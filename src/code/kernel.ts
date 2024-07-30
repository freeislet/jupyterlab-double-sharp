import { ISessionContext } from '@jupyterlab/apputils';
import { Kernel, KernelMessage } from '@jupyterlab/services';
import { IExecuteResult, IStream, StreamType } from '@jupyterlab/nbformat';
import { ISignal, Signal } from '@lumino/signaling';
import { PromiseDelegate } from '@lumino/coreutils';

import INIT_SCRIPT from '/script/kernel.py';
import { joinMultiline } from '../utils/nbformat';

export namespace KernelExecutor {
  export interface IExecuteOptions {
    onResult?: (result: any) => void;
    onExecuteResult?: (result: any) => void;
    onStream?: (result: any, type: StreamType) => void;

    /**
     * (따옴표로 둘러싸였을 수 있는) result 문자열을 json object로 파싱
     * default: true
     */
    resultAsJson?: boolean;

    /**
     * stream msg_type을 JSON Lines 배열로 파싱
     * default: onStream 있으면 true, 없으면 false
     */
    streamAsJsonl?: boolean;
  }

  export interface IInspectResult {
    stored_names: string[];
    unbound_names: string[];
  }
}

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
      // Log.debug('sessionContext.kernelChanged', sender, args);

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
        // Log.debug('kernel initialized', msg);

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
      const streamAsJsonl = options?.streamAsJsonl ?? Boolean(onStream);

      future.onIOPub = (msg: KernelMessage.IIOPubMessage) => {
        // Log.debug(msg);

        const msgType = msg.header.msg_type;
        switch (msgType) {
          case 'execute_result':
            if (onResult || onExecuteResult) {
              const executeResult = msg.content as IExecuteResult;
              const text = executeResult.data['text/plain'] as string;
              // Log.debug(msgType, { text });

              const result = resultAsJson ? Private.parseJSON(text) : text;
              onResult?.(result);
              onExecuteResult?.(result);
            }
            break;

          case 'stream':
            if (onResult || onStream) {
              const content = msg.content as IStream;
              const streamType = content.name;
              const text = joinMultiline(content.text);
              // Log.debug(msgType, streamType, { text });

              const result = streamAsJsonl
                ? Private.parseJSONL(text)
                : resultAsJson
                  ? Private.parseJSON(text)
                  : text;
              if (streamType === 'stdout') {
                onResult?.(result);
              }
              onStream?.(result, streamType);
            }
            break;
        }
      };
    }

    return future.done;
  }

  async getInteractiveVariables(): Promise<string[]> {
    const retVars: string[] = [];

    await this.execute('__DoubleSharp.who()', {
      onResult: (vars: string[]) => {
        retVars.push(...vars);
      }
    });
    return retVars;
  }

  async inspect(
    source: string
  ): Promise<KernelExecutor.IInspectResult | undefined> {
    const escaped = source.replace(/"""/g, '\\"\\"\\"');
    const code = `__DoubleSharp.inspect("""${escaped}""")`;
    // Log.debug(code);

    let ret: KernelExecutor.IInspectResult | undefined;

    await this.execute(code, {
      onExecuteResult(result: KernelExecutor.IInspectResult) {
        ret = result;
        // Log.debug('inspect result:', result);
      },
      onStream(result, streamType) {
        Log.debug('inspect log:', result);
      }
    });
    return ret;
  }
}

namespace Private {
  /**
   * JSON 파싱
   * JSON 문자열이 따옴표(', ")로 싸인 경우도 처리
   * (python 리턴값을 execute_result msg_type으로 받을 때 사용)
   */
  //
  export function parseJSON(json: string): any {
    try {
      json = unescapeQuotes(json);
      return JSON.parse(json);
    } catch {
      return json;
    }
  }

  /**
   * JSON Lines 파싱
   * 한 JSON 덩어리가 여러 줄로 이루어진 경우도 고려해서 처리
   * (stream으로 여러 개의 JSON을 보낼 때 사용)
   */
  export function parseJSONL(jsonl: string): any {
    try {
      jsonl = unescapeQuotes(jsonl);
      const json = '[' + jsonl.replace(/(?<=[}\]])\n*(?=[{[])/g, ',') + ']';
      return JSON.parse(json);
    } catch {
      return jsonl;
    }
  }

  function unescapeQuotes(text: string): string {
    return text.startsWith("'") || text.startsWith('"')
      ? text.slice(1, -1).replace(/\\"/g, '"').replace(/\\'/g, "'")
      : text;
  }
}
