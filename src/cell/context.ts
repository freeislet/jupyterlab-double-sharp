import { Cell, ICellModel } from '@jupyterlab/cells';

import { CellMetadata } from './metadata';

export class CellContext {
  constructor(public readonly cell: Cell) {}

  getConfig(): Required<CellMetadata.IConfig> {
    return CellContext.getConfig(this.cell.model);
  }
}

export namespace CellContext {
  export function getConfig(model: ICellModel): Required<CellMetadata.IConfig> {
    const config = CellMetadata.Config.getCoalesced(model);
    const override = CellMetadata.ConfigOverride.get(model);

    const defaultCache = false; // TODO: settings cache 설정 적용
    const coalesced = { cache: defaultCache, ...config, ...override };
    // console.log('cell config', coalesced);
    return coalesced;
  }
}
