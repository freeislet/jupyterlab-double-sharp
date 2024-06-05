import { ICellModel } from '@jupyterlab/cells';
import equal from 'fast-deep-equal';

export class Metadata<T> {
  constructor(public readonly name: string) {}

  get(model: ICellModel): T | undefined {
    return model.getMetadata(this.name);
  }

  set(model: ICellModel, value: T) {
    model.setMetadata(this.name, value);
  }

  delete(model: ICellModel) {
    model.deleteMetadata(this.name);
  }
}

export class MetadataGroup<T> extends Metadata<T> {
  constructor(
    public readonly name: string,
    public readonly defaultValue: T
  ) {
    super(name);
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
      model.setMetadata(this.name, value);
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
  private _deferUpdate = false;
  private _deferredUpdates = new Map<ICellModel, Partial<T>>();

  constructor(
    public readonly name: string,
    public readonly defaultValue: T,
    dirtyFlagName?: string
  ) {
    super(name, defaultValue);
    this.dirtyFlagName = dirtyFlagName ?? name + '-dirty';
  }

  setDirtyResolver(resolver: (model: ICellModel) => void) {
    this._dirtyResolver = resolver;
  }

  isDirty(model: ICellModel): boolean {
    const dirty = model.getMetadata(this.dirtyFlagName) as boolean;
    return dirty ?? true;
  }

  setDirty(model: ICellModel, dirty = true) {
    model.setMetadata(this.dirtyFlagName, dirty);
  }

  get(model: ICellModel): T | undefined {
    if (this.isDirty(model)) {
      if (this._dirtyResolver) {
        this._dirtyResolver(model);
        if (this.isDirty(model)) return;
      } else return;
    }
    return super.get(model);
  }

  set(model: ICellModel, value: T, deleteIfEqualDefault = false) {
    this.setDirty(model, false);
    super.set(model, value, deleteIfEqualDefault);
  }

  update(model: ICellModel, value: Partial<T>, deleteIfEqualDefault = false) {
    if (this._deferUpdate) {
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

  deferUpdate() {
    this._deferUpdate = true;
    this._deferredUpdates.clear();
  }

  flushUpdate(resolveTargets?: Iterable<ICellModel>) {
    this._deferUpdate = false;

    for (const [model, update] of this._deferredUpdates.entries()) {
      this.update(model, update);
    }

    if (resolveTargets) {
      for (const model of resolveTargets) {
        if (!this._deferredUpdates.has(model)) {
          this.delete(model);
        }
      }
    }

    this._deferredUpdates.clear();
  }

  private _accumulateUpdate(model: ICellModel, value: Partial<T>) {
    let modelUpdate = this._deferredUpdates.get(model);
    if (!modelUpdate) {
      modelUpdate = {};
      this._deferredUpdates.set(model, modelUpdate);
    }
    Object.assign(modelUpdate, value);
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
