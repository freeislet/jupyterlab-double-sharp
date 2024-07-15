import { Cell, CodeCell, isCodeCellModel } from '@jupyterlab/cells';
import { Notebook } from '@jupyterlab/notebook';

import { CellError } from './error';
import { mapSort } from './array';

export function isCodeCell(cell: Cell): cell is CodeCell {
  return isCodeCellModel(cell.model);
}

export function getCellIndex(cell: Cell): number {
  const notebook = cell.parent as Notebook;
  if (!notebook) throw new CellError(cell, 'Cell notebook is null.');

  const index = notebook.widgets.indexOf(cell);
  if (index < 0) throw new CellError(cell, 'Cell not found in the notebook.');

  return index;
}

export function getAboveCells(cell: Cell): Cell[] {
  try {
    const index = getCellIndex(cell);
    const notebook = cell.parent as Notebook;
    const aboves = notebook.widgets.slice(0, index);
    return aboves;
  } catch (e) {
    if (e instanceof CellError) return [];
    else throw e;
  }
}

export function getAboveCodeCells(cell: Cell): CodeCell[] {
  return getAboveCells(cell).filter(c => isCodeCell(c)) as CodeCell[];
}

export function sortCells<T extends Cell>(cells: T[]): T[] {
  return mapSort(cells, getCellIndex);
}
