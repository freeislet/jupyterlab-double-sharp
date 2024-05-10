import { MultilineString } from '@jupyterlab/nbformat';
import { Cell, CodeCell, isCodeCellModel } from '@jupyterlab/cells';
import { Kernel, KernelMessage } from '@jupyterlab/services';
import { IExecuteResult } from '@jupyterlab/nbformat';

export function joinMultiline(
  multiline: MultilineString,
  separator = '\n'
): string {
  return Array.isArray(multiline) ? multiline.join(separator) : multiline;
}

export function isCodeCell(cell: Cell): cell is CodeCell {
  return isCodeCellModel(cell.model);
}

export function parseJSON(json: string): any {
  if (json.startsWith("'") || json.startsWith('"')) {
    json = json.slice(1, -1).replace(/\\"/g, '"').replace(/\\'/g, "'");
  }

  return JSON.parse(json);
}

export function requestExecute(
  kernel: Kernel.IKernelConnection,
  code: string,
  onExecuteResult?: (resultData: any) => void
): Promise<KernelMessage.IExecuteReplyMsg> {
  const content: KernelMessage.IExecuteRequestMsg['content'] = {
    code,
    stop_on_error: false,
    store_history: false,
    silent: !onExecuteResult
  };
  const future = kernel.requestExecute(content);

  if (onExecuteResult) {
    future.onIOPub = (msg: KernelMessage.IIOPubMessage) => {
      // console.log(msg);

      const msgType = msg.header.msg_type;
      if (msgType === 'execute_result') {
        const result = msg.content as IExecuteResult;
        const text = result.data['text/plain'] as string;
        const data = parseJSON(text);
        onExecuteResult(data);
      }
    };
  }
  return future.done;
}
