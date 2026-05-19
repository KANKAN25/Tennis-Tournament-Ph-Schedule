import { MANILA_TIME_ZONE } from './app-constants.js';

const DATE_FORMAT_OPTIONS = {
  day: 'numeric',
  month: 'long',
  weekday: 'long',
  year: 'numeric',
};

const MATCH_DATE_OPTIONS = {
  day: 'numeric',
  month: 'short',
  timeZone: 'UTC',
  weekday: 'short',
};

export function createManilaDate() {
  const localDate = new Date().toLocaleString('en-US', { timeZone: MANILA_TIME_ZONE });
  return new Date(localDate);
}

export function formatClockTime(date) {
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  const period = date.getHours() >= 12 ? 'PM' : 'AM';
  const hours = date.getHours() % 12 || 12;

  return `${hours}:${minutes}:${seconds} ${period}`;
}

export function formatClockDate(date) {
  return date.toLocaleDateString('en-PH', DATE_FORMAT_OPTIONS);
}

export function createPhilippineDate(unixTime) {
  return unixTime ? new Date(unixTime * 1000 + 8 * 3600000) : null;
}

export function formatMatchTime(date) {
  if (!date) return 'TBD';

  const minutes = String(date.getUTCMinutes()).padStart(2, '0');
  const period = date.getUTCHours() >= 12 ? 'PM' : 'AM';
  const hours = date.getUTCHours() % 12 || 12;

  return `${hours}:${minutes} ${period}`;
}

export function formatMatchDate(date) {
  return date ? date.toLocaleDateString('en-PH', MATCH_DATE_OPTIONS) : '';
}
