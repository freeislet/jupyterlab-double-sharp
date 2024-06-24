import { ICellModel } from '@jupyterlab/cells';
import merge from 'lodash.merge';

import { CellMetadata } from './metadata';
import { Settings } from '../settings';
import { replaceValue } from '../utils/json';

export namespace CellConfig {
  export type UseSettings = null;

  export interface IConfig {
    skip: boolean;
    cache: boolean | UseSettings;
    autoDependency: boolean | UseSettings;
  }

  export function get(
    model: ICellModel,
    checkDirty = true
  ): NonNullableField<IConfig> {
    const execSettings = Settings.data.execution;
    const settings: NonNullableField<PickNullish<IConfig>> = {
      cache: execSettings.cache,
      autoDependency: execSettings.autoDependency
    };
    const forcedSettings: Partial<IConfig> = {
      skip: execSettings.disableSkip ? false : undefined,
      cache: execSettings.disableCache ? false : undefined,
      autoDependency: execSettings.disableAutoDependency ? false : undefined
    };

    const config = CellMetadata.config.getCoalesced(model);
    const override = CellMetadata.configOverride.get(model, checkDirty);
    const coalesced = merge(
      settings,
      removeNull(config),
      removeNull(override),
      forcedSettings
    );
    Log.debug('cell config', coalesced);
    return coalesced;
  }

  function removeNull(obj: any) {
    return replaceValue(obj, null, undefined);
  }
}
