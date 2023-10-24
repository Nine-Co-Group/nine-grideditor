import { CoordinateType } from "../types/DimensionType";

export const getTopParent = (node: HTMLElement): HTMLElement => {
  if (!!node.parentElement && node.parentElement.tagName !== "BODY")
    return getTopParent(node.parentElement);
  return node;
};

export const hasParent = (
  element: HTMLElement,
  parentElement: HTMLElement
): boolean => {
  if (element === parentElement) return true;

  if (!element.parentElement) return false;

  return hasParent(element.parentElement, parentElement);
};

export const stripForbiddenTags = (html: string, allowed: string[] = []) => {
  if (!html) return html;

  const hasHtml = html.includes("<") && html.includes(">");
  if (!hasHtml) return html;

  const dom = document.createElement("div");
  dom.innerHTML = html;

  const replacesContent = ["style", "script"];

  const nodes = Array.from(dom.querySelectorAll("*"));
  nodes.forEach((node) => {
    if (!node.parentNode) return;

    if (node.nodeType !== Node.ELEMENT_NODE) return;

    const tagName = node.tagName.toLowerCase();

    if (allowed.includes(tagName)) return;

    if (replacesContent.includes(tagName)) {
      node.parentNode.removeChild(node);
    }

    const newNode = document.createDocumentFragment();
    while (node.hasChildNodes()) {
      newNode.appendChild(node.removeChild(node.firstChild!));
    }
    node.parentNode.replaceChild(newNode, node);
  });

  return dom.innerHTML;
};

export const stripForbiddenAttributes = (
  target: string | Element,
  allowed: string[] = []
): Element => {
  let elem = null;
  if (typeof target === "string") {
    elem = document.createElement("div");
    elem.innerHTML = target;
  } else elem = target;

  if (!elem) return elem;

  for (const name of elem.getAttributeNames()) {
    if (!allowed.includes(name)) elem.removeAttribute(name);
  }

  for (let i = 0; i < elem.children.length; i++) {
    const child = elem.children[i];
    if (child) stripForbiddenAttributes(child, allowed);
  }

  return elem;
};

export const stripForbiddenStyles = (
  target: string | Element,
  allowed: string[] = [],
  filterFunction?: any
): Element => {
  let elem: Element | null = null;
  if (typeof target === "string") {
    elem = document.createElement("div");
    elem.innerHTML = target;
  } else elem = target;

  if (!elem) return elem;

  const styles = (elem as any).style;
  if (styles) {
    const newStyles = allowed
      .map((x) => ({ name: x, value: styles[x] }))
      .filter((x) => {
        const allowed =
          !!x.value && x.value !== "inherit" && x.value !== "initial";

        const filterAllowed = !filterFunction || !!filterFunction(x);

        return allowed && filterAllowed;
      });
    elem.removeAttribute("style");
    newStyles.forEach((x) => ((elem as any).style[x.name] = x.value));
  }

  for (let i = 0; i < elem.children.length; i++) {
    const child = elem.children[i];
    if (child) stripForbiddenStyles(child, allowed, filterFunction);
  }

  return elem;
};

const getScrollParents = (
  node: HTMLElement,
  direction: undefined | "y" | "x",
  nodes?: HTMLElement[]
): HTMLElement[] => {
  const isInitialNode = !nodes;
  nodes = nodes || [];

  if (!node) {
    return nodes;
  }

  if (!isInitialNode) {
    if (
      ((direction === "y" || !direction) &&
        node.scrollHeight > node.clientHeight) ||
      ((direction === "x" || !direction) && node.scrollWidth > node.clientWidth)
    ) {
      const overflow = window
        .getComputedStyle(node)
        .getPropertyValue("overflow");

      if (overflow !== "hidden" && overflow !== "visible") nodes.push(node);
    }
  }

  if (node.parentElement)
    nodes.concat(getScrollParents(node.parentElement, direction, nodes));

  return nodes;
};

export const getScrollOffsetParents = (node: HTMLElement): CoordinateType => {
  const parents = getScrollParents(node, undefined);

  const offset = { y: window.scrollY, x: window.scrollX };
  const offsetWithParents = parents.reduce(
    (acc, current) => ({
      y: acc.y + current.scrollTop,
      x: acc.x + current.scrollLeft,
    }),
    offset
  );

  return offsetWithParents;
};

export const changeElementType = (node: HTMLElement, name: string) => {
  const renamed = document.createElement(name);

  for (const name of node.getAttributeNames()) {
    renamed.setAttribute(name, node.getAttribute(name) || "");
  }
  while (node.firstChild) {
    renamed.appendChild(node.firstChild);
  }
  if (node.parentNode) node.parentNode.replaceChild(renamed, node);
  return renamed;
};

export const scrollToCenter = (
  node: HTMLElement,
  behavior: "smooth" | undefined = undefined
) => {
  node.scrollIntoView({
    behavior: behavior,
    block: "center",
    inline: "center",
  });

  // const scrollParents = getScrollParents(node, undefined);
  // if (!scrollParents.length) return;

  // let previous = node;

  // const parent = scrollParents[0];
  // // scrollParents.forEach((parent) => {
  // const rect = previous.getBoundingClientRect();

  // // previous = parent;

  // if (behavior === "smooth") {
  //   parent.scrollBy({
  //     top:
  //       rect.top - parent.offsetTop + rect.height / 2 - parent.clientHeight / 2,
  //     left:
  //       rect.left - parent.offsetLeft + rect.width / 2 - parent.clientWidth / 2,
  //     behavior: behavior,
  //   });
  //   return;
  // }

  // parent.scrollTop =
  //   rect.top +
  //   parent.scrollTop -
  //   parent.offsetTop -
  //   parent.clientHeight / 2 +
  //   rect.height / 2;
  // // });

  // window.scrollTo(0, node.getBoundingClientRect().top);
};
