import { MultilineString } from '@jupyterlab/nbformat';
import { Cell, CodeCell, isCodeCellModel } from '@jupyterlab/cells';

export function joinMultiline(
  multiline: MultilineString,
  separator = '\n'
): string {
  return Array.isArray(multiline) ? multiline.join(separator) : multiline;
}

export function isCodeCell(cell: Cell): cell is CodeCell {
  return isCodeCellModel(cell.model);
}
