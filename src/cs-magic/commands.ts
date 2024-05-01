import { Cell } from '@jupyterlab/cells';

export namespace CSMagic {
  export interface ICommand {
    readonly name: string;
    execute: (cell: Cell, ...args: string[]) => void;
  }

  export class Skip implements ICommand {
    readonly name = 'skip';

    execute(cell: Cell, test?: string) {
      console.log(this.name, cell, test);
      // TBD
    }
  }

  export class Cache implements ICommand {
    readonly name = 'cache';

    execute(cell: Cell) {
      console.log(this.name, cell);
      // TBD
    }
  }
}
