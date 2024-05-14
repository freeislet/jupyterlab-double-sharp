import { ISessionContext } from '@jupyterlab/apputils';
import { Kernel, KernelMessage } from '@jupyterlab/services';
import { IExecuteResult, IStream } from '@jupyterlab/nbformat';
import { ISignal, Signal } from '@lumino/signaling';
import { PromiseDelegate } from '@lumino/coreutils';

import { joinMultiline } from '../util';

const INIT_SCRIPT = String.raw`
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
    source = cls.transformer.transform_cell(source)
    # code = compile(source, '<string>', 'exec')
    source = cls.make_temp_function(source)
    exec(source, cls.temp_module.__dict__)
    temp_function = cls.temp_module._temp
    code = temp_function.__code__

    from inspect import getclosurevars
    closurevars = getclosurevars(temp_function)

    print(cls.dumps({
      # 'co_names': code.co_names,  # builtins 포함
      'co_varnames': code.co_varnames,
      'unbound': list(closurevars.unbound),
    }))
  
  @staticmethod
  def dumps(obj):
    import json

    return json.dumps(obj, ensure_ascii=False)

  @staticmethod
  def make_temp_function(source):
    import re
    return 'def _temp():\n    ' + re.sub(r'\n', '\n    ', source)

DoubleSharpKernel.init()
`;

export class KernelExecutor {
  private _ready = new PromiseDelegate<void>();
  private _initialized = new Signal<
    KernelExecutor,
    KernelMessage.IExecuteReplyMsg
  >(this);

  get ready(): Promise<void> {
    return this._ready.promise;
  }

  get initialized(): ISignal<KernelExecutor, KernelMessage.IExecuteReplyMsg> {
    return this._initialized;
  }

  constructor(public readonly sessionContext: ISessionContext) {
    sessionContext.kernelChanged.connect((sender, args) => {
      // console.log('sessionContext.kernelChanged', sender, args);

      if (args.newValue) {
        this._initializeKernel();
      } else {
        this._ready = new PromiseDelegate<void>();
      }
    }, this);
  }

  private _initializeKernel() {
    this._requestExecute(INIT_SCRIPT).then(
      (msg: KernelMessage.IExecuteReplyMsg) => {
        // console.log('kernel initialized', msg);

        this._ready.resolve();
        this._initialized.emit(msg);
      }
    );
  }

  get kernel(): Kernel.IKernelConnection {
    const kernel = this.sessionContext.session?.kernel;
    if (!kernel) throw new Error('Session has no kernel.');
    return kernel;
  }

  async execute(
    code: string,
    options?: KernelExecutor.IExecuteOptions
  ): Promise<KernelMessage.IExecuteReplyMsg> {
    await this.ready;
    return this._requestExecute(code, options);
  }

  private _requestExecute(
    code: string,
    options?: KernelExecutor.IExecuteOptions
  ): Promise<KernelMessage.IExecuteReplyMsg> {
    const { onResult, onExecuteResult, onStream } = options ?? {};
    const useResult = Boolean(onResult || onExecuteResult || onStream);

    const content: KernelMessage.IExecuteRequestMsg['content'] = {
      code,
      stop_on_error: false,
      store_history: false,
      silent: !useResult
    };
    const future = this.kernel.requestExecute(content);

    if (useResult) {
      const resultAsJson = options?.resultAsJson ?? true;

      future.onIOPub = (msg: KernelMessage.IIOPubMessage) => {
        // console.log(msg);

        switch (msg.header.msg_type) {
          case 'execute_result':
            if (onResult || onExecuteResult) {
              const executeResult = msg.content as IExecuteResult;
              const text = executeResult.data['text/plain'] as string;
              const result = resultAsJson ? Private.parseJSON(text) : text;
              onResult?.(result);
              onExecuteResult?.(result);
            }
            break;

          case 'stream':
            if (onResult || onStream) {
              const content = msg.content as IStream;
              if (content.name === 'stdout') {
                const text = joinMultiline(content.text);
                const result = resultAsJson ? Private.parseJSON(text) : text;
                onResult?.(result);
                onStream?.(result);
              }
            }
            break;
        }
      };
    }

    return future.done;
  }

  async getInteractiveVariables(): Promise<string[]> {
    const retVars: string[] = [];

    await this.execute('DoubleSharpKernel.who()', {
      onResult: (vars: string[]) => {
        retVars.push(...vars);
      }
    });
    return retVars;
  }

  async inspect(source: string): Promise<KernelExecutor.IInspectResult | void> {
    const escaped = source.replace(/"""/g, '\\"""');
    const code = `DoubleSharpKernel.inspect("""${escaped}""")`;
    // console.log(code);

    let ret: KernelExecutor.IInspectResult | undefined;

    await this.execute(code, {
      onResult: (result: KernelExecutor.IInspectResult) => {
        ret = result;
        // console.log('inspect result:', result);
      }
    });
    return ret;
  }
}

export namespace KernelExecutor {
  export interface IExecuteOptions {
    onResult?: (result: any) => void;
    onExecuteResult?: (result: any) => void;
    onStream?: (result: any) => void;

    /**
     * (따옴표로 둘러싸였을 수 있는) result 문자열을 json object로 파싱
     * default: true
     */
    resultAsJson?: boolean;
  }

  export interface IInspectResult {
    co_varnames: string[];
    unbound: string[];
  }
}

namespace Private {
  export function parseJSON(json: string): any {
    if (json.startsWith("'") || json.startsWith('"')) {
      json = json.slice(1, -1).replace(/\\"/g, '"').replace(/\\'/g, "'");
    }

    return JSON.parse(json);
  }
}
