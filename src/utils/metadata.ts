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

  constructor(
    public readonly name: string,
    public readonly defaultValue: T,
    dirtyFlagName?: string
  ) {
    super(name, defaultValue);
    this.dirtyFlagName = dirtyFlagName ?? name + '-dirty';
  }

  isDirty(model: ICellModel): boolean {
    const dirty = model.getMetadata(this.dirtyFlagName) as boolean;
    return dirty ?? true;
  }

  setDirty(model: ICellModel, dirty = true) {
    model.setMetadata(this.dirtyFlagName, dirty);
  }

  get(model: ICellModel): T | undefined {
    if (this.isDirty(model)) return;
    return super.get(model);
  }

  set(model: ICellModel, value: T, deleteIfEqualDefault = false) {
    this.setDirty(model, false);
    super.set(model, value, deleteIfEqualDefault);
  }

  update(model: ICellModel, value: Partial<T>, deleteIfEqualDefault = false) {
    if (this.isDirty(model)) {
      const coalescedValue = this.getCoalescedValue(value);
      this.set(model, coalescedValue, deleteIfEqualDefault);
    } else {
      super.update(model, value, deleteIfEqualDefault);
    }
  }

  clean(model: ICellModel) {
    this.delete(model);
    model.deleteMetadata(this.dirtyFlagName);
  }
}
