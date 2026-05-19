import { createManilaDate, formatClockDate, formatClockTime } from '../utils/date-utils.js';
import { setElementText } from '../utils/dom-utils.js';

export class Clock {
  constructor($time, $date) {
    this.$time = $time;
    this.$date = $date;
    this.intervalId = null;
  }

  render() {
    this.update();
    this.attachEventListeners();
  }

  update() {
    const currentDate = createManilaDate();

    setElementText(this.$time, formatClockTime(currentDate));
    setElementText(this.$date, formatClockDate(currentDate));
  }

  attachEventListeners() {
    this.intervalId = window.setInterval(() => this.update(), 1000);
  }

  toJSON() {
    return { intervalId: this.intervalId };
  }

  static fromJSON(data, $time, $date) {
    const clock = new Clock($time, $date);
    clock.intervalId = data.intervalId;
    return clock;
  }
}
