import { Cell } from '@jupyterlab/cells';

import { CellMetadata } from './metadata';

export namespace CellStyle {
  export function update(cell: Cell) {
    const cellExecution = CellMetadata.Execution.getCoalesced(cell.model);

    const classes = {
      'jp-DoubleSharp-skip': cellExecution.skip,
      'jp-DoubleSharp-cache': cellExecution.cache
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
