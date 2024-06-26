import { Cell } from '@jupyterlab/cells';

import { CellConfig } from './config';
import { CellMetadata } from './metadata';

export namespace CellStyle {
  let updating = false;

  export function update(cell: Cell) {
    /**
     * 재귀 호출 방지 위해 updating 플래그 확인
     * CellStyle.update -> CellMetadata.configOverride 업데이트 -> metadataChanged 시그널
     * -> CellStyle.update 다시 호출
     */
    if (updating) return;
    updating = true;

    const config = CellConfig.get(cell.model);
    const execution = CellMetadata.execution.get(cell.model);
    const classes = {
      'jp-DoubleSharp-skip': config.skip,
      'jp-DoubleSharp-skipped': execution?.skipped,
      'jp-DoubleSharp-cached': execution?.cached
    };

    setClasses(cell, classes);
    // console.log(classes);

    updating = false;
  }

  function setClasses(
    cell: Cell,
    classes: Record<string, boolean | undefined>
  ) {
    for (const [cls, on] of Object.entries(classes)) {
      if (on) cell.addClass(cls);
      else cell.removeClass(cls);
    }
  }
}
