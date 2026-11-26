// Scrolls a box just far enough to show something inside it. Unlike scrollIntoView, the page stays put.
export function revealWithin(box: HTMLElement, item: Element): void {
  const outer = box.getBoundingClientRect();
  const inner = item.getBoundingClientRect();
  if (inner.bottom > outer.bottom) {
    box.scrollTop += inner.bottom - outer.bottom;
  } else if (inner.top < outer.top) {
    box.scrollTop -= outer.top - inner.top;
  }
}
