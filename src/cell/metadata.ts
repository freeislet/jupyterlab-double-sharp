import { ICellModel } from '@jupyterlab/cells';
import equal from 'fast-deep-equal';

export namespace CellMetadata {
  export interface ICell {
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
    cache: boolean;
    // dependencies?: string[]; // TODO
  }
}

export class CellMetadata {
  static get Cell(): MetadataGroup<CellMetadata.ICell> {
    return Private.Cell;
  }

  static get Config(): MetadataGroup<CellMetadata.IConfig> {
    return Private.Config;
  }

  static get Execution(): MetadataGroup<CellMetadata.IExecution> {
    return Private.Execution;
  }

  private constructor() {}
}

class MetadataGroup<T> {
  constructor(
    public readonly name: string,
    public readonly defaultValue: T
  ) {}

  get(model: ICellModel): T | undefined {
    return model.getMetadata(this.name);
  }

  getCoalesced(model: ICellModel): T {
    return { ...this.defaultValue, ...this.get(model) };
  }

  set(model: ICellModel, value: T) {
    model.setMetadata(this.name, value);
  }

  update(model: ICellModel, value: Partial<T>, deleteIfEqual = false) {
    const newValue = { ...this.getCoalesced(model), ...value };
    if (deleteIfEqual && equal(newValue, this.defaultValue)) {
      this.delete(model);
    } else {
      this.set(model, newValue);
    }
  }

  delete(model: ICellModel) {
    model.deleteMetadata(this.name);
  }
}

namespace Private {
  export const Cell = new MetadataGroup<CellMetadata.ICell>('##Cell', {});
  export const Config = new MetadataGroup<CellMetadata.IConfig>('##Config', {
    skip: false,
    cache: false
  });
  export const Execution = new MetadataGroup<CellMetadata.IExecution>(
    '##Execution',
    {
      skip: false,
      cache: false
    }
  );
}
