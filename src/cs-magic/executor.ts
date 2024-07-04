import { ICellModel } from '@jupyterlab/cells';

import { CSMagic } from './commands';
import { CellMetadata } from '../cell/metadata';
import { CellDictionary } from '../cell';
import { Settings } from '../settings';
import { matchAllStatements, tokenize } from '../utils/statement';

export class CSMagicExecutor {
  static commands = new Map<string, CSMagic.ICommand>();

  static {
    this.register(new CSMagic.Skip());
    this.register(new CSMagic.Cache());

    CellMetadata.configOverride.setValidChecker((model: ICellModel) => {
      return Settings.data.enableCSMagic;
    });
    CellMetadata.configOverride.setDirtyResolver((model: ICellModel) => {
      CSMagicExecutor.executeConfig(model);
    });
  }

  static register(command: CSMagic.ICommand) {
    this.commands.set('%' + command.name, command);
  }

  static executeGeneral(model: ICellModel) {
    this.execute(model, command => command.type === 'general');
  }

  static executeConfig(model: ICellModel) {
    this.execute(model, command => command.type === 'config');
  }

  static execute(
    model: ICellModel,
    predicate?: (command: CSMagic.ICommand) => boolean
  ) {
    if (!Settings.data.enableCSMagic) return;

    const cell = CellDictionary.global.getByModel(model);
    if (!cell) return;

    CellMetadata.configOverride.deferUpdate();

    const matches = matchAllStatements(cell);
    for (const match of matches) {
      if (match.isCommand && match.statement) {
        this._executeStatement(model, match.statement, predicate);
      }
    }

    CellMetadata.configOverride.flushUpdate([model]);
  }

  private static _executeStatement(
    model: ICellModel,
    statement: string,
    predicate?: (command: CSMagic.ICommand) => boolean
  ) {
    // Log.debug(statement);

    const tokens = tokenize(statement);
    if (!tokens.length) return;

    const commandKey = tokens[0];
    const command = this.commands.get(commandKey);
    if (!command) return;
    if (predicate && !predicate(command)) return;

    command.execute(model, ...tokens.slice(1));
  }
}
