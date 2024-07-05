import { ICellModel } from '@jupyterlab/cells';

import { CSMagicExecutor } from './executor';
import * as Commands from './commands';
import { CSMagicConfig } from './config';
import { Settings } from '../settings';

export function setupClientSideMagic() {
  CSMagicConfig.metadata.setValidChecker((model: ICellModel) => {
    return CSMagic.executor.enabled;
  });
  CSMagicConfig.metadata.setDirtyResolver((model: ICellModel) => {
    CSMagic.executor.executeConfig(model);
  });

  Settings.csMagicChanged.connect((_, change) => {
    CSMagic.executor.enabled = change.newValue;
  });
}

export class CSMagic {
  static readonly executor = new CSMagicExecutor([
    new Commands.SkipCommand(),
    new Commands.CacheCommand()
  ]);

  static execute(model: ICellModel) {
    CSMagic.executor.execute(model);
  }
}

export { CSMagicConfig as CSMagicCell, CSMagicExecutor };
