import { SetMultimap } from '@teppeis/multimaps';

export class MultiMap<K, V> extends SetMultimap<K, V> {
  /**
   * map value Set 직접 조회 (없으면 undefined 리턴)
   */
  getRef(key: K): Set<V> | undefined {
    return this['map'].get(key);
  }

  /**
   * get: clone 없이 value Set 조회하도록 변경
   */
  get(key: K): Set<V> {
    const values = this.getRef(key);
    return values ?? super.get(key);
  }

  /**
   * cloned value Set 조회
   */
  getCloned(key: K): Set<V> {
    return super.get(key);
  }

  /**
   * value Set을 array 타입으로 조회
   */
  getAsArray(key: K): V[] {
    const values = this.getRef(key);
    return values ? Array.from(values) : [];
  }

  /**
   * value가 해당 key의 유일한 entry이면, key 삭제하도록 수정
   */
  deleteEntry(key: K, value: V): boolean {
    const current = this.getRef(key);
    if (!current?.has(value)) return false;

    if (current.size === 1) {
      this['map'].delete(key);
    } else {
      current.delete(value);
    }
    this['size_'] = this.size - 1;
    return true;
  }
}
