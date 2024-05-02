import { Cell } from '@jupyterlab/cells';

import { Metadata } from '../metadata';

export namespace CSMagic {
  export interface ICommand {
    readonly name: string;
    execute: (cell: Cell, ...args: string[]) => void;
  }

  export class Skip implements ICommand {
    readonly name = 'skip';

    execute(cell: Cell, message?: string) {
      Metadata.updateCellExecution(cell.model, {
        skip: true,
        skipMessage: message
      });
    }
  }

  export class Cache implements ICommand {
    readonly name = 'cache';

    execute(cell: Cell) {
      Metadata.updateCellExecution(cell.model, { useCache: true });
    }
  }

  // TODO: depend
  // TODO: tag
  // TODO: load
}
