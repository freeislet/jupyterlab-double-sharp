// TODO: 제거 검토

import { Cell } from '@jupyterlab/cells';

import { CodeContext } from './code';
import { Cache } from '../utils/cache';
import { isCodeCell } from '../utils/cell';

export class CellContext {
  private _codeContextCache: Cache<CodeContext | undefined>;

  get codeContext(): CodeContext | undefined {
    return this._codeContextCache.value;
  }

  get isCodeCell(): boolean {
    return isCodeCell(this.cell);
  }

  //----

  constructor(public readonly cell: Cell) {
    this._codeContextCache = new Cache<CodeContext | undefined>(() =>
      CodeContext.fromCell(this.cell)
    );
  }
}
