import { Cell, CodeCell } from '@jupyterlab/cells';
import { Notebook } from '@jupyterlab/notebook';

import { CellConfig, CellCode } from '.';
import { CSMagicExecutor } from '../cs-magic';
import { VariableTracker } from '../variable';
import { isCodeCell } from '../utils/cell';

export namespace CellExecution {
  /**
   * 셀 실행 준비
   * - ##% client-side magic command 실행
   *   - ##ConfigOverride metadata 업데이트 (skip, cache, ...)
   *   - load -> 셀 추가
   */
  export function prepare(cell: Cell) {
    CSMagicExecutor.execute(cell);
  }

  /**
   * 실행 셀 목록 조회 (실행 여부 판단, dependent cells 수집 포함)
   * - skip 처리
   * - cache 처리
   * - unbound variables dependent cells 수집
   */
  export async function getCellsToExecute(cell: CodeCell): Promise<CodeCell[]> {
    // console.log('CellExecution cell', cell);

    const config = CellConfig.get(cell.model);
    if (config.skip) return [];

    // ##Code metadata에 variables 정보 저장 (또는, 기존 metadata 조회))
    const code = await CellCode.build(cell);

    if (config.cache && isCellCached(cell, code.variables)) {
      return [];
    }

    const cells = getDependentCells(cell, code.unboundVariables);
    cells.push(cell);
    console.log('CellExecution cellsToExecute', cells);
    return cells;
  }

  function isCellCached(cell: Cell, variables?: string[]): boolean {
    // console.log('isCellCached', cell, variables);

    const noVariables = !variables?.length;
    if (noVariables) return true;

    const variableTracker = VariableTracker.getByCell(cell);
    if (!variableTracker) return false;

    return variableTracker.isVariablesCached(variables);
  }

  function getDependentCells(
    cell: CodeCell,
    unboundVariables?: string[]
  ): CodeCell[] {
    // console.log('getDependentCells', cell, unboundVariables);

    const noUnbound = !unboundVariables?.length;
    if (noUnbound) return [];

    const dependencies: CodeCell[] = [];

    const lookups = getDependencyLookupCells(cell);
    for (const cell of lookups) {
      cell;
      // CSMagicExecutor.execute(cell);
    }
    return dependencies;
  }

  function getDependencyLookupCells(cell: CodeCell): CodeCell[] {
    // console.log('getDependencyLookupCells', cell);

    const notebook = cell.parent as Notebook;
    if (!notebook) return [];

    const index = notebook.widgets.findIndex(c => c === cell);
    if (index < 0) return [];

    const aboves = notebook.widgets.slice(0, index);
    const lookups = aboves.filter(c => isCodeCell(c)) as CodeCell[];
    console.log('lookup cells', lookups);
    return lookups;
  }
}
