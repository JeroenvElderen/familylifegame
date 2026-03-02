export const BASE_EVENTS = [
  {
    id: 'ev_fee',
    title: 'Unexpected fee',
    description: 'A small admin fee hits your account.',
    options: [
      { text: 'Pay immediately', effects: { money: -20 } },
      { text: 'Dispute it (time cost)', effects: { money: -5 } },
      { text: 'Ignore it (it grows)', effects: { money: -40 } },
      { text: 'Ask for a waiver', effects: { money: -10 } },
    ],
  },
  {
    id: 'ev_side_gig',
    title: 'Side gig offer',
    description: "A short side gig appears. It's not glamorous, but it pays.",
    options: [
      { text: 'Take it', effects: { money: 50, incomePerSecond: 0.2, happiness: -1 } },
      { text: 'Decline', effects: { happiness: 1 } },
      { text: 'Negotiate higher pay', effects: { money: 70, incomePerSecond: -0.1 } },
      { text: 'Delay decision', effects: { money: -5 } },
    ],
  },
  {
    id: 'ev_subscription',
    title: 'Subscription creep',
    description: 'You notice recurring subscriptions you barely use.',
    options: [
      { text: 'Cancel a few', effects: { incomePerSecond: 0.15 } },
      { text: 'Keep them', effects: {} },
      { text: 'Downgrade to cheaper plans', effects: { incomePerSecond: 0.08 } },
      { text: 'Ignore it', effects: { incomePerSecond: -0.05 } },
    ],
  },
  {
    id: 'ev_impulse_buy',
    title: 'Impulse buy',
    description: 'Something tempting is on sale. You feel that pull.',
    options: [
      { text: 'Buy it', effects: { money: -60, happiness: 2 } },
      { text: 'Wait 24 hours', effects: { happiness: 1 } },
      { text: 'Buy second-hand instead', effects: { money: -25, happiness: 1 } },
      { text: "Sell something you don't use", effects: { money: 30 } },
    ],
  },
];

export const PREGNANCY_EVENT = {
  id: 'pregnancy_event',
  title: 'Pregnancy Decision',
  description: 'You have a chance to have a baby. Do you want to proceed?',
  options: [
    { text: 'Yes, have a baby now', effects: { action: 'haveBaby' } },
    { text: 'No, maybe later', effects: { happiness: -1 } },
  ],
};

export function createGirlfriendEvent() {
  return {
    id: 'girlfriend_event',
    title: 'Teen Relationship',
    description: 'Your teenager wants to start a relationship. What do you advise?',
    options: [
      { text: 'Support it with guidance', effects: { hasPartner: true, happiness: 5, love: 5 } },
      { text: 'Allow only with strict rules', effects: { hasPartner: true, happiness: 1, love: 2 } },
      { text: 'Focus on studies first', effects: { intelligence: 3, happiness: -2 } },
      { text: 'Say no for now', effects: { happiness: -4 } },
    ],
  };
}

export function createMarriageEvent() {
  return {
    id: 'marriage_event',
    title: 'Marriage Proposal Time',
    description: 'Now 18+, your child is thinking about marriage. What is the direction?',
    options: [
      { text: 'Get married now', effects: { married: true, happiness: 8, incomePerSecond: 0.3 } },
      { text: 'Wait and build stability', effects: { love: 3, intelligence: 2 } },
      { text: 'Focus on career first', effects: { incomePerSecond: 0.4, happiness: -1 } },
      { text: 'End the relationship', effects: { hasPartner: false, love: -8, happiness: -5 } },
    ],
  };
}

export function createSchoolEvent(type) {
  if (type === 'primary') {
    return {
      id: 'school_primary',
      title: 'Primary School Decision',
      description: 'Choose a school type for your child.',
      options: [
        { text: 'Public school', effects: { money: -100, childExpense: -0.1, intelligence: 3 } },
        { text: 'Private school', effects: { money: -400, childExpense: -0.3, intelligence: 6 } },
        { text: 'Elite school', effects: { money: -1000, childExpense: -0.6, intelligence: 10 } },
      ],
    };
  }

  if (type === 'middle') {
    return {
      id: 'school_middle',
      title: 'Middle School Decision',
      description: 'Time to choose middle school path.',
      options: [
        { text: 'Public middle school', effects: { money: -150, childExpense: -0.12, intelligence: 4 } },
        { text: 'Private middle school', effects: { money: -500, childExpense: -0.35, intelligence: 7 } },
        { text: 'Elite academy', effects: { money: -1400, childExpense: -0.65, intelligence: 12 } },
      ],
    };
  }

  return {
    id: 'post_middle_path',
    title: 'After Middle School Path',
    description: 'Choose the next step after middle school.',
    options: [
      { text: 'Start working', effects: { childIncome: 0.5, intelligence: 1, happiness: 1 } },
      { text: 'Community college', effects: { money: -600, childExpense: -0.2, intelligence: 8 } },
      { text: 'University', effects: { money: -1800, childExpense: -0.5, intelligence: 15 } },
      { text: 'Vocational program', effects: { money: -800, childExpense: -0.25, intelligence: 10, childIncome: 0.2 } },
    ],
  };
}