import { Cell, ICellModel } from '@jupyterlab/cells';

import { CellMetadata } from './metadata';
import { CSMagicExecutor } from '../cs-magic';

export namespace CellConfig {
  export type IConfig = CellMetadata.IConfig;

  export function get(cell: Cell): Required<IConfig> {
    const model = cell.model;

    if (CellMetadata.configOverride.isDirty(model)) {
      CSMagicExecutor.executeConfig(cell); // TODO: executeConfig 인자로 ICellModel 검토 (ICellModel로 Cell 찾기 구현)
    }

    const config = CellMetadata.config.getCoalesced(model);
    const override = CellMetadata.configOverride.get(model);

    const defaultCache = false; // TODO: settings cache 설정 적용
    const coalesced = { cache: defaultCache, ...config, ...override };
    // console.log('cell config', coalesced);
    return coalesced;
  }

  export function updateOverride(model: ICellModel, value: Partial<IConfig>) {
    CellMetadata.configOverride.update(model, value);
  }
}
