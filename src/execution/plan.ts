import { CodeCell } from '@jupyterlab/cells';

import { ICodeExecution, ICodeContext } from './code';
import { notIn } from '../utils/array';

export interface IExecutionPlan {
  executions: ICodeExecution[];
  cells: CodeCell[];
  dependentCells?: CodeCell[];
}

export class ExecutionPlanner {
  static async buildFromContexts(
    contexts: ICodeContext[]
  ): Promise<IExecutionPlan> {
    const executions = await Promise.all(
      contexts.map(context => context.buildExecution())
    );
    const plan = new ExecutionPlanner().build(executions);
    return plan;
  }

  //----

  constructor() {}

  build(executions: ICodeExecution[]): IExecutionPlan {
    const cells = executions.map(execution => execution.cell);
    const dependentCells = executions
      .flatMap(execution => execution.dependentCells ?? [])
      .filter(notIn(cells));

    const plan = { executions, cells, dependentCells };
    Log.debug('execution plan', plan);
    return plan;
  }
}
