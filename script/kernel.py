class __DoubleSharp:
    @classmethod
    def init(cls):
        from IPython import get_ipython
        from IPython.core.magics.namespace import NamespaceMagics
        from IPython.core.inputtransformer2 import TransformerManager
        from types import ModuleType
        from builtins import set, str

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

            def print_obj(self, obj, **kwargs):
                print(self.dumps(obj))

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

            def print_bytecode(self, bytecode):
                for instr in bytecode:
                    print(f"{instr.opname} arg:{instr.arg} argval:{instr.argval}")

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
            result = cls.inspect_code(code)
            return cls.util.dumps(result)

        except Exception as e:
            print(e)

    @classmethod
    def inspect_code(cls, code):
        import inspect
        import dis
        from builtins import set

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
        stored_names = {}  # set() # 순서 유지 위해 set 대신 dict 사용
        # LOAD_NAME, LOAD_GLOBAL argval 중 stored_names, builtins에 없는 이름
        unbound_names = {}  # set()
        # NOTE: nested function 안의 unbound variables는 해당 함수가 사용되지 않는다면
        #       실행 오류를 발생하지 않는다. 이런 경우에 대해서도 예외 처리하면 좋을 듯.

        codes = [code]
        for code in codes:
            # debug
            # cls.util.print_code(code)

            bytecode = dis.Bytecode(code)
            # cls.util.print_bytecode(bytecode)

            for inst in bytecode:
                opname = inst.opname
                argval = inst.argval

                if opname == "STORE_NAME":
                    stored_names[argval] = None
                elif opname in ["LOAD_NAME", "LOAD_GLOBAL"]:
                    unbound = argval not in stored_names and argval not in cls.builtins
                    if unbound:
                        unbound_names[argval] = None
                elif opname == "LOAD_CONST":
                    if inspect.iscode(argval):
                        codes.append(argval)

        return {
            # stored_names -> ICodeData.variables
            "stored_names": list(stored_names.keys()),
            # unbound_names -> ICodeData.unboundVariables
            "unbound_names": list(unbound_names.keys()),
        }


__DoubleSharp.init()
