import { ICellModel } from '@jupyterlab/cells';

import { CellMetadata } from './metadata';

export namespace CellConfig {
  export type IConfig = CellMetadata.IConfig;

  export function get(model: ICellModel): Required<CellMetadata.IConfig> {
    const config = CellMetadata.Config.getCoalesced(model);
    const override = CellMetadata.ConfigOverride.get(model);

    const defaultCache = false; // TODO: settings cache 설정 적용
    const coalesced = { cache: defaultCache, ...config, ...override };
    // console.log('cell config', coalesced);
    return coalesced;
  }

  export function isOverrideDirty(model: ICellModel): boolean {
    return CellMetadata.ConfigOverride.isDirty(model);
  }

  export function updateOverride(model: ICellModel, value: Partial<IConfig>) {
    CellMetadata.ConfigOverride.update(model, value);
  }
}
