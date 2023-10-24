export const removeLink = (doc: Document) => {
  replaceElementWithContent(doc);
};

export const replaceElementWithContent = (doc: Document) => {
  const win = doc.defaultView;
  if (!win) return;

  const sel = win.getSelection();
  if (!sel || !sel.focusNode || !sel.focusNode.parentNode) return;

  const parent =
    sel.focusNode.nodeType !== Node.ELEMENT_NODE
      ? sel.focusNode.parentNode
      : sel.focusNode;
  const fragment = doc.createDocumentFragment();
  for (let i = 0; i < parent.childNodes.length; i++) {
    const child = parent.childNodes[i];
    if (child) fragment.appendChild(child);
  }

  parent.parentNode!.replaceChild(fragment, parent);
};

export const insertLink = (
  doc: Document,
  href: string,
  text?: string,
  target?: string,
  attributes?: object
) => {
  if (
    href.includes("@") &&
    !href.startsWith("mailto:") &&
    /(http|ftp|https):\/\//i.test(href) === false
  ) {
    href = "mailto:" + href;
  }
  insertElement(
    doc,
    "a",
    { ...(attributes || {}), href, target },
    text || href
  );
};

export const insertElement = (
  doc: Document,
  tagName: string,
  attributes?: object,
  text?: string
): HTMLElement | undefined => {
  const endsWithSpace = !!text && text.endsWith(" ");

  const elem = doc.createElement(tagName) as HTMLElement;
  if (attributes) {
    Object.entries(attributes).forEach(([key, value]) => {
      if (value !== undefined) elem.setAttribute(key, value);
      else elem.removeAttribute(key);
    });
  }

  const win = doc.defaultView;
  if (!win) return undefined;

  const sel = win.getSelection();
  if (!!sel && sel.rangeCount > 0) {
    elem.innerHTML = getSelectionHtml(doc).trim();
    const range = sel.getRangeAt(0);
    range.deleteContents();
  }
  if (text) elem.innerText = text.trim();

  insertNodeAtCaret(doc, elem);
  setCaretAfterNode(doc, elem);

  if (endsWithSpace) insertSpace(doc);

  return elem;
};

export const insertSpace = (doc: Document) => {
  const node = insertNodeAtCaret(doc, "\u00a0");
  setCaretAfterNode(doc, node);
};

export const setCaretAfterNode = (doc: Document, node: ChildNode) => {
  const win = doc.defaultView;
  if (!win) return;
  const sel = win.getSelection();
  if (!sel) return;

  const range = document.createRange();
  range.setStartAfter(node);
  range.collapse(true);

  sel.removeAllRanges();
  sel.addRange(range);
};

export const insertNodeAtCaret = (doc: Document, node: any) => {
  const win = doc.defaultView;
  if (!win) return;
  const sel = win.getSelection();
  if (!sel) return;

  if (sel.rangeCount) {
    let range = sel.getRangeAt(0);
    range.collapse(false);

    if (typeof node == "string") {
      node = doc.createTextNode(node);
    }

    range.insertNode(node);
    range.setStartAfter(node);
    range.collapse(true);

    range = range.cloneRange();
    range.selectNodeContents(node);
    range.collapse(false);
    sel.removeAllRanges();
    sel.addRange(range);

    return node;
  }
};

export const getSelectionParents = (doc: Document) => {
  const win = doc.defaultView;
  if (!win) return [];
  const sel = win.getSelection();
  if (!sel) return [];

  let elements: HTMLElement[] = [];

  if (!sel.isCollapsed) {
    //Get all children
    for (let i = 0; i < sel.rangeCount; i++) {
      const range = sel.getRangeAt(i);

      elements = elements.concat(
        Array.from(range.cloneContents().querySelectorAll("*")) as HTMLElement[]
      );
    }
  }

  try {
    let targetElem = sel.anchorNode;
    while (!!targetElem && !!targetElem.parentElement) {
      if (
        !!(targetElem as any).hasAttribute &&
        (targetElem as any).hasAttribute("contenteditable")
      ) {
        break;
      }
      elements.push(targetElem.parentElement);
      targetElem = targetElem.parentElement;
    }
  } catch (e) {
    //Permission denied to access property "parentElement"
  }

  if (
    !!sel.anchorNode &&
    sel.anchorNode.nodeType === Node.ELEMENT_NODE &&
    !elements.includes(sel.anchorNode as HTMLElement)
  )
    elements.push(sel.anchorNode as HTMLElement);

  return elements;
};

export const getSelectionCoords = (doc: Document) => {
  let x = 0,
    y = 0;

  const win = doc.defaultView;
  if (!win) return { x: x, y: y };
  const sel = win.getSelection();
  if (!sel) return { x: x, y: y };

  if (sel.rangeCount) {
    const range = sel.getRangeAt(0).cloneRange();
    if (range.getClientRects) {
      range.collapse(true);
      const rects = range.getClientRects();
      if (rects.length > 0) {
        const rect = rects[0];
        if (rect) {
          x = rect.left;
          y = rect.top;
        }
      }
    }

    // Fall back to inserting a temporary element
    if (x === 0 && y === 0) {
      const span = doc.createElement("span");
      if (span.getClientRects) {
        // Ensure span has dimensions and position by
        // adding a zero-width space character
        span.appendChild(doc.createTextNode("\u200b"));
        range.insertNode(span);
        const rect = span.getClientRects()[0];
        if (rect) {
          x = rect.left;
          y = rect.top;
        }
        const spanParent = span.parentNode;
        if (spanParent) {
          spanParent.removeChild(span);

          // Glue any broken text nodes back together
          spanParent.normalize();
        }
      }
    }
  }
  return { x: x, y: y };
};

export const selectElemContents = (el: HTMLElement) => {
  const doc = el.ownerDocument,
    win = doc.defaultView;
  if (!win) return;
  const sel = win.getSelection();
  if (!sel) return;

  const range = document.createRange();
  range.selectNodeContents(el);
  sel.removeAllRanges();
  sel.addRange(range);
};

export const selectRangeAtCaret = (
  doc: Document,
  start: number,
  end: number
) => {
  const win = doc.defaultView;
  if (!win) return;
  const sel = win.getSelection();
  if (!sel) return;

  const range = sel.getRangeAt(0);

  const endOffset = range.endOffset + end;
  const startOffset = endOffset + start;

  range.setStart(range.endContainer, startOffset);
  range.setEnd(range.endContainer, endOffset);

  sel.removeAllRanges();
  sel.addRange(range);
};

export type SelectionType = {
  start: number;
  end: number;
};

export const saveSelection = (containerEl: HTMLElement): SelectionType => {
  const doc = containerEl.ownerDocument,
    win = doc.defaultView;
  if (!win) return { start: 0, end: 0 };

  const sel = win.getSelection();
  if (!sel || sel.rangeCount === 0) return { start: 0, end: 0 };
  const range = sel.getRangeAt(0);
  const preSelectionRange = range.cloneRange();
  preSelectionRange.selectNodeContents(containerEl);
  preSelectionRange.setEnd(range.startContainer, range.startOffset);
  const start = preSelectionRange.toString().length;

  return {
    start: start,
    end: start + range.toString().length,
  };
};

export const restoreSelection = (
  containerEl: HTMLElement | Text,
  savedSel: SelectionType
) => {
  const doc = containerEl.ownerDocument,
    win = doc.defaultView;
  if (!win) return;

  let charIndex = 0;
  const range = doc.createRange();

  range.setStart(containerEl, 0);
  range.collapse(true);
  const nodeStack: (HTMLElement | Text | ChildNode)[] = [containerEl];
  let node,
    foundStart = false,
    stop = false;

  while (!stop && (node = nodeStack.pop())) {
    if (node.nodeType === Node.TEXT_NODE) {
      const nextCharIndex = charIndex + (node as Text).length;
      if (
        !foundStart &&
        savedSel.start >= charIndex &&
        savedSel.start <= nextCharIndex
      ) {
        range.setStart(node, savedSel.start - charIndex);
        foundStart = true;
      }
      if (
        foundStart &&
        savedSel.end >= charIndex &&
        savedSel.end <= nextCharIndex
      ) {
        range.setEnd(node, savedSel.end - charIndex);
        stop = true;
      }
      charIndex = nextCharIndex;
    } else {
      let i = node.childNodes.length;
      while (i--) {
        const child = node.childNodes[i];
        if (child) nodeStack.push(child);
      }
    }
  }

  const sel = win.getSelection();
  if (!sel) return;

  sel.removeAllRanges();
  sel.addRange(range);
};

// export const surroundSelection = (el: HTMLElement) => {
//   const doc = el.ownerDocument,
//     win = doc.defaultView;
//   const sel = win.getSelection();
//   if (!sel) return;

//   if (sel.rangeCount) {
//     var range = sel.getRangeAt(0).cloneRange();
//     range.surroundContents(el);
//     sel.removeAllRanges();
//     sel.addRange(range);
//   }
// };

export const getSelectionHtml = (doc: Document) => {
  const win = doc.defaultView;
  if (!win) return "";
  const sel = win.getSelection();

  let html = "";
  if (!sel) return html;

  // if (typeof window.getSelection != "undefined") {
  if (sel.rangeCount) {
    const container = document.createElement("div");
    for (let i = 0, len = sel.rangeCount; i < len; ++i) {
      container.appendChild(sel.getRangeAt(i).cloneContents());
    }
    html = container.innerHTML;
  }
  // }
  // else if (typeof document.selection != "undefined") {
  //     if (document.selection.type == "Text") {
  //         html = document.selection.createRange().htmlText;
  //     }
  // }
  return html;
};
