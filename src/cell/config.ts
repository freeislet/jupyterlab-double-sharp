import { ICellModel } from '@jupyterlab/cells';

import { CellMetadata } from './metadata';

export namespace CellConfig {
  export function get(model: ICellModel): Required<CellMetadata.IConfig> {
    const config = CellMetadata.Config.getCoalesced(model);
    const override = CellMetadata.ConfigOverride.get(model);

    const defaultCache = true; // TODO: settings cache 설정 적용
    const coalesced = { cache: defaultCache, ...config, ...override };
    console.log('CellConfig', coalesced);
    return coalesced;
  }
}
