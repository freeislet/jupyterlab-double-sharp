/**
 * Array.filter predicate
 * Usage: arrA.filter(In(arrB))
 * @param array array
 * @returns filter function
 */
export function In<T>(array: Array<T>): (item: T) => boolean {
  return (item: T) => array.includes(item);
}

/**
 * Array.filter predicate
 * Usage: arrA.filter(NotIn(arrB))
 * @param array array
 * @returns filter function
 */
export function notIn<T>(array: Array<T>): (item: T) => boolean {
  return (item: T) => !array.includes(item);
}
