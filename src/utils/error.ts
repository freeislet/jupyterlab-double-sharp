import { Cell } from '@jupyterlab/cells';

class ErrorBase extends Error {
  constructor(message?: string) {
    super(message);
    this.name = this.constructor.name;
  }
}

export class CellError extends ErrorBase {
  constructor(
    public readonly cell: Cell,
    message?: string
  ) {
    super(message);
  }
}
