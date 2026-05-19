import { createElement, toggleClass } from '../utils/dom-utils.js';

export class FilterBar {
  constructor($element, filters, activeFilterId, onFilterChange) {
    this.$element = $element;
    this.filters = filters;
    this.activeFilterId = activeFilterId;
    this.onFilterChange = onFilterChange;
    this.$count = null;
  }

  render() {
    this.$element.replaceChildren();
    this.filters.forEach((filter) => this.$element.append(this.createButton(filter)));
    this.$count = createElement('span', 'filter-bar__count');
    this.$element.append(this.$count);
  }

  createButton(filter) {
    const $button = createElement('button', 'filter-bar__button', filter.label);
    $button.type = 'button';
    $button.dataset.filterId = filter.id;
    this.attachButtonEventListeners($button);
    toggleClass($button, 'filter-bar__button--active', filter.id === this.activeFilterId);
    return $button;
  }

  attachButtonEventListeners($button) {
    $button.addEventListener('click', (event) => this.handleFilterClick(event));
  }

  handleFilterClick(event) {
    const filterId = event.currentTarget.dataset.filterId;
    this.activeFilterId = filterId;
    this.updateActiveButton();
    this.onFilterChange(filterId);
  }

  updateActiveButton() {
    this.$element.querySelectorAll('.filter-bar__button').forEach(($button) => {
      toggleClass($button, 'filter-bar__button--active', $button.dataset.filterId === this.activeFilterId);
    });
  }

  updateCount(count) {
    this.$count.textContent = `${count} match${count === 1 ? '' : 'es'}`;
  }
}
