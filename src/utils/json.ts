import { Cell } from '@jupyterlab/cells';
import { Widget } from '@lumino/widgets';

export function stringify(obj: any, replaceForLog = false): string {
  const replacer = replaceForLog ? stringifyReplacerForLog : undefined;
  return JSON.stringify(obj, replacer);
}

function stringifyReplacerForLog(key: string, value: any): any {
  if (value instanceof Map) {
    return Object.fromEntries(value);
  } else if (value instanceof Set) {
    return [...value];
  } else if (value instanceof Cell) {
    return `<${typeof value}>${value.title}(${value.model.id})`;
  } else if (value instanceof Widget) {
    return `<${typeof value}>${value.title}(${value.id})`;
  } else if (value instanceof Object && 'type' in value && 'id' in value) {
    // ICellModel-like type
    return `<${value.type}>(${value.id})`;
  } else return value;
}

export function replaceValue(obj: any, fromValue: any, toValue: any): any {
  if (obj === fromValue) return toValue;
  if (typeof obj === 'object') {
    for (const key in obj) {
      obj[key] = replaceValue(obj[key], fromValue, toValue);
    }
  }
  return obj;
}

export function encodeNull(obj: any, clone = false): any {
  if (clone) {
    obj = cloneObj(obj);
  }
  return replaceValue(obj, null, 'null');
}

export function decodeNull(obj: any, clone = false): any {
  if (clone) {
    obj = cloneObj(obj);
  }
  return replaceValue(obj, 'null', null);
}

function cloneObj<T>(obj: T): T {
  try {
    return structuredClone(obj);
  } catch {
    return obj;
  }
}
