import { DocumentRegistry } from '@jupyterlab/docregistry';
import { NotebookPanel } from '@jupyterlab/notebook';
import { IDisposable } from '@lumino/disposable';
import { Signal } from '@lumino/signaling';
import { KernelMessage } from '@jupyterlab/services';
import { IStream } from '@jupyterlab/nbformat';
import { Cell, CodeCell } from '@jupyterlab/cells';
import { CodeMirrorEditor } from '@jupyterlab/codemirror';
import { syntaxTree } from '@codemirror/language';

import { ExecutionActions } from '../execution';
import { joinMultiline } from '../util';

export interface ICellVariables {
  /**
   * 셀에서 참조하는 변수 목록
   */
  refVariables: string[];

  /**
   * 셀에서 정의하는 변수 목록
   */
  outVariables: string[];
}

/**
 * VariableTracker
 */
export class VariableTracker implements IDisposable {
  private static _trackers = new Map<NotebookPanel, VariableTracker>();

  static get(panel: NotebookPanel): VariableTracker | undefined {
    return this._trackers.get(panel);
  }

  static getByCell(cell: Cell): VariableTracker | undefined {
    const panel = cell.parent?.parent;
    return panel ? this.get(panel as NotebookPanel) : undefined;
  }

  static {
    ExecutionActions.afterExecution.connect((_, args) => {
      const { cells } = args;

      const tracker = cells.length ? this.getByCell(cells[0]) : null;
      if (!tracker) return;

      tracker.updateKernelVariables();
    });
  }

  //

  private _isDisposed = false;
  readonly panel: NotebookPanel;
  private _kernelVars: string[] = [];

  constructor(panel: NotebookPanel) {
    VariableTracker._trackers.set(panel, this);

    this.panel = panel;

    panel.sessionContext.kernelChanged.connect(() => {
      // console.log('sessionContext.kernelChanged');
      this._onKernelStarted();
    }, this);
  }

  get isDisposed(): boolean {
    return this._isDisposed;
  }

  dispose() {
    if (this.isDisposed) return;

    this._isDisposed = true;
    this._kernelVars = [];

    Signal.clearData(this);
    VariableTracker._trackers.delete(this.panel);
  }

  async updateKernelVariables(): Promise<KernelMessage.IExecuteReplyMsg> {
    const kernel = this.panel.sessionContext.session?.kernel;
    if (!kernel) {
      return Promise.reject(new Error('kernel is missing.'));
    }

    // console.log('kernel: ', kernel);

    const reqContent: KernelMessage.IExecuteRequestMsg['content'] = {
      code: '%who',
      stop_on_error: false,
      store_history: false
    };
    const future = kernel.requestExecute(reqContent);
    future.onIOPub = (response: KernelMessage.IIOPubMessage) => {
      const msgType = response.header.msg_type;
      if (msgType === 'stream') {
        const content = response.content as IStream;
        if (content.name === 'stdout') {
          const text = joinMultiline(content.text);
          const empty = text.startsWith('Interactive namespace is empty');
          this._kernelVars = empty ? [] : text.trim().split(/\s+/);
          // console.log('kernel vars:', this._kernelVars);
        }
      }
    };
    return future.done;
  }

  private _onKernelStarted() {
    this.updateKernelVariables();
  }

  getCellVariables(cell: CodeCell): ICellVariables {
    const refVariables: string[] = [];
    const outVariables: string[] = [];

    const editorView = (cell.editor as CodeMirrorEditor).editor;
    const tree = syntaxTree(editorView.state);
    const doc = editorView.state.doc;

    // 참조 변수 수집
    // 할당된 변수 수집
    const assignNodes = tree.topNode.getChildren('AssignStatement');
    for (const assignNode of assignNodes) {
      // const varNodes = assignNode.getChildren('VariableName', null, 'AssignOp');
      // NOTE: 위 코드로는 a = b = 1 구문에서 b를 얻지 못 함 (버그?)
      const varNodes = assignNode.getChildren('VariableName');
      const vars = varNodes
        .filter(node => node.nextSibling?.name === 'AssignOp')
        .map(node => doc.sliceString(node.from, node.to));
      outVariables.push(...vars);
    }

    console.log(tree.topNode, { refVariables, outVariables });

    return { refVariables, outVariables };
  }

  isCellCached(cell: CodeCell): boolean {
    const cellVars = this.getCellVariables(cell);

    // TODO
    cellVars;
    this._kernelVars;
    return false;
  }
}

/**
 * VariableExtension
 */
export class VariableExtension implements DocumentRegistry.WidgetExtension {
  constructor() {}

  createNew(panel: NotebookPanel): IDisposable {
    return new VariableTracker(panel);
  }
}
