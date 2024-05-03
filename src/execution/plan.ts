import { Cell, CodeCell, isCodeCellModel } from '@jupyterlab/cells';

import { Metadata } from '../metadata';

export namespace ExecutionPlan {
  /**
   * Cell 실행정보
   */
  export interface ICellExecution {
    cell: Cell;
    execute: boolean;
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

  export type ExcludedReason = 'skipped' | 'cached' | 'already included';
}

export class ExecutionPlan {
  /**
   * Cell 배열로부터 ExecutionPlan 생성
   */
  static fromCells(cells: Cell[]): ExecutionPlan {
    const plan = new ExecutionPlan();
    plan.build(cells);
    return plan;
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
  protected _cells = new Set<Cell>();

  constructor() {}

  get cellExecutions(): ExecutionPlan.ICellExecution[] {
    return this._cellExecutions;
  }

  get cellsToExecute(): Cell[] {
    return this._cellExecutions.filter(ce => ce.execute).map(ce => ce.cell);
  }

  /**
   * Cell의 dependencies를 포함하여 실행할 셀 목록 조회
   * CodeCell.execute 안에서 종속 셀들과 함께 실행하기 위한 용도
   * (X) 해당 cell이 dependency이면 [] 리턴
   */
  getExecutionCellsOf(cell: Cell): Cell[] {
    const index = this._cellExecutions.findIndex(ce => ce.cell === cell);
    if (index < 0) return [];

    let firstIndex = index; // cell dependency 첫 번째 인덱스 (없으면 cell index)
    const baseLevel = this._cellExecutions[index].extra.dependencyLevel ?? 0;

    for (let i = index - 1; i >= 0; --i) {
      const level = this._cellExecutions[i].extra.dependencyLevel ?? 0;
      const inGroup = level > baseLevel;
      if (inGroup) {
        firstIndex = i;
      } else break;
    }

    const executionCells = this._cellExecutions
      .slice(firstIndex, index + 1)
      .filter(ce => ce.execute);
    console.log('execution cells', executionCells, firstIndex, index);

    return executionCells.map(ce => ce.cell);
  }

  getExecutionCodeCellsOf(cell: Cell): CodeCell[] {
    const cells = this.getExecutionCellsOf(cell);
    return cells.filter(c => isCodeCellModel(c.model)) as CodeCell[];
  }

  build(cells: Cell[]): ExecutionPlan {
    for (const cell of cells) {
      this._add(cell);
    }

    return this;
  }

  protected _add(cell: Cell, dependencyLevel?: number) {
    if (!cell) return;

    const metadata = Metadata.getCellExecution(cell.model, true)!;
    console.log(metadata);

    const item: ExecutionPlan.ICellExecution = {
      cell,
      execute: true,
      extra: {}
    };

    if (dependencyLevel !== undefined) {
      item.extra.dependencyLevel = dependencyLevel;
    }

    if (metadata.skip) {
      item.execute = false;
      item.extra.excludedReason = 'skipped';
      item.extra.skipMessage = metadata.skipMessage;
    } else if (metadata.useCache && this._cached(cell)) {
      item.execute = false;
      item.extra.excludedReason = 'cached';
    } else if (this._added(cell)) {
      item.execute = false;
      item.extra.excludedReason = 'already included';
    }

    // dependencies
    if (item.execute) {
      // TODO
    }

    this._cellExecutions.push(item);
    this._cells.add(cell);
  }

  protected _cached(cell: Cell): boolean {
    const codeCellModel = isCodeCellModel(cell.model) ? cell.model : undefined;
    return codeCellModel?.isDirty === false;
  }

  protected _added(cell: Cell): boolean {
    return this._cells.has(cell);
  }
}
