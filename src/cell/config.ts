import { ICellModel } from '@jupyterlab/cells';

import { CellMetadata } from './metadata';
import { CSMagicExecutor } from '../cs-magic';

export namespace CellConfig {
  export type IConfig = CellMetadata.IConfig;

  export function get(model: ICellModel): Required<IConfig> {
    if (CellMetadata.configOverride.isDirty(model)) {
      CSMagicExecutor.executeConfig(model);
    }

    const config = CellMetadata.config.getCoalesced(model);
    const override = CellMetadata.configOverride.get(model);

    const defaultCache = false; // TODO: settings cache 설정 적용
    const coalesced = { useCache: defaultCache, ...config, ...override };
    // console.log('cell config', coalesced);
    return coalesced;
  }

  export function updateOverride(model: ICellModel, value: Partial<IConfig>) {
    CellMetadata.configOverride.update(model, value);
  }
}
