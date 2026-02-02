/**
 * Application-wide constants
 * 
 * This module contains all magic numbers and configuration values
 * used throughout the application for better maintainability.
 */

// Time conversion constants
export const MILLISECONDS_PER_SECOND = 1000;
export const SECONDS_PER_MINUTE = 60;
export const MINUTES_PER_HOUR = 60;
export const HOURS_PER_DAY = 24;

// Derived time constants
export const MILLISECONDS_PER_MINUTE = MILLISECONDS_PER_SECOND * SECONDS_PER_MINUTE;

// Auto-backup configuration
export const AUTO_BACKUP_DELAY_MS = 5000; // 5 seconds delay before auto-backup

// Default values
export const DEFAULT_START_MONTH = '2020-01';
export const DEFAULT_FTE = 1.0;
export const DEFAULT_ALLOCATION_PCT = 100;

// Validation constants
export const MIN_FTE = 0.0;
export const MAX_FTE = 1.0;
export const MIN_ALLOCATION_PCT = 0;
export const MAX_ALLOCATION_PCT = 100;
export const MIN_PM = 0;

// UI constants
export const PM_STEP = 0.01;
export const FTE_STEP = 0.01;
export const PCT_STEP = 1;

// Date/Time display
export const MONTHS_PER_YEAR = 12;
