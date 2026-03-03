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
  const pool = ['Romantic', 'Charming', 'Genius', 'Triplet Luck', 'Ambitious', 'Careful with money'];
  return [...pool].sort(() => Math.random() - 0.5).slice(0, 2);
};

const withTarget = (event, person) => ({ ...event, targetPersonId: person.id, targetPersonName: person.name });

const SCHOOL_DAYS_PER_STAGE = SCHOOL_STAGE_YEARS * DAYS_PER_YEAR;
const SCHOOL_START_AGE = 6;

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
  return {
    money: 1000,
    isRunning: false,
    day: 1,
    yearsPassed: 0,
    recurringExpensesPerSecond: {
      housing: 28,
      maintenance: 0,
      children: 0,
      pets: 0,
      insurance: 0,
      university: 0,
    },
    assets: {
      cars: 0,
      houses: 0,
      mortgages: 0,
      rentActive: true,
      pets: 0,
      insurancePlan: 'none',
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

        return {
          ...prev,
          day: wraps ? 1 : nextDay,
          yearsPassed: wraps ? prev.yearsPassed + 1 : prev.yearsPassed,
          family: {
            ...prev.family,
            people: updatedPeople,
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

      if (person.hasPartner && age >= 19 && person.stats.happiness > 45 && person.stats.love > 42 && Math.random() < 0.25) {
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
        updated.job = { employed: false, title: 'Unemployed', level: 0, salaryPerSecond: 0 };
      }

      if (effects.jobTitle) {
        updated.job = {
          employed: true,
          title: effects.jobTitle,
          level: 1,
          salaryPerSecond: effects.salaryPerSecond,
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
        setPendingBabyParentId(targetPersonId ?? state.family.activePersonId);
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
        const parent = prev.family.people[pendingBabyParentId];
        if (!parent) return prev;
        const newBaby = createPerson({ ageYears: 0, parentId: parent.id, name: effects.babyName, joinedDay: absoluteDay });
        newBaby.job = { employed: false, title: 'Child', level: 0, salaryPerSecond: 0 };
        newBaby.education = {
          completed: false,
          schoolStartDay: absoluteDay + SCHOOL_START_AGE * DAYS_PER_YEAR,
          performance: 55,
          inUniversity: false,
        };
        
        const parentUpdated = {
          ...parent,
          childrenIds: [...parent.childrenIds, newBaby.id],
        };

        const nextPeople = {
          ...prev.family.people,
          [parentUpdated.id]: parentUpdated,
          [newBaby.id]: newBaby,
        };

        if (parent.spouseId && nextPeople[parent.spouseId]) {
          nextPeople[parent.spouseId] = {
            ...nextPeople[parent.spouseId],
            childrenIds: [...nextPeople[parent.spouseId].childrenIds, newBaby.id],
          };
        }

        return {
          ...prev,
          recurringExpensesPerSecond: {
            ...prev.recurringExpensesPerSecond,
            children: prev.recurringExpensesPerSecond.children + 60,
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

  const spendMoney = (amount, recurringType = null, recurringDelta = 0, assetType = null) =>
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