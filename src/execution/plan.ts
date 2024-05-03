import { Cell, CodeCell, isCodeCellModel } from '@jupyterlab/cells';

import { Metadata } from '../metadata';

export namespace ExecutionPlan {
  /**
   * Cell 실행정보
   */
  export interface ICellExecution {
    cell: Cell;
    execute: boolean;
    dependencies?: ICellExecution[];
    extra: ICellExecutionExtra;
  }

  /**
   * Cell 실행 관련 추가 정보 (디버그, 시각화 용)
   */
  export interface ICellExecutionExtra {
    dependencyLevel?: number;
    excludedReason?: ExcludedReason;
    skipMessage?: string;
  }

  export type ExcludedReason = 'skipped' | 'cached' | 'already exists';
}

export class ExecutionPlan {
  /**
   * Cell 배열로부터 ExecutionPlan 생성
   */
  static fromCells(cells: Cell[]): ExecutionPlan {
    return new ExecutionPlan().build(cells);
  }

  private static _current: ExecutionPlan | null = null;

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

  protected _cellExecutions: ExecutionPlan.ICellExecution[] = [];
  protected _allCells = new Set<Cell>();

  constructor() {}

  get cellExecutions(): ExecutionPlan.ICellExecution[] {
    return this._cellExecutions;
  }

  get executionCells(): Cell[] {
    const cells: Cell[] = [];
    this._cellExecutions.forEach(ce => this._collectExecutionCells(ce, cells));
    return cells;
  }

  build(cells: Cell[]): ExecutionPlan {
    this._cellExecutions = cells.map(c => this._buildItem(c));
    return this;
  }

  protected _buildItem(
    cell: Cell,
    dependencyLevel?: number
  ): ExecutionPlan.ICellExecution {
    this._allCells.add(cell);

    const item: ExecutionPlan.ICellExecution = {
      cell,
      execute: true,
      extra: {}
    };

    if (dependencyLevel !== undefined) {
      item.extra.dependencyLevel = dependencyLevel;
    }

    const metadata = Metadata.getCellExecution(cell.model, true)!;
    // console.log(metadata);

    if (metadata.skip) {
      item.execute = false;
      item.extra.excludedReason = 'skipped';
      item.extra.skipMessage = metadata.skipMessage;
    } else if (metadata.useCache && this._cached(cell)) {
      item.execute = false;
      item.extra.excludedReason = 'cached';
    } else if (this.exists(cell)) {
      item.execute = false;
      item.extra.excludedReason = 'already exists';
    }

    // dependencies
    if (item.execute) {
      // TODO
      // const nextDependencyLevel = (dependencyLevel ?? 0) + 1
      // item.dependencies = dependencies.map(c => this._buildItem(c, nextDependencyLevel))
    }

    return item;
  }

  protected _cached(cell: Cell): boolean {
    const codeCellModel = isCodeCellModel(cell.model) ? cell.model : undefined;
    return codeCellModel?.isDirty === false;
  }

  exists(cell: Cell): boolean {
    return this._allCells.has(cell);
  }

  /**
   * Cell의 dependencies를 포함하여 실행할 셀 목록 조회
   * CodeCell.execute 안에서 종속 셀들과 함께 실행하기 위한 용도
   */
  getExecutionCellsOf(cell: Cell): Cell[] {
    const cellExecution = this._cellExecutions.find(ce => ce.cell === cell);
    if (!cellExecution) return [];

    const cells: Cell[] = [];
    this._collectExecutionCells(cellExecution, cells);
    console.log('execution cells', cells);
    return cells;
  }

  getExecutionCodeCellsOf(cell: Cell): CodeCell[] {
    const cells = this.getExecutionCellsOf(cell);
    return cells.filter(c => isCodeCellModel(c.model)) as CodeCell[];
  }

  protected _collectExecutionCells(
    cellExecution: ExecutionPlan.ICellExecution,
    outCells: Cell[]
  ) {
    if (!cellExecution.execute) return;

    for (const dependency of cellExecution.dependencies ?? []) {
      this._collectExecutionCells(dependency, outCells);
    }

    outCells.push(cellExecution.cell);
  }
}
