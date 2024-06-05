import { stringify } from './json';

export function toString(obj: any) {
  let str = obj + '';
  if (str.startsWith('[object')) {
    try {
      str = stringify(obj);
    } catch {}
  }
  return str;
}
