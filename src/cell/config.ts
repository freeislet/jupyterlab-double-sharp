import { ICellModel } from '@jupyterlab/cells';
import merge from 'lodash.merge';

import { CellCSMagic } from './cs-magic';
import { Settings } from '../settings';
import { metadataKeys } from '../const';
import { MetadataGroup } from '../utils/metadata';
import { replaceValue } from '../utils/json';

export namespace CellConfig {
  export type UseSettings = null;

  export interface IData {
    skip: boolean;
    cache: boolean | UseSettings;
    autoDependency: boolean | UseSettings;
  }
}

export class CellConfig {
  private static _metadata = new MetadataGroup<CellConfig.IData>(
    metadataKeys.config,
    {
      skip: false,
      cache: null,
      autoDependency: null
    },
    true
  );

  static get metadata(): MetadataGroup<CellConfig.IData> {
    return CellConfig._metadata;
  }
}

export namespace CellConfig {
  export function get(
    model: ICellModel,
    checkDirty = true
  ): NonNullableField<IData> {
    const execSettings = Settings.data.execution;
    const settings: NonNullableField<PickNullish<IData>> = {
      cache: execSettings.cache,
      autoDependency: execSettings.autoDependency
    };
    const forcedSettings: Partial<IData> = {
      skip: execSettings.disableSkip ? false : undefined,
      cache: execSettings.disableCache ? false : undefined,
      autoDependency: execSettings.disableAutoDependency ? false : undefined
    };

    const config = CellConfig.metadata.getCoalesced(model);
    const csmagic = CellCSMagic.metadata.get(model, checkDirty);
    const composite = merge(
      settings,
      removeNull(config),
      removeNull(csmagic),
      forcedSettings
    );
    // Log.debug('cell config', composite);
    return composite;
  }

  function removeNull(obj: any) {
    return replaceValue(obj, null, undefined);
  }
}
