export const dragAndDrop = () =>
  'draggable' in window.document.createElement('span') &&
  !/(iPad|iPhone|iPod|Android)/g.test(navigator.userAgent);
