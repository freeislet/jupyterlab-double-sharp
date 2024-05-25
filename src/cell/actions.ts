import { ICellModel, Cell } from '@jupyterlab/cells';
import { ISignal, Signal } from '@lumino/signaling';
import { IChangedArgs } from '@jupyterlab/coreutils';
import { IMapChange } from '@jupyter/ydoc';
import { IDisposable } from '@lumino/disposable';

import { CellDictionary } from './dictionary';

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
  export const sourceChanged = new Signal<any, CellActions.ISourceChangeParams>(
    {}
  );

  export function params<T extends CellActions.IParams>(
    model: ICellModel,
    args: Omit<T, keyof CellActions.IParams>
  ): T {
    return {
      model,
      cell: CellDictionary.global.getByModel(model), // TODO: ChangeContext property로 대체
      ...args
    } as T;
  }
}

export class CellActionConnector {
  constructor(public readonly slotContext: any) {}

  add(model: ICellModel) {
    model.contentChanged.connect(this._onContentChanged, this.slotContext);
    model.stateChanged.connect(this._onStateChanged, this.slotContext);
    model.metadataChanged.connect(this._onMetadataChanged, this.slotContext);

    // console.log('CellActionConnector.add', model);
  }

  remove(model: ICellModel) {
    if (!model) return;

    model.contentChanged.disconnect(this._onContentChanged, this.slotContext);
    model.stateChanged.disconnect(this._onStateChanged, this.slotContext);
    model.metadataChanged.disconnect(this._onMetadataChanged, this.slotContext);

    // console.log('CellActionConnector.remove', model);
  }

  protected _onContentChanged(model: ICellModel) {
    Private.contentChanged.emit(Private.params(model, {}));
  }

  protected _onStateChanged(
    model: ICellModel,
    change: IChangedArgs<boolean, boolean, any>
  ) {
    Private.stateChanged.emit(Private.params(model, { change }));
  }

  protected _onMetadataChanged(model: ICellModel, change: IMapChange) {
    Private.metadataChanged.emit(Private.params(model, { change }));
  }
}
