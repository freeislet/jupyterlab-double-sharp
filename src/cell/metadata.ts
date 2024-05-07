import { ICellModel } from '@jupyterlab/cells';

export namespace CellMetadata {
  export interface ICell {
    id: string;
    subIds?: string[];
    parentId?: string;
    generated?: boolean;
  }

  export interface IConfig {
    skip: boolean;
    skipMessage?: string;
    cache: boolean;
    ignore?: string[];
  }

  export interface IExecution {
    skip: boolean;
    skipMessage?: string;
    useCache: boolean;
    dependencies?: string[]; // TODO
  }

  // const CELL = '##Cell';
  // const CONFIG = '##Config';
  const EXECUTION = '##Execution';

  export function getCell(
    model: ICellModel,
    coalesceDefault = false
  ): IExecution | undefined {
    const metadata = model.getMetadata(EXECUTION);
    return coalesceDefault
      ? { skip: false, useCache: false, ...metadata }
      : metadata;
  }

  export function getExecution(
    model: ICellModel,
    coalesceDefault = false
  ): IExecution | undefined {
    const metadata = model.getMetadata(EXECUTION);
    return coalesceDefault
      ? { skip: false, useCache: false, ...metadata }
      : metadata;
  }

  export function setExecution(model: ICellModel, value: IExecution) {
    model.setMetadata(EXECUTION, value);
  }

  export function updateExecution(
    model: ICellModel,
    value: Partial<IExecution>
  ) {
    const newValue = { ...getExecution(model), ...value };
    model.setMetadata(EXECUTION, newValue);
  }
}
