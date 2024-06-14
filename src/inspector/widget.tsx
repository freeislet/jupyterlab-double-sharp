import * as React from 'react';
import { ReactWidget, UseSignal } from '@jupyterlab/ui-components';
import { Signal } from '@lumino/signaling';
import { INotebookTracker } from '@jupyterlab/notebook';
import { Cell } from '@jupyterlab/cells';

import { CellContext } from '../cell';
import CellTools from './components/cell-tools';

export class CellInspectorWidget extends ReactWidget {
  private _cellChanged = new Signal<this, CellContext | null>(this);
  private _cellContext: CellContext | null = null;

  constructor(nbtracker: INotebookTracker) {
    super();

    this.addClass('jp-DoubleSharp-CellInspector');

    nbtracker.activeCellChanged.connect((tracker, cell) => {
      // Log.debug('activeCellChanged', tracker, cell);
      this.setCell(cell);
    }, this);
    nbtracker.currentChanged.connect((tracker, panel) => {
      // Log.debug('INotebookTracker.currentChanged', tracker, panel);
      // 모든 노트북 닫힐 때 activeCellChanged 보내지 않는 대신, currentChanged가 panel null로 옴
      // 이 때, activeCell도 null
      if (!tracker.activeCell) {
        this.setCell(null);
      }
    }, this);
  }

  protected onBeforeDetach() {
    Signal.clearData(this);
  }

  setCell(cell: Cell | null) {
    this._cellContext = cell ? new CellContext(cell) : null;
    this._cellChanged.emit(this._cellContext);
  }

  render() {
    return (
      <UseSignal signal={this._cellChanged}>
        {(_, cellContext) => <CellTools context={cellContext ?? null} />}
      </UseSignal>
    );
  }
}
