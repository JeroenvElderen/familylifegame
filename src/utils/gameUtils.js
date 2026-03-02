export const TICK_MS = 1000;
export const DAY_MS = 30000;
export const EVENT_MS = 30000;
export const LOVE_TICK_MS = 60000;
export const DAYS_PER_YEAR = 365;

const AVATARS = ['👩', '👨', '🧑‍🦱', '👩‍🦰', '👨‍🦳', '🧔', '👱‍♀️', '👱‍♂️', '🧑‍🦳', '👧', '👦'];

export function randomAvatar() {
  return AVATARS[Math.floor(Math.random() * AVATARS.length)];
}

export function pickRandomEvent(events, avoidId) {
  if (!events.length) return null;
  if (events.length === 1) return events[0];

  let ev = events[Math.floor(Math.random() * events.length)];
  if (avoidId && ev.id === avoidId) {
    ev = events[Math.floor(Math.random() * events.length)];
  }
  return ev;
}

export function formatMoney(value) {
  const n = Math.round(value);
  const sign = n < 0 ? '-' : '';
  return `${sign}€${Math.abs(n).toLocaleString()}`;
}

export function clampNumber(n) {
  return Number.isFinite(n) ? n : 0;
}