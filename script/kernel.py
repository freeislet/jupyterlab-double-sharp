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
        cls.temp_module = ModuleType("temp_module")

    @classmethod
    def who(cls):
        vars = cls.magics.who_ls()
        print(cls.dumps(vars))

    @classmethod
    def inspect(cls, source):
        from inspect import getclosurevars

        try:
            source = cls.transformer.transform_cell(source)
            # code = compile(source, "<string>", "exec")

            fn_source = cls.make_temp_function(source)
            exec(fn_source, cls.temp_module.__dict__)
            fn_temp_function = cls.temp_module._temp_function
            fn_code = fn_temp_function.__code__
            fn_closurevars = getclosurevars(fn_temp_function)

            print(
                cls.dumps(
                    {
                        # 'co_names': fn_code.co_names,  # builtins 포함
                        "co_varnames": fn_code.co_varnames,
                        "unbound": list(fn_closurevars.unbound),
                    }
                )
            )

        except Exception as e:
            cls.eprint_obj(e)

    @staticmethod
    def make_temp_function(source):
        import re

        return "def _temp_function():\n    " + re.sub(r"\n", "\n    ", source)

    @staticmethod
    def dumps(obj):
        import json

        return json.dumps(obj, ensure_ascii=False)

    @staticmethod
    def print_obj(obj, **kwargs):

        for attr in dir(obj):
            print(f"{attr}: {getattr(obj, attr)}", **kwargs)

    @classmethod
    def eprint_obj(cls, obj, **kwargs):
        import sys

        cls.print_obj(obj, file=sys.stderr, **kwargs)


DoubleSharpKernel.init()
