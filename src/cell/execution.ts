import { Cell, CodeCell } from '@jupyterlab/cells';
import { Notebook } from '@jupyterlab/notebook';

import { CellContext, CodeContext, CellMetadata } from '.';
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
  export async function getCellsToExecute(
    cell: CodeCell
  ): Promise<CodeCell[] | void> {
    // console.log('CellExecution cell', cell);

    const cellContext = new CellContext(cell); // TODO: 인자로 CellContext 받기 검토
    if (!cellContext.isCodeCell()) return;

    const config = cellContext.getConfig();
    if (config.skip) return;

    // ##Code metadata에 variables 정보 저장 (또는, 기존 metadata 조회))
    const codeContext = cellContext.getCodeContext();
    if (!codeContext) return;

    const code = await codeContext.getMetadata();

    if (config.cache && isCellCached(cell, code.variables)) {
      return [];
    }

    const cells = await getDependentCells(cell, code.unboundVariables);
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

  async function getDependentCells(
    cell: CodeCell,
    unboundVariables?: string[]
  ): Promise<CodeCell[]> {
    // console.log('getDependentCells', cell, unboundVariables);

    const noUnbound = !unboundVariables?.length;
    if (noUnbound) return [];

    const dependencies: CodeCell[] = [];

    const scanCells = getDependencyScanCells(cell);
    for (const cell of scanCells) {
      if (CellMetadata.ConfigOverride.isDirty(cell.model)) {
        CSMagicExecutor.executeConfig(cell);
      }

      // TODO: VariableContext 분리
      //       CellContext 분리
      //       실행 여부 판단, target vars, unresolved vars 처리
      const config = CellContext.getConfig(cell.model);
      if (config.skip) continue;

      // const code = await CellCode.build(cell);

      // if (config.cache && isCellCached(cell, code.variables)) {
      //   continue;
      // }
    }
    return dependencies;
  }

  function getDependencyScanCells(cell: CodeCell): CodeCell[] {
    // console.log('getDependencyScanCells', cell);

    const notebook = cell.parent as Notebook;
    if (!notebook) return [];

    const index = notebook.widgets.findIndex(c => c === cell);
    if (index < 0) return [];

    const aboves = notebook.widgets.slice(0, index);
    const scanCells = aboves.filter(c => isCodeCell(c)) as CodeCell[];
    console.log('scan cells', scanCells);
    return scanCells;
  }
}
