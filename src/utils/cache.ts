export class Cache<T> {
  private _value?: T;

  constructor(private readonly setter: () => T) {}

  get value(): T {
    if (!this._value) {
      this._value = this.setter();
    }
    return this._value;
  }
}
