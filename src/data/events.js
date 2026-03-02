import { generatePersonName } from '../utils/gameUtils';

export const BASE_EVENTS = [
  {
    id: 'ev_fee',
    title: 'Unexpected fee',
    description: 'A small admin fee hits your account.',
    options: [
      { text: 'Pay immediately', effects: { money: -20, happiness: -1, charm: -1 } },
      { text: 'Dispute it (time cost)', effects: { money: -5, iq: 1, happiness: -1 } },
      { text: 'Ignore it (it grows)', effects: { money: -40, happiness: -2, love: -1 } },
      { text: 'Ask for a waiver', effects: { money: -10, charm: 2, happiness: 1 } },
    ],
  },
  {
    id: 'ev_side_gig',
    title: 'Side gig offer',
    description: "A short side gig appears. It's not glamorous, but it pays.",
    options: [
      { text: 'Take it', effects: { money: 50, happiness: -1, iq: 1 } },
      { text: 'Decline', effects: { happiness: 2, love: 1 } },
      { text: 'Negotiate higher pay', effects: { money: 80, charm: 2, happiness: -1 } },
      { text: 'Delay decision', effects: { money: -5, happiness: -1 } },
    ],
  },
  {
    id: 'ev_health',
    title: 'Health check reminder',
    description: 'You have enough time to prioritize your health this week.',
    options: [
      { text: 'Book a checkup', effects: { money: -35, happiness: 2, iq: 1 } },
      { text: 'Go for daily walks', effects: { happiness: 3, charm: 1 } },
      { text: 'Skip this month', effects: { money: 15, happiness: -2 } },
      { text: 'Join a sports club', effects: { money: -80, happiness: 4, charm: 2 } },
    ],
  },
];

export function createMarriageEvent(person) {
  return {
    id: 'marriage_event',
    title: 'A serious relationship starts',
    description: `${person.name} met someone special. What should happen next?`,
    options: [
      { text: 'Get married soon', effects: { married: true, happiness: 8, love: 8, charm: 2 } },
      { text: 'Date for a while first', effects: { love: 4, happiness: 4 } },
      { text: 'Stay focused on work', effects: { iq: 1, happiness: -2, love: -2 } },
      { text: 'Not interested right now', effects: { happiness: -1, love: -3 } },
    ],
  };
}

export function createPromotionEvent(currentLevel) {
  return {
    id: 'promotion_event',
    title: 'Career growth opportunity',
    description: 'Your manager is considering you for a promotion.',
    options: [
      { text: 'Push for promotion', effects: { promote: true, happiness: 4, iq: 2 } },
      { text: 'Ask for training first', effects: { iq: 3, charm: 1, happiness: 2 } },
      { text: 'Decline for now', effects: { happiness: 1, love: 1 } },
      {
        text: currentLevel > 2 ? 'Switch teams' : 'Take on extra projects',
        effects: { promote: true, happiness: -1, charm: 2 },
      },
    ],
  };
}

export function createApplyJobEvent() {
  const jobs = [
    'Retail Associate',
    'Office Assistant',
    'Warehouse Operator',
    'Support Agent',
    'Junior Designer',
    'Barista',
  ]
    .sort(() => Math.random() - 0.5)
    .slice(0, 4);

  return {
    id: 'job_apply_event',
    title: 'Job applications',
    description: 'You are unemployed. Pick one job offer or refresh.',
    options: [
      ...jobs.map((job) => ({
        text: `Apply: ${job}`,
        effects: {
          jobTitle: job,
          salaryPerSecond: 120 + Math.floor(Math.random() * 96),
          happiness: 2,
          love: 1,
        },
      })),
      { text: 'Refresh offers', effects: { action: 'refreshJobs', iq: 1 } },
    ],
  };
}

export function createBabyNamingEvent() {
  const options = Array.from({ length: 4 }).map(() => generatePersonName());

  return {
    id: 'baby_name_event',
    title: 'Name your newborn',
    description: 'Your child is born! Choose a name.',
    options: options.map((name) => ({
      text: name,
      effects: { action: 'nameBaby', babyName: name, happiness: 6, love: 6, money: -250 },
    })),
  };
}