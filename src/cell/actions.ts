import { ICellModel, Cell } from '@jupyterlab/cells';
import { ISignal, Signal } from '@lumino/signaling';

export class NotebookCellActions {
  /**
   * 모든 셀의 ICellModel.contentChanged 시그널을 Cell 타입과 함께 emit
   */
  static get cellContentChanged(): ISignal<
    any,
    { model: ICellModel; cell?: Cell }
  > {
    return Private.cellContentChanged;
  }

  // TODO: state, metadata, ...
}

namespace Private {
  export const cellContentChanged = new Signal<
    any,
    { model: ICellModel; cell?: Cell }
  >({});
}

export class CellActionConnector {
  readonly cellMap = new Map<ICellModel, Cell | undefined>();

  constructor() {}

  add(model: ICellModel, cell?: Cell) {
    this.cellMap.set(model, cell);

    model.contentChanged.connect(this._onCellContentChanged, this);
    cell?.disposed;

    // console.log('CellActionConnector.add', model, this.cellMap);
  }

  remove(model: ICellModel) {
    if (!model) return;

    model.contentChanged.disconnect(this._onCellContentChanged, this);

    this.cellMap.delete(model);
    // console.log('CellActionConnector.remove', model, this.cellMap);
  }

  protected _onCellContentChanged(model: ICellModel) {
    this._emit(Private.cellContentChanged, model);
  }

  protected _emit(
    signal: Signal<any, { model: ICellModel; cell?: Cell }>,
    model: ICellModel
  ) {
    signal.emit({
      model,
      cell: this.cellMap.get(model)
    });
  }
}
