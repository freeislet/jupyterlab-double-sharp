import { StatementActions } from '../editor';
import { CSMagicExecutor } from './executor';

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

      // console.log(contents);
      contents;
      // TODO: markdown header, heading 추가
    }
  );

  StatementActions.commandExecuted.connect(
    (_, params: StatementActions.ICommandParams) => {
      const { cell, command } = params;
      if (!cell) return;

      // console.log(command.statement);
      CSMagicExecutor.execute(cell, command.statement);
    }
  );
}
