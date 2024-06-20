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
