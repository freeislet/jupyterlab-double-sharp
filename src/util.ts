import { MultilineString } from '@jupyterlab/nbformat';

export function joinMultiline(
  multiline: MultilineString,
  separator = '\n'
): string {
  return Array.isArray(multiline) ? multiline.join(separator) : multiline;
}
