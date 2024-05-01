import { ISignal, Signal } from '@lumino/signaling';
import { Notebook, NotebookActions } from '@jupyterlab/notebook';
import { Cell } from '@jupyterlab/cells';

import { CellActions } from '../cell';

export namespace StatementActions {
  export interface IContentParams extends CellActions.IParams {
    content: string;
  }

  export interface ICommandParams extends CellActions.IParams {
    command: string;
  }
}

export class StatementActions {
  /**
   * 일반 ## comment의 내용 변경.
   */
  static get contentChanged(): ISignal<any, StatementActions.IContentParams> {
    return Private.contentChanged;
  }

  /**
   * ##% command 실행.
   */
  static get commandExecuted(): ISignal<any, StatementActions.ICommandParams> {
    return Private.commandExecuted;
  }
}

namespace Private {
  export const contentChanged = new Signal<
    any,
    StatementActions.IContentParams
  >({});
  export const commandExecuted = new Signal<
    any,
    StatementActions.ICommandParams
  >({});

  export function matchAllStatements(
    source: string
  ): IterableIterator<RegExpMatchArray> {
    const matches = source.matchAll(/^##[^\S\r\n]*(.*)/gm); // ##으로 시작하는 텍스트 캡쳐
    return matches;
  }
}

export function setupStatementModule() {
  CellActions.contentChanged.connect((_, args: CellActions.IParams) => {
    // console.log('cell content changed', args);

    const { model, cell } = args;
    const contents: string[] = [];

    const source = model.sharedModel.getSource();
    const matches = Private.matchAllStatements(source);
    for (const match of matches) {
      const statement = match[1];
      const isCommand = statement.startsWith('%');
      if (!isCommand) {
        contents.push(statement);
      }
    }

    const content = contents.join('\n');
    console.log(content);
    // TODO: markdown header, heading 추가

    Private.contentChanged.emit({ model, cell, content });
  });

  NotebookActions.executionScheduled.connect(
    (_, args: { notebook: Notebook; cell: Cell }) => {
      console.log('execution scheduled', args);

      const { cell } = args;

      const source = cell.model.sharedModel.getSource();
      const matches = Private.matchAllStatements(source);
      for (const match of matches) {
        const statement = match[1];
        const isCommand = statement.startsWith('%');
        if (isCommand) {
          console.log(statement);

          Private.commandExecuted.emit({
            model: cell.model,
            cell,
            command: statement
          });
        }
      }
    }
  );
}
