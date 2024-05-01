import { StatementActions } from '../editor/statement';

export function setupClientSideMagicCommand() {
  // TODO: markdown 관련 모듈로 이동
  StatementActions.contentChanged.connect(
    (_, params: StatementActions.IContentParams) => {
      const { model, cell, content } = params;
      model;
      cell;
      console.log(content);
      // TODO: markdown header, heading 추가
    }
  );

  StatementActions.commandExecuted.connect(
    (_, params: StatementActions.ICommandParams) => {
      const { model, cell, command } = params;
      model;
      cell;
      console.log(command);
      // TODO: command dispatch
    }
  );
}
