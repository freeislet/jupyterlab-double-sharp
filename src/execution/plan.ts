import { CodeCell, Cell } from '@jupyterlab/cells';

import { ICodeExecution, CodeExecution } from './code';
import { CodeContext, CellCode, CellExecution } from '../cell'; // TODO: ../cell 의존성 제거 검토
import { Settings } from '../settings';
import { sortCells } from '../utils/cell';
import { notIn } from '../utils/array';

export interface IExecutionCell {
  readonly cell: CodeCell;
  needExecute(): Promise<boolean>;
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
    // Log.debug('execution plan', this);
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

  async needExecute(): Promise<boolean> {
    const execution = this.execution;
    if (execution.skipped) return false;
    if (execution.cached) return false;

    const options = execution.options;
    const config = execution.config;
    if (config?.cache && !options?.ignoreCache) {
      // ICodeExecution 생성 시점에는 cache가 없었지만 셀들 실행 중에 cache 됐는지 여부 확인
      const cell = this.cell;
      const variables = execution.code?.variables;
      const cached = await CellCode.isCached(cell, undefined, variables);
      if (cached) {
        CellExecution.metadata.update(cell.model, { cached: true });
        return false;
      }
    }
    return true;
  }
}

export class DependencyCell implements IExecutionCell {
  context: CodeContext;

  constructor(public readonly cell: CodeCell) {
    this.context = new CodeContext(cell);
  }

  async needExecute(): Promise<boolean> {
    const config = this.context.getConfig();
    if (config.skip) return false;
    if (config.cache) {
      const cached = await this.context.isCached();
      if (cached) return false;
    }
    return true;
  }
}
