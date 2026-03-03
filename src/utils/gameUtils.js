export const TICK_MS = 1000;
export const DAY_MS = 60;
export const EVENT_MS = 22000;
export const DAYS_PER_YEAR = 365;
export const SCHOOL_STAGE_YEARS = 2;
export const SCHOOL_STAGES = ['Primary School', 'Middle School', 'High School'];

const AVATARS = ['👩', '👨', '🧑‍🦱', '👩‍🦰', '👨‍🦳', '🧔', '👱‍♀️', '👱‍♂️', '🧑‍🦳', '👧', '👦'];
export const BOY_NAMES = [
  'Liam',
  'Noah',
  'Mason',
  'Ethan',
  'Lucas',
  'Leo',
  'Ezra',
  'Aiden',
  'Logan',
  'James',
  'Benjamin',
];

export const GIRL_NAMES = [
  'Emma',
  'Olivia',
  'Ava',
  'Sophia',
  'Mila',
  'Ella',
  'Aria',
  'Nora',
  'Ivy',
  'Amelia',
  'Luna',
  'Chloe',
];

const FIRST_NAMES = [...BOY_NAMES, ...GIRL_NAMES];

export function generatePersonName() {
  return FIRST_NAMES[Math.floor(Math.random() * FIRST_NAMES.length)];
}
export function randomAvatar() {
  return AVATARS[Math.floor(Math.random() * AVATARS.length)];
}

export function pickRandomEvent(events, avoidId) {
  if (!events.length) return null;
  if (events.length === 1) return events[0];

  let ev = events[Math.floor(Math.random() * events.length)];
  if (avoidId && ev.id === avoidId) ev = events[Math.floor(Math.random() * events.length)];
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

export function formatDate(date) {
  const dd = String(date.getDate()).padStart(2, '0');
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const yyyy = date.getFullYear();
  return `${dd}-${mm}-${yyyy}`;
}