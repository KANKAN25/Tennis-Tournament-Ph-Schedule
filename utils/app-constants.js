export const DOM_IDS = {
  CLOCK_DATE: 'CLOCK_DATE',
  CLOCK_TIME: 'CLOCK_TIME',
  FILTER_BAR: 'FILTER_BAR',
  MATCH_LIST: 'MATCH_LIST',
  REFRESH_BUTTON: 'REFRESH_BUTTON',
  REFRESH_ICON: 'REFRESH_ICON',
};

export const FILTERS = [
  { id: 'all', label: 'All' },
  { id: 'live', label: 'Live' },
  { id: 'upcoming', label: 'Upcoming' },
  { id: 'finished', label: 'Finished' },
];

export const DEFAULT_FILTER_ID = 'all';
export const MATCH_API_URL = 'http://localhost:3456/matches';
export const MANILA_TIME_ZONE = 'Asia/Manila';
export const REFRESH_INTERVAL_MS = 3 * 60 * 1000;
