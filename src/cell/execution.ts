import { Cell } from '@jupyterlab/cells';

import { CellMetadata, CellConfig, CellCode } from '.';
import { CSMagicExecutor } from '../cs-magic';
import { isCodeCell } from '../utils/cell';
import { VariableTracker } from '../variable';

export namespace CellExecution {
  /**
   * 셀 실행 준비
   * - ##% client-side magic command 실행
   *   - ##ConfigOverride metadata 업데이트 (skip, cache, ...)
   *   - load -> 셀 추가
   */
  export function prepare(cell: Cell) {
    CellMetadata.ConfigOverride.delete(cell.model);
    CSMagicExecutor.execute(cell);
  }

  /**
   * 실행 셀 목록 조회 (실행 여부 판단, dependent cells 수집 포함)
   * - skip 처리
   * - ##Code metadata에 variables 정보 저장
   * - dependent cells 수집
   */
  export async function getCellsToExecute(cell: Cell) {
    const config = CellConfig.get(cell.model);
    if (config.skip) return;

    if (isCodeCell(cell)) {
      // ##Code metadata 생성 (variables)
      const code = await CellCode.build(cell);

      if (config.cache && code.variables) {
        const variableTracker = VariableTracker.getByCell(cell);
        const cached = variableTracker?.isCellCached(cell);
      }

      // TODO: dependency 체크
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
