import { ICellModel } from '@jupyterlab/cells';

import { CellConfig } from './config';
import { CSMagic, ICSMagicData } from '../cs-magic';
import { Settings } from '../settings';
import { ExecutionActions } from '../execution';
import { CellActions } from './actions';
import { CellDictionary } from './dictionary';
import { MetadataGroupDirtyable } from '../utils/metadata';
import { metadataKeys } from '../const';

export function setupCellCSMagic() {
  CSMagic.executor.metadata = CellCSMagic.metadata;

  CellCSMagic.metadata.setValidChecker((model: ICellModel) => {
    return Settings.data.enableCSMagic;
  });
  CellCSMagic.metadata.setDirtyResolver((model: ICellModel) => {
    CSMagic.executor.executeConfig(model);
  });

  ExecutionActions.beforeExecution.connect(
    (_, args: ExecutionActions.IParams) => {
      // Log.debug('beforeExecution', args);

      // ##% client-side magic command 실행
      if (Settings.data.enableCSMagic) {
        for (const cell of args.cells) {
          // 통합 config 조회
          // 이 때, config magic도 실행됨 (skip, cache, ...)
          const config = CellConfig.get(cell.model);
          if (config.skip) return;

          // (주로) 일반 magic 실행 (load, ...)
          CSMagic.executor.execute(cell.model);
        }
      }
    }
  );

  CellActions.sourceChanged.connect(
    (_, args: CellActions.ISourceChangeParams) => {
      // Log.debug('cell sourceChanged', args);

      const { sharedModel } = args;
      const cell = CellDictionary.global.getBySharedModel(sharedModel);
      const model = cell?.model;
      if (model) {
        if (Settings.data.enableCSMagic) {
          // cs-magic config 즉시 업데이트
          CSMagic.executor.executeConfig(model, false);
        } else {
          CellCSMagic.metadata.setDirty(model);
        }
      }
    }
  );
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
