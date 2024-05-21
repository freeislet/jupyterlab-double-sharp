/* eslint-disable prefer-rest-params */

import { NotebookActions, Notebook } from '@jupyterlab/notebook';
import { Cell, CodeCell } from '@jupyterlab/cells';
import { ISessionContext, ISessionContextDialogs } from '@jupyterlab/apputils';
import { ITranslator } from '@jupyterlab/translation';
import { KernelMessage } from '@jupyterlab/services';
import { JSONObject } from '@lumino/coreutils';

import { ExecutionActions } from './actions';
import { CellExecution } from '../cell';

namespace OrgNotebookActions {
  export const run = NotebookActions.run;
  export const runAndAdvance = NotebookActions.runAndAdvance;
  export const runAndInsert = NotebookActions.runAndInsert;
  export const runCells = NotebookActions.runCells;
  export const runAll = NotebookActions.runAll;
  export const runAllAbove = NotebookActions.runAllAbove;
  export const runAllBelow = NotebookActions.runAllBelow;
}

namespace OrgCodeCell {
  export const execute = CodeCell.execute;
}

namespace NewNotebookActions {
  async function _run(
    cells: readonly Cell[],
    runFn: (...args: any) => Promise<boolean>,
    args: IArguments
  ): Promise<boolean> {
    ExecutionActions.beforeExecution.emit({ cells });
    // ExecutionPlan.begin(await ExecutionPlan.fromCells(cells));
    const ret = await runFn.call(null, ...args);
    // ExecutionPlan.end();
    ExecutionActions.afterExecution.emit({ cells });
    return ret;
  }

  function getSelectedCells(notebook: Notebook): Cell[] {
    return notebook.widgets.filter(child => notebook.isSelectedOrActive(child));
  }

  export function run(
    notebook: Notebook,
    sessionContext?: ISessionContext,
    sessionDialogs?: ISessionContextDialogs,
    translator?: ITranslator
  ): Promise<boolean> {
    const cells = getSelectedCells(notebook);
    return _run(cells, OrgNotebookActions.run, arguments);
  }

  export async function runAndAdvance(
    notebook: Notebook,
    sessionContext?: ISessionContext,
    sessionDialogs?: ISessionContextDialogs,
    translator?: ITranslator
  ): Promise<boolean> {
    const cells = getSelectedCells(notebook);
    return await _run(cells, OrgNotebookActions.runAndAdvance, arguments);
  }

  export async function runAndInsert(
    notebook: Notebook,
    sessionContext?: ISessionContext,
    sessionDialogs?: ISessionContextDialogs,
    translator?: ITranslator
  ): Promise<boolean> {
    const cells = getSelectedCells(notebook);
    return await _run(cells, OrgNotebookActions.runAndInsert, arguments);
  }

  export function runCells(
    notebook: Notebook,
    cells: readonly Cell[],
    sessionContext?: ISessionContext,
    sessionDialogs?: ISessionContextDialogs,
    translator?: ITranslator
  ): Promise<boolean> {
    return _run(cells, OrgNotebookActions.runCells, arguments);
  }

  export function runAll(
    notebook: Notebook,
    sessionContext?: ISessionContext,
    sessionDialogs?: ISessionContextDialogs,
    translator?: ITranslator
  ): Promise<boolean> {
    const allCells = notebook.widgets;
    return _run(allCells, OrgNotebookActions.runAll, arguments);
  }

  export function runAllAbove(
    notebook: Notebook,
    sessionContext?: ISessionContext,
    sessionDialogs?: ISessionContextDialogs,
    translator?: ITranslator
  ): Promise<boolean> {
    const aboveCells = notebook.widgets.slice(0, notebook.activeCellIndex);
    return _run(aboveCells, OrgNotebookActions.runAllAbove, arguments);
  }

  export function runAllBelow(
    notebook: Notebook,
    sessionContext?: ISessionContext,
    sessionDialogs?: ISessionContextDialogs,
    translator?: ITranslator
  ): Promise<boolean> {
    const belowCells = notebook.widgets.slice(notebook.activeCellIndex);
    return _run(belowCells, OrgNotebookActions.runAllBelow, arguments);
  }
}

namespace NewCodeCell {
  export async function execute(
    cell: CodeCell,
    sessionContext: ISessionContext,
    metadata?: JSONObject
  ): Promise<KernelMessage.IExecuteReplyMsg | void> {
    let ret: Awaited<ReturnType<typeof OrgCodeCell.execute>> = undefined;

    const cells = await CellExecution.getCellsToExecute(cell);
    for (const codeCell of cells) {
      ret = await OrgCodeCell.execute(codeCell, sessionContext, metadata);
      // console.log('CodeCell.execute ret:', ret);
    }

    return ret;
  }
}

export function patchExecutionFunctions() {
  NotebookActions.run = NewNotebookActions.run;
  NotebookActions.runAndAdvance = NewNotebookActions.runAndAdvance;
  NotebookActions.runAndInsert = NewNotebookActions.runAndInsert;
  NotebookActions.runCells = NewNotebookActions.runCells;
  NotebookActions.runAll = NewNotebookActions.runAll;
  NotebookActions.runAllAbove = NewNotebookActions.runAllAbove;
  NotebookActions.runAllBelow = NewNotebookActions.runAllBelow;
  CodeCell.execute = NewCodeCell.execute;
}
