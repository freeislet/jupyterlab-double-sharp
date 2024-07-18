import { ICellModel } from '@jupyterlab/cells';

import { ICommand } from './command';
import { CSMagicMetadata } from './metadata';
import { CellDictionary } from '../cell';
import { matchAllStatements, tokenize } from '../utils/statement';

export class CSMagicExecutor {
  private _commands = new Map<string, ICommand>();

  metadata?: CSMagicMetadata;

  constructor(commands: ICommand[]) {
    commands.forEach((command: ICommand) => this.register(command));
  }

  register(command: ICommand) {
    this._commands.set('%' + command.name, command);
  }

  execute(model: ICellModel) {
    this.executeConfig(model);
    this.executeGeneral(model);
  }

  executeGeneral(model: ICellModel) {
    this._execute(model, command => command.type === 'general');
  }

  executeConfig(model: ICellModel, checkDirty = true) {
    if (checkDirty && this.metadata?.isDirty(model) === false) return;

    this.metadata?.beginCumulativeUpdate([model]);
    this._execute(model, command => command.type === 'config');
    this.metadata?.endCumulativeUpdate();
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

    command.execute(model, this.metadata, tokens.slice(1));
  }
}
