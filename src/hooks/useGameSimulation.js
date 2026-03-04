import { useEffect, useMemo, useRef, useState } from 'react';
import {
  BASE_EVENTS,
  createAIBabyProposalEvent,
  createAICareerFocusEvent,
  createApplyJobEvent,
  createBabyNamingEvent,
  createEmergencyHospitalEvent,
  createFamilyHealthInsuranceEvent,
  createGirlfriendEvent,
  createMarriageEvent,
  createPartnerCareerEvent,
  createPartnerLifeEvent,
  createPetAdoptionEvent,
  createPregnancyPlanEvent,
  createPromotionEvent,
  createRetirementPlanningEvent,
  createSchoolAttendanceEvent,
  createSchoolPerformanceEvent,
  createTeenJobEvent,
  createUniversityAdmissionsEvent,
  createBurnoutInterventionEvent,
} from '../data/events';
import {
  clampNumber,
  DAYS_PER_YEAR,
  DAY_MS,
  EVENT_MS,
  formatDate,
  formatMoney,
  generatePersonName,
  pickRandomEvent,
  randomAvatar,
  SCHOOL_STAGES,
  SCHOOL_STAGE_YEARS,
} from '../utils/gameUtils';

let personIdCounter = 1;

const randomTraits = () => {
  const pool = ['Romantic', 'Charming', 'Genius', 'Triplet Luck', 'Ambitious', 'Careful with money', 'Fertile'];
  return [...pool].sort(() => Math.random() - 0.5).slice(0, 2);
};

const withTarget = (event, person) => ({ ...event, targetPersonId: person.id, targetPersonName: person.name });

const SCHOOL_DAYS_PER_STAGE = SCHOOL_STAGE_YEARS * DAYS_PER_YEAR;
const SCHOOL_START_AGE = 6;
const DAYS_PER_MONTH = 30;

const CITY_AMENITIES = ['Hospital', 'School', 'Shopping Centre', 'Public Park', 'Train Station', 'Creche', 'Gym', 'Library'];

const generateCity = () => {
  const namePrefixes = ['North', 'South', 'River', 'Green', 'Liffey', 'Oak'];
  const nameSuffixes = ['Heights', 'Cross', 'View', 'Harbour', 'Point', 'Vale'];
  const chosen = [...CITY_AMENITIES].sort(() => Math.random() - 0.5).slice(0, 6);
  return {
    name: `${namePrefixes[Math.floor(Math.random() * namePrefixes.length)]} ${nameSuffixes[Math.floor(Math.random() * nameSuffixes.length)]}`,
    amenities: chosen.map((name) => ({
      name,
      effect: name === 'Hospital' ? 'Healthcare costs slightly lower' : name === 'School' ? 'Education outcomes improve' : 'Family quality-of-life boost',
      cost: 100000 + Math.floor(Math.random() * 260000),
      incomePerSecond: 2600 + Math.floor(Math.random() * 2600),
      ownerId: null,
    })),
  };
};

const fertilityScore = (person, spouse) => {
  const traitScore = [person, spouse].filter(Boolean).flatMap((p) => p.traits).reduce((acc, trait) => {
    if (trait === 'Fertile') return acc + 0.22;
    if (trait === 'Triplet Luck') return acc + 0.16;
    return acc;
  }, 0);
  const loveScore = (((person?.stats.love ?? 40) + (spouse?.stats.love ?? 40)) / 200) * 0.16;
  return Math.min(0.58, traitScore + loveScore);
};

const decideBirthCount = (fertility) => {
  const quadChance = 0.002 + fertility * 0.025;
  const tripletChance = 0.01 + fertility * 0.08;
  const twinChance = 0.06 + fertility * 0.2;
  const roll = Math.random();
  if (roll < quadChance) return 4;
  if (roll < quadChance + tripletChance) return 3;
  if (roll < quadChance + tripletChance + twinChance) return 2;
  return 1;
};

const isSchoolCompleted = (person, currentAbsoluteDay) => {
  if (!person.education || person.education.completed) return true;

  const ageYears = Math.floor(person.ageDays / DAYS_PER_YEAR);
  if (ageYears < SCHOOL_START_AGE) return false;

  const schoolStartDay = person.education.schoolStartDay ?? person.joinedDay + SCHOOL_START_AGE * DAYS_PER_YEAR;
  const elapsed = Math.max(0, currentAbsoluteDay - schoolStartDay);
  const completedStages = Math.floor(elapsed / SCHOOL_DAYS_PER_STAGE);
  return completedStages >= SCHOOL_STAGES.length;
};

const sumRecurring = (recurring) => Object.values(recurring).reduce((acc, value) => acc + value, 0);
const clampStat = (value) => Math.max(0, Math.min(100, Math.round(value ?? 0)));

const householdIncome = (people) => Object.values(people).reduce((acc, person) => acc + (person.job?.salaryPerSecond ?? 0) + (person.pensionPerSecond ?? 0), 0);

const PROGRESSION_PER_YEAR_MAX = 5;
const TALENTS = ['Music', 'Sports', 'Coding'];
const EURO_MONTH_TO_GAME = 10;
const EURO_YEAR_TO_GAME = 100;
const MIN_IRISH_ANNUAL_SALARY = 26000;
const RENTAL_MARKET = {
  studio: { label: 'Studio Apartment', monthlyRentEuro: 1450, minAnnualIncomeEuro: 26000, moveInFeeEuro: 1200 },
  one_bed: { label: '1-Bed Apartment', monthlyRentEuro: 1850, minAnnualIncomeEuro: 37000, moveInFeeEuro: 1600 },
  two_bed: { label: '2-Bed Apartment', monthlyRentEuro: 2400, minAnnualIncomeEuro: 52000, moveInFeeEuro: 2200 },
  three_bed: { label: '3-Bed House', monthlyRentEuro: 3200, minAnnualIncomeEuro: 70000, moveInFeeEuro: 2800 },
};

const euroMonthToGameRate = (value) => Math.round(value / EURO_MONTH_TO_GAME);
const euroYearToGameRate = (value) => Math.round(value / EURO_YEAR_TO_GAME);

const nextUniqueBabyName = (usedNames) => {
  let candidate = generatePersonName();
  let guard = 0;
  while (usedNames.has(candidate) && guard < 20) {
    candidate = generatePersonName();
    guard += 1;
  }
  if (usedNames.has(candidate)) {
    candidate = `${candidate}-${Math.floor(Math.random() * 90) + 10}`;
  }
  usedNames.add(candidate);
  return candidate;
};

const getSiblingNames = (baseName, count) => {
  if (count <= 1) return [baseName];
  const names = [baseName];
  const used = new Set(names);
  while (names.length < count) {
    names.push(nextUniqueBabyName(used));
  }
  return names;
};

const createPerson = ({ ageYears = 21, parentId = null, spouseId = null, name, joinedDay = 1, isPartner = false } = {}) => ({
  id: `p_${personIdCounter++}`,
  name: name ?? generatePersonName(),
  avatar: randomAvatar(),
  ageDays: ageYears * DAYS_PER_YEAR,
  joinedDay,
  parentId,
  spouseId,
  isPartner,
  childrenIds: [],
  hasPartner: false,
  married: false,
  traits: randomTraits(),
  stats: {
    happiness: 55,
    love: 40,
    charm: 45,
    iq: 50,
    socialReputation: 20,
    burnout: 15,
  },
  job: {
    employed: true,
    title: 'Junior Clerk',
    level: 1,
    salaryPerSecond: euroYearToGameRate(MIN_IRISH_ANNUAL_SALARY) + Math.floor(Math.random() * 72),
    proficiency: Math.floor(Math.random() * 45),
  },
  pensionPerSecond: 0,
  education: {
    completed: true,
    schoolStartDay: null,
    performance: 60,
    inUniversity: false,
  },
});

const initialState = () => {
  const founder = createPerson({ ageYears: 21, joinedDay: 1 });
  const startingRental = RENTAL_MARKET.studio;
  const baselineExpenses = {
    housing: euroMonthToGameRate(startingRental.monthlyRentEuro),
    maintenance: 12,
    children: 0,
    pets: 0,
    insurance: 0,
    university: 0,
    debt: 0,
  };
  const minFounderIncome = sumRecurring(baselineExpenses) + 20;
  founder.job.salaryPerSecond = Math.max(founder.job.salaryPerSecond, minFounderIncome);
  return {
    money: 25000,
    isRunning: false,
    day: 1,
    yearsPassed: 0,
    recurringExpensesPerSecond: baselineExpenses,
    assets: {
      cars: 0,
      houses: 0,
      mortgages: 0,
      rentActive: true,
      rentalTier: 'studio',
      pets: 0,
      insurancePlan: 'none',
      businessesOwned: 0,
    },
    modifiers: {
      homeComfort: 0,
    },
    city: generateCity(),
    monthlySummary: 'No yearly update yet',
    loans: {
      principal: 0,
      annualInterestRate: 0.07,
      paymentPerSecond: 0,
    },
    family: {
      activePersonId: founder.id,
      selectedPersonId: null,
      people: { [founder.id]: founder },
    },
  };
};

const summarizeEffects = (effects) => {
  if (!effects) return [];
  const labels = { money: 'Money', happiness: 'Happiness', love: 'Love', charm: 'Charm', iq: 'IQ' };
  return Object.entries(labels)
    .map(([key, label]) => {
      const value = effects[key];
      if (!value) return null;
      const sign = value > 0 ? '+' : '';
      return `${label} ${sign}${value}`;
    })
    .filter(Boolean);
};

export function useGameSimulation() {
  const [state, setState] = useState(initialState);
  const [currentEvent, setCurrentEvent] = useState(null);
  const [eventResult, setEventResult] = useState(null);
  const [pendingBabyParentId, setPendingBabyParentId] = useState(null);
  const lastEventIdRef = useRef(null);
  const latestStateRef = useRef(state);
  const currentEventRef = useRef(currentEvent);
  const lastEventAtRef = useRef(0);
  const pauseForEvent = (event, person) => {
    setCurrentEvent(withTarget(event, person));
    setState((prev) => ({ ...prev, isRunning: false }));
    lastEventAtRef.current = Date.now();
  };

  useEffect(() => {
    latestStateRef.current = state;
  }, [state]);

  useEffect(() => {
    currentEventRef.current = currentEvent;
  }, [currentEvent]);

  const absoluteDay = state.yearsPassed * DAYS_PER_YEAR + state.day;
  const activePerson = state.family.people[state.family.activePersonId];
  const selectedPerson = state.family.people[state.family.selectedPersonId];
  const totalIncome = householdIncome(state.family.people);
  const monthlyNetIncome = totalIncome - sumRecurring(state.recurringExpensesPerSecond);

  useEffect(() => {
    if (!state.isRunning) return;
    const id = setInterval(() => {
      setState((prev) => {
        const nextDay = prev.day + 1;
        const wraps = nextDay > DAYS_PER_YEAR;
        const updatedPeople = Object.fromEntries(
          Object.entries(prev.family.people).map(([id, person]) => {
            const ageDays = person.ageDays + 1;
            const ageYears = Math.floor(ageDays / DAYS_PER_YEAR);
            const shouldRetire = ageYears >= 65 && person.job.employed;
            return [
              id,
              {
                ...person,
                ageDays,
                pensionPerSecond: shouldRetire ? Math.round(person.job.salaryPerSecond * 0.45) : person.pensionPerSecond,
                job: shouldRetire ? { employed: false, title: 'Retired', level: 0, salaryPerSecond: 0 } : person.job,
              },
            ];
          }),
        );

        const isYearEnd = wraps;
        const monthDay = ((nextDay - 1) % DAYS_PER_MONTH) + 1;
        const isMonthEnd = monthDay === DAYS_PER_MONTH || wraps;

        const comfortBoost = isYearEnd ? prev.modifiers.homeComfort : 0;
        const yearlyUpdates = { talentDiscoveries: [], crimeSummary: null };
        const yearPeople = isYearEnd
          ? Object.fromEntries(Object.entries(updatedPeople).map(([id, person]) => {
            const hasJobTrack = person.job?.employed && person.job.level > 0 && person.job.title !== 'Retired';
            const proficiencyGain = hasJobTrack ? Math.min(PROGRESSION_PER_YEAR_MAX, Math.round(Math.random() * PROGRESSION_PER_YEAR_MAX)) : 0;
            const nextProficiency = hasJobTrack ? (person.job.proficiency ?? 0) + proficiencyGain : (person.job.proficiency ?? 0);
            const earnedPromotion = hasJobTrack && nextProficiency >= 100;
            const burnoutDelta = hasJobTrack ? 8 : -12;
            const nextBurnout = clampStat((person.stats.burnout ?? 0) + burnoutDelta);
            const socialShift = Math.round((Math.random() - 0.4) * 8);
            const nextReputation = clampStat((person.stats.socialReputation ?? 20) + socialShift);
            const ageYears = Math.floor(person.ageDays / DAYS_PER_YEAR);
            const canDiscoverTalent = !!person.parentId && ageYears >= 6 && ageYears <= 16 && !person.talent && Math.random() < 0.32;
            const discoveredTalent = canDiscoverTalent ? TALENTS[Math.floor(Math.random() * TALENTS.length)] : null;
            if (discoveredTalent) {
              yearlyUpdates.talentDiscoveries.push(`${person.name} discovered talent in ${discoveredTalent}`);
            }
            return [
              id,
              {
                ...person,
                talent: person.talent ?? discoveredTalent,
                stats: {
                  ...person.stats,
                  happiness: clampStat(person.stats.happiness + comfortBoost - (nextBurnout > 75 ? 6 : 0) + (discoveredTalent ? 5 : 0)),
                  iq: clampStat(person.stats.iq + (discoveredTalent === 'Coding' ? 4 : 0)),
                  burnout: nextBurnout,
                  socialReputation: nextReputation,
                },
                job: hasJobTrack
                  ? {
                    ...person.job,
                    level: earnedPromotion ? person.job.level + 1 : person.job.level,
                    salaryPerSecond: earnedPromotion
                      ? Math.round(person.job.salaryPerSecond * 1.08)
                      : person.job.salaryPerSecond,
                    proficiency: earnedPromotion ? 0 : nextProficiency,
                  }
                  : person.job,
                traits: discoveredTalent ? [...person.traits, `${discoveredTalent} Talent`] : person.traits,
              },
            ];
          }))
          : updatedPeople;

        const crimeRoll = isYearEnd ? Math.random() : 1;
        const crimeCost = crimeRoll < 0.2 ? 2800 : 0;
        yearlyUpdates.crimeSummary = crimeCost > 0 ? 'Crime wave increased household costs this year.' : 'Neighborhood remained safe this year.';
        const assetWearAndTear = isYearEnd
          ? (prev.assets.cars * 6) + (prev.assets.houses * 24)
          : 0;

        const nextPrincipal = isYearEnd && prev.loans.principal > 0
          ? Number((prev.loans.principal * (1 + prev.loans.annualInterestRate)).toFixed(2))
          : prev.loans.principal;

        const monthlyIncome = householdIncome(yearPeople);
        const monthlyExpenses = sumRecurring(prev.recurringExpensesPerSecond);
        const monthlyNet = isMonthEnd ? (monthlyIncome - monthlyExpenses) : 0;

        return {
          ...prev,
          money: clampNumber(prev.money + monthlyNet),
          day: wraps ? 1 : nextDay,
          yearsPassed: wraps ? prev.yearsPassed + 1 : prev.yearsPassed,
          monthlySummary: isYearEnd
            ? `Year ${prev.yearsPassed + 1}: ${yearlyUpdates.crimeSummary} ${yearlyUpdates.talentDiscoveries.join(' • ')}`
            : prev.monthlySummary,
          recurringExpensesPerSecond: {
            ...prev.recurringExpensesPerSecond,
            maintenance: prev.recurringExpensesPerSecond.maintenance + assetWearAndTear + (crimeCost > 0 ? 8 : 0),
            debt: prev.loans.paymentPerSecond,
          },
          loans: {
            ...prev.loans,
            principal: nextPrincipal,
          },
          family: {
            ...prev.family,
            people: yearPeople,
          },
        };
      });
    }, DAY_MS);
    return () => clearInterval(id);
  }, [state.isRunning]);

  useEffect(() => {
    if (!state.isRunning) return;
    const id = setInterval(() => {
      if (currentEventRef.current) return;

      const snapshot = latestStateRef.current;
      const people = Object.values(snapshot.family.people);
      const minGap = EVENT_MS + people.length * 3000;
      if (Date.now() - lastEventAtRef.current < minGap) return;

      const currentAbsoluteDay = snapshot.yearsPassed * DAYS_PER_YEAR + snapshot.day;
      const eligiblePeople = people.filter((person) => currentAbsoluteDay - person.joinedDay >= 30);
      const person = eligiblePeople.length
        ? eligiblePeople[Math.floor(Math.random() * eligiblePeople.length)]
        : snapshot.family.people[snapshot.family.activePersonId];
      if (!person) return;
      const age = Math.floor(person.ageDays / DAYS_PER_YEAR);

      const burnoutLevel = person.stats?.burnout ?? 0;
      if (burnoutLevel >= 100) {
        pauseForEvent(createBurnoutInterventionEvent(person), person);
        return;
      }
      if (burnoutLevel >= 50 && Math.random() < 0.25) {
        pauseForEvent(createBurnoutInterventionEvent(person), person);
        return;
      }

      if (!person.hasPartner && age >= 12 && Math.random() < 0.25) {
        pauseForEvent(createGirlfriendEvent(person), person);
        return;
      }

      if (person.hasPartner && !person.married && age >= 18 && Math.random() < 0.2) {
        pauseForEvent(createMarriageEvent(person), person);
        return;
      }

      const schoolCompleted = isSchoolCompleted(person, currentAbsoluteDay);

      if (age >= 13 && age <= 19 && person.parentId && !person.job.employed && Math.random() < 0.22) {
        pauseForEvent(createTeenJobEvent(person), person);
        return;
      }

      if (person.parentId && age >= 6 && age <= 18 && Math.random() < 0.18) {
        pauseForEvent(createSchoolAttendanceEvent(person), person);
        return;
      }

      if (person.parentId && age >= 6 && age <= 18 && Math.random() < 0.2) {
        pauseForEvent(createSchoolPerformanceEvent(person), person);
        return;
      }

      if (person.parentId && age >= 17 && age <= 22 && schoolCompleted && !person.education.inUniversity && Math.random() < 0.2) {
        pauseForEvent(createUniversityAdmissionsEvent(person), person);
        return;
      }

      if (Math.random() < 0.14) {
        pauseForEvent(createPetAdoptionEvent(person), person);
        return;
      }

      if (Math.random() < 0.16) {
        pauseForEvent(createFamilyHealthInsuranceEvent(person), person);
        return;
      }

      if (Math.random() < 0.12) {
        pauseForEvent(createEmergencyHospitalEvent(person), person);
        return;
      }

      if (age >= 55 && Math.random() < 0.18) {
        pauseForEvent(createRetirementPlanningEvent(person), person);
        return;
      }

      if (person.hasPartner && Math.random() < 0.2) {
        pauseForEvent(createPartnerLifeEvent(person), person);
        return;
      }

      if (person.hasPartner && Math.random() < 0.16) {
        pauseForEvent(createPartnerCareerEvent(person), person);
        return;
      }

      if (!person.job.employed && schoolCompleted) {
        pauseForEvent(createApplyJobEvent(), person);
        return;
      }

      if (schoolCompleted && Math.random() < 0.2) {
        pauseForEvent(createPromotionEvent(person.job.level), person);
        return;
      }

      if (person.hasPartner && age >= 21 && age <= 40 && person.stats.happiness > 40 && person.stats.love > 38 && Math.random() < 0.42) {
        pauseForEvent(createAIBabyProposalEvent(person), person);
        return;
      }

      if (schoolCompleted && Math.random() < 0.2) {
        pauseForEvent(createAICareerFocusEvent(person), person);
        return;
      }

      const ev = pickRandomEvent(BASE_EVENTS, lastEventIdRef.current);
      if (!ev) return;
      lastEventIdRef.current = ev.id;
      pauseForEvent(ev, person)
    }, 1000);
    return () => clearInterval(id);
  }, [state.isRunning]);

  const applyEffects = (effects, targetPersonId) => {
    if (!effects) return null;
    let nextPerson = null;
    setState((prev) => {
      const personId = targetPersonId ?? prev.family.activePersonId;
      const person = prev.family.people[personId];
      if (!person) return prev;

      const updated = {
        ...person,
        stats: {
          happiness: person.stats.happiness + (effects.happiness ?? 0),
          love: person.stats.love + (effects.love ?? 0),
          charm: person.stats.charm + (effects.charm ?? 0),
          iq: person.stats.iq + (effects.iq ?? 0),
          socialReputation: clampStat(person.stats.socialReputation + (effects.socialReputation ?? 0)),
          burnout: clampStat(person.stats.burnout + (effects.burnout ?? 0)),
        },
      };

      const nextPeople = { ...prev.family.people };
      const nextRecurring = { ...prev.recurringExpensesPerSecond };
      const nextAssets = { ...prev.assets };

      if (effects.hasPartner && !updated.spouseId) {
        const partner = createPerson({
          ageYears: Math.max(18, Math.floor(updated.ageDays / DAYS_PER_YEAR) + (Math.random() < 0.5 ? 0 : 1)),
          spouseId: updated.id,
          joinedDay: absoluteDay,
          isPartner: true,
        });
        partner.hasPartner = true;
        partner.spouseId = updated.id;
        partner.married = !!effects.married;
        nextPeople[partner.id] = partner;
        updated.hasPartner = true;
        updated.spouseId = partner.id;
      }

      if (effects.losePartner && updated.spouseId) {
        const spouse = nextPeople[updated.spouseId];
        if (spouse) {
          spouse.hasPartner = false;
          spouse.spouseId = null;
          spouse.married = false;
        }
        updated.hasPartner = false;
        updated.married = false;
        updated.spouseId = null;
      }

      if (effects.married) {
        updated.married = true;
        updated.hasPartner = true;
        if (updated.spouseId && nextPeople[updated.spouseId]) {
          nextPeople[updated.spouseId] = { ...nextPeople[updated.spouseId], married: true, hasPartner: true };
        }
      }

      if (effects.action === 'unemployed') {
        updated.job = { employed: false, title: 'Unemployed', level: 0, salaryPerSecond: 0, proficiency: 0 };
      }

      if (effects.jobTitle) {
        updated.job = {
          employed: true,
          title: effects.jobTitle,
          level: 1,
          salaryPerSecond: effects.salaryPerSecond,
          proficiency: 0,
        };
      }

      if (typeof effects.partnerIncomeDelta === 'number' && updated.spouseId && nextPeople[updated.spouseId]) {
        const spouse = nextPeople[updated.spouseId];
        nextPeople[updated.spouseId] = {
          ...spouse,
          job: { ...spouse.job, employed: true, salaryPerSecond: Math.max(0, spouse.job.salaryPerSecond + effects.partnerIncomeDelta) },
        };
      }

      if (typeof effects.partnerIncomeSet === 'number' && updated.spouseId && nextPeople[updated.spouseId]) {
        const spouse = nextPeople[updated.spouseId];
        nextPeople[updated.spouseId] = { ...spouse, job: { ...spouse.job, employed: true, salaryPerSecond: effects.partnerIncomeSet } };
      }

      if (effects.promote) {
        updated.job = {
          ...updated.job,
          employed: true,
          level: updated.job.level + 1,
          salaryPerSecond: Math.round(updated.job.salaryPerSecond * (1.15 + Math.random() * 0.15)),
          proficiency: 0,
        };
      }

      if (typeof effects.childExpenseDelta === 'number') {
        nextRecurring.children = Math.max(0, nextRecurring.children + effects.childExpenseDelta);
      }

      if (typeof effects.petExpenseDelta === 'number') {
        nextRecurring.pets = Math.max(0, nextRecurring.pets + effects.petExpenseDelta);
        nextAssets.pets = Math.max(0, nextAssets.pets + (effects.petExpenseDelta > 0 ? 1 : -1));
      }

      if (typeof effects.insuranceCostSet === 'number') {
        nextRecurring.insurance = Math.max(0, effects.insuranceCostSet);
      }

      if (typeof effects.universityCostDelta === 'number') {
        nextRecurring.university = Math.max(0, nextRecurring.university + effects.universityCostDelta);
      }

      if (typeof effects.schoolPerformanceDelta === 'number') {
        updated.education = {
          ...updated.education,
          performance: Math.max(0, Math.min(100, (updated.education.performance ?? 60) + effects.schoolPerformanceDelta)),
        };
      }

      if (effects.startUniversity) {
        updated.education = {
          ...updated.education,
          inUniversity: true,
        };
      }

      if (typeof effects.retirementContribution === 'number') {
        updated.pensionPerSecond += effects.retirementContribution;
      }

      nextPerson = updated;
      nextPeople[updated.id] = updated;

      return {
        ...prev,
        money: clampNumber(prev.money + (effects.money ?? 0)),
        recurringExpensesPerSecond: nextRecurring,
        assets: nextAssets,
        family: {
          ...prev.family,
          people: nextPeople,
        },
      };
    });

    if (effects.action === 'startPregnancyPlan') {
      return { updatedPerson: nextPerson, nextEvent: createPregnancyPlanEvent() };
    }

    if (effects.action === 'startBabyNaming') {
      const planType = effects.planType ?? 'doctor';
      const successChance = planType === 'budget' ? 0.7 : 0.92;
      if (Math.random() <= successChance) {
        const parentId = targetPersonId ?? state.family.activePersonId;
        const parent = state.family.people[parentId];
        const spouse = parent?.spouseId ? state.family.people[parent.spouseId] : null;
        const birthCount = decideBirthCount(fertilityScore(parent, spouse));
        setPendingBabyParentId(`${parentId}:${birthCount}`);
        const babyGender = Math.random() < 0.5 ? 'boy' : 'girl';
        return { updatedPerson: nextPerson, nextEvent: createBabyNamingEvent(babyGender) };
      }
      return { updatedPerson: nextPerson, resultOverride: { summary: ['Pregnancy attempt failed this time.'], option: 'No pregnancy' } };
    }

    if (effects.action === 'refreshJobs') {
      return { updatedPerson: nextPerson, nextEvent: createApplyJobEvent() };
    }

    if (effects.action === 'nameBaby' && pendingBabyParentId) {
      setState((prev) => {
        const [parentId, countRaw] = String(pendingBabyParentId).split(':');
        const babyCount = Math.max(1, Number(countRaw) || 1);
        const parent = prev.family.people[parentId];
        if (!parent) return prev;
        const babyNames = getSiblingNames(effects.babyName, babyCount);
        const babies = Array.from({ length: babyCount }, (_, idx) => {
          const baby = createPerson({ ageYears: 0, parentId: parent.id, name: babyNames[idx], joinedDay: absoluteDay });
          baby.job = { employed: false, title: 'Child', level: 0, salaryPerSecond: 0, proficiency: 0 };
          baby.education = {
            completed: false,
            schoolStartDay: absoluteDay + SCHOOL_START_AGE * DAYS_PER_YEAR,
            performance: 55,
            inUniversity: false,
          };
          return baby;
        });
        
        const parentUpdated = {
          ...parent,
          childrenIds: [...parent.childrenIds, ...babies.map((baby) => baby.id)],
        };

        const nextPeople = {
          ...prev.family.people,
          [parentUpdated.id]: parentUpdated,
          ...Object.fromEntries(babies.map((baby) => [baby.id, baby])),
        };

        if (parent.spouseId && nextPeople[parent.spouseId]) {
          nextPeople[parent.spouseId] = {
            ...nextPeople[parent.spouseId],
            childrenIds: [...nextPeople[parent.spouseId].childrenIds, ...babies.map((baby) => baby.id)],
          };
        }

        return {
          ...prev,
          recurringExpensesPerSecond: {
            ...prev.recurringExpensesPerSecond,
            children: prev.recurringExpensesPerSecond.children + (120 * babyCount),
          },
          family: {
            ...prev.family,
            people: nextPeople,
          },
        };
      });
      setPendingBabyParentId(null);
    }

    return { updatedPerson: nextPerson };
  };

  const chooseOption = (idx) => {
    const option = currentEvent?.options?.[idx];
    if (!option) return;
    const targetPersonId = currentEvent?.targetPersonId ?? state.family.activePersonId;
    const targetPerson = state.family.people[targetPersonId];
    const applied = applyEffects(option.effects, targetPersonId);
    const updatedPerson = applied?.updatedPerson ?? targetPerson;
    if (applied?.nextEvent) {
      setCurrentEvent(withTarget(applied.nextEvent, targetPerson));
      return;
    }

    setEventResult({
      personName: targetPerson?.name,
      summary: applied?.resultOverride?.summary ?? summarizeEffects(option.effects),
      stats: updatedPerson?.stats ?? targetPerson?.stats,
      option: applied?.resultOverride?.option ?? option.text,
    });
    setCurrentEvent(null);
    setState((prev) => ({ ...prev, isRunning: true }));
  };

  const reset = () => {
    personIdCounter = 1;
    setState(initialState());
    setCurrentEvent(null);
    setPendingBabyParentId(null);
    setEventResult(null);
    lastEventIdRef.current = null;
    lastEventAtRef.current = 0;
  };

  const spendMoney = (amount, recurringType = null, recurringDelta = 0, assetType = null, bonusType = null, bonusValue = 0) =>
    setState((prev) => {
      if (prev.money < amount) return prev;
      const next = { ...prev, money: clampNumber(prev.money - amount) };
      const maintenanceByAsset = { cars: 14, houses: 38 };
      if (recurringType) {
        next.recurringExpensesPerSecond = {
          ...prev.recurringExpensesPerSecond,
          [recurringType]: Math.max(0, (prev.recurringExpensesPerSecond[recurringType] ?? 0) + recurringDelta),
        };
      }
      if (assetType) {
        next.assets = {
          ...prev.assets,
          [assetType]: (prev.assets[assetType] ?? 0) + 1,
        };
        if (maintenanceByAsset[assetType]) {
          next.recurringExpensesPerSecond = {
            ...next.recurringExpensesPerSecond,
            maintenance: (next.recurringExpensesPerSecond.maintenance ?? 0) + maintenanceByAsset[assetType],
          };
        }
      }
      if (bonusType) {
        next.modifiers = {
          ...prev.modifiers,
          [bonusType]: Number(((prev.modifiers[bonusType] ?? 0) + bonusValue).toFixed(2)),
        };
      }
      return next;
    });
  
  const upgradeRental = (tierKey) => {
    const tier = RENTAL_MARKET[tierKey];
    if (!tier) return;

    setState((prev) => {
      const annualIncomeEuro = householdIncome(prev.family.people) * EURO_YEAR_TO_GAME;
      if (annualIncomeEuro < tier.minAnnualIncomeEuro) return prev;
      if (prev.money < tier.moveInFeeEuro) return prev;
      if (prev.assets.rentalTier === tierKey) return prev;
      if (!prev.assets.rentActive) return prev;

      return {
        ...prev,
        money: clampNumber(prev.money - tier.moveInFeeEuro),
        recurringExpensesPerSecond: {
          ...prev.recurringExpensesPerSecond,
          housing: euroMonthToGameRate(tier.monthlyRentEuro),
        },
        assets: {
          ...prev.assets,
          rentalTier: tierKey,
        },
      };
    });
  };

  const takeLoan = (amount) => {
    if (amount <= 0) return;
    setState((prev) => {
      const payment = Math.round(amount / 1200);
      return {
        ...prev,
        money: clampNumber(prev.money + amount),
        loans: {
          ...prev.loans,
          principal: Number((prev.loans.principal + amount).toFixed(2)),
          paymentPerSecond: prev.loans.paymentPerSecond + payment,
        },
        recurringExpensesPerSecond: {
          ...prev.recurringExpensesPerSecond,
          debt: (prev.recurringExpensesPerSecond.debt ?? 0) + payment,
        },
      };
    });
  };

  const repayLoan = (amount) => {
    if (amount <= 0) return;
    setState((prev) => {
      const payment = Math.min(amount, prev.money, prev.loans.principal);
      if (payment <= 0) return prev;
      const remainingPrincipal = Number((prev.loans.principal - payment).toFixed(2));
      const nextDebtPayment = remainingPrincipal <= 0 ? 0 : prev.loans.paymentPerSecond;
      return {
        ...prev,
        money: clampNumber(prev.money - payment),
        loans: {
          ...prev.loans,
          principal: Math.max(0, remainingPrincipal),
          paymentPerSecond: nextDebtPayment,
        },
        recurringExpensesPerSecond: {
          ...prev.recurringExpensesPerSecond,
          debt: nextDebtPayment,
        },
      };
    });
  };

  const buyBusiness = (amenityName) => {
    setState((prev) => {
      const amenity = prev.city.amenities.find((item) => item.name === amenityName);
      if (!amenity || amenity.ownerId || prev.money < amenity.cost) return prev;
      const active = prev.family.people[prev.family.activePersonId];
      const updatedActive = {
        ...active,
        job: {
          employed: true,
          title: `${amenity.name} Owner`,
          level: 1,
          salaryPerSecond: amenity.incomePerSecond,
          proficiency: Math.min(20, active.job?.proficiency ?? 0),
        },
      };
      return {
        ...prev,
        money: prev.money - amenity.cost,
        city: {
          ...prev.city,
          amenities: prev.city.amenities.map((item) => item.name === amenityName ? { ...item, ownerId: active.id } : item),
        },
        assets: {
          ...prev.assets,
          businessesOwned: prev.assets.businessesOwned + 1,
        },
        family: {
          ...prev.family,
          people: {
            ...prev.family.people,
            [active.id]: updatedActive,
          },
        },
      };
    });
  };

  const takeVacation = () => {
    setState((prev) => {
      if (prev.money < 3400) return prev;
      return {
      ...prev,
      money: prev.money - 3400,
      family: {
        ...prev.family,
        people: Object.fromEntries(Object.entries(prev.family.people).map(([id, person]) => [
          id,
          {
            ...person,
            stats: {
              ...person.stats,
              burnout: clampStat((person.stats.burnout ?? 0) - 20),
              happiness: clampStat((person.stats.happiness ?? 0) + 5),
            },
          },
        ])),
      },
    };
    });
  };

  return {
    ...state,
    activePerson,
    selectedPerson,
    monthlyNetIncome,
    currentEvent,
    eventResult,
    chooseOption,
    dismissEventResult: () => setEventResult(null),
    reset,
    setIsRunning: (value) => setState((prev) => ({ ...prev, isRunning: value })),
    spendMoney,
    upgradeRental,
    takeLoan,
    repayLoan,
    buyBusiness,
    takeVacation,
    rentalMarket: RENTAL_MARKET,
    householdAnnualIncomeEuro: totalIncome * EURO_YEAR_TO_GAME,
    selectPerson: (personId) =>
      setState((prev) => ({
        ...prev,
        family: {
          ...prev.family,
          selectedPersonId: prev.family.selectedPersonId === personId ? null : personId,
        },
      })),
    setActivePerson: (personId) =>
      setState((prev) => ({ ...prev, family: { ...prev.family, activePersonId: personId, selectedPersonId: personId } })),
    moneyDisplay: useMemo(() => formatMoney(state.money), [state.money]),
    dateDisplay: useMemo(() => formatDate(new Date(2026, 0, 1 + (state.yearsPassed * DAYS_PER_YEAR + state.day - 1))), [state.day, state.yearsPassed]),
  };
}