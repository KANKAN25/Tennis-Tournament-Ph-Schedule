import { appendChildren, createElement } from '../utils/dom-utils.js';
import { createPhilippineDate, formatMatchDate, formatMatchTime } from '../utils/date-utils.js';

export class MatchCard {
  constructor(match, animationIndex) {
    this.match = match;
    this.animationIndex = animationIndex;
  }

  render() {
    return this.createElement();
  }

  createElement() {
    const $card = createElement('article', this.getCardClassName());
    appendChildren($card, this.createCardChildren());
    return $card;
  }

  createCardChildren() {
    return [
      this.createPlayer(this.match.p1, this.match.p1c, false),
      this.createCenterBlock(),
      this.createPlayer(this.match.p2, this.match.p2c, true),
      this.createTimeBlock(),
    ];
  }

  createPlayer(name, country, isRightAligned) {
    const className = isRightAligned ? 'match-card__player match-card__player--right' : 'match-card__player';
    const $player = createElement('div', className);

    appendChildren($player, [
      createElement('p', 'match-card__player-name', name || ''),
      createElement('p', 'match-card__player-country', country || ''),
    ]);

    return $player;
  }

  createCenterBlock() {
    const $center = createElement('div', 'match-card__center');
    appendChildren($center, [this.createScoreBlock(), this.createRound()]);
    return $center;
  }

  createScoreBlock() {
    if (this.match.sets?.trim()) return this.createSetScoreBlock();
    if (this.match.homeScore || this.match.awayScore) return this.createTotalScore();
    return createElement('p', 'match-card__versus', 'VS');
  }

  createSetScoreBlock() {
    const $score = createElement('div', 'match-card__score');
    const $sets = createElement('div', 'match-card__sets');
    this.match.sets.trim().split(/\s+/).forEach((set) => {
      $sets.append(createElement('span', 'match-card__set-score', set));
    });
    appendChildren($score, [$sets, this.createTotalScore()]);
    return $score;
  }

  createTotalScore() {
    const homeScore = this.match.homeScore || '0';
    const awayScore = this.match.awayScore || '0';
    return createElement('p', 'match-card__total-score', `${homeScore}-${awayScore}`);
  }

  createRound() {
    return this.match.round ? createElement('p', 'match-card__round', this.match.round) : null;
  }

  createTimeBlock() {
    const date = createPhilippineDate(this.match.startUtime);
    const $time = createElement('div', 'match-card__time');
    appendChildren($time, this.createTimeChildren(date));
    return $time;
  }

  createTimeChildren(date) {
    return [
      createElement('p', 'match-card__start-time', formatMatchTime(date)),
      createElement('p', 'match-card__time-label', 'PH Time'),
      createElement('p', 'match-card__start-date', formatMatchDate(date)),
      this.createBadge(),
    ];
  }

  createBadge() {
    if (this.match.isLive) return this.createLiveBadge();
    if (this.match.isDone) return createElement('p', 'match-card__done-badge', 'FINISHED');
    return null;
  }

  createLiveBadge() {
    const $badge = createElement('p', 'match-card__live-badge', 'LIVE');
    $badge.prepend(createElement('span', 'match-card__live-dot'));
    return $badge;
  }

  getCardClassName() {
    if (this.match.isLive) return 'match-card match-card--live';
    if (this.match.isDone) return 'match-card match-card--done';
    return 'match-card';
  }

  toJSON() {
    return { animationIndex: this.animationIndex, match: this.match };
  }

  static fromJSON(data) {
    return new MatchCard(data.match, data.animationIndex);
  }
}
