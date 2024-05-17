import { Cell } from '@jupyterlab/cells';

import { CellConfig, CellCode } from '.';
import { CSMagicExecutor } from '../cs-magic';
import { isCodeCell } from '../utils/cell';

export namespace CellExecution {
  /**
   * 셀 실행 준비
   * - ##% client-side magic command 실행
   *   - ##ConfigOverride metadata 업데이트 (skip, cache, ...)
   *   - load -> 셀 추가
   * - skip 처리
   * - ##Code metadata에 variables 정보 저장
   */
  export function prepare(cell: Cell) {
    if (isCodeCell(cell)) {
      // ##% client-side magic command 실행 (##ConfigOverride metadata 업데이트 등)
      CSMagicExecutor.execute(cell);

      // skip 처리
      const config = CellConfig.get(cell.model);
      if (config.skip) return;

      // ##Code metadata 생성 (variables)
      CellCode.get(cell);
    }
  }

  export function checkTargetVars(cell: Cell, targetVars: string[]) {
    // if cell skipped, return
    // VariableTracker.checkCellVariables(cell, targetVars);
  }

  /**
   * 셀 실행 여부 확인, dependencies 포함하여 실행할 셀 리턴
   * - skip 처리
   * - cache 처리
   * - unbound variables dependencies 수집
   */
  export function checkExecution() {
    // dependencies;
  }
}
