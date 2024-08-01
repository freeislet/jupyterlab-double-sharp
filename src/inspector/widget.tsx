import * as React from 'react';
import { INotebookTracker } from '@jupyterlab/notebook';
import { Cell } from '@jupyterlab/cells';
import { Signal } from '@lumino/signaling';
import { ReactWidget, UseSignal } from '@jupyterlab/ui-components';
import { settingsIcon } from '@jupyterlab/ui-components';
import { TbHelp } from 'react-icons/tb';

import { doubleSharpIcon } from '../icon';
import { App } from '../app';
import { CellContext } from '../cell';
import Accordion from '../ui/accordion';
import Toolbar from '../ui/toolbar';
import Settings from './components/settings';
import CellTools from './components/cell-tools';

export class InspectorWidget extends ReactWidget {
  private _cellChanged = new Signal<this, CellContext | null>(this);
  private _cellContext: CellContext | null = null;

  constructor(nbtracker: INotebookTracker) {
    super();

    this.addClass('jp-DoubleSharp-Inspector');

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
      <div className="jp-DoubleSharp-Inspector-content">
        <Accordion>
          <Accordion.TriggerContainer>
            <Accordion.TriggerInner>
              <doubleSharpIcon.react className="jp-DoubleSharp-icon-inline" />
              Settings
            </Accordion.TriggerInner>
            <Toolbar>
              <Toolbar.Button
                title="Double Sharp settings"
                onClick={() => App.instance.openSettings()}
              >
                <settingsIcon.react />
              </Toolbar.Button>
            </Toolbar>
          </Accordion.TriggerContainer>
          <Accordion.Content>
            <Settings />
          </Accordion.Content>
        </Accordion>
        <Accordion initialActive={true}>
          <Accordion.TriggerContainer>
            <Accordion.TriggerInner>
              <doubleSharpIcon.react className="jp-DoubleSharp-icon-inline" />
              Cell Inspector
            </Accordion.TriggerInner>
            <Toolbar>
              <Toolbar.Button
                title="Double Sharp document"
                onClick={() => App.instance.openDocument()}
              >
                <TbHelp className="jp-DoubleSharp-icon" />
              </Toolbar.Button>
            </Toolbar>
          </Accordion.TriggerContainer>
          <Accordion.Content>
            <UseSignal signal={this._cellChanged}>
              {(_, cellContext) => <CellTools context={cellContext ?? null} />}
            </UseSignal>
          </Accordion.Content>
        </Accordion>
      </div>
    );
  }
}
