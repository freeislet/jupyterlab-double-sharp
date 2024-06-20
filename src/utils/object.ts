import { stringify } from './json';

export function stringFrom(obj: any): string {
  if (obj instanceof Array) {
    return '[' + obj.map(stringFrom).join(', ') + ']';
  } else {
    let str = obj + '';
    if (str.startsWith('[object')) {
      try {
        str = stringify(obj, true);
      } catch {}
    }
    return str;
  }
}
