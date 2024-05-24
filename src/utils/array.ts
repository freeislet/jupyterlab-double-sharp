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
export function first<T>(array?: Array<T>): T | undefined {
  if (array?.length) {
    return array[0];
  }
}
