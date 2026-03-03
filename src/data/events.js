import { BOY_NAMES, GIRL_NAMES } from '../utils/gameUtils';

const OPTION_INTENTS = {
  positive: [
    'Support enthusiastically',
    'Encourage this idea',
    'Go all-in together',
    'Back the plan with confidence',
  ],
  balanced: [
    'Take a careful middle path',
    'Try a smaller first step',
    'Plan before committing',
    'Test it and review later',
  ],
  cautious: ['Delay the decision', 'Focus on stability first', 'Wait for a better moment', 'Keep things unchanged'],
};

function buildDynamicOptions(effectProfiles) {
  const tones = ['positive', 'balanced', 'cautious'];
  return effectProfiles.map((effects, idx) => {
    const tone = tones[idx % tones.length];
    const pool = OPTION_INTENTS[tone];
    return {
      text: pool[Math.floor(Math.random() * pool.length)],
      effects,
    };
  });
}

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
  {
    id: 'ev_weekend_trip',
    title: 'Weekend plan',
    description: 'The weekend is free. How do you want to spend it?',
    options: [
      { text: 'Go on a mini trip', effects: { money: -140, happiness: 7, love: 2 } },
      { text: 'Stay home and recharge', effects: { happiness: 3, iq: 1 } },
      { text: 'Work overtime', effects: { money: 90, happiness: -2 } },
      { text: 'Host friends for dinner', effects: { money: -60, happiness: 4, charm: 2 } },
    ],
  },
  {
    id: 'ev_family_visit',
    title: 'Family visit call',
    description: 'A relative asks if you can visit this week.',
    options: [
      { text: 'Visit this weekend', effects: { money: -30, happiness: 4, love: 4 } },
      { text: 'Send gifts instead', effects: { money: -50, love: 3 } },
      { text: 'Postpone politely', effects: { iq: 1, love: -1 } },
      { text: 'Skip this time', effects: { happiness: -1, love: -3 } },
    ],
  },
  {
    id: 'ev_skill_course',
    title: 'Skill course discount',
    description: 'A limited-time online course could boost your future opportunities.',
    options: [
      { text: 'Enroll now', effects: { money: -110, iq: 5, happiness: 2 } },
      { text: 'Take the short version', effects: { money: -60, iq: 3 } },
      { text: 'Learn from free resources', effects: { iq: 2, happiness: 1 } },
      { text: 'Skip and focus on routine', effects: { money: 20, iq: -1 } },
    ],
  },
  {
    id: 'ev_neighbor_help',
    title: 'Neighbor asks for help',
    description: 'A neighbor needs help moving furniture this evening.',
    options: [
      { text: 'Help out', effects: { happiness: 3, charm: 3, money: 15 } },
      { text: 'Offer a small tip instead', effects: { money: -20, love: 1 } },
      { text: 'Decline politely', effects: { happiness: -1, charm: -1, iq: 1 } },
    ],
  },
  {
    id: 'ev_lottery',
    title: 'Local raffle',
    description: 'A cheap raffle ticket might pay off.',
    options: [
      { text: 'Buy one ticket', effects: { money: 30, happiness: 2 } },
      { text: 'Buy five tickets', effects: { money: -35, happiness: 1 } },
      { text: 'Skip it', effects: { iq: 1 } },
    ],
  },
  {
    id: 'ev_hobby',
    title: 'New hobby trend',
    description: 'Friends invite you to try a creative hobby club.',
    options: [
      { text: 'Join and commit', effects: { money: -45, happiness: 4, charm: 2 } },
      { text: 'Try a trial session', effects: { money: -15, happiness: 2 } },
      { text: 'No time right now', effects: { happiness: -1, iq: 1 } },
    ],
  },
];

const JOB_ROLES = [
  'General Practitioner',
  'Mental Health Counselor',
  'Nurse',
  'Pharmacist Assistant',
  'Social Worker',
  'Physical Therapist',
  'Teacher',
  'Software Developer',
  'Accountant',
  'Electrician',
  'Paramedic',
  'Civil Engineer',
  'UX Designer',
  'Data Analyst',
  'Cybersecurity Specialist',
  'Chef',
  'Architect',
  'Product Manager',
  'Sales Lead',
  'Flight Dispatcher',
  'Biology Lab Technician',
  'Veterinary Assistant',
];

export function createGirlfriendEvent(person) {
  return {
    id: 'girlfriend_event',
    title: 'First relationship',
    description: `${person.name} likes someone and might start dating.`,
    options: [
      { text: 'Ask them out', effects: { hasPartner: true, happiness: 6, love: 8, charm: 2 } },
      { text: 'Take it slow', effects: { love: 3, happiness: 2 } },
      { text: 'Focus on school/life first', effects: { iq: 2, happiness: -1 } },
      { text: 'Not interested', effects: { love: -2, happiness: -1 } },
    ],
  };
}

export function createMarriageEvent(person) {
  const partnerLabel = person.partnerName ?? person.spouseName ?? 'their partner';
  return {
    id: 'marriage_event',
    title: 'A serious relationship starts',
    description: `${person.name} and ${partnerLabel} are discussing marriage.`,
    options: [
      { text: 'Get married soon', effects: { married: true, hasPartner: true, happiness: 8, love: 8, charm: 2 } },
      { text: 'Wait a little longer', effects: { love: 3, happiness: 2 } },
      { text: 'Stay focused on work', effects: { iq: 1, happiness: -2, love: -2 } },
      { text: 'Break up', effects: { hasPartner: false, losePartner: true, happiness: -4, love: -6 } },
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
  const jobs = [...JOB_ROLES].sort(() => Math.random() - 0.5).slice(0, 4);

  return {
    id: 'job_apply_event',
    title: 'Job applications',
    description: 'You are unemployed. Pick one job offer or refresh.',
    options: [
      ...jobs.map((job) => ({
        text: `Apply: ${job}`,
        effects: {
          jobTitle: job,
          salaryPerSecond: 120 + Math.floor(Math.random() * 156),
          happiness: 2,
          love: 1,
        },
      })),
      { text: 'Refresh offers', effects: { action: 'refreshJobs', iq: 1 } },
    ],
  };
}

export function createBabyEvent() {
  return {
    id: 'baby_offer',
    title: 'Family Planning',
    description: 'You and your partner are considering a child.',
    options: [
      { text: "Yes, let's try", effects: { action: 'startBabyNaming' } },
      { text: 'Not now', effects: { happiness: -1, love: -1 } },
    ],
  };
}

export function createAIBabyProposalEvent(person) {
  const partnerLabel = person.partnerName ?? person.spouseName ?? 'their partner';
  return {
    id: 'ai_baby_proposal',
    title: `${person.name} wants to try for a baby`,
    description: `${person.name} and ${partnerLabel} feel ready to grow the family. What do you want to do?`,
    options: [
      { text: 'Try for a child now', effects: { action: 'startPregnancyPlan', happiness: 2, love: 3 } },
      { text: 'Wait and save money', effects: { iq: 2, love: -1, money: 40 } },
      { text: 'Not ready for a child', effects: { happiness: -2, love: -3 } },
    ],
  };
}

export function createPregnancyPlanEvent() {
  return {
    id: 'pregnancy_plan_event',
    title: 'Family planning choices',
    description: 'Pick how to handle the pregnancy decision right now.',
    options: [
      {
        text: 'Choose doctor (cost €900)',
        effects: { action: 'startBabyNaming', planType: 'doctor', money: -900, happiness: 4, love: 4 },
      },
      {
        text: 'Budget clinic path (cost €300)',
        effects: { action: 'startBabyNaming', planType: 'budget', money: -300, happiness: 1, love: 2 },
      },
      {
        text: 'Take abortion',
        effects: { money: -180, happiness: -3, love: -4 },
      },
    ],
  };
}

export function createAICareerFocusEvent(person) {
  return {
    id: 'ai_career_focus',
    title: `${person.name} wants a career pivot`,
    description: `${person.name} is feeling ambitious and asks for your guidance on the next step.`,
    options: buildDynamicOptions([
      { iq: 3, happiness: 2, money: -50 },
      { promote: true, charm: 2, happiness: -1 },
      { happiness: 1 },
    ]),
  };
}

export function createPartnerLifeEvent(person) {
  const partnerLabel = person.partnerName ?? person.spouseName ?? 'Your partner';
  return {
    id: 'partner_life_event',
    title: `${partnerLabel} has a request`,
    description: `${partnerLabel} wants to plan something important with ${person.name}.`,
    options: buildDynamicOptions([
      { happiness: 3, love: 4, money: -45 },
      { love: 2, iq: 1 },
      { happiness: -2, love: -3, money: 20 },
    ]),
  };
}

export function createPartnerCareerEvent(person) {
  const partnerLabel = person.partnerName ?? person.spouseName ?? 'Your partner';
  return {
    id: 'partner_career_event',
    title: `${partnerLabel} has career news`,
    description: `${partnerLabel} got a work update that impacts your household income.`,
    options: [
      { text: 'Support a better role', effects: { partnerIncomeDelta: 55, happiness: 2, love: 3 } },
      { text: 'Choose stability for now', effects: { partnerIncomeDelta: 0, iq: 1, love: 1 } },
      { text: 'Take risky freelance switch', effects: { partnerIncomeSet: [-90, -30, 0, 80, 140][Math.floor(Math.random() * 5)], happiness: -1, iq: 2 } },
      { text: 'Encourage a break from work', effects: { partnerIncomeSet: 0, happiness: 1, love: 2 } },
    ],
  };
}

export function createTeenJobEvent(person) {
  return {
    id: 'teen_job_event',
    title: `${person.name} wants a part-time job`,
    description: 'A teen in your family can start earning while studying.',
    options: [
      { text: 'Take a weekend café job', effects: { jobTitle: 'Teen Café Worker', salaryPerSecond: 40, schoolPerformanceDelta: -4, happiness: 1 } },
      { text: 'Tutor younger kids', effects: { jobTitle: 'Part-time Tutor', salaryPerSecond: 50, schoolPerformanceDelta: 2, iq: 2 } },
      { text: 'Focus only on studies', effects: { happiness: -1, schoolPerformanceDelta: 5, iq: 1 } },
    ],
  };
}

export function createPetAdoptionEvent(person) {
  return {
    id: 'pet_adoption_event',
    title: `${person.name} asks to adopt a pet`,
    description: 'Pets raise family happiness but add monthly upkeep.',
    options: [
      { text: 'Adopt a dog', effects: { money: -220, petExpenseDelta: 18, happiness: 4, love: 2 } },
      { text: 'Adopt a cat', effects: { money: -140, petExpenseDelta: 12, happiness: 3, love: 1 } },
      { text: 'Not now', effects: { happiness: -1 } },
    ],
  };
}

export function createFamilyHealthInsuranceEvent(person) {
  return {
    id: 'health_insurance_event',
    title: `${person.name} reviews insurance plans`,
    description: 'Pick a family health insurance tier with recurring monthly bills.',
    options: [
      { text: 'Basic plan', effects: { insuranceCostSet: 24, happiness: 1 } },
      { text: 'Premium plan', effects: { insuranceCostSet: 45, happiness: 2, iq: 1 } },
      { text: 'Stay uninsured', effects: { insuranceCostSet: 0, money: 10, happiness: -1 } },
    ],
  };
}

export function createEmergencyHospitalEvent(person) {
  return {
    id: 'hospital_event',
    title: `Emergency at the hospital for ${person.name}`,
    description: 'You must choose quickly. Your insurance and decision both matter.',
    options: [
      { text: 'Private emergency care', effects: { money: -520, happiness: -2, love: 2 } },
      { text: 'Public hospital queue', effects: { money: -180, happiness: -4 } },
      { text: 'Call insured family hotline first', effects: { money: -90, iq: 2, happiness: -1 } },
    ],
  };
}

export function createRetirementPlanningEvent(person) {
  return {
    id: 'retirement_planning_event',
    title: `${person.name} starts retirement planning`,
    description: 'Contribute now for later pension payouts.',
    options: [
      { text: 'High pension contribution', effects: { money: -450, retirementContribution: 15, iq: 2 } },
      { text: 'Small steady contribution', effects: { money: -180, retirementContribution: 6, happiness: 1 } },
      { text: 'Delay retirement saving', effects: { money: 40, happiness: -1 } },
    ],
  };
}

export function createSchoolPerformanceEvent(person) {
  return {
    id: 'school_performance_event',
    title: `${person.name}'s report card is in`,
    description: 'Family support can shift school performance over time.',
    options: [
      { text: 'Hire tutoring support', effects: { money: -120, schoolPerformanceDelta: 10, iq: 1 } },
      { text: 'Set study routine at home', effects: { schoolPerformanceDelta: 6, happiness: -1 } },
      { text: 'No extra changes', effects: { schoolPerformanceDelta: -3 } },
    ],
  };
}

export function createUniversityAdmissionsEvent(person) {
  return {
    id: 'university_admission_event',
    title: `${person.name} gets university offers`,
    description: 'Choose between tuition cost and career upside.',
    options: [
      { text: 'Top university (high tuition)', effects: { startUniversity: true, universityCostDelta: 55, iq: 5, money: -400 } },
      { text: 'Community college', effects: { startUniversity: true, universityCostDelta: 24, iq: 2, money: -120 } },
      { text: 'Skip university', effects: { happiness: 1, iq: -1 } },
    ],
  };
}

export function createBabyNamingEvent(gender) {
  const sourceNames = gender === 'boy' ? BOY_NAMES : GIRL_NAMES;
  const options = [...sourceNames].sort(() => Math.random() - 0.5).slice(0, 4);
  const label = gender === 'boy' ? 'boy' : 'girl';

  return {
    id: 'baby_name_event',
    title: `Name your newborn ${label}`,
    description: `Your child is born (${label}). Choose a name.`,
    options: options.map((name) => ({
      text: name,
      effects: { action: 'nameBaby', babyName: name, happiness: 6, love: 6, money: -250 },
    })),
  };
}