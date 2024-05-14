import { Cell } from '@jupyterlab/cells';

import { CellMetadata } from '../cell/metadata';

export namespace CSMagic {
  export interface ICommand {
    readonly name: string;
    execute: (cell: Cell, ...args: string[]) => void;
  }

  export class Skip implements ICommand {
    readonly name = 'skip';

    execute(cell: Cell, message?: string) {
      CellMetadata.Execution.update(cell.model, {
        skip: true,
        skipMessage: message
      });
    }
  }

  export class Cache implements ICommand {
    readonly name = 'cache';

    execute(cell: Cell) {
      CellMetadata.Execution.update(cell.model, { cache: true });
    }
  }

  // TODO: depend
  // TODO: tag
  // TODO: load
}
