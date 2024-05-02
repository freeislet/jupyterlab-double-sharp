import { ICellModel } from '@jupyterlab/cells';

export namespace Metadata {
  export interface ICellExecution {
    skip: boolean;
    skipMessage?: string;
    useCache: boolean;
    dependencies?: string[];
  }

  const CELL_EXECUTION = '##execution';

  export function getCellExecution(
    model: ICellModel,
    coalesceDefault = false
  ): ICellExecution | undefined {
    const metadata = model.getMetadata(CELL_EXECUTION);
    return coalesceDefault
      ? { skip: false, useCache: false, ...metadata }
      : metadata;
  }

  export function setCellExecution(model: ICellModel, value: ICellExecution) {
    model.setMetadata(CELL_EXECUTION, value);
  }

  export function updateCellExecution(
    model: ICellModel,
    value: Partial<ICellExecution>
  ) {
    const newValue = { ...getCellExecution(model), ...value };
    model.setMetadata(CELL_EXECUTION, newValue);
  }
}
