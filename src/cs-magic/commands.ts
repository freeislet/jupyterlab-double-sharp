import { ICellModel } from '@jupyterlab/cells';

import { GeneralCommand, ConfigCommand } from './command';
import { CSMagicMetadata } from './metadata';
import { paramAsBoolean } from '../utils/statement';

export class SkipCommand extends ConfigCommand {
  get name(): string {
    return 'skip';
  }

  execute(model: ICellModel, metadata?: CSMagicMetadata) {
    metadata?.update(model, { skip: true });
  }
}

export class CacheCommand extends ConfigCommand {
  get name(): string {
    return 'cache';
  }

  execute(model: ICellModel, metadata?: CSMagicMetadata, args?: string[]) {
    const flag = args?.[0];
    const cache = !flag || paramAsBoolean(flag, true);
    metadata?.update(model, { cache: cache });
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
