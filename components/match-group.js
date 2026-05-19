import { appendChildren, createElement } from '../utils/dom-utils.js';
import { MatchCard } from './match-card.js';

export class MatchGroup {
  constructor(group, startIndex) {
    this.group = group;
    this.startIndex = startIndex;
  }

  render() {
    return this.createElement();
  }

  createElement() {
    const $group = createElement('section', 'match-group');
    appendChildren($group, [this.createHeader(), ...this.createCards()]);
    return $group;
  }

  createHeader() {
    const $header = createElement('header', 'match-group__header');
    appendChildren($header, [
      createElement('h2', 'match-group__name', this.group.tournament),
      createElement('p', 'match-group__category', this.group.category),
    ]);
    return $header;
  }

  createCards() {
    return this.group.matches.map((match, index) => {
      return new MatchCard(match, this.startIndex + index).render();
    });
  }
}
