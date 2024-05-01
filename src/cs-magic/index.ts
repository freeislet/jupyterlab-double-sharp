import { StatementActions } from '../editor';

export function setupClientSideMagicCommand() {
  // TODO: markdown 관련 모듈로 이동
  StatementActions.statementChanged.connect(
    (_, params: StatementActions.IStatementParams) => {
      const { model, cell, statements } = params;
      model;
      cell;
      const contents = statements
        .filter(s => !s.isCommand)
        .map(s => s.statement)
        .join('\n');

      console.log(contents);
      // TODO: markdown header, heading 추가
    }
  );

  StatementActions.commandExecuted.connect(
    (_, params: StatementActions.ICommandParams) => {
      const { model, cell, command } = params;
      model;
      cell;
      console.log(command.statement);
      // TODO: command dispatch
    }
  );
}
