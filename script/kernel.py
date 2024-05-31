class DoubleSharp:
    @classmethod
    def init(cls):
        from IPython import get_ipython
        from IPython.core.magics.namespace import NamespaceMagics
        from IPython.core.inputtransformer2 import TransformerManager
        from types import ModuleType

        cls.magics = NamespaceMagics()
        cls.magics.shell = get_ipython().kernel.shell
        cls.transformer = TransformerManager()
        cls.builtins = set(dir(__builtins__))
        # @deprecated
        cls.internal_module = ModuleType("internal_module")

        # util class (json dumps, debug용 log)
        def list_(lst):
            return [str(e) for e in lst]

        def pairs(pairs):
            return {str(k): str(v) for k, v in pairs}

        def mapping(map):
            return pairs(map.items())

        class Util:
            @staticmethod
            def dumps(obj):
                import json

                return json.dumps(obj, ensure_ascii=False)

            def print_code(self, code, members=None):
                log = {
                    "co_name": code.co_name,
                    "co_flags": code.co_flags,
                    "co_names": code.co_names,  # builtins 포함
                    "co_varnames": code.co_varnames,  # arguments, function locals
                    "co_freevars": code.co_freevars,  # 함수 closure를 통해 참조되는 변수들
                    "co_cellvars": code.co_cellvars,  # 내부 scope에서 참조하는 변수들
                    "co_consts": list_(code.co_consts),
                }

                if members:
                    log["members"] = pairs(members)

                self.print_obj(log)

            def print_closurevars(self, closurevars, fn_members=None):
                log = {
                    "builtins": mapping(closurevars.builtins),
                    "nonlocals": mapping(closurevars.nonlocals),
                    "globals": mapping(closurevars.globals),
                    "unbound": list(closurevars.unbound),
                }

                if fn_members:
                    # log["members"] = pairs(fn_members)
                    members_dict = {k: v for k, v in fn_members}
                    log["__name__"] = members_dict.get("__name__", "<unknown>")
                    # log["__builtins__"] = mapping(members_dict.get("__builtins__", {}))
                    # log["__globals__"] = mapping(members_dict.get("__globals__", {}))
                    log["__globals__"] = list(members_dict.get("__globals__", {}))

                self.print_obj(log)

            def print_obj(self, obj, **kwargs):
                # for attr in dir(obj):
                #     print(f"{attr}: {getattr(obj, attr)}", **kwargs)
                print(self.dumps(obj))

        cls.util = Util()

    @classmethod
    def who(cls):
        vars = cls.magics.who_ls()
        print(cls.util.dumps(vars))

    @classmethod
    def inspect(cls, source):
        try:
            source = cls.transformer.transform_cell(source)
            code = compile(source, "<string>", "exec")

            # NOTE: getclosurevars 대신 bytecode로부터 직접 variables 정보 수집하도록 함 (아래 코드 삭제 예정)
            # fn_source = cls.make_source_function(source)
            # fn_reports = cls.inspect_function(fn_source)
            # result = cls.util.dumps({"functions": fn_reports})

            result = cls.inspect_code(code)
            return cls.util.dumps(result)

        except Exception as e:
            print(e)

    @classmethod
    def inspect_code(cls, code):
        import inspect
        import dis

        # NOTE: bytecode 구조 (추가 검토 필요)
        # * <module>
        #   - STORE_NAME으로 변수, 모듈 등 할당 (import한 모듈 포함)
        #   - LOAD_NAME으로 변수, 모듈 등 참조 (builtins 포함))
        #   - LOAD_CONST로 function, lambda 등의 코드 로드
        # * nested code
        #   - STORE_FAST로 로컬 변수 할당
        #   - LOAD_DEREF로 free variables 로드
        #   - LOAD_GLOBAL로 global variables 로드

        # STORE_NAME에서 할당하는 variables, modules, ...
        stored_names = set()
        # LOAD_NAME, LOAD_GLOBAL argval 중 stored_names, builtins에 없는 이름
        unbound_names = set()

        codes = [code]
        for code in codes:
            # debug
            cls.util.print_code(code)

            bytecode = dis.Bytecode(code)
            for inst in bytecode:
                opname = inst.opname
                argval = inst.argval

                if opname == "STORE_NAME":
                    stored_names.add(argval)
                elif opname in ["LOAD_NAME", "LOAD_GLOBAL"]:
                    unbound = argval not in stored_names and argval not in cls.builtins
                    if unbound:
                        unbound_names.add(argval)
                elif opname == "LOAD_CONST":
                    if inspect.iscode(argval):
                        codes.append(argval)

        return {
            # stored_names -> ICodeVariables.variables
            "stored_names": list(stored_names),
            # unbound_names -> ICodeVariables.unboundVariables
            "unbound_names": list(unbound_names),
        }

    # @deprecated
    @classmethod
    def inspect_function(cls, function):
        import inspect
        import dis

        if isinstance(function, str):
            exec(function, cls.internal_module.__dict__)
            function = cls.internal_module._source_

        reports = []
        fns = [function]

        for fn in fns:
            code = fn.__code__
            closurevars = inspect.getclosurevars(fn)

            # debug
            cls.util.print_closurevars(closurevars, inspect.getmembers(fn))

            # inspect할 functions 추가
            # NOTE: module을 function화하면 globals 안 생기는 듯? -> 확실하면 아래 코드 제거
            global_fns = [
                var for var in closurevars.globals.values() if inspect.isfunction(var)
            ]
            fns.extend(global_fns)

            # function 정보 추가
            report = {
                "name": code.co_name,
                # co_varnames -> ICodeVariables.variables
                "co_varnames": code.co_varnames,
                # unbound -> ICodeVariables.unboundVariables
                "unbound": list(closurevars.unbound),
            }
            reports.append(report)

        return reports

    # @deprecated
    @staticmethod
    def make_source_function(source):
        import re

        return "def _source_():\n    " + re.sub(r"\n", "\n    ", source)


DoubleSharp.init()
