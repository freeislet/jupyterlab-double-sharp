import { DocumentRegistry } from '@jupyterlab/docregistry';
import { NotebookPanel } from '@jupyterlab/notebook';
import { IDisposable } from '@lumino/disposable';
import { Signal } from '@lumino/signaling';
import { Cell, CodeCell, ICodeCellModel } from '@jupyterlab/cells';
// import { CodeMirrorEditor } from '@jupyterlab/codemirror';
// import { syntaxTree } from '@codemirror/language';

import { KernelExecutor } from './kernel';
import { NotebookExt, NotebookExtDictionary } from '../utils/notebook';
import { In, notIn } from '../utils/array';

export interface ICodeData {
  /**
   * 셀에서 정의하는 변수 목록
   */
  variables: string[];

  /**
   * 셀에서 참조하지만 정의하지 않는 외부 변수 목록
   */
  unboundVariables: string[];
}

/**
 * CodeInspector
 */
export class CodeInspector extends NotebookExt {
  private static _dictionary = new NotebookExtDictionary<CodeInspector>();

  static get(panel: NotebookPanel): CodeInspector | undefined {
    return this._dictionary.get(panel);
  }

  static getByCell(cell: Cell): CodeInspector | undefined {
    return this._dictionary.getByCell(cell);
  }

  static getByCells(cells: readonly Cell[]): CodeInspector | undefined {
    return this._dictionary.getByCells(cells);
  }

  //----

  readonly kernelExecutor: KernelExecutor;
  private _kernelVars = new Set<string>();

  constructor(panel: NotebookPanel) {
    super(panel);
    CodeInspector._dictionary.set(panel, this);

    this.kernelExecutor = new KernelExecutor(panel.sessionContext);
    this.kernelExecutor.initialized.connect(() => {
      this.updateKernelVariables();
    });
  }

  dispose() {
    if (this.isDisposed) return;

    super.dispose();
    CodeInspector._dictionary.delete(this.panel);
    this._kernelVars.clear();
    Signal.clearData(this);
  }

  get kernelVariables(): Set<string> {
    return this._kernelVars;
  }

  async updateKernelVariables(): Promise<Set<string>> {
    const vars = await this.kernelExecutor.getInteractiveVariables();
    this._kernelVars = new Set(vars);
    // Log.debug('kernel vars:', this._kernelVars);
    return this._kernelVars;
  }

  filterKernelVariables(variables: string[]): string[] {
    return variables.filter(In(this._kernelVars));
  }

  filterNonKernelVariables(variables: string[]): string[] {
    const nonKernelVars = variables.filter(notIn(this._kernelVars));
    // Log.debug(
    //   'filterNonKernelVariables',
    //   nonKernelVariables,
    //   variables,
    //   this._kernelVars
    // );
    return nonKernelVars;
  }

  async getCodeData(cell: CodeCell): Promise<ICodeData | undefined> {
    return await this.getCodeDataFromKernel(cell.model);
  }

  private async getCodeDataFromKernel(
    model: ICodeCellModel
  ): Promise<ICodeData | undefined> {
    const source = model.sharedModel.getSource();
    const result = await this.kernelExecutor.inspect(source);
    if (!result) return;

    const data: ICodeData = {
      variables: result.stored_names,
      unboundVariables: result.unbound_names
    };
    // Log.debug('code variables', data);
    return data;
  }

  // deprecated
  // private getCodeDataFromAst(cell: CodeCell): ICodeData {
  //   const variables: string[] = [];
  //   const unboundVariables: string[] = [];

  //   const editorView = (cell.editor as CodeMirrorEditor).editor;
  //   const tree = syntaxTree(editorView.state);
  //   const doc = editorView.state.doc;

  //   // 참조 변수 수집
  //   // 할당된 변수 수집
  //   const assignNodes = tree.topNode.getChildren('AssignStatement');
  //   for (const assignNode of assignNodes) {
  //     // const varNodes = assignNode.getChildren('VariableName', null, 'AssignOp');
  //     // NOTE: 위 코드로는 a = b = 1 구문에서 b를 얻지 못 함 (버그?)
  //     const varNodes = assignNode.getChildren('VariableName');
  //     const vars = varNodes
  //       .filter(node => node.nextSibling?.name === 'AssignOp')
  //       .map(node => doc.sliceString(node.from, node.to));
  //     variables.push(...vars);
  //   }

  //   console.debug(tree.topNode, { variables, unboundVariables });
  //   // console.debug(tree.topNode.getChildren('Statement'));

  //   return { variables, unboundVariables };
  // }
}

/**
 * CodeInspectorExtension
 */
export class CodeInspectorExtension
  implements DocumentRegistry.WidgetExtension
{
  constructor() {}

  createNew(panel: NotebookPanel): IDisposable {
    return new CodeInspector(panel);
  }
}
