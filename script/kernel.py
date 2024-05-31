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
            # debug
            code = compile(source, "<string>", "exec")
            cls.util.print_code(code)

            fn_source = cls.make_source_function(source)
            fn_reports = cls.inspect_function(fn_source)

            result = cls.util.dumps({"functions": fn_reports})
            return result

        except Exception as e:
            print(e)

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
            fn_code = fn.__code__
            closurevars = inspect.getclosurevars(fn)

            # debug
            cls.util.print_closurevars(closurevars, inspect.getmembers(fn))

            # inspect할 functions 추가
            # NOTE: module을 function화하면 globals 안 생기는 듯? -> 확실하면 아래 코드 제거
            global_fns = [
                var for var in closurevars.globals.values() if inspect.isfunction(var)
            ]
            fns.extend(global_fns)

            # variables 결과 보정을 위해 code 및 inner code 검사 (nested function, lambda 등)
            # NOTE: instructions 수집해서 전달만 하고, 실제 variables 보정 작업은 client에서 처리
            relevant_instructions = [
                "IMPORT_NAME",
                "LOAD_NAME",
                "LOAD_ATTR",
                "STORE_NAME",
                "STORE_FAST",
            ]

            codes = [fn_code]
            for code in codes:
                instruction_args = {opname: [] for opname in relevant_instructions}

                # debug
                cls.util.print_code(code)

                bytecode = dis.Bytecode(code)
                for inst in bytecode:
                    if inst.opname in relevant_instructions:
                        instruction_args[inst.opname].append(
                            inst.argval
                        )  # argval 항상 str?

                    if inst.opname in ["LOAD_CONST"]:  # 다른 op 확인?
                        if inspect.isfunction(inst.argval):
                            # const가 function인 경우는 없는 듯? -> 확실하면 코드 제거
                            fns.append(inst.argval)
                        elif inspect.iscode(inst.argval):
                            codes.append(inst.argval)

                # function 정보 추가
                report = {
                    "name": code.co_name,
                    # co_varnames -> ICodeVariables.variables
                    "co_varnames": code.co_varnames,
                    # unbound -> ICodeVariables.unboundVariables
                    "unbound": list(closurevars.unbound),
                    # variables 결과 보정을 위한 instruction-args list
                    "instructionArgs": instruction_args,
                }
                reports.append(report)

        return reports

    @staticmethod
    def make_source_function(source):
        import re

        return "def _source_():\n    " + re.sub(r"\n", "\n    ", source)


DoubleSharp.init()
