import { DocumentRegistry } from '@jupyterlab/docregistry';
import { NotebookPanel, CellList } from '@jupyterlab/notebook';
import { ICellModel } from '@jupyterlab/cells';
import { IObservableList } from '@jupyterlab/observables';
import { IDisposable } from '@lumino/disposable';
import { Signal } from '@lumino/signaling';

import { CellActionConnector } from './actions';
import { CellStyle } from './style';
import { NotebookExt } from '../utils/notebook';

/**
 * CellTracker
 */
export class CellTracker extends NotebookExt {
  private _actionConnector = new CellActionConnector();

  constructor(panel: NotebookPanel) {
    super(panel);

    panel.context.ready.then(() => this.updateCells());
    panel.context.model.cells.changed.connect(this._onCellsChanged, this);
  }

  dispose() {
    if (this.isDisposed) return;

    super.dispose();
    this._actionConnector.dispose();
    Signal.clearData(this);
  }

  updateCells() {
    const cells = this.panel.content.widgets;
    if (cells) {
      for (const cell of cells) {
        CellStyle.update(cell);
      }
    }
  }

  protected _onCellsChanged(
    cells: CellList,
    changed: IObservableList.IChangedArgs<ICellModel>
  ) {
    // console.log('_onCellsChanged', cells, changed);

    changed.newValues.forEach(model =>
      this._actionConnector.add(model, this.findCellByModel(model))
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
