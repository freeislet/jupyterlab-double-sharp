import { ICellModel } from '@jupyterlab/cells';

export namespace Metadata {
  export interface ICellExecution {
    skip: boolean;
    use_cache: boolean;
    dependencies: string[] | undefined;
  }

  const CELL_EXECUTION = '##execution';

  export function getCellExecution(
    model: ICellModel
  ): ICellExecution | undefined {
    return model.getMetadata(CELL_EXECUTION);
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
