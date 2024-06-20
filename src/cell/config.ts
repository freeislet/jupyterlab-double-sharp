import { ICellModel } from '@jupyterlab/cells';
import merge from 'lodash.merge';

import { CellMetadata } from './metadata';
import { Settings } from '../settings';

export namespace CellConfig {
  export type UseSettings = null;

  export interface IConfig {
    skip: boolean;
    useCache: boolean | UseSettings;
    autoDependency: boolean | UseSettings;
  }

  export function get(model: ICellModel): NonNullableField<IConfig> {
    const execSettings = Settings.data.execution;
    const settings: NonNullableField<PickNullish<IConfig>> = {
      useCache: execSettings.useCache,
      autoDependency: execSettings.autoDependency
    };
    const forcedSettings: Partial<IConfig> = {
      skip: execSettings.disableSkip ? false : undefined,
      useCache: execSettings.disableCache ? false : undefined,
      autoDependency: execSettings.disableAutoDependency ? false : undefined
    };

    const config = CellMetadata.config.getCoalesced(model);
    const override = CellMetadata.configOverride.get(model);
    const coalesced = merge(settings, config, override, forcedSettings);
    Log.debug('cell config', coalesced);
    return coalesced;
  }
}
