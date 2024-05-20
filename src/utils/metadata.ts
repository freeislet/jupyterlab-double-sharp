import { ICellModel } from '@jupyterlab/cells';
import equal from 'fast-deep-equal';

export class MetadataGroup<T> {
  constructor(
    public readonly name: string,
    public readonly defaultValue: T
  ) {}

  get(model: ICellModel): T | undefined {
    return model.getMetadata(this.name);
  }

  getCoalesced(model: ICellModel): T {
    return { ...this.defaultValue, ...this.get(model) };
  }

  set(model: ICellModel, value: T, deleteIfEqual = false) {
    if (deleteIfEqual && equal(value, this.defaultValue)) {
      this.delete(model);
    } else {
      model.setMetadata(this.name, value);
    }
  }

  update(model: ICellModel, value: Partial<T>, deleteIfEqual = false) {
    const coalescedValue = { ...this.getCoalesced(model), ...value };
    this.set(model, coalescedValue, deleteIfEqual);
  }

  delete(model: ICellModel) {
    model.deleteMetadata(this.name);
  }
}

export class MetadataGroupDirtyable<T> extends MetadataGroup<T> {
  constructor(
    public readonly name: string,
    public readonly dirtyFlagName: string,
    public readonly defaultValue: T
  ) {
    super(name, defaultValue);
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

  set(model: ICellModel, value: T, deleteIfEqual = false) {
    this.setDirty(model, false);
    super.set(model, value, deleteIfEqual);
  }

  update(model: ICellModel, value: Partial<T>, deleteIfEqual = false) {
    if (this.isDirty(model)) {
      const coalescedValue = { ...this.defaultValue, ...value };
      this.set(model, coalescedValue, deleteIfEqual);
    } else {
      super.update(model, value, deleteIfEqual);
    }
  }

  delete(model: ICellModel) {
    super.delete(model);
    model.deleteMetadata(this.dirtyFlagName);
  }
}
