import { ISignal, Signal } from '@lumino/signaling';
import { Cell } from '@jupyterlab/cells';

import { CellActions } from '../cell';
import { ExecutionActions } from '../execution';

export interface IStatementMatch {
  statement: string;
  isCommand: boolean;
  start?: number;
  end?: number;
}

export namespace StatementActions {
  export interface IStatementParams extends CellActions.IParams {
    statements: IStatementMatch[];
  }

  export interface ICommandParams extends CellActions.IParams {
    command: IStatementMatch;
  }
}

export class StatementActions {
  /**
   * ## comment 내용 변경. (일반 content 및 ##% command 모두 포함)
   */
  static get statementChanged(): ISignal<
    any,
    StatementActions.IStatementParams
  > {
    return Private.statementChanged;
  }

  /**
   * ##% command 실행.
   */
  static get commandExecuted(): ISignal<any, StatementActions.ICommandParams> {
    return Private.commandExecuted;
  }
}

namespace Private {
  export const statementChanged = new Signal<
    any,
    StatementActions.IStatementParams
  >({});
  export const commandExecuted = new Signal<
    any,
    StatementActions.ICommandParams
  >({});

  export function* matchAllStatements(
    source: string
  ): Generator<IStatementMatch> {
    const matches = source.matchAll(/^##[^\S\r\n]*(.*)/gm); // ##으로 시작하는 텍스트 캡쳐
    for (const match of matches) {
      const statement = match[1];
      const start = match.index;
      const statementMatch: IStatementMatch = {
        statement,
        isCommand: statement.startsWith('%'),
        start,
        end: start !== undefined ? start + statement.length : undefined
      };
      yield statementMatch;
    }
  }
}

export function setupStatementModule() {
  CellActions.contentChanged.connect((_, args: CellActions.IParams) => {
    // console.log('cell content changed', args);

    const { model, cell } = args;

    const source = model.sharedModel.getSource();
    const matches = Private.matchAllStatements(source);

    // TODO: 변경 여부 판단

    Private.statementChanged.emit({
      model,
      cell,
      statements: Array.from(matches)
    });
  });

  ExecutionActions.beforeExecution.connect(
    (_, args: { cells: readonly Cell[] }) => {
      // NOTE: ExecutionPlan 수립을 위해 NotebookActions.runXXX 이전에 metadata를 설정해야 하므로,
      //       MetaNotebookActions.executionScheduled 대신 자체적으로 추가한 Signal 사용

      // console.log('execution scheduled', args);

      const { cells } = args;

      for (const cell of cells) {
        const source = cell.model.sharedModel.getSource();
        const matches = Private.matchAllStatements(source);
        for (const match of matches) {
          if (match.isCommand && match.statement) {
            Private.commandExecuted.emit({
              model: cell.model,
              cell,
              command: match
            });
          }
        }
      }
    }
  );
}
