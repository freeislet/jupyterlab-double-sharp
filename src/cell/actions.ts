import { ICellModel, Cell } from '@jupyterlab/cells';
import { ISignal, Signal } from '@lumino/signaling';
import { IChangedArgs } from '@jupyterlab/coreutils';
import { IMapChange, ISharedCell, CellChange, Delta } from '@jupyter/ydoc';

import { CellDictionary } from './dictionary';

export namespace CellActions {
  export interface IParams {
    model: ICellModel;
  }

  export interface IChangedParams {
    model: ICellModel;
    change: IChangedArgs<boolean, boolean, any>;
  }

  export interface IMapChangeParams {
    model: ICellModel;
    change: IMapChange;
  }

  export interface ISourceChangeParams {
    sharedModel: ISharedCell;
    change: Delta<string>;
  }
}

export class CellActions {
  /**
   * 모든 셀 Cell.model의 ICellModel.contentChanged 시그널 emit
   */
  static get contentChanged(): ISignal<any, CellActions.IParams> {
    return Private.contentChanged;
  }

  /**
   * 모든 셀 Cell.model의 ICellModel.stateChanged 시그널 emit
   */
  static get stateChanged(): ISignal<any, CellActions.IChangedParams> {
    return Private.stateChanged;
  }

  /**
   * 모든 셀 Cell.model의 ICellModel.metadataChanged 시그널 emit
   */
  static get metadataChanged(): ISignal<any, CellActions.IMapChangeParams> {
    return Private.metadataChanged;
  }

  /**
   * 모든 셀 Cell.model.sharedModel의 ISharedBaseCell.changed 시그널 중
   * CellChange.sourceChange 변경사항 emit
   */
  static get sourceChanged(): ISignal<any, CellActions.ISourceChangeParams> {
    return Private.sourceChanged;
  }

  // TODO: mimetype, syntax tree
}

export namespace CellActions {
  export function forAllCells(
    callback: (cell: Cell, cells: ReadonlySet<Cell>) => any,
    predicate?: (cell: Cell, cells: ReadonlySet<Cell>) => boolean
  ) {
    // for (const widget of App.instance.jlab.labshell.widgets()) {
    //   if (widget instanceof NotebookPanel) {
    //   }
    // }
    CellDictionary.global.cells.forEach((value, _, set) => {
      const filtered = predicate?.(value, set) ?? true;
      if (filtered) {
        callback(value, set);
      }
    });
  }
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
}

export class CellActionConnector {
  constructor(public readonly slotContext: any) {}

  add(model: ICellModel) {
    model.contentChanged.connect(this._onContentChanged, this.slotContext);
    model.stateChanged.connect(this._onStateChanged, this.slotContext);
    model.metadataChanged.connect(this._onMetadataChanged, this.slotContext);
    model.sharedModel.changed.connect(
      this._onSharedModelChanged,
      this.slotContext
    );

    // console.log('CellActionConnector.add', model);
  }

  remove(model: ICellModel) {
    model.contentChanged.disconnect(this._onContentChanged, this.slotContext);
    model.stateChanged.disconnect(this._onStateChanged, this.slotContext);
    model.metadataChanged.disconnect(this._onMetadataChanged, this.slotContext);
    model.sharedModel.changed.disconnect(
      this._onSharedModelChanged,
      this.slotContext
    );

    // console.log('CellActionConnector.remove', model);
  }

  protected _onContentChanged(model: ICellModel) {
    Private.contentChanged.emit({ model });
  }

  protected _onStateChanged(
    model: ICellModel,
    change: IChangedArgs<boolean, boolean, any>
  ) {
    Private.stateChanged.emit({ model, change });
  }

  protected _onMetadataChanged(model: ICellModel, change: IMapChange) {
    Private.metadataChanged.emit({ model, change });
  }

  protected _onSharedModelChanged(
    sharedModel: ISharedCell,
    change: CellChange
  ) {
    if (change.sourceChange) {
      Private.sourceChanged.emit({ sharedModel, change: change.sourceChange });
    }
  }
}
