import { Cell, CodeCell, isCodeCellModel } from '@jupyterlab/cells';

export function isCodeCell(cell: Cell): cell is CodeCell {
  return isCodeCellModel(cell.model);
}
