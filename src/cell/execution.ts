import { Cell, ICellModel } from '@jupyterlab/cells';

import { CellMetadata } from '.';
import { CellCode } from './code';
import { CSMagicExecutor } from '../cs-magic';
import { isCodeCell } from '../util';

export namespace CellExecution {
  /**
   * 셀 실행 준비
   * - ##Code metadata에 configs, variables 정보 저장
   * - ##% client-side magic command 실행
   *   - ##Code metadata 업데이트 (skip, cache, ...)
   *   - load -> 셀 추가
   * - skip 처리
   */
  export function prepare(cell: Cell) {
    if (isCodeCell(cell)) {
      // ##Code metadata 생성 (configs, variables)
      CellCode.buildMetadata(cell);

      // ##% client-side magic command 실행 (##Code metadata 업데이트 등)
      // CSMagicExecutor.execute(cell);

      const code = CellMetadata.Code.getCoalesced(cell.model);
      if (code.skip) return;
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
