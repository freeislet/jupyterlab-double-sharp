/**
 * add 시 기존 element가 있으면 마지막 순서로 만드는 Set
 */
export class ReorderSet<T> extends Set<T> {
  add(value: T): this {
    if (this.has(value)) {
      this.delete(value);
    }
    return super.add(value);
  }
}
