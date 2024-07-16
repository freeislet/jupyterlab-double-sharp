/**
 * Array.filter predicate
 * Usage: arrA.filter(In(arrB))
 * @param list Array or Set
 * @returns filter function
 */
export function In<T>(list: Array<T> | Set<T>): (item: T) => boolean {
  if (Array.isArray(list)) {
    return (item: T) => list.includes(item);
  } else if (list instanceof Set) {
    return (item: T) => list.has(item);
  } else throw new TypeError();
}

/**
 * Array.filter predicate
 * Usage: arrA.filter(NotIn(arrB))
 * @param list Array or Set
 * @returns filter function
 */
export function notIn<T>(list: Array<T> | Set<T>): (item: T) => boolean {
  if (Array.isArray(list)) {
    return (item: T) => !list.includes(item);
  } else if (list instanceof Set) {
    return (item: T) => !list.has(item);
  } else throw new TypeError();
}

/**
 * 첫 번째 array element 리턴
 * array가 null or undefined or empty이면 undefined 리턴
 */
export function first<T>(array?: T[]): T | undefined {
  if (array?.length) {
    return array[0];
  }
}

/**
 * filter 함수에 의해 포함/미포함 배열 나누기
 */
export function partition<T>(
  list: T[],
  predicate: (value: T, index: number, array: T[]) => unknown
) {
  const result: [T[], T[]] = [[], []];
  list.forEach((value, index, array) => {
    result[predicate(value, index, array) ? 0 : 1].push(value);
  });
  return result;
}

/**
 * 중복 제거
 */
export function uniq<T>(list: T[]): T[] {
  return [...new Set(list)];
}

/**
 * sort compareFn 부하가 클 경우 keyFn으로 key를 미리 계산한 후에 sort
 * * 참고
 *   - Sorting with map (https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/sort#sorting_with_map)
 *   - mapsort (https://github.com/Pimm/mapsort)
 */
export function mapSort<T, U>(
  list: T[],
  keyFn: (value: T, index: number, array: T[]) => U,
  compareFn?: (a: U, b: U) => number
): T[] {
  const keys: U[] = [];
  const indexes: number[] = [];

  list.forEach((value, index, array) => {
    const key = keyFn(value, index, array);
    keys[index] = key;
    indexes.push(index);
  });

  compareFn ??= (a, b) => (a > b ? 1 : a < b ? -1 : 0);
  indexes.sort((a, b) => compareFn!(keys[a], keys[b]));

  const result = indexes.map(index => list[index]);
  return result;
}
