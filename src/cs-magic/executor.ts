import { ICellModel } from '@jupyterlab/cells';

import { CSMagic } from './commands';
import { CellMetadata } from '../cell/metadata';
import { CellDictionary } from '../cell';
import { Settings } from '../settings';
import { matchAllStatements, tokenize } from '../utils/statement';

export class CSMagicExecutor {
  static commands = new Map<string, CSMagic.ICommand>();

  static {
    this._register(new CSMagic.Skip());
    this._register(new CSMagic.Cache());

    CellMetadata.configOverride.setValidChecker((model: ICellModel) => {
      return Settings.data.enableCSMagic;
    });
    CellMetadata.configOverride.setDirtyResolver((model: ICellModel) => {
      CSMagicExecutor.executeConfig(model);
    });
  }

  private static _register(command: CSMagic.ICommand) {
    this.commands.set('%' + command.name, command);
  }

  static execute(model: ICellModel) {
    if (!Settings.data.enableCSMagic) return;

    this.executeConfig(model);
    this.executeGeneral(model);
  }

  static executeGeneral(model: ICellModel) {
    if (!Settings.data.enableCSMagic) return;

    this._execute(model, command => command.type === 'general');
  }

  static executeConfig(model: ICellModel) {
    if (!Settings.data.enableCSMagic) return;

    this._execute(model, command => command.type === 'config');
  }

  private static _execute(
    model: ICellModel,
    predicate?: (command: CSMagic.ICommand) => boolean
  ) {
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
