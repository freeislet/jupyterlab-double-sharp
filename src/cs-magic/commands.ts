import { ICellModel } from '@jupyterlab/cells';

import { GeneralCommand, ConfigCommand } from './command';
import { CSMagicCell } from './cell';
import { paramAsBoolean } from '../utils/statement';

export class SkipCommand extends ConfigCommand {
  get name(): string {
    return 'skip';
  }

  execute(model: ICellModel) {
    CSMagicCell.metadata.update(model, { skip: true });
  }
}

export class CacheCommand extends ConfigCommand {
  get name(): string {
    return 'cache';
  }

  execute(model: ICellModel, flag?: string) {
    const cache = !flag || paramAsBoolean(flag, true);
    CSMagicCell.metadata.update(model, { cache: cache });
  }
}

export class DummyCommand extends GeneralCommand {
  get name(): string {
    return 'dummy';
  }

  execute(model: ICellModel) {}
}

// TODO: depend
// TODO: tag
// TODO: load
