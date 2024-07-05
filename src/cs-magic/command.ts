import { ICellModel } from '@jupyterlab/cells';

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

export abstract class GeneralCommand extends Command {
  get type(): CommandType {
    return 'general';
  }
}

export abstract class ConfigCommand extends Command {
  get type(): CommandType {
    return 'config';
  }
}
