import { CodeCell, Cell } from '@jupyterlab/cells';

import { ICodeExecution, CodeExecution } from './code';
import { CodeContext } from '../cell';
import { Settings } from '../settings';
import { sortCells } from '../utils/cell';
import { notIn } from '../utils/array';

export interface IExecutionCell {
  readonly cell: CodeCell;
  readonly needExecute: boolean;
}

export class ExecutionPlan {
  private static _current: ExecutionPlan | null = null;

  /**
   * global 접근 가능하도록 static ExecutionPlan 설정
   * NOTE: NotebookActions의 Private.runCells를 patch할 수 없으므로,
   *       CodeCell.execute 안에서 현재 실행계획을 참조하도록 함
   */
  static get current(): ExecutionPlan | null {
    return this._current;
  }

  static async beginFromCells(
    cells: readonly Cell[],
    isSelected?: boolean
  ): Promise<ExecutionPlan> {
    const contexts = CodeContext.fromCells(cells);
    const executions = await CodeExecution.buildMultiple(contexts, {
      saveUnresolvedDependencies: Settings.data.verbose.metadata,
      ignoreCache: isSelected && Settings.data.execution.ignoreCacheSelected
    });
    const plan = ExecutionPlan.begin(executions);
    return plan;
  }

  static begin(executions: ICodeExecution[]): ExecutionPlan {
    if (ExecutionPlan._current) throw 'Execution plan has already begun.';

    ExecutionPlan._current = new ExecutionPlan(executions);
    return ExecutionPlan._current;
  }

  static end() {
    if (!ExecutionPlan._current) throw 'Execution plan has not begun.';

    ExecutionPlan._current = null;
  }

  //----

  executionCells: ExecutionCell[];
  dependencyCells?: DependencyCell[];

  constructor(public readonly executions: ICodeExecution[]) {
    const cells = executions.map(execution => execution.cell);

    this.executionCells = executions.map(
      execution => new ExecutionCell(execution)
    );
    this.dependencyCells = sortCells(
      executions
        .flatMap(execution => execution.dependencyCells ?? [])
        .filter(notIn(cells))
    ).map(cell => new DependencyCell(cell));
    Log.debug('execution plan', this);
  }

  getExecutionCell(cell: CodeCell): IExecutionCell | undefined {
    const executionCell = this.executionCells.find(c => c.cell === cell);
    if (executionCell) return executionCell;

    const dependencyCell = this.dependencyCells?.find(c => c.cell === cell);
    return dependencyCell;
  }
}

export class ExecutionCell implements IExecutionCell {
  constructor(public readonly execution: ICodeExecution) {}

  get cell(): CodeCell {
    return this.execution.cell;
  }

  get needExecute(): boolean {
    // const config = context.getConfig();
    // if (config.skip) return;
    // if (config.cache) {
    //   const cached = await context.isCached();
    //   if (cached) return;
    // }
    return true;
  }

  getConfig() {}

  isCached() {}
}

export class DependencyCell implements IExecutionCell {
  constructor(public readonly cell: CodeCell) {}

  get needExecute(): boolean {
    return true;
  }

  getConfig() {}
}
