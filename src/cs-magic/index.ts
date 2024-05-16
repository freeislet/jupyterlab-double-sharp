// import { Cell } from '@jupyterlab/cells';

// import { CSMagicExecutor } from './executor';
// import { ExecutionActions } from '../execution';

// export function setupClientSideMagicCommand() {
//   // // TODO: markdown 관련 모듈로 이동
//   // export namespace StatementActions {
//   //   export interface IStatementParams extends CellActions.IParams {
//   //     statements: IStatementMatch[];
//   //   }
//   // }
//   // export class StatementActions {
//   //   /**
//   //    * ## comment 내용 변경. (일반 content 및 ##% command 모두 포함)
//   //    */
//   //   static get statementChanged(): ISignal<
//   //     any,
//   //     StatementActions.IStatementParams
//   //   > {
//   //     return Private.statementChanged;
//   //   }
//   // }
//   // namespace Private {
//   //   export const statementChanged = new Signal<
//   //     any,
//   //     StatementActions.IStatementParams
//   //   >({});
//   // }
//   // CellActions.contentChanged.connect((_, args: CellActions.IParams) => {
//   //   // console.log('cell content changed', args);
//   //   const { model, cell } = args;
//   //   const source = model.sharedModel.getSource();
//   //   const matches = Private.matchAllStatements(source);
//   //   // TODO: 변경 여부 판단
//   //   Private.statementChanged.emit({
//   //     model,
//   //     cell,
//   //     statements: Array.from(matches)
//   //   });
//   // });
//   // StatementActions.statementChanged.connect(
//   //   (_, params: StatementActions.IStatementParams) => {
//   //     const { model, cell, statements } = params;
//   //     model;
//   //     cell;
//   //     const contents = statements
//   //       .filter(s => !s.isCommand)
//   //       .map(s => s.statement)
//   //       .join('\n');

//   //     // console.log(contents);
//   //     contents;
//   //     // TODO: markdown header, heading 추가
//   //   }
//   // );

//   // ##% command 실행
//   ExecutionActions.beforeExecution.connect(
//     (_, args: { cells: readonly Cell[] }) => {
//       // NOTE: ExecutionPlan 수립을 위해 NotebookActions.runXXX 이전에 metadata를 설정해야 하므로,
//       //       NotebookActions.executionScheduled 대신 자체적으로 추가한 Signal 사용

//       // console.log('beforeExecution', args);

//       const { cells } = args;

//       cells.forEach(cell => CSMagicExecutor.execute(cell));
//     }
//   );
// }

export { CSMagicExecutor } from './executor';
