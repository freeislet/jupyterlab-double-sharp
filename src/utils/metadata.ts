import { ICellModel, ICodeCellModel } from '@jupyterlab/cells';
import equal from 'fast-deep-equal';

import { encodeNull, decodeNull } from './json';

export class Metadata<T> {
  private _validChecker?: (model: ICellModel) => boolean;

  constructor(
    public readonly name: string,
    public nullish = false
  ) {}

  setValidChecker(checker: (model: ICellModel) => boolean) {
    this._validChecker = checker;
  }

  _isValid(model: ICellModel): boolean {
    return this._validChecker?.(model) ?? true;
  }

  get(model: ICellModel): T | undefined {
    if (!this._isValid(model)) return;
    return this._getMetadata(model);
  }

  _getMetadata(model: ICellModel): T | undefined {
    const metadata = model.getMetadata(this.name);
    return this.nullish ? decodeNull(metadata) : metadata;
  }

  set(model: ICellModel, value: T) {
    this._setMetadata(model, value);
  }

  _setMetadata(model: ICellModel, value: T) {
    if (this.nullish) {
      value = encodeNull(value, true);
    }
    model.setMetadata(this.name, value);
  }

  delete(model: ICellModel) {
    model.deleteMetadata(this.name);
  }
}

export class MetadataGroup<T> extends Metadata<T> {
  constructor(
    public readonly name: string,
    public readonly defaultValue: T,
    public nullish = false
  ) {
    super(name, nullish);
  }

  getCoalesced(model: ICellModel): T {
    const value = this.get(model);
    return this.getCoalescedValue(value);
  }

  getCoalescedValue(value?: Partial<T>): T {
    return { ...this.defaultValue, ...value };
  }

  set(model: ICellModel, value: T, deleteIfEqualDefault = false) {
    if (deleteIfEqualDefault && equal(value, this.defaultValue)) {
      this.delete(model);
    } else {
      this._setMetadata(model, value);
    }
  }

  update(model: ICellModel, value: Partial<T>, deleteIfEqualDefault = false) {
    const coalesced = this.getCoalesced(model);
    const newValue = { ...coalesced, ...value };
    this.set(model, newValue, deleteIfEqualDefault);
  }
}

export class MetadataGroupDirtyable<T> extends MetadataGroup<T> {
  public readonly dirtyFlagName: string;
  private _dirtyResolver?: (model: ICellModel) => void;
  private _cumulativeUpdating = false;
  private _cumulativeUpdates = new Map<ICellModel, T>();

  constructor(
    public readonly name: string,
    public readonly defaultValue: T,
    public nullish = false,
    dirtyFlagName?: string
  ) {
    super(name, defaultValue, nullish);
    this.dirtyFlagName = dirtyFlagName ?? name + '-dirty';
  }

  setDirtyResolver(resolver: (model: ICellModel) => void) {
    this._dirtyResolver = resolver;
  }

  isDirty(model: ICellModel): boolean {
    const dirty = model.getMetadata(this.dirtyFlagName) as boolean;
    if (dirty === undefined) {
      // dirty flag metadata가 없지만, dirty == false인 경우 확인 (새로 추가한 셀)
      // Log.debug('dirty flag metadata is null', this.name, model.id);
      const codeNotDirty = (model as ICodeCellModel).isDirty === false;
      const noSource = model.sharedModel.source.length === 0;
      const noMetadata = model.getMetadata(this.name) === undefined;
      if (codeNotDirty && noSource && noMetadata) {
        // Log.debug('- return false (not dirty)', this.name, model.id);
        return false;
      }
    }
    return dirty ?? true;
  }

  setDirty(model: ICellModel, dirty = true) {
    model.setMetadata(this.dirtyFlagName, dirty);
  }

  get(model: ICellModel, checkDirty = true): T | undefined {
    if (!this._isValid(model)) return;
    if (checkDirty && this.isDirty(model)) {
      if (this._dirtyResolver) {
        this._dirtyResolver(model);
        if (this.isDirty(model)) return;
      } else return;
    }
    return this._getMetadata(model);
  }

  set(model: ICellModel, value: T, deleteIfEqualDefault = false) {
    this.setDirty(model, false);
    super.set(model, value, deleteIfEqualDefault);
  }

  update(model: ICellModel, value: Partial<T>, deleteIfEqualDefault = false) {
    if (this._cumulativeUpdating) {
      this._accumulateUpdate(model, value);
      return;
    }

    if (this.isDirty(model)) {
      const coalescedValue = this.getCoalescedValue(value);
      this.set(model, coalescedValue, deleteIfEqualDefault);
    } else {
      super.update(model, value, deleteIfEqualDefault);
    }
  }

  beginCumulativeUpdate(targets?: Iterable<ICellModel>) {
    this._cumulativeUpdating = true;
    this._cumulativeUpdates.clear();

    if (targets) {
      for (const model of targets) {
        const initial = structuredClone(this.defaultValue);
        this._cumulativeUpdates.set(model, initial);
      }
    }
  }

  endCumulativeUpdate() {
    this._cumulativeUpdating = false;

    for (const [model, update] of this._cumulativeUpdates.entries()) {
      this.set(model, update);
    }

    this._cumulativeUpdates.clear();
  }

  private _accumulateUpdate(model: ICellModel, value: Partial<T>) {
    let update = this._cumulativeUpdates.get(model);
    if (!update) {
      update = structuredClone(this.defaultValue);
    }
    update = { ...update, ...value };
    this._cumulativeUpdates.set(model, update);
  }

  delete(model: ICellModel) {
    this.setDirty(model, false);
    super.delete(model);
  }

  clean(model: ICellModel) {
    super.delete(model);
    model.deleteMetadata(this.dirtyFlagName);
  }
}
