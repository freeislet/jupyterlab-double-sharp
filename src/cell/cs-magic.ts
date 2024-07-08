import { ICellModel } from '@jupyterlab/cells';

import { CSMagic, ICSMagicData } from '../cs-magic';
import { MetadataGroupDirtyable } from '../utils/metadata';
import { metadataKeys } from '../const';
import { Settings } from '../settings';

export function setupCellCSMagic() {
  CSMagic.executor.metadata = CellCSMagic.metadata;

  CellCSMagic.metadata.setValidChecker((model: ICellModel) => {
    return Settings.data.enableCSMagic;
  });
  CellCSMagic.metadata.setDirtyResolver((model: ICellModel) => {
    CSMagic.executor.executeConfig(model);
  });
}

export namespace CellCSMagic {
  export type IData = ICSMagicData;
}

export class CellCSMagic {
  private static _metadata = new MetadataGroupDirtyable<CellCSMagic.IData>(
    metadataKeys.csmagic,
    {}
  );

  static get metadata(): MetadataGroupDirtyable<CellCSMagic.IData> {
    return CellCSMagic._metadata;
  }
}

export namespace CellCSMagic {
  export function execute(model: ICellModel) {
    if (Settings.data.enableCSMagic) {
      CSMagic.executor.execute(model);
    }
  }
}
