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

  set(model: ICellModel, value: T) {
    model.setMetadata(this.name, value);
  }

  update(model: ICellModel, value: Partial<T>, deleteIfEqual = false) {
    const newValue = { ...this.getCoalesced(model), ...value };
    if (deleteIfEqual && equal(newValue, this.defaultValue)) {
      this.delete(model);
    } else {
      this.set(model, newValue);
    }
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

  set(model: ICellModel, value: T) {
    super.set(model, value);
    this.setDirty(model, false);
  }

  delete(model: ICellModel) {
    super.delete(model);
    model.deleteMetadata(this.dirtyFlagName);
  }
}
