import { ICellModel, Cell } from '@jupyterlab/cells';
import { ISignal, Signal } from '@lumino/signaling';
import { IChangedArgs } from '@jupyterlab/coreutils';
import { IMapChange } from '@jupyter/ydoc';
import { IDisposable } from '@lumino/disposable';

export namespace CellActions {
  export interface IParams {
    model: ICellModel;
    cell?: Cell;
  }

  export interface IChangedParams extends IParams {
    change: IChangedArgs<boolean, boolean, any>;
  }

  export interface IMapChangeParams extends IParams {
    change: IMapChange;
  }
}

export class CellActions {
  /**
   * 모든 셀의 ICellModel.contentChanged 시그널을 Cell 타입과 함께 emit
   */
  static get contentChanged(): ISignal<any, CellActions.IParams> {
    return Private.contentChanged;
  }

  /**
   * 모든 셀의 ICellModel.stateChanged 시그널을 Cell 타입과 함께 emit
   */
  static get stateChanged(): ISignal<any, CellActions.IChangedParams> {
    return Private.stateChanged;
  }

  /**
   * 모든 셀의 ICellModel.metadataChanged 시그널을 Cell 타입과 함께 emit
   */
  static get metadataChanged(): ISignal<any, CellActions.IMapChangeParams> {
    return Private.metadataChanged;
  }

  // TODO: mimetype, syntax tree
}

namespace Private {
  export const contentChanged = new Signal<any, CellActions.IParams>({});
  export const stateChanged = new Signal<any, CellActions.IChangedParams>({});
  export const metadataChanged = new Signal<any, CellActions.IMapChangeParams>(
    {}
  );
}

export class CellActionConnector implements IDisposable {
  private _isDisposed = false;
  readonly cellMap = new Map<ICellModel, Cell | undefined>();

  constructor() {}

  get isDisposed(): boolean {
    return this._isDisposed;
  }

  dispose() {
    if (this.isDisposed) return;

    this._isDisposed = true;
    this.cellMap.clear();
    Signal.clearData(this);
  }

  add(model: ICellModel, cell?: Cell) {
    this.cellMap.set(model, cell);

    model.contentChanged.connect(this._onContentChanged, this);
    model.stateChanged.connect(this._onStateChanged, this);
    model.metadataChanged.connect(this._onMetadataChanged, this);

    // console.log('CellActionConnector.add', model, this.cellMap);
  }

  remove(model: ICellModel) {
    if (!model) return;

    model.contentChanged.disconnect(this._onContentChanged, this);
    model.stateChanged.disconnect(this._onStateChanged, this);
    model.metadataChanged.disconnect(this._onMetadataChanged, this);

    this.cellMap.delete(model);
    // console.log('CellActionConnector.remove', model, this.cellMap);
  }

  protected _onContentChanged(model: ICellModel) {
    Private.contentChanged.emit(this._params(model, {}));
  }

  protected _onStateChanged(
    model: ICellModel,
    change: IChangedArgs<boolean, boolean, any>
  ) {
    Private.stateChanged.emit(this._params(model, { change }));
  }

  protected _onMetadataChanged(model: ICellModel, change: IMapChange) {
    Private.metadataChanged.emit(this._params(model, { change }));
  }

  protected _params<T extends CellActions.IParams>(
    model: ICellModel,
    args: Omit<T, keyof CellActions.IParams>
  ): T {
    return {
      model,
      cell: this.cellMap.get(model),
      ...args
    } as T;
  }
}
