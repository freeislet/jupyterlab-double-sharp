import { Cell } from '@jupyterlab/cells';

import { CellMetadata } from '../cell';
import { paramAsBoolean } from '../utils/statement';

export namespace CSMagic {
  export type CommandType = 'general' | 'config';

  export interface ICommand {
    readonly type: CommandType;
    readonly name: string;
    execute(cell: Cell, ...args: string[]): void;
  }

  abstract class Command implements ICommand {
    abstract get type(): CommandType;
    abstract get name(): string;
    abstract execute(cell: Cell, ...args: string[]): void;
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

  export class Skip extends ConfigCommand {
    get name(): string {
      return 'skip';
    }

    execute(cell: Cell) {
      CellMetadata.ConfigOverride.update(cell.model, { skip: true });
    }
  }

  export class Cache extends ConfigCommand {
    get name(): string {
      return 'cache';
    }

    execute(cell: Cell, flag?: string) {
      const cache = !flag || paramAsBoolean(flag);
      CellMetadata.ConfigOverride.update(cell.model, { cache });
    }
  }

  export class Dummy extends GeneralCommand {
    get name(): string {
      return 'dummy';
    }

    execute(cell: Cell) {}
  }

  // TODO: depend
  // TODO: tag
  // TODO: load
}
