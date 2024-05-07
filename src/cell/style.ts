import { Cell } from '@jupyterlab/cells';

import { Metadata } from '../metadata';

export namespace CellStyle {
  export function update(cell: Cell) {
    const cellExecution = Metadata.getCellExecution(cell.model, true)!;

    const classes = {
      'jp-DoubleSharp-skip': cellExecution.skip,
      'jp-DoubleSharp-cache': cellExecution.useCache
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
