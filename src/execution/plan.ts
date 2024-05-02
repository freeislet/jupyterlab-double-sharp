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
   *
   * @param cells Cell 배열로부터 ExecutionPlan 생성
   * @returns
   */
  static fromCells(cells: Cell[]): ExecutionPlan {
    const plan = new ExecutionPlan();
    plan.build(cells);
    return plan;
  }

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
