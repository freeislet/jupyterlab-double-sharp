import { ICellModel } from '@jupyterlab/cells';

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
    // syntax 테스트 코드
    // const editorView = (cell.editor as CodeMirrorEditor).editor;
    // const tree = syntaxTree(editorView.state);
    // tree.iterate({ enter });
    // const commentNodes = tree.topNode.getChildren('Comment');
    // console.log(commentNodes, tree.topNode);

    const source = model.sharedModel.getSource();
    const matches = matchAllStatements(source);
    for (const match of matches) {
      if (match.isCommand && match.statement) {
        this._executeStatement(model, match.statement, predicate);
      }
    }
  }

  private static _executeStatement(
    model: ICellModel,
    statement: string,
    predicate?: (command: CSMagic.ICommand) => boolean
  ) {
    console.log(statement);

    const tokens = tokenize(statement);
    if (!tokens.length) return;

    const commandKey = tokens[0];
    const command = this.commands.get(commandKey);
    if (!command) return;
    if (predicate && !predicate(command)) return;

    command.execute(model, ...tokens.slice(1));
  }
}
