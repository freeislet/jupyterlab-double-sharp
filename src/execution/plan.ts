// 제거 예정

import { Cell, CodeCell } from '@jupyterlab/cells';

import { CellConfig } from '../cell';
import { CodeInspector } from '../code';
import { isCodeCell } from '../utils/cell';

export namespace ExecutionPlan {
  /**
   * Cell 실행정보
   */
  export interface IExecutionCell {
    cell: Cell;
    execute: boolean;
    dependencies?: IExecutionCell[];
    extra: IExecutionCellExtra;
  }

  /**
   * Cell 실행 관련 추가 정보 (디버그, 시각화 용)
   */
  export interface IExecutionCellExtra {
    dependencyLevel?: number;
    excludedReason?: ExcludedReason;
    message?: string;
  }

  export type ExcludedReason = 'skipped' | 'cached' | 'already exists';
}

export class ExecutionCells {
  protected _executionCells: ExecutionPlan.IExecutionCell[] = [];
  protected _allCells = new Set<Cell>();

  //

  get executionCells(): ExecutionPlan.IExecutionCell[] {
    return this._executionCells;
  }

  get cellsToExecute(): Cell[] {
    return this._collectCellsToExecute();
  }

  get codeCellsToExecute(): CodeCell[] {
    return this.cellsToExecute.filter(isCodeCell);
  }

  //

  constructor() {}

  /**
   * Cell 배열로부터 IExecutionCell 목록 생성
   */
  async build(cells: readonly Cell[]): Promise<ExecutionPlan.IExecutionCell[]> {
    this._executionCells = await Promise.all(
      cells.map(async cell => await this._buildItem(cell))
    );
    return this._executionCells;
  }

  protected async _buildItem(
    cell: Cell,
    dependencyLevel?: number
  ): Promise<ExecutionPlan.IExecutionCell> {
    const item: ExecutionPlan.IExecutionCell = {
      cell,
      execute: true,
      extra: {}
    };

    if (dependencyLevel) {
      item.extra.dependencyLevel = dependencyLevel;
    }

    const metadata = CellConfig.metadata.getCoalesced(cell.model);
    // console.log(metadata);

    // 셀 변수 테스트
    if (isCodeCell(cell)) {
      // CodeInspector.getByCell(cell)?.isCellCached(cell);
      await CodeInspector.getByCell(cell)?.getCodeData(cell);
    }

    if (metadata.skip) {
      item.execute = false;
      item.extra.excludedReason = 'skipped';
      item.extra.message = this._message('skipped' /*, metadata.skipMessage*/);
    } else if (metadata.cache && this.cached(cell)) {
      item.execute = false;
      item.extra.excludedReason = 'cached';
    } else if (this.exists(cell)) {
      item.execute = false;
      item.extra.excludedReason = 'already exists';
    }

    this._allCells.add(cell); // NOTE: 반드시 바로 위 exclude 체크와 아래 dependencies 수집 사이에 추가해야 함

    // dependencies
    if (item.execute) {
      // TODO
      // const nextDependencyLevel = (dependencyLevel ?? 0) + 1
      // item.dependencies = dependencies.map(c => this._buildItem(c, nextDependencyLevel))
    }

    return item;
  }

  protected _message(msg: string, desc?: string, noDesc = '.') {
    return msg + (desc ? `: ${desc}` : noDesc);
  }

  cached(cell: Cell): boolean {
    if (isCodeCell(cell) && cell.model.isDirty) {
      // const varTracker = CodeInspector.getByCell(cell);
      // return Boolean(varTracker?.isCellCached(cell));
    }
    return false;
  }

  exists(cell: Cell): boolean {
    return this._allCells.has(cell);
  }

  find(cell: Cell): ExecutionPlan.IExecutionCell | undefined {
    return this._executionCells.find(ce => ce.cell === cell);
  }

  reconstruct(executionCells: ExecutionPlan.IExecutionCell[]): this {
    this._executionCells = [...executionCells];
    this._allCells.clear();

    const add = (executionCell: ExecutionPlan.IExecutionCell) => {
      if (executionCell.dependencies) {
        for (const dependency of executionCell.dependencies) {
          add(dependency);
        }
      }
      this._allCells.add(executionCell.cell);
    };

    executionCells.forEach(ec => add(ec));
    return this;
  }

  processExcludedCells() {
    function process(executionCell: ExecutionPlan.IExecutionCell) {
      if (executionCell.execute) {
        if (executionCell.dependencies) {
          for (const dependency of executionCell.dependencies) {
            process(dependency);
          }
        }
      } else {
        const msg = executionCell.extra.message;
        const cell = executionCell.cell;
        if (msg && isCodeCell(cell)) {
          const output = {
            output_type: 'stream',
            name: 'stdout',
            text: `## ${msg}\n`
          };
          cell.outputArea.model.clear(true);
          cell.outputArea.model.add(output);
          // console.log(executionCell, output);
        }
      }
    }

    this._executionCells.forEach(ec => process(ec));
  }

  protected _collectCellsToExecute(): Cell[] {
    const cells: Cell[] = [];

    function collect(executionCell: ExecutionPlan.IExecutionCell) {
      if (!executionCell.execute) return;
      if (executionCell.dependencies) {
        for (const dependency of executionCell.dependencies) {
          collect(dependency);
        }
      }
      cells.push(executionCell.cell);
    }

    this._executionCells.forEach(ec => collect(ec));
    // console.log('cellsToExecute', cells);
    return cells;
  }
}

export class ExecutionPlan extends ExecutionCells {
  private static _current: ExecutionPlan | null = null;

  static async fromCells(cells: readonly Cell[]): Promise<ExecutionPlan> {
    const plan = new ExecutionPlan();
    await plan.build(cells);
    return plan;
  }

  /**
   * global 접근 가능하도록 static ExecutionPlan 설정
   * NOTE: NotebookActions의 Private.runCells를 patch할 수 없으므로,
   *       CodeCell.execute 안에서 현재 실행계획을 참조하도록 함
   */
  static begin(plan: ExecutionPlan) {
    if (this._current) throw 'Execution plan has already begun.';
    this._current = plan;
  }

  static end() {
    if (!this._current) throw 'Execution plan has not begun.';
    this._current = null;
  }

  static get current(): ExecutionPlan | null {
    return this._current;
  }

  //

  constructor() {
    super();
  }

  /**
   * 특정 Cell의 ExecutionCells 객체 생성
   * CodeCell.execute 안에서 종속 셀들과 함께 실행하기 위한 용도
   */
  getExecutionCellsOf(cell: Cell): ExecutionCells | undefined {
    const executionCell = this.find(cell);
    return executionCell && new ExecutionCells().reconstruct([executionCell]);
  }
}
