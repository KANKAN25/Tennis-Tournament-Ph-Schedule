import { MATCH_API_URL } from '../utils/app-constants.js';

export class MatchService {
  static async fetchMatches(forceRefresh = false) {
    const requestUrl = forceRefresh ? `${MATCH_API_URL}?refresh=1` : MATCH_API_URL;
    const response = await fetch(requestUrl);

    if (!response.ok) {
      throw new Error(`Server error ${response.status}`);
    }

    return response.json();
  }
}
