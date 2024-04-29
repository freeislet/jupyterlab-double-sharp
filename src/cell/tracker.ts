import { DocumentRegistry } from '@jupyterlab/docregistry';
import { NotebookPanel, CellList } from '@jupyterlab/notebook';
import { Cell, ICellModel } from '@jupyterlab/cells';
import { IObservableList } from '@jupyterlab/observables';
import { IDisposable } from '@lumino/disposable';
import { Signal } from '@lumino/signaling';

import { CellActionConnector } from './actions';

/**
 * CellTracker
 */
export class CellTracker implements IDisposable {
  private _isDisposed = false;
  private _actionConnector = new CellActionConnector();
  private _panel: NotebookPanel | null;

  constructor(panel: NotebookPanel) {
    this._panel = panel;

    panel.context.model.cells.changed.connect(this._onCellsChanged, this);
  }

  get isDisposed(): boolean {
    return this._isDisposed;
  }

  dispose() {
    if (this.isDisposed) return;

    this._isDisposed = true;
    this._panel = null;

    Signal.clearData(this);
  }

  protected _onCellsChanged(
    cells: CellList,
    changed: IObservableList.IChangedArgs<ICellModel>
  ) {
    // console.log('_onCellsChanged', cells, changed);

    changed.newValues.forEach(model =>
      this._actionConnector.add(model, this._getCell(model))
    );

    // changed.oldValues.forEach(model => this._actionConnector.remove(model));
    // NOTE: CellList.changed.oldValues 목록이 undefined로 오는 문제로 전체 목록 참고하여 remove
    if (changed.oldValues.length) {
      const newCellMap = new Set(cells);
      for (const model of this._actionConnector.cellMap.keys()) {
        if (!newCellMap.has(model)) {
          this._actionConnector.remove(model);
        }
      }
    }
  }

  private _getCell(model: ICellModel): Cell | undefined {
    return this._panel?.content.widgets.find(widget => widget.model === model);
  }
}

/**
 * CellExtension
 */
export class CellExtension implements DocumentRegistry.WidgetExtension {
  constructor() {}

  createNew(panel: NotebookPanel): IDisposable {
    return new CellTracker(panel);
  }
}
