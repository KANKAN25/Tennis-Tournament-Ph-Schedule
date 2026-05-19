export function getElementById(id) {
  return document.getElementById(id);
}

export function createElement(tagName, className, textContent = '') {
  const $element = document.createElement(tagName);
  $element.className = className;
  $element.textContent = textContent;

  return $element;
}

export function appendChildren($parent, children) {
  children.filter(Boolean).forEach(($child) => $parent.append($child));
}

export function setElementText($element, textContent) {
  $element.textContent = textContent;
}

export function toggleClass($element, className, shouldApply) {
  $element.classList.toggle(className, shouldApply);
}
