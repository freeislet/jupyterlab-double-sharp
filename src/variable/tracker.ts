import { DocumentRegistry } from '@jupyterlab/docregistry';
import { NotebookPanel } from '@jupyterlab/notebook';
import { IDisposable } from '@lumino/disposable';
import { Signal } from '@lumino/signaling';
import { Cell, CodeCell } from '@jupyterlab/cells';
import { CodeMirrorEditor } from '@jupyterlab/codemirror';
import { syntaxTree } from '@codemirror/language';

import { KernelExecutor } from './kernel';
import { ExecutionActions } from '../execution';

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

  readonly kernelExecutor: KernelExecutor;
  private _kernelVars = new Set<string>();
  private _isDisposed = false;

  constructor(public readonly panel: NotebookPanel) {
    VariableTracker._trackers.set(panel, this);

    this.kernelExecutor = new KernelExecutor(panel.sessionContext);
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

  get kernelVariables(): Set<string> {
    return this._kernelVars;
  }

  async updateKernelVariables(): Promise<Set<string>> {
    const vars = await this.kernelExecutor.getInteractiveVariables();
    this._kernelVars = new Set(vars);
    console.log('kernel vars:', this._kernelVars);
    return this._kernelVars;
  }

  async getCellVariablesFromKernel(cell: CodeCell): Promise<ICellVariables> {
    const source = cell.model.sharedModel.getSource();
    const codeInfo = await this.kernelExecutor.inspect(source);
    console.log(codeInfo);

    let cellVars: ICellVariables = {
      refVariables: [],
      outVariables: []
    };

    // TODO

    return cellVars;
  }

  getCellVariables(cell: CodeCell): ICellVariables {
    const refVariables: string[] = [];
    const outVariables: string[] = [];

    const editorView = (cell.editor as CodeMirrorEditor).editor;
    const tree = syntaxTree(editorView.state);
    const doc = editorView.state.doc;

    this.getCellVariablesFromKernel(cell);

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

    // console.log(tree.topNode.getChildren('Statement'));

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
