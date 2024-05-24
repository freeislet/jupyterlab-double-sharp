import { NotebookPanel } from '@jupyterlab/notebook';
import { ICellModel, Cell } from '@jupyterlab/cells';
import { IDisposable } from '@lumino/disposable';

/**
 * notebook extension instance base class
 */

export abstract class NotebookExt implements IDisposable {
  protected _isDisposed = false;

  get isDisposed(): boolean {
    return this._isDisposed;
  }

  constructor(public readonly panel: NotebookPanel) {}

  dispose() {
    this._isDisposed = true;
  }

  findCellByModel(model: ICellModel): Cell | undefined {
    return this.panel.content.widgets.find(widget => widget.model === model);
  }
}

/**
 * notebook extension instance dictionary
 */
export class NotebookExtDictionary<T extends NotebookExt> {
  private _dictionary = new Map<NotebookPanel, T>();

  set(panel: NotebookPanel, notebookExt: T) {
    this._dictionary.set(panel, notebookExt);
  }

  delete(panel: NotebookPanel) {
    this._dictionary.delete(panel);
  }

  get(panel: NotebookPanel): T | undefined {
    return this._dictionary.get(panel);
  }

  getByCell(cell: Cell): T | undefined {
    const panel = cell.parent?.parent;
    if (panel) {
      return this.get(panel as NotebookPanel);
    }
  }

  getByCells(cells: readonly Cell[]): T | undefined {
    if (cells.length) {
      return this.getByCell(cells[0]);
    }
  }
}
