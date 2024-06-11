import * as React from 'react';
import { ReactWidget, UseSignal } from '@jupyterlab/ui-components';
import { Signal } from '@lumino/signaling';
// import { Widget } from '@lumino/widgets';

function CellInspectorComponent() {
  return <div>My Widget</div>;
}

export class CellInspectorWidget extends ReactWidget {
  render() {
    return (
      <UseSignal signal={this._signal}>
        {() => <CellInspectorComponent />}
      </UseSignal>
    );
  }

  private _signal = new Signal<this, void>(this);
}
