import { CodeCell } from '@jupyterlab/cells';

import { CellMetadata } from './metadata';
import { VariableTracker } from '../variable';

export namespace CellCode {
  export async function get(cell: CodeCell): Promise<CellMetadata.ICode> {
    const cachedCode = CellMetadata.Code.get(cell.model);
    if (cachedCode) return cachedCode;

    let code = CellMetadata.Code.defaultValue;

    const variableTracker = VariableTracker.getByCell(cell);
    if (variableTracker) {
      const vars = await variableTracker.getCellVariables(cell);
      code = { ...vars };
    }

    CellMetadata.Code.set(cell.model, code);
    return code;
  }
}
