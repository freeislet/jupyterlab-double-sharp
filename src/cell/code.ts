import { CodeCell } from '@jupyterlab/cells';

import { CellMetadata } from './metadata';
import { VariableTracker } from '../variable';
import { CellError } from '../utils/error';

export class CodeContext {
  private _variableTracker: VariableTracker;

  get variableTracker(): VariableTracker {
    if (!this._variableTracker) {
      const variableTracker = VariableTracker.getByCell(this.cell);
      if (!variableTracker) {
        throw new CellError(this.cell, 'cannot find VariableTracker');
      }
      this._variableTracker = variableTracker;
    }
    return this._variableTracker;
  }

  //

  constructor(public readonly cell: CodeCell) {}

  async build(): Promise<CellMetadata.ICode> {
    return CodeContext.build(this.cell, this.variableTracker);
  }
}

export namespace CodeContext {
  export async function build(
    cell: CodeCell,
    variableTracker: VariableTracker
  ): Promise<CellMetadata.ICode> {
    const cachedCode = CellMetadata.Code.get(cell.model);
    if (cachedCode) return cachedCode;

    const vars = await variableTracker.getCellVariables(cell);
    const code = { ...vars };
    CellMetadata.Code.set(cell.model, code);
    return code;
  }
}
