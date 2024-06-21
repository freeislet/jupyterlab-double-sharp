import { ICellModel } from '@jupyterlab/cells';

import { CellMetadata } from '../cell';
import { paramAsBoolean } from '../utils/statement';

export namespace CSMagic {
  export type CommandType = 'general' | 'config';

  export interface ICommand {
    readonly type: CommandType;
    readonly name: string;
    execute(model: ICellModel, ...args: string[]): void;
  }

  abstract class Command implements ICommand {
    abstract get type(): CommandType;
    abstract get name(): string;
    abstract execute(model: ICellModel, ...args: string[]): void;
  }

  abstract class GeneralCommand extends Command {
    get type(): CommandType {
      return 'general';
    }
  }

  abstract class ConfigCommand extends Command {
    get type(): CommandType {
      return 'config';
    }
  }

  //

  export class Skip extends ConfigCommand {
    get name(): string {
      return 'skip';
    }

    execute(model: ICellModel) {
      CellMetadata.configOverride.update(model, { skip: true });
    }
  }

  export class Cache extends ConfigCommand {
    get name(): string {
      return 'cache';
    }

    execute(model: ICellModel, flag?: string) {
      const cache = !flag || paramAsBoolean(flag, true);
      CellMetadata.configOverride.update(model, { cache: cache });
    }
  }

  export class Dummy extends GeneralCommand {
    get name(): string {
      return 'dummy';
    }

    execute(model: ICellModel) {}
  }

  // TODO: depend
  // TODO: tag
  // TODO: load
}
