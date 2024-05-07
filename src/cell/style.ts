import { Cell } from '@jupyterlab/cells';

import { CellActions } from './actions';
import { CellMetadata } from './metadata';

export function setupCellStyles() {
  CellActions.metadataChanged.connect(
    (_, args: CellActions.IMapChangeParams) => {
      console.log(args);

      const { cell, change } = args;

      if (!cell) return;

      if (change.key.startsWith('##')) {
        CellStyle.update(cell);
      }
    }
  );
}

export namespace CellStyle {
  export function update(cell: Cell) {
    const cellExecution = CellMetadata.getExecution(cell.model, true)!;

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
