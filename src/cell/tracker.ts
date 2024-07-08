import { DocumentRegistry } from '@jupyterlab/docregistry';
import { NotebookPanel, CellList } from '@jupyterlab/notebook';
import { ICellModel } from '@jupyterlab/cells';
import { IObservableList } from '@jupyterlab/observables';
import { IDisposable } from '@lumino/disposable';
import { Signal } from '@lumino/signaling';

import { CellDictionary } from './dictionary';
import { CellActionConnector } from './actions';
import { CellStyle } from './style';
import { NotebookExt } from '../utils/notebook';
import { Settings } from '../settings';

/**
 * CellTracker
 */
export class CellTracker extends NotebookExt {
  private _actionConnector = new CellActionConnector(this);

  constructor(panel: NotebookPanel) {
    super(panel);

    panel.context.model.cells.changed.connect(this._onCellsChanged, this);
    // panel.context.ready.then(() => this.updateStyles());
    panel.revealed.then(() => this.updateStyles()); // NOTE: cell.editor 참조 위해 revealed 사용하지만 완벽하진 않음
    Settings.executionChanged.connect((_, change) => {
      this.updateStyles();
    });
    Settings.csMagicChanged.connect((_, change) => {
      this.updateStyles();
    });
  }

  dispose() {
    if (this.isDisposed) return;

    super.dispose();
    Signal.clearData(this);
  }

  updateStyles() {
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

    changed.newValues.forEach(model => {
      const cell = this.findCellByModel(model);
      if (cell) {
        CellDictionary.global.add(cell);
      }
      this._actionConnector.add(model);
    });

    // changed.oldValues.forEach(model => this._actionConnector.remove(model));
    // NOTE: CellList.changed.oldValues 목록이 undefined로 오는 문제로 전체 목록 참고하여 remove
    if (changed.oldValues.length) {
      const curModels = new Set(cells);
      const panelCells = CellDictionary.global.getCellsByPanel(this.panel);
      for (const cell of panelCells) {
        const removed = !curModels.has(cell.model);
        if (removed) {
          this._actionConnector.remove(cell.model);
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
