import { CodeCell } from '@jupyterlab/cells';

import { ICodeExecution, ICodeContext, CodeExecutionBuilder } from './code';
import { sortCells } from '../utils/cell';
import { notIn } from '../utils/array';

export interface IExecutionPlan {
  executions: ICodeExecution[];
  cells: CodeCell[];
  dependentCells?: CodeCell[];
}

export class ExecutionPlanner {
  static async buildFromContexts(
    contexts: ICodeContext[],
    forceExecute?: boolean
  ): Promise<IExecutionPlan> {
    const builder = new CodeExecutionBuilder();
    const executions = await Promise.all(
      contexts.map(context => builder.build(context, forceExecute))
    );
    const plan = new ExecutionPlanner().build(executions);
    return plan;
  }

  //----

  constructor() {}

  build(executions: ICodeExecution[]): IExecutionPlan {
    const cells = executions.map(execution => execution.cell);
    const dependentCells = sortCells(
      executions
        .flatMap(execution => execution.dependentCells ?? [])
        .filter(notIn(cells))
    );

    const plan = { executions, cells, dependentCells };
    Log.debug('execution plan', plan);
    return plan;
  }
}
