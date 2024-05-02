import { Cell, isCodeCellModel } from '@jupyterlab/cells';

import { Metadata } from '../metadata';

export namespace ExecutionPlan {
  /**
   * Cell 실행정보
   */
  export interface ICellExecution {
    execute: boolean;
    cell: Cell;
    extra: ICellExecutionExtra;
  }

  /**
   * Cell 실행 관련 추가 정보 (디버그, 시각화 용)
   */
  export interface ICellExecutionExtra {
    dependencyLevel: number;
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
    if (this._current) throw 'Execution plan has not begun.';
    this._current = null;
  }

  static get current(): ExecutionPlan | null {
    return this._current;
  }

  //

  protected _cellExecutions: ExecutionPlan.ICellExecution[] = [];
  protected _cells = new Set<Cell>();

  get cellExecutions(): ExecutionPlan.ICellExecution[] {
    return this._cellExecutions;
  }

  get cellsToExecute(): Cell[] {
    return this._cellExecutions.filter(ce => ce.execute).map(ce => ce.cell);
  }

  constructor() {}

  build(cells: Cell[]): ExecutionPlan {
    for (const cell of cells) {
      this._add(cell, 0);
    }

    return this;
  }

  protected _add(cell: Cell, dependencyLevel = 0) {
    if (!cell) return;

    const metadata = Metadata.getCellExecution(cell.model, true)!;
    console.log(metadata);

    const item: ExecutionPlan.ICellExecution = {
      execute: true,
      cell,
      extra: {
        dependencyLevel
      }
    };

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

  /**
   * Cell의 dependencies 샐 조회
   * CodeCell.execute 안에서 종속 셀들을 먼저 실행하기 위한 용도로서, 해당 cell이 dependency이면 [] 리턴
   */
  getDependenciesOf(cell: Cell): Cell[] {
    // TODO
    return [];
  }
}
