import { Cell } from '@jupyterlab/cells';

import { CellConfig } from './config';

export namespace CellStyle {
  export function update(cell: Cell) {
    const config = CellConfig.get(cell.model);
    const classes = {
      'jp-DoubleSharp-skip': config.skip,
      'jp-DoubleSharp-cache': config.useCache // TODO: cached, uncached 구분
    };

    // if (cellExecution.skip) {
    // } else if (cellExecution.useCache) {
    // }

    setClasses(cell, classes);
    // console.log(classes);
  }

  function setClasses(cell: Cell, classes: { [name: string]: boolean }) {
    for (const [cls, on] of Object.entries(classes)) {
      if (on) cell.addClass(cls);
      else cell.removeClass(cls);
    }
  }
}
