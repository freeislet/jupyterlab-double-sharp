import { Cell, CodeCell, isCodeCellModel } from '@jupyterlab/cells';
import { Notebook } from '@jupyterlab/notebook';

export function isCodeCell(cell: Cell): cell is CodeCell {
  return isCodeCellModel(cell.model);
}

export function getAboveCells(cell: Cell): Cell[] {
  const notebook = cell.parent as Notebook;
  if (!notebook) return [];

  const index = notebook.widgets.findIndex(c => c === cell);
  if (index < 0) return [];

  const aboves = notebook.widgets.slice(0, index);
  return aboves;
}

export function getAboveCodeCells(cell: Cell): CodeCell[] {
  return getAboveCells(cell).filter(c => isCodeCell(c)) as CodeCell[];
}
