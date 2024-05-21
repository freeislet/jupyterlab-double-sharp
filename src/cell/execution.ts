import { Cell, CodeCell } from '@jupyterlab/cells';

import { CellContext } from './context';
import { CSMagicExecutor } from '../cs-magic';

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
   * 실행 셀 목록 조회 (dependent cells 수집 포함)
   */
  export async function getCellsToExecute(cell: CodeCell): Promise<CodeCell[]> {
    // console.log('CellExecution cell', cell);

    const cellContext = new CellContext(cell); // TODO: 인자로 CellContext 받기 검토
    const cellsToExecute = await cellContext.getCellsToExecute();
    return cellsToExecute ?? [];
  }
}
