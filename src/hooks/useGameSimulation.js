import { useEffect, useMemo, useRef, useState } from 'react';
import {
  BASE_EVENTS,
  createAIBabyProposalEvent,
  createAICareerFocusEvent,
  createApplyJobEvent,
  createBabyNamingEvent,
  createGirlfriendEvent,
  createMarriageEvent,
  createPromotionEvent,
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
  TICK_MS,
} from '../utils/gameUtils';

let personIdCounter = 1;

const randomTraits = () => {
  const pool = ['Romantic', 'Charming', 'Genius', 'Triplet Luck', 'Ambitious', 'Careful with money'];
  return [...pool].sort(() => Math.random() - 0.5).slice(0, 2);
};

const withTarget = (event, person) => ({ ...event, targetPersonId: person.id, targetPersonName: person.name });

const createPerson = ({ ageYears = 21, parentId = null, name, joinedDay = 1 } = {}) => ({
  id: `p_${personIdCounter++}`,
  name: name ?? generatePersonName(),
  avatar: randomAvatar(),
  ageDays: ageYears * DAYS_PER_YEAR,
  joinedDay,
  parentId,
  childrenIds: [],
  partnerName: null,
  partnerAvatar: null,
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
  childCostPerSecond: 0,
});

const initialState = () => {
  const founder = createPerson({ ageYears: 21, joinedDay: 1 });
  return {
    money: 1000,
    isRunning: false,
    day: 1,
    yearsPassed: 0,
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
  const [pendingEvent, setPendingEvent] = useState(null);
  const [eventResult, setEventResult] = useState(null);
  const [pendingBabyParentId, setPendingBabyParentId] = useState(null);
  const [cashPopups, setCashPopups] = useState({});
  const lastEventIdRef = useRef(null);
  const latestStateRef = useRef(state);
  const currentEventRef = useRef(currentEvent);
  const pendingEventRef = useRef(pendingEvent);
  const lastEventAtRef = useRef(0);

  useEffect(() => {
    latestStateRef.current = state;
  }, [state]);

  useEffect(() => {
    currentEventRef.current = currentEvent;
  }, [currentEvent]);

  useEffect(() => {
    pendingEventRef.current = pendingEvent;
  }, [pendingEvent]);

  const absoluteDay = state.yearsPassed * DAYS_PER_YEAR + state.day;
  const activePerson = state.family.people[state.family.activePersonId];
  const selectedPerson = state.family.people[state.family.selectedPersonId];
  const incomePerSecond = (activePerson?.job.salaryPerSecond ?? 0) - (activePerson?.childCostPerSecond ?? 0);

  useEffect(() => {
    if (!state.isRunning) return;
    const id = setInterval(() => {
      setState((prev) => {
        const person = prev.family.people[prev.family.activePersonId];
        if (!person) return prev;
        const netIncome = person.job.salaryPerSecond - person.childCostPerSecond;
        return { ...prev, money: clampNumber(prev.money + netIncome) };
      });

      const people = latestStateRef.current.family.people;
      const nextPopups = {};
      Object.values(people).forEach((person) => {
        const net = person.job.salaryPerSecond - person.childCostPerSecond;
        if (!net) return;
        nextPopups[person.id] = {
          id: `${person.id}_${Date.now()}`,
          text: `${net > 0 ? '+' : ''}${net}/s`,
          type: net > 0 ? 'gain' : 'cost',
        };
      });
      setCashPopups(nextPopups);
    }, TICK_MS);
    return () => clearInterval(id);
  }, [state.isRunning]);

  useEffect(() => {
    if (!state.isRunning) return;
    const id = setInterval(() => {
      setState((prev) => {
        const person = prev.family.people[prev.family.activePersonId];
        if (!person) return prev;
        const nextDay = prev.day + 1;
        const wraps = nextDay > DAYS_PER_YEAR;

        return {
          ...prev,
          day: wraps ? 1 : nextDay,
          yearsPassed: wraps ? prev.yearsPassed + 1 : prev.yearsPassed,
          family: {
            ...prev.family,
            people: {
              ...prev.family.people,
              [person.id]: {
                ...person,
                ageDays: person.ageDays + 1,
              },
            },
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
      const minGap = EVENT_MS + people.length * 1500;
      if (Date.now() - lastEventAtRef.current < minGap) return;

      if (pendingEventRef.current) {
        setCurrentEvent(pendingEventRef.current);
        setPendingEvent(null);
        lastEventAtRef.current = Date.now();
        return;
      }

      const currentAbsoluteDay = snapshot.yearsPassed * DAYS_PER_YEAR + snapshot.day;
      const eligiblePeople = people.filter((person) => currentAbsoluteDay - person.joinedDay >= 30);
      const person = eligiblePeople.length
        ? eligiblePeople[Math.floor(Math.random() * eligiblePeople.length)]
        : snapshot.family.people[snapshot.family.activePersonId];
      if (!person) return;
      const age = Math.floor(person.ageDays / DAYS_PER_YEAR);

      if (!person.hasPartner && age >= 12 && Math.random() < 0.25) {
        setCurrentEvent(withTarget(createGirlfriendEvent(person), person));
        lastEventAtRef.current = Date.now();
        return;
      }

      if (person.hasPartner && !person.married && age >= 18 && Math.random() < 0.2) {
        setCurrentEvent(withTarget(createMarriageEvent(person), person));
        lastEventAtRef.current = Date.now();
        return;
      }

      if (!person.job.employed) {
        setCurrentEvent(withTarget(createApplyJobEvent(), person));
        lastEventAtRef.current = Date.now();
        return;
      }

      if (Math.random() < 0.2) {
        setCurrentEvent(withTarget(createPromotionEvent(person.job.level), person));
        lastEventAtRef.current = Date.now();
        return;
      }

      if (person.hasPartner && age >= 19 && person.stats.happiness > 45 && person.stats.love > 42 && Math.random() < 0.25) {
        setCurrentEvent(withTarget(createAIBabyProposalEvent(person), person));
        lastEventAtRef.current = Date.now();
        return;
      }

      if (Math.random() < 0.2) {
        setCurrentEvent(withTarget(createAICareerFocusEvent(person), person));
        lastEventAtRef.current = Date.now();
        return;
      }

      const ev = pickRandomEvent(BASE_EVENTS, lastEventIdRef.current);
      if (!ev) return;
      lastEventIdRef.current = ev.id;
      setCurrentEvent(withTarget(ev, person));
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

      if (effects.hasPartner) {
        updated.hasPartner = true;
        updated.partnerName = updated.partnerName ?? generatePersonName();
        updated.partnerAvatar = updated.partnerAvatar ?? randomAvatar();
      }

      if (effects.losePartner) {
        updated.hasPartner = false;
        updated.married = false;
        updated.partnerName = null;
        updated.partnerAvatar = null;
      }

      if (effects.married) {
        updated.married = true;
        updated.hasPartner = true;
        updated.partnerAvatar = updated.partnerAvatar ?? randomAvatar();
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

      if (effects.promote) {
        updated.job = {
          ...updated.job,
          level: updated.job.level + 1,
          salaryPerSecond: Math.round(updated.job.salaryPerSecond * (1.15 + Math.random() * 0.15)),
        };
      }

      nextPerson = updated;
      return {
        ...prev,
        money: clampNumber(prev.money + (effects.money ?? 0)),
        family: {
          ...prev.family,
          people: {
            ...prev.family.people,
            [updated.id]: updated,
          },
        },
      };
    });

    if (effects.action === 'startBabyNaming') {
      setPendingBabyParentId(targetPersonId ?? state.family.activePersonId);
      setPendingEvent(createBabyNamingEvent());
    }

    if (effects.action === 'refreshJobs') {
      setPendingEvent(createApplyJobEvent());
    }

    if (effects.action === 'nameBaby' && pendingBabyParentId) {
      setState((prev) => {
        const parent = prev.family.people[pendingBabyParentId];
        if (!parent) return prev;
        const newBaby = createPerson({ ageYears: 0, parentId: parent.id, name: effects.babyName, joinedDay: absoluteDay });
        newBaby.job = { employed: false, title: 'Child', level: 0, salaryPerSecond: 0 };
        newBaby.childCostPerSecond = 60;

        const parentUpdated = {
          ...parent,
          childrenIds: [...parent.childrenIds, newBaby.id],
          childCostPerSecond: parent.childCostPerSecond + 60,
        };

        return {
          ...prev,
          family: {
            ...prev.family,
            people: {
              ...prev.family.people,
              [parentUpdated.id]: parentUpdated,
              [newBaby.id]: newBaby,
            },
          },
        };
      });
      setPendingBabyParentId(null);
    }

    return nextPerson;
  };

  const chooseOption = (idx) => {
    const option = currentEvent?.options?.[idx];
    if (!option) return;
    const targetPersonId = currentEvent?.targetPersonId ?? state.family.activePersonId;
    const targetPerson = state.family.people[targetPersonId];
    const updatedPerson = applyEffects(option.effects, targetPersonId) ?? targetPerson;
    setEventResult({
      personName: targetPerson?.name,
      summary: summarizeEffects(option.effects),
      stats: updatedPerson?.stats ?? targetPerson?.stats,
      option: option.text,
    });
    setCurrentEvent(null);
  };

  const reset = () => {
    personIdCounter = 1;
    setState(initialState());
    setCurrentEvent(null);
    setPendingEvent(null);
    setPendingBabyParentId(null);
    setEventResult(null);
    setCashPopups({});
    lastEventIdRef.current = null;
    lastEventAtRef.current = 0;
  };

  return {
    ...state,
    activePerson,
    selectedPerson,
    incomePerSecond,
    currentEvent,
    eventResult,
    cashPopups,
    chooseOption,
    dismissEventResult: () => setEventResult(null),
    reset,
    setIsRunning: (value) => setState((prev) => ({ ...prev, isRunning: value })),
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