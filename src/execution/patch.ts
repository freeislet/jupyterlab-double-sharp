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
    const plan = ExecutionPlan.fromCells(cells);
    ExecutionPlan.begin(plan);

    const ret = OrgNotebookActions.run(
      notebook,
      sessionContext,
      sessionDialogs,
      translator
    );

    ExecutionPlan.end();
    return ret;
  }

  export async function runAndAdvance(
    notebook: Notebook,
    sessionContext?: ISessionContext,
    sessionDialogs?: ISessionContextDialogs,
    translator?: ITranslator
  ): Promise<boolean> {
    console.log('NotebookActions.runAndAdvance');
    return await OrgNotebookActions.runAndAdvance(
      notebook,
      sessionContext,
      sessionDialogs,
      translator
    );
  }

  export async function runAndInsert(
    notebook: Notebook,
    sessionContext?: ISessionContext,
    sessionDialogs?: ISessionContextDialogs,
    translator?: ITranslator
  ): Promise<boolean> {
    console.log('NotebookActions.runAndInsert');
    return await OrgNotebookActions.runAndInsert(
      notebook,
      sessionContext,
      sessionDialogs,
      translator
    );
  }

  export function runCells(
    notebook: Notebook,
    cells: readonly Cell[],
    sessionContext?: ISessionContext,
    sessionDialogs?: ISessionContextDialogs,
    translator?: ITranslator
  ): Promise<boolean> {
    console.log('NotebookActions.runCells');
    return OrgNotebookActions.runCells(
      notebook,
      cells,
      sessionContext,
      sessionDialogs,
      translator
    );
  }

  export function runAll(
    notebook: Notebook,
    sessionContext?: ISessionContext,
    sessionDialogs?: ISessionContextDialogs,
    translator?: ITranslator
  ): Promise<boolean> {
    console.log('NotebookActions.runAll');
    return OrgNotebookActions.runAll(
      notebook,
      sessionContext,
      sessionDialogs,
      translator
    );
  }

  export function runAllAbove(
    notebook: Notebook,
    sessionContext?: ISessionContext,
    sessionDialogs?: ISessionContextDialogs,
    translator?: ITranslator
  ): Promise<boolean> {
    console.log('NotebookActions.runAllAbove');
    return OrgNotebookActions.runAllAbove(
      notebook,
      sessionContext,
      sessionDialogs,
      translator
    );
  }

  export function runAllBelow(
    notebook: Notebook,
    sessionContext?: ISessionContext,
    sessionDialogs?: ISessionContextDialogs,
    translator?: ITranslator
  ): Promise<boolean> {
    console.log('NotebookActions.runAllBelow');
    return OrgNotebookActions.runAllBelow(
      notebook,
      sessionContext,
      sessionDialogs,
      translator
    );
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
