import { Clock } from '../components/clock.js';
import { FilterBar } from '../components/filter-bar.js';
import { MatchGroup } from '../components/match-group.js';
import { MatchService } from '../services/match-service.js';
import { DEFAULT_FILTER_ID, FILTERS, REFRESH_INTERVAL_MS } from '../utils/app-constants.js';
import { appendChildren, createElement, getElementById, toggleClass } from '../utils/dom-utils.js';

export class TennisCalendarPage {
  constructor(domIds) {
    this.domIds = domIds;
    this.matches = [];
    this.activeFilterId = DEFAULT_FILTER_ID;
    this.$matchList = getElementById(domIds.MATCH_LIST);
    this.$refreshButton = getElementById(domIds.REFRESH_BUTTON);
    this.$refreshIcon = getElementById(domIds.REFRESH_ICON);
    this.clock = this.createClock();
    this.filterBar = this.createFilterBar();
  }

  render() {
    this.clock.render();
    this.filterBar.render();
    this.attachEventListeners();
    this.loadMatches(false);
  }

  createClock() {
    return new Clock(getElementById(this.domIds.CLOCK_TIME), getElementById(this.domIds.CLOCK_DATE));
  }

  createFilterBar() {
    const $filterBar = getElementById(this.domIds.FILTER_BAR);
    return new FilterBar($filterBar, FILTERS, this.activeFilterId, (id) => this.handleFilterChange(id));
  }

  attachEventListeners() {
    this.$refreshButton.addEventListener('click', () => this.handleRefreshClick());
    window.setInterval(() => this.loadMatches(false), REFRESH_INTERVAL_MS);
  }

  handleRefreshClick() {
    this.loadMatches(true);
  }

  handleFilterChange(filterId) {
    this.activeFilterId = filterId;
    this.renderMatches();
  }

  loadMatches(forceRefresh) {
    this.setLoadingState(true);
    MatchService.fetchMatches(forceRefresh)
      .then((data) => this.handleMatchesLoaded(data))
      .catch((error) => this.renderError(error))
      .finally(() => this.setLoadingState(false));
  }

  handleMatchesLoaded(data) {
    this.matches = data.matches || [];
    this.matches.length ? this.renderMatches() : this.renderNoMatches();
  }

  renderMatches() {
    const matches = this.getFilteredMatches();
    this.filterBar.updateCount(matches.length);
    matches.length ? this.renderGroups(matches) : this.renderEmptyFilter();
  }

  renderGroups(matches) {
    const groups = this.createGroups(matches);
    let startIndex = 0;
    this.$matchList.replaceChildren();
    groups.forEach((group) => {
      this.$matchList.append(new MatchGroup(group, startIndex).render());
      startIndex += group.matches.length;
    });
  }

  createGroups(matches) {
    const groups = new Map();
    matches.forEach((match) => this.addMatchToGroup(groups, match));
    return [...groups.values()];
  }

  addMatchToGroup(groups, match) {
    const key = `${match.cat}__${match.tournament}`;
    if (!groups.has(key)) groups.set(key, this.createGroup(match));
    groups.get(key).matches.push(match);
  }

  createGroup(match) {
    return { category: match.cat, matches: [], tournament: match.tournament };
  }

  getFilteredMatches() {
    if (this.activeFilterId === 'live') return this.matches.filter((match) => match.isLive);
    if (this.activeFilterId === 'upcoming') return this.matches.filter((match) => !match.isLive && !match.isDone);
    if (this.activeFilterId === 'finished') return this.matches.filter((match) => match.isDone);
    return this.matches;
  }

  renderNoMatches() {
    this.filterBar.updateCount(0);
    this.$matchList.replaceChildren(this.createMessage('No matches found right now.', 'Try refreshing or check back later.'));
  }

  renderEmptyFilter() {
    this.$matchList.replaceChildren(this.createMessage('No matches for this filter.'));
  }

  renderError(error) {
    this.filterBar.updateCount(0);
    const $error = createElement('div', 'calendar-message calendar-message--error');
    appendChildren($error, [createElement('strong', 'calendar-message__title', error.message)]);
    $error.append(this.createMessageLine('Make sure the server is running: node server.js'));
    this.$matchList.replaceChildren($error);
  }

  createMessage(title, detail = '') {
    const $message = createElement('div', 'calendar-message');
    appendChildren($message, [
      createElement('p', 'calendar-message__title', title),
      detail ? createElement('p', 'calendar-message__detail', detail) : null,
    ]);
    return $message;
  }

  createMessageLine(text) {
    return createElement('p', 'calendar-message__detail', text);
  }

  setLoadingState(isLoading) {
    this.$refreshButton.disabled = isLoading;
    toggleClass(this.$refreshIcon, 'refresh-button__icon--spinning', isLoading);
    if (isLoading) this.$matchList.replaceChildren(this.createLoading());
  }

  createLoading() {
    const $loading = createElement('div', 'calendar-loading');
    appendChildren($loading, [
      createElement('div', 'calendar-loading__spinner'),
      createElement('p', 'calendar-loading__label', 'Loading matches...'),
    ]);
    return $loading;
  }

  toJSON() {
    return { activeFilterId: this.activeFilterId, matches: this.matches };
  }

  static fromJSON(data, domIds) {
    const page = new TennisCalendarPage(domIds);
    page.activeFilterId = data.activeFilterId;
    page.matches = data.matches;
    return page;
  }
}
