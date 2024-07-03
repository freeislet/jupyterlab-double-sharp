/**
 * offsetParent workaround
 * "position: fixed" element에 대해 null 대신 contain style을 가진 Element 리턴
 */
export function getOffsetParent(el: HTMLElement): Element {
  const offsetParent = isHTMLElement(el) ? el.offsetParent : null;
  if (offsetParent) return offsetParent;

  let parent = el.parentElement;

  while (parent && !isContainingBlockForFixed(parent)) {
    parent = parent.parentElement;
  }

  return parent || el.ownerDocument.documentElement;
}

function isHTMLElement(node: Node): node is HTMLElement {
  return 'offsetParent' in node;
}

function isContainingBlockForFixed(el: HTMLElement): boolean {
  const contain = getComputedStyle(el).contain;
  return (
    contain === 'content' ||
    contain === 'layout' ||
    contain === 'paint' ||
    contain === 'strict'
  );
}

// offset overflow

export interface IOffsetOverflow {
  left: number;
  right: number;
  top: number;
  bottom: number;
}

export function getOffsetOverflow(
  el: HTMLElement,
  margin = 0
): IOffsetOverflow {
  const parent = getOffsetParent(el);
  const bound = parent.getBoundingClientRect();
  const rc = el.getBoundingClientRect();
  const top = bound.top - rc.top + margin;
  const left = bound.left - rc.left + margin;
  const right = rc.right - bound.right + margin;
  const bottom = rc.bottom - bound.bottom + margin;
  return { top, left, right, bottom };
}
