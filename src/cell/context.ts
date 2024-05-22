import { Cell } from '@jupyterlab/cells';

import { CodeContext } from './code';
import { Cache } from '../utils/cache';

export class CellContext {
  private _codeContextCache: Cache<CodeContext | undefined>;

  get codeContext(): CodeContext | undefined {
    return this._codeContextCache.value;
  }

  //----

  constructor(public readonly cell: Cell) {
    this._codeContextCache = new Cache<CodeContext | undefined>(() =>
      CodeContext.fromCell(this.cell)
    );
  }
}
