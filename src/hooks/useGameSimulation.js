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
  createSchoolPerformanceEvent,
  createTeenJobEvent,
  createUniversityAdmissionsEvent,
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
  TICK_MS,
} from '../utils/gameUtils';

let personIdCounter = 1;

const randomTraits = () => {
  const pool = ['Romantic', 'Charming', 'Genius', 'Triplet Luck', 'Ambitious', 'Careful with money', 'Fertile'];
  return [...pool].sort(() => Math.random() - 0.5).slice(0, 2);
};

const withTarget = (event, person) => ({ ...event, targetPersonId: person.id, targetPersonName: person.name });

const SCHOOL_DAYS_PER_STAGE = SCHOOL_STAGE_YEARS * DAYS_PER_YEAR;
const SCHOOL_START_AGE = 6;

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const WEATHER_TYPES = [
  { type: 'Mild Rain', min: 1.02, max: 1.08 },
  { type: 'Cold Snap', min: 1.08, max: 1.2 },
  { type: 'Storm Season', min: 1.06, max: 1.16 },
  { type: 'Clear Skies', min: 0.95, max: 1.02 },
  { type: 'Heatwave', min: 1.01, max: 1.1 },
];
const CITY_AMENITIES = ['Hospital', 'School', 'Shopping Centre', 'Public Park', 'Train Station', 'Creche', 'Gym', 'Library'];

const randomWeather = (monthIdx) => {
  const profile = WEATHER_TYPES[Math.floor(Math.random() * WEATHER_TYPES.length)];
  return {
    month: MONTH_NAMES[monthIdx % 12],
    type: profile.type,
    costMultiplier: Number((profile.min + Math.random() * (profile.max - profile.min)).toFixed(2)),
  };
};

const generateCity = () => {
  const namePrefixes = ['North', 'South', 'River', 'Green', 'Liffey', 'Oak'];
  const nameSuffixes = ['Heights', 'Cross', 'View', 'Harbour', 'Point', 'Vale'];
  const chosen = [...CITY_AMENITIES].sort(() => Math.random() - 0.5).slice(0, 6);
  return {
    name: `${namePrefixes[Math.floor(Math.random() * namePrefixes.length)]} ${nameSuffixes[Math.floor(Math.random() * nameSuffixes.length)]}`,
    amenities: chosen.map((name) => ({
      name,
      effect: name === 'Hospital' ? 'Healthcare costs slightly lower' : name === 'School' ? 'Education outcomes improve' : 'Family quality-of-life boost',
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

const householdIncome = (people) => Object.values(people).reduce((acc, person) => acc + (person.job?.salaryPerSecond ?? 0) + (person.pensionPerSecond ?? 0), 0);

const PROGRESSION_PER_MONTH = 8;

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
  },
  job: {
    employed: true,
    title: 'Junior Clerk',
    level: 1,
    salaryPerSecond: 120 + Math.floor(Math.random() * 96),
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
  const baselineExpenses = {
    housing: 340,
    maintenance: 35,
    weather: 0,
    children: 0,
    pets: 0,
    insurance: 0,
    university: 0,
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
      pets: 0,
      insurancePlan: 'none',
    },
    modifiers: {
      homeComfort: 0,
      weatherResilience: 0,
    },
    city: generateCity(),
    weather: randomWeather(0),
    monthlySummary: 'No month finished yet',
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
  const incomePerSecond = totalIncome - sumRecurring(state.recurringExpensesPerSecond);

  useEffect(() => {
    if (!state.isRunning) return;
    const id = setInterval(() => {
      setState((prev) => ({
        ...prev,
        money: clampNumber(prev.money + (householdIncome(prev.family.people) - sumRecurring(prev.recurringExpensesPerSecond))),
      }));
    }, TICK_MS);
    return () => clearInterval(id);
  }, [state.isRunning]);

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

        const isMonthEnd = nextDay % 30 === 0;
        const monthIdx = Math.floor(nextDay / 30);
        const nextWeather = isMonthEnd ? randomWeather(monthIdx) : prev.weather;
        const weatherCost = isMonthEnd
          ? Math.max(0, Math.round(prev.recurringExpensesPerSecond.housing * Math.max(0, (nextWeather.costMultiplier - prev.modifiers.weatherResilience - 1))))
          : prev.recurringExpensesPerSecond.weather;

        const comfortBoost = isMonthEnd ? prev.modifiers.homeComfort : 0;
        const monthPeople = isMonthEnd
          ? Object.fromEntries(Object.entries(updatedPeople).map(([id, person]) => {
            const hasJobTrack = person.job?.employed && person.job.level > 0 && person.job.title !== 'Retired';
            const nextProficiency = hasJobTrack ? (person.job.proficiency ?? 0) + PROGRESSION_PER_MONTH : (person.job.proficiency ?? 0);
            const earnedPromotion = hasJobTrack && nextProficiency >= 100;
            return [
              id,
              {
                ...person,
                stats: {
                  ...person.stats,
                  happiness: person.stats.happiness + comfortBoost,
                },
                job: hasJobTrack
                  ? {
                    ...person.job,
                    level: earnedPromotion ? person.job.level + 1 : person.job.level,
                    salaryPerSecond: earnedPromotion
                      ? Math.round(person.job.salaryPerSecond * 1.14)
                      : person.job.salaryPerSecond,
                    proficiency: earnedPromotion ? 0 : nextProficiency,
                  }
                  : person.job,
              },
            ];
          }))
          : updatedPeople;

        return {
          ...prev,
          day: wraps ? 1 : nextDay,
          yearsPassed: wraps ? prev.yearsPassed + 1 : prev.yearsPassed,
          weather: nextWeather,
          monthlySummary: isMonthEnd ? `${nextWeather.month}: ${nextWeather.type} adjusted weather costs by ${weatherCost}/s` : prev.monthlySummary,
          recurringExpensesPerSecond: {
            ...prev.recurringExpensesPerSecond,
            weather: weatherCost,
          },
          family: {
            ...prev.family,
            people: monthPeople,
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

      if (!person.hasPartner && age >= 12 && Math.random() < 0.25) {
        setCurrentEvent(withTarget(createGirlfriendEvent(person), person));
        setState((prev) => ({ ...prev, isRunning: false }));
        lastEventAtRef.current = Date.now();
        return;
      }

      if (person.hasPartner && !person.married && age >= 18 && Math.random() < 0.2) {
        setCurrentEvent(withTarget(createMarriageEvent(person), person));
        setState((prev) => ({ ...prev, isRunning: false }));
        lastEventAtRef.current = Date.now();
        return;
      }

      const schoolCompleted = isSchoolCompleted(person, currentAbsoluteDay);

      if (age >= 13 && age <= 19 && person.parentId && !person.job.employed && Math.random() < 0.22) {
        setCurrentEvent(withTarget(createTeenJobEvent(person), person));
        setState((prev) => ({ ...prev, isRunning: false }));
        lastEventAtRef.current = Date.now();
        return;
      }

      if (person.parentId && age >= 6 && age <= 18 && Math.random() < 0.2) {
        setCurrentEvent(withTarget(createSchoolPerformanceEvent(person), person));
        setState((prev) => ({ ...prev, isRunning: false }));
        lastEventAtRef.current = Date.now();
        return;
      }

      if (person.parentId && age >= 17 && age <= 22 && schoolCompleted && !person.education.inUniversity && Math.random() < 0.2) {
        setCurrentEvent(withTarget(createUniversityAdmissionsEvent(person), person));
        setState((prev) => ({ ...prev, isRunning: false }));
        lastEventAtRef.current = Date.now();
        return;
      }

      if (Math.random() < 0.14) {
        setCurrentEvent(withTarget(createPetAdoptionEvent(person), person));
        setState((prev) => ({ ...prev, isRunning: false }));
        lastEventAtRef.current = Date.now();
        return;
      }

      if (Math.random() < 0.16) {
        setCurrentEvent(withTarget(createFamilyHealthInsuranceEvent(person), person));
        setState((prev) => ({ ...prev, isRunning: false }));
        lastEventAtRef.current = Date.now();
        return;
      }

      if (Math.random() < 0.12) {
        setCurrentEvent(withTarget(createEmergencyHospitalEvent(person), person));
        setState((prev) => ({ ...prev, isRunning: false }));
        lastEventAtRef.current = Date.now();
        return;
      }

      if (age >= 55 && Math.random() < 0.18) {
        setCurrentEvent(withTarget(createRetirementPlanningEvent(person), person));
        setState((prev) => ({ ...prev, isRunning: false }));
        lastEventAtRef.current = Date.now();
        return;
      }

      if (person.hasPartner && Math.random() < 0.2) {
        setCurrentEvent(withTarget(createPartnerLifeEvent(person), person));
        setState((prev) => ({ ...prev, isRunning: false }));
        lastEventAtRef.current = Date.now();
        return;
      }

      if (person.hasPartner && Math.random() < 0.16) {
        setCurrentEvent(withTarget(createPartnerCareerEvent(person), person));
        setState((prev) => ({ ...prev, isRunning: false }));
        lastEventAtRef.current = Date.now();
        return;
      }

      if (!person.job.employed && schoolCompleted) {
        setCurrentEvent(withTarget(createApplyJobEvent(), person));
        setState((prev) => ({ ...prev, isRunning: false }));
        lastEventAtRef.current = Date.now();
        return;
      }

      if (schoolCompleted && Math.random() < 0.2) {
        setCurrentEvent(withTarget(createPromotionEvent(person.job.level), person));
        setState((prev) => ({ ...prev, isRunning: false }));
        lastEventAtRef.current = Date.now();
        return;
      }

      if (person.hasPartner && age >= 21 && age <= 40 && person.stats.happiness > 40 && person.stats.love > 38 && Math.random() < 0.42) {
        setCurrentEvent(withTarget(createAIBabyProposalEvent(person), person));
        setState((prev) => ({ ...prev, isRunning: false }));
        lastEventAtRef.current = Date.now();
        return;
      }

      if (schoolCompleted && Math.random() < 0.2) {
        setCurrentEvent(withTarget(createAICareerFocusEvent(person), person));
        setState((prev) => ({ ...prev, isRunning: false }));
        lastEventAtRef.current = Date.now();
        return;
      }

      const ev = pickRandomEvent(BASE_EVENTS, lastEventIdRef.current);
      if (!ev) return;
      lastEventIdRef.current = ev.id;
      setCurrentEvent(withTarget(ev, person));
      setState((prev) => ({ ...prev, isRunning: false }));
      lastEventAtRef.current = Date.now();
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
          job: { ...spouse.job, employed: true, salaryPerSecond: Math.max(-140, spouse.job.salaryPerSecond + effects.partnerIncomeDelta) },
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
      }
      if (bonusType) {
        next.modifiers = {
          ...prev.modifiers,
          [bonusType]: Number(((prev.modifiers[bonusType] ?? 0) + bonusValue).toFixed(2)),
        };
      }
      return next;
    });

  return {
    ...state,
    activePerson,
    selectedPerson,
    incomePerSecond,
    currentEvent,
    eventResult,
    chooseOption,
    dismissEventResult: () => setEventResult(null),
    reset,
    setIsRunning: (value) => setState((prev) => ({ ...prev, isRunning: value })),
    spendMoney,
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