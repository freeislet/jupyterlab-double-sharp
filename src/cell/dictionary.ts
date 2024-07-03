import { ICellModel, Cell } from '@jupyterlab/cells';
import { ISharedCell } from '@jupyter/ydoc';
import { NotebookPanel } from '@jupyterlab/notebook';

import { MultiMap } from '../utils/map';
import { first } from '../utils/array';

/**
 * Cell id, model, sharedModel로부터 Cell을 조회하기 위한 utility class
 */
export class CellDictionary {
  static readonly global = new CellDictionary();

  //----

  private _set = new Set<Cell>();
  private _idMap = new Map<string, Cell>();
  private _modelMap = new MultiMap<ICellModel, Cell>();
  private _sharedModelMap = new MultiMap<ISharedCell, Cell>();
  // NOTE: model, sharedModel이 각각 cell과 1:N 관계인 경우를 고려하여 MultiMap 사용
  private _panelMap = new MultiMap<NotebookPanel, Cell>();

  constructor() {}

  add(cell: Cell) {
    this._set.add(cell);
    this._idMap.set(cell.id, cell);
    this._modelMap.put(cell.model, cell);
    this._sharedModelMap.put(cell.model.sharedModel, cell);

    const panel = cell.parent?.parent as NotebookPanel;
    if (panel) {
      this._panelMap.put(panel, cell);
    }
  }

  delete(cell: Cell): boolean {
    let success = true;
    success &&= this._set.delete(cell);
    success &&= this._idMap.delete(cell.id);
    success &&= this._modelMap.deleteEntry(cell.model, cell);
    success &&= this._sharedModelMap.deleteEntry(cell.model.sharedModel, cell);

    const panel = cell.parent?.parent as NotebookPanel;
    if (panel) {
      success &&= this._panelMap.deleteEntry(panel, cell);
    }
    return success;
  }

  get cells(): ReadonlySet<Cell> {
    return this._set;
  }

  getById(id: string): Cell | undefined {
    return this._idMap.get(id);
  }

  getByModel(model: ICellModel): Cell | undefined {
    return first(this.getCellsByModel(model));
  }

  getBySharedModel(sharedModel: ISharedCell): Cell | undefined {
    return first(this.getCellsBySharedModel(sharedModel));
  }

  getCellsByModel(model: ICellModel): Cell[] {
    return this._modelMap.getAsArray(model);
  }

  getCellsBySharedModel(sharedModel: ISharedCell): Cell[] {
    return this._sharedModelMap.getAsArray(sharedModel);
  }

  getCellsByPanel(panel: NotebookPanel): Cell[] {
    return this._panelMap.getAsArray(panel);
  }
}
