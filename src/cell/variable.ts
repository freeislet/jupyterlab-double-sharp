import { DocumentRegistry } from '@jupyterlab/docregistry';
import { NotebookPanel } from '@jupyterlab/notebook';
import { IDisposable } from '@lumino/disposable';
import { Signal } from '@lumino/signaling';
import { KernelMessage } from '@jupyterlab/services';
import { IStream, MultilineString } from '@jupyterlab/nbformat';
import { CodeCell } from '@jupyterlab/cells';
import { CodeMirrorEditor } from '@jupyterlab/codemirror';
import { syntaxTree } from '@codemirror/language';
import { SyntaxNodeRef } from '@lezer/common';

import { ExecutionActions } from '../execution/actions';

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

  static {
    ExecutionActions.afterExecution.connect((_, args) => {
      const { cells } = args;

      const panel = cells.length ? cells[0].parent?.parent : null;
      if (!panel) return;

      const tracker = this.get(panel as NotebookPanel);
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

    function split(text: MultilineString): string[] {
      const split1 = (str: string) => str.trim().split(/\s+/);

      if (Array.isArray(text)) {
        text.map(split1).flat();
      } else if (!text.startsWith('Interactive namespace is empty')) {
        return split1(text);
      }
      return [];
    }

    future.onIOPub = (response: KernelMessage.IIOPubMessage) => {
      const msgType = response.header.msg_type;
      if (msgType === 'stream') {
        const content = response.content as IStream;
        if (content.name === 'stdout') {
          this._kernelVars = split(content.text);
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

    cell;

    // variable 테스트
    function enter(node: SyntaxNodeRef): boolean | void {
      // if (node.name === 'Comment') {
      //   const comment = view.state.doc.sliceString(node.from, node.to);
      //   const isExt = comment.startsWith('##');
      //   if (isExt) {
      //     const deco = commentDecoration;
      //     builder.add(node.from, node.from, deco);
      //   }
      // }
      // console.log(node.name, node.from, node.to, node);
    }

    const editorView = (cell.editor as CodeMirrorEditor).editor;
    syntaxTree(editorView.state).iterate({ enter });

    return { refVariables, outVariables };
  }

  isCellCached(cell: CodeCell) {
    cell;
    this._kernelVars;
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
