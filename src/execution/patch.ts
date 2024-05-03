import { NotebookActions, Notebook } from '@jupyterlab/notebook';
import { Cell, CodeCell } from '@jupyterlab/cells';
import { ISessionContext, ISessionContextDialogs } from '@jupyterlab/apputils';
import { ITranslator } from '@jupyterlab/translation';
import { KernelMessage } from '@jupyterlab/services';
import { JSONObject } from '@lumino/coreutils';

import { ExecutionPlan } from './plan';

// NOTE: dependency 처리를 위해 Private.runCells를 patch하면 좋지만,
//       불가능하므로 NotebookAction.runXXX 함수들을 모두 patch

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
  type ActionType = (...args: any) => Promise<boolean>;

  function _run<T extends ActionType>(
    cells: readonly Cell[],
    action: T,
    args: IArguments
  ): Promise<boolean> {
    ExecutionPlan.beginFromCells(cells);
    const ret = action.call(null, ...args);
    ExecutionPlan.end();
    return ret;
  }

  async function _runAsync<T extends ActionType>(
    cells: readonly Cell[],
    action: T,
    args: IArguments
  ): Promise<boolean> {
    ExecutionPlan.beginFromCells(cells);
    const ret = await action.call(null, ...args);
    ExecutionPlan.end();
    return ret;
  }

  function getSelectedCells(notebook: Notebook): readonly Cell[] {
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
    return await _runAsync(cells, OrgNotebookActions.runAndAdvance, arguments);
  }

  export async function runAndInsert(
    notebook: Notebook,
    sessionContext?: ISessionContext,
    sessionDialogs?: ISessionContextDialogs,
    translator?: ITranslator
  ): Promise<boolean> {
    const cells = getSelectedCells(notebook);
    return await _runAsync(cells, OrgNotebookActions.runAndInsert, arguments);
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
    const plan = ExecutionPlan.current;
    if (plan) {
      let ret: Awaited<ReturnType<typeof OrgCodeCell.execute>> = undefined;
      const cells = plan.getExecutionCodeCellsOf(cell);
      for (const cell of cells) {
        ret = await OrgCodeCell.execute(cell, sessionContext, metadata);
        console.log('CodeCell.execute msg:', ret);
      }
      return ret;
    } else {
      return OrgCodeCell.execute(cell, sessionContext, metadata);
    }
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
