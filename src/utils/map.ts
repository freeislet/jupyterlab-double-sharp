import { SetMultimap } from '@teppeis/multimaps';

export class MultiMap<K, V> extends SetMultimap<K, V> {
  /**
   * clone 없이 value Set 조회
   */
  getRef(key: K): Set<V> | undefined {
    return this['map'].get(key);
  }

  /**
   * value를 array 타입으로 조회
   * key가 없어도 새로운 map entry를 만들지 않음
   */
  getAsArray(key: K): V[] {
    const current = this.getRef(key);
    return current ? Array.from(current) : [];
  }

  /**
   * value가 해당 key의 유일한 entry이면, key 삭제하도록 수정
   */
  deleteEntry(key: K, value: V): boolean {
    const current = this.getRef(key);
    if (!current) return false;
    if (!current.has(value)) return false;
    if (current.size === 1) {
      this['size_'] = this.size - 1;
      return this['map'].delete(key);
    } else {
      return super.deleteEntry(key, value);
    }
  }
}
