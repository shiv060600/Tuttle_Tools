/**
 * Utility functions for managing daily report timing
 * Reports refresh daily at 7:50 AM EST
 */

const REPORT_REFRESH_HOUR = 7;
const REPORT_REFRESH_MINUTE = 50;

/**
 * Get the next 7:50 AM EST time
 * If current time is before 7:50 AM EST today, returns today at 7:50 AM EST
 * Otherwise returns tomorrow at 7:50 AM EST
 */
export function getNextReportRefreshTime(): Date {
  const now = new Date();
  
  // Convert current time to EST
  const estNow = new Date(now.toLocaleString('en-US', { timeZone: 'America/New_York' }));
  
  // Create today's 7:50 AM EST
  const todayRefresh = new Date(estNow);
  todayRefresh.setHours(REPORT_REFRESH_HOUR, REPORT_REFRESH_MINUTE, 0, 0);
  
  // If we're past 7:50 AM EST today, move to tomorrow
  if (estNow >= todayRefresh) {
    todayRefresh.setDate(todayRefresh.getDate() + 1);
  }
  
  return todayRefresh;
}

/**
 * Calculate milliseconds until the next 7:50 AM EST
 * This is used for React Query's staleTime
 */
export function getMillisecondsUntilNextRefresh(): number {
  const now = new Date();
  const nextRefresh = getNextReportRefreshTime();
  return nextRefresh.getTime() - now.getTime();
}

/**
 * Check if we've passed 7:50 AM EST today
 * Useful for determining if data should be considered stale
 */
export function hasPassedTodaysRefresh(): boolean {
  const now = new Date();
  const estNow = new Date(now.toLocaleString('en-US', { timeZone: 'America/New_York' }));
  
  const todayRefresh = new Date(estNow);
  todayRefresh.setHours(REPORT_REFRESH_HOUR, REPORT_REFRESH_MINUTE, 0, 0);
  
  return estNow >= todayRefresh;
}

/**
 * Get a cache key that changes daily at 7:50 AM EST
 * This ensures cached data is invalidated after the daily refresh
 */
export function getDailyCacheKey(): string {
  const now = new Date();
  const estNow = new Date(now.toLocaleString('en-US', { timeZone: 'America/New_York' }));
  
  const todayRefresh = new Date(estNow);
  todayRefresh.setHours(REPORT_REFRESH_HOUR, REPORT_REFRESH_MINUTE, 0, 0);
  
  // If before 7:50 AM, use yesterday's date
  // If after 7:50 AM, use today's date
  if (estNow < todayRefresh) {
    todayRefresh.setDate(todayRefresh.getDate() - 1);
  }
  
  return todayRefresh.toISOString().split('T')[0];
}
