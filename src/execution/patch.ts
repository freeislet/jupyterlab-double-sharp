/* eslint-disable prefer-rest-params */

import { NotebookActions, Notebook } from '@jupyterlab/notebook';
import { Cell, CodeCell } from '@jupyterlab/cells';
import { ISessionContext, ISessionContextDialogs } from '@jupyterlab/apputils';
import { ITranslator } from '@jupyterlab/translation';
import { KernelMessage } from '@jupyterlab/services';
import { JSONObject } from '@lumino/coreutils';

import { ExecutionPlanner } from './plan';
import { ExecutionActions } from './actions';
import { CodeContext } from '../cell';

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
    runFn: (...args: any) => Promise<boolean>,
    args: IArguments,
    cells: readonly Cell[],
    sessionContext: ISessionContext | undefined
  ): Promise<boolean> {
    ExecutionActions.beforeExecution.emit({ cells });

    const contexts = CodeContext.fromCells(cells);
    const plan = await ExecutionPlanner.buildFromContexts(contexts);
    if (plan.dependentCells) {
      const validSession =
        sessionContext &&
        !sessionContext.isTerminating &&
        !sessionContext.pendingInput &&
        !sessionContext.hasNoKernel;
      if (validSession) {
        for (const cell of plan.dependentCells) {
          await CodeCell.execute(cell, sessionContext);
        }
      }
    }

    const ret = await runFn.call(null, ...args);

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
    Log.debug('run');
    const cells = getSelectedCells(notebook);
    return _run(OrgNotebookActions.run, arguments, cells, sessionContext);
  }

  export async function runAndAdvance(
    notebook: Notebook,
    sessionContext?: ISessionContext,
    sessionDialogs?: ISessionContextDialogs,
    translator?: ITranslator
  ): Promise<boolean> {
    Log.debug('runAndAdvance');
    const cells = getSelectedCells(notebook);
    return await _run(
      OrgNotebookActions.runAndAdvance,
      arguments,
      cells,
      sessionContext
    );
  }

  export async function runAndInsert(
    notebook: Notebook,
    sessionContext?: ISessionContext,
    sessionDialogs?: ISessionContextDialogs,
    translator?: ITranslator
  ): Promise<boolean> {
    Log.debug('runAndInsert');
    const cells = getSelectedCells(notebook);
    return await _run(
      OrgNotebookActions.runAndInsert,
      arguments,
      cells,
      sessionContext
    );
  }

  export function runCells(
    notebook: Notebook,
    cells: readonly Cell[],
    sessionContext?: ISessionContext,
    sessionDialogs?: ISessionContextDialogs,
    translator?: ITranslator
  ): Promise<boolean> {
    Log.debug('runCells');
    return _run(OrgNotebookActions.runCells, arguments, cells, sessionContext);
  }

  export function runAll(
    notebook: Notebook,
    sessionContext?: ISessionContext,
    sessionDialogs?: ISessionContextDialogs,
    translator?: ITranslator
  ): Promise<boolean> {
    Log.debug('runAll');
    const allCells = notebook.widgets;
    return _run(OrgNotebookActions.runAll, arguments, allCells, sessionContext);
  }

  export function runAllAbove(
    notebook: Notebook,
    sessionContext?: ISessionContext,
    sessionDialogs?: ISessionContextDialogs,
    translator?: ITranslator
  ): Promise<boolean> {
    const aboveCells = notebook.widgets.slice(0, notebook.activeCellIndex);
    return _run(
      OrgNotebookActions.runAllAbove,
      arguments,
      aboveCells,
      sessionContext
    );
  }

  export function runAllBelow(
    notebook: Notebook,
    sessionContext?: ISessionContext,
    sessionDialogs?: ISessionContextDialogs,
    translator?: ITranslator
  ): Promise<boolean> {
    const belowCells = notebook.widgets.slice(notebook.activeCellIndex);
    return _run(
      OrgNotebookActions.runAllBelow,
      arguments,
      belowCells,
      sessionContext
    );
  }
}

namespace NewCodeCell {
  export async function execute(
    cell: CodeCell,
    sessionContext: ISessionContext,
    metadata?: JSONObject
  ): Promise<KernelMessage.IExecuteReplyMsg | void> {
    // 셀 config 및 cache 여부 조회
    const context = new CodeContext(cell);
    const config = context.getConfig();
    // TODO; force execution
    if (config.skip) return;
    if (config.cache) {
      const cached = await context.isCached();
      if (cached) return;
    }

    // 기존 실행 함수
    const ret = await OrgCodeCell.execute(cell, sessionContext, metadata);
    Log.debug('CodeCell.execute:', cell.model.id, ret, metadata);
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
