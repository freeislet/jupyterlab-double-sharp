import { DocumentRegistry } from '@jupyterlab/docregistry';
import { NotebookPanel } from '@jupyterlab/notebook';
import { IDisposable } from '@lumino/disposable';
import { Signal } from '@lumino/signaling';
import { Kernel, KernelMessage } from '@jupyterlab/services';
import { Cell, CodeCell } from '@jupyterlab/cells';
import { CodeMirrorEditor } from '@jupyterlab/codemirror';
import { syntaxTree } from '@codemirror/language';

import { ExecutionActions } from '../execution';
import { requestExecute } from '../util';

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
  private _kernelVars = new Set<string>();

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
    this._kernelVars.clear();

    Signal.clearData(this);
    VariableTracker._trackers.delete(this.panel);
  }

  get kernel(): Kernel.IKernelConnection | null | undefined {
    return this.panel.sessionContext.session?.kernel;
  }

  private _onKernelStarted() {
    const code = `
class DoubleSharpKernel:
  @classmethod
  def init(cls):
    from IPython.core.magics.namespace import NamespaceMagics
    from IPython import get_ipython

    cls.magics = NamespaceMagics()
    cls.magics.shell = get_ipython().kernel.shell
  
  @classmethod
  def who(cls):
    import json

    vars = cls.magics.who_ls()
    return json.dumps(vars, ensure_ascii=False)

DoubleSharpKernel.init()
`;
    requestExecute(this.kernel!, code).then(() => this.updateKernelVariables());
  }

  updateKernelVariables(): Promise<KernelMessage.IExecuteReplyMsg> {
    const future = requestExecute(
      this.kernel!,
      'DoubleSharpKernel.who()',
      (vars: string[]) => {
        this._kernelVars = new Set(vars);

        console.log('kernel vars:', this._kernelVars);
      }
    );
    return future;
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
