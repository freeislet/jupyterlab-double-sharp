import { ICellModel } from '@jupyterlab/cells';

import { ICommand } from './command';
import { CSMagicConfig } from './config';
import { CellDictionary } from '../cell';
import { matchAllStatements, tokenize } from '../utils/statement';

export class CSMagicExecutor {
  private _commands = new Map<string, ICommand>();

  private _enabled = true;
  get enabled(): boolean {
    return this._enabled;
  }
  set enabled(value: boolean) {
    this._enabled = value;
  }

  constructor(commands: ICommand[]) {
    commands.forEach((command: ICommand) => this._register(command));
  }

  _register(command: ICommand) {
    this._commands.set('%' + command.name, command);
  }

  execute(model: ICellModel) {
    if (!this.enabled) return;

    this.executeConfig(model);
    this.executeGeneral(model);
  }

  executeGeneral(model: ICellModel) {
    if (!this.enabled) return;

    this._execute(model, command => command.type === 'general');
  }

  executeConfig(model: ICellModel) {
    if (!this.enabled) return;

    CSMagicConfig.metadata.deferUpdate();
    this._execute(model, command => command.type === 'config');
    CSMagicConfig.metadata.flushUpdate([model]);
  }

  private _execute(
    model: ICellModel,
    predicate?: (command: ICommand) => boolean
  ) {
    const cell = CellDictionary.global.getByModel(model);
    if (!cell) return;

    const matches = matchAllStatements(cell);
    for (const match of matches) {
      if (match.isCommand && match.statement) {
        this._executeStatement(model, match.statement, predicate);
      }
    }
  }

  private _executeStatement(
    model: ICellModel,
    statement: string,
    predicate?: (command: ICommand) => boolean
  ) {
    // Log.debug(statement);

    const tokens = tokenize(statement);
    if (!tokens.length) return;

    const commandKey = tokens[0];
    const command = this._commands.get(commandKey);
    if (!command) return;
    if (predicate && !predicate(command)) return;

    command.execute(model, ...tokens.slice(1));
  }
}
