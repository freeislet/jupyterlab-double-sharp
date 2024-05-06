import { Cell } from '@jupyterlab/cells';

import { CSMagic } from './commands';
import { tokenize } from './utils';
import { CellStyle } from '../cell';

export class CSMagicExecutor {
  static commands = new Map<string, CSMagic.ICommand>();

  static {
    this.register(new CSMagic.Skip());
    this.register(new CSMagic.Cache());
  }

  static register(command: CSMagic.ICommand) {
    this.commands.set('%' + command.name, command);
  }

  static execute(cell: Cell, cmdStr: string) {
    const tokens = tokenize(cmdStr);
    if (!tokens.length) return;

    const cmdKey = tokens[0];
    const command = this.commands.get(cmdKey);
    if (!command) return;

    command.execute(cell, ...tokens.slice(1));
    CellStyle.update(cell);
  }
}
