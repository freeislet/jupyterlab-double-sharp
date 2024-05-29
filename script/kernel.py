class DoubleSharpKernel:
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

    @classmethod
    def who(cls):
        vars = cls.magics.who_ls()
        print(cls.dumps(vars))

    @classmethod
    def inspect(cls, source):
        try:
            source = cls.transformer.transform_cell(source)
            # debug
            code = compile(source, "<string>", "exec")
            cls.print_code(code)

            fn_source = cls.make_source_function(source)
            exec(fn_source, cls.internal_module.__dict__)
            fn_function = cls.internal_module._source_
            fn_reports = cls.inspect_function(fn_function)

            result = cls.dumps({"functions": fn_reports})
            return result

        except Exception as e:
            print(e)

    @classmethod
    def inspect_function(cls, function):
        import inspect

        reports = []
        fns = [function]

        for fn in fns:
            code = fn.__code__
            closurevars = inspect.getclosurevars(fn)

            # debug
            cls.print_code(code, closurevars)

            report = {
                "name": code.co_name,
                # co_varnames -> ICodeVariables.variables
                "co_varnames": code.co_varnames,
                # unbound -> ICodeVariables.unboundVariables
                "unbound": list(closurevars.unbound),
            }
            reports.append(report)

            fn_consts = filter(lambda const: inspect.isfunction(const), code.co_consts)
            fns.extend(fn_consts)

            # for block in codeworklist:
            #     for k, v in [
            #         interesting(inst)
            #         for inst in Bytecode(block)
            #         if interesting(inst)
            #     ]:
            #         if k == "modules":
            #             newmods = [
            #                 mod.__name__ for mod in v if hasattr(mod, "__name__")
            #             ]
            #             mods.update(set(newmods))
            #         elif k == "code" and id(v) not in seen:
            #             seen.add(id(v))
            #             if hasattr(v, "__module__"):
            #                 mods.add(v.__module__)
            #         if inspect.isfunction(v):
            #             worklist.append(v)
            #         elif inspect.iscode(v):
            #             codeworklist.append(v)

        return reports

    @staticmethod
    def make_source_function(source):
        import re

        return "def _source_():\n    " + re.sub(r"\n", "\n    ", source)

    @staticmethod
    def dumps(obj):
        import json

        return json.dumps(obj, ensure_ascii=False)

    @classmethod
    def print_obj(cls, obj, **kwargs):
        # for attr in dir(obj):
        #     print(f"{attr}: {getattr(obj, attr)}", **kwargs)
        print(cls.dumps(obj))

    @classmethod
    def print_code(cls, code, closurevars=None):
        def list_(lst):
            return [str(e) for e in lst]

        def mapping(map):
            return {str(k): str(v) for k, v in map.items()}

        obj = {
            "co_name": code.co_name,
            "co_flags": code.co_flags,
            "co_names": code.co_names,  # builtins 포함
            "co_varnames": code.co_varnames,  # arguments, function locals
            "co_consts": list_(code.co_consts),
        }

        if closurevars:
            cv = {
                "builtins": mapping(closurevars.builtins),
                "nonlocals": mapping(closurevars.nonlocals),
                "globals": mapping(closurevars.globals),
                "unbound": list(closurevars.unbound),
            }
            obj.update(cv)

        cls.print_obj(obj)


DoubleSharpKernel.init()
