export class Cache<T> {
  private _value?: T;

  constructor(
    private readonly setter: () => T,
    initialValue?: T
  ) {
    this._value = initialValue;
  }

  get value(): T {
    if (!this._value) {
      this._value = this.setter();
    }
    return this._value;
  }
}
