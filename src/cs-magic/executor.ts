import { Cell } from '@jupyterlab/cells';

import { CSMagic } from './commands';
import { matchAllStatements, tokenize } from '../utils/statement';

export class CSMagicExecutor {
  static commands = new Map<string, CSMagic.ICommand>();

  static {
    this.register(new CSMagic.Skip());
    this.register(new CSMagic.Cache());
  }

  static register(command: CSMagic.ICommand) {
    this.commands.set('%' + command.name, command);
  }

  static execute(
    cell: Cell,
    predicate?: (command: CSMagic.ICommand) => boolean
  ) {
    // syntax 테스트 코드
    // const editorView = (cell.editor as CodeMirrorEditor).editor;
    // const tree = syntaxTree(editorView.state);
    // tree.iterate({ enter });
    // const commentNodes = tree.topNode.getChildren('Comment');
    // console.log(commentNodes, tree.topNode);

    const source = cell.model.sharedModel.getSource();
    const matches = matchAllStatements(source);
    for (const match of matches) {
      if (match.isCommand && match.statement) {
        // console.log(command.statement);
        this._executeStatement(cell, match.statement, predicate);
      }
    }
  }

  static executeType(cell: Cell, type: CSMagic.CommandType) {
    this.execute(cell, cell => cell.type === type);
  }

  private static _executeStatement(
    cell: Cell,
    statement: string,
    predicate?: (command: CSMagic.ICommand) => boolean
  ) {
    const tokens = tokenize(statement);
    if (!tokens.length) return;

    const commandKey = tokens[0];
    const command = this.commands.get(commandKey);
    if (!command) return;
    if (predicate && !predicate(command)) return;

    command.execute(cell, ...tokens.slice(1));
  }
}
