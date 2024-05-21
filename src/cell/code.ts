import { Cell, CodeCell } from '@jupyterlab/cells';

import { CellMetadata } from './metadata';
import { VariableTracker } from '../variable';
import { isCodeCell } from '../utils/cell';
import { Cache } from '../utils/cache';
import { CellError } from '../utils/error';

export class CodeContext {
  static fromCell(
    cell: Cell,
    variableTracker?: VariableTracker
  ): CodeContext | undefined {
    if (isCodeCell(cell)) {
      return new CodeContext(cell, variableTracker);
    }
  }

  //----

  private _variableTrackerCache: Cache<VariableTracker>;

  get variableTracker(): VariableTracker {
    return this._variableTrackerCache.value;
  }

  //----

  constructor(
    public readonly cell: CodeCell,
    variableTracker?: VariableTracker
  ) {
    this._variableTrackerCache = new Cache<VariableTracker>(() => {
      const variableTracker = VariableTracker.getByCell(this.cell);
      if (!variableTracker) {
        throw new CellError(this.cell, 'cannot find VariableTracker');
      }
      return variableTracker;
    }, variableTracker);
  }

  /**
   * ##Code metadata에 variables 정보 저장 및 리턴 (또는, 기존 metadata 조회))
   */
  async getMetadata(): Promise<CellMetadata.ICode> {
    const cachedMetadata = CellMetadata.Code.get(this.cell.model);
    if (cachedMetadata) return cachedMetadata;

    const cellVars = await this.variableTracker.getCellVariables(this.cell);
    const metadata = CellMetadata.Code.getCoalescedValue(cellVars);
    CellMetadata.Code.set(this.cell.model, metadata);
    return metadata;
  }

  /**
   * Cell variables cached 여부 리턴
   */
  async isVariablesCached(): Promise<boolean> {
    const metadata = await this.getMetadata();
    const vars = metadata.variables;
    const uncachedVars = this.variableTracker.getUncachedVariables(vars);
    return !uncachedVars.length;
  }
}
