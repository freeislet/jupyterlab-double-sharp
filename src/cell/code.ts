import { CodeCell } from '@jupyterlab/cells';

import { CellMetadata } from './metadata';
import { CSMagicExecutor } from '../cs-magic';
import { VariableTracker } from '../variable';

export namespace CellCode {
  export async function buildMetadata(
    cell: CodeCell
  ): Promise<CellMetadata.ICode> {
    const cachedCode = CellMetadata.Code.get(cell.model);
    if (cachedCode) return cachedCode;

    const code = CellMetadata.Code.defaultValue;
    const config = CellMetadata.Config.getCoalesced(cell.model);
    code.skip = config.skip;
    code.cache = config.cache;

    // ##% client-side magic command 실행 (##Code metadata 업데이트 등)
    CSMagicExecutor.execute(cell);

    const variableTracker = VariableTracker.getByCell(cell);
    if (variableTracker) {
      const vars = await variableTracker.getCellVariables(cell);
      Object.assign(code, vars);
    }

    CellMetadata.Code.set(cell.model, code);
    return code;
  }
}
