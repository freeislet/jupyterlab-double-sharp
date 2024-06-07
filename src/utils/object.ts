import { stringify } from './json';

export function toString(obj: any): string {
  if (obj instanceof Array) {
    return '[' + obj.map(toString).join(', ') + ']';
  } else {
    let str = obj + '';
    if (str.startsWith('[object')) {
      try {
        str = stringify(obj);
      } catch {}
    }
    return str;
  }
}
