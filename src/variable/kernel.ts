import { ISessionContext } from '@jupyterlab/apputils';
import { Kernel, KernelMessage } from '@jupyterlab/services';
import { IExecuteResult } from '@jupyterlab/nbformat';
import { ISignal, Signal } from '@lumino/signaling';
import { PromiseDelegate } from '@lumino/coreutils';

const INIT_SCRIPT = `
class DoubleSharpKernel:
  @classmethod
  def init(cls):
    from IPython.core.magics.namespace import NamespaceMagics
    from IPython import get_ipython

    cls.magics = NamespaceMagics()
    cls.magics.shell = get_ipython().kernel.shell
  
  @staticmethod
  def dumps(obj):
    import json

    return json.dumps(obj, ensure_ascii=False)

  @classmethod
  def who(cls):
    vars = cls.magics.who_ls()
    return cls.dumps(vars)
  
  @classmethod
  def inspect(cls, source):
    code = compile(source, '<string>', 'exec')
    return cls.dumps({
      'refVariables': code.co_varnames,
      'outVariables': code.co_names
    })

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
    const handleResult = Boolean(onResult || onExecuteResult || onStream);

    const content: KernelMessage.IExecuteRequestMsg['content'] = {
      code,
      stop_on_error: false,
      store_history: false,
      silent: !handleResult
    };
    const future = this.kernel.requestExecute(content);

    if (handleResult) {
      const resultAsJson = options?.resultAsJson ?? true;

      future.onIOPub = (msg: KernelMessage.IIOPubMessage) => {
        console.log(msg);

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

          // TODO: stream
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

  async inspect(source: string): Promise<any> {
    const inspectCode = `
source = """${source.replace(/"""/g, '\\"""')}"""
DoubleSharpKernel.inspect(source)`;
    // console.log(code);

    // let cellVars: ICellVariables = {
    //   refVariables: [],
    //   outVariables: []
    // };

    let ret: any;

    await this.execute(inspectCode, {
      onResult: (result: any) => {
        // TODO
        ret = result;
        console.log('inspect result:', result);
      }
    });
    console.log(ret);
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
}

namespace Private {
  export function parseJSON(json: string): any {
    if (json.startsWith("'") || json.startsWith('"')) {
      json = json.slice(1, -1).replace(/\\"/g, '"').replace(/\\'/g, "'");
    }

    return JSON.parse(json);
  }
}
