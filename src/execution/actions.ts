import { Cell } from '@jupyterlab/cells';
import { Signal } from '@lumino/signaling';

export namespace ExecutionActions {
  export interface IParams {
    cells: readonly Cell[];
  }
}

export class ExecutionActions {
  /**
   * NotebookActions.runXXX 실행 전
   */
  static readonly beforeExecution = new Signal<any, ExecutionActions.IParams>(
    {}
  );

  /**
   * NotebookActions.runXXX 실행 후
   */
  static readonly afterExecution = new Signal<any, ExecutionActions.IParams>(
    {}
  );
}
