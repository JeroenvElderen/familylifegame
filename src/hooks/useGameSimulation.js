import { useEffect, useMemo, useRef, useState } from 'react';
import {
  BASE_EVENTS,
  createGirlfriendEvent,
  createMarriageEvent,
  createSchoolEvent,
  PREGNANCY_EVENT,
} from '../data/events';
import {
  clampNumber,
  DAYS_PER_YEAR,
  DAY_MS,
  EVENT_MS,
  formatMoney,
  LOVE_TICK_MS,
  pickRandomEvent,
  randomAvatar,
  TICK_MS,
} from '../utils/gameUtils';

const initialState = () => ({
  money: 100,
  incomePerSecond: 1,
  isRunning: false,
  time: { age: 24, dayOfYear: 1, yearsPassed: 0 },
  relationship: { happiness: 50, love: 30, hasPartner: false, married: false },
  family: {
    parentA: { avatar: randomAvatar() },
    parentB: { avatar: randomAvatar() },
    child: null,
  },
});

export function useGameSimulation() {
  const [state, setState] = useState(initialState);
  const [currentEvent, setCurrentEvent] = useState(null);
  const [pendingEvent, setPendingEvent] = useState(null);
  const lastEventIdRef = useRef(null);
  const eventOpenRef = useRef(false);

  useEffect(() => {
    eventOpenRef.current = !!currentEvent;
  }, [currentEvent]);

  const maybeQueueMilestoneEvents = (draft) => {
    const child = draft.family.child;
    if (!child) return null;

    if (child.age >= 6 && !child.school.primaryChosen) return createSchoolEvent('primary');
    if (child.age >= 12 && !child.school.middleChosen) return createSchoolEvent('middle');
    if (child.age >= 15 && !child.school.afterMiddleChosen) return createSchoolEvent('afterMiddle');
    if (child.age >= 13 && !child.milestones.teenDatingShown) return createGirlfriendEvent();
    if (
      child.age >= 18 &&
      draft.relationship.hasPartner &&
      !child.milestones.marriageShown
    ) {
      return createMarriageEvent();
    }
    return null;
  };

  useEffect(() => {
    if (!state.isRunning) return;
    const id = setInterval(() => {
      setState((prev) => ({ ...prev, money: clampNumber(prev.money + prev.incomePerSecond) }));
    }, TICK_MS);
    return () => clearInterval(id);
  }, [state.isRunning]);

  useEffect(() => {
    if (!state.isRunning) return;
    const id = setInterval(() => {
      setState((prev) => {
        const day = prev.time.dayOfYear + 1;
        const willWrap = day > DAYS_PER_YEAR;
        const nextTime = {
          age: willWrap ? prev.time.age + 1 : prev.time.age,
          yearsPassed: willWrap ? prev.time.yearsPassed + 1 : prev.time.yearsPassed,
          dayOfYear: willWrap ? 1 : day,
        };

        const nextChild = prev.family.child
          ? {
              ...prev.family.child,
              ageDays: prev.family.child.ageDays + 1,
              age: Math.floor((prev.family.child.ageDays + 1) / DAYS_PER_YEAR),
            }
          : null;

        const next = {
          ...prev,
          time: nextTime,
          family: { ...prev.family, child: nextChild },
        };

        const milestoneEvent = maybeQueueMilestoneEvents(next);
        if (milestoneEvent) setPendingEvent(milestoneEvent);
        return next;
      });
    }, DAY_MS);
    return () => clearInterval(id);
  }, [state.isRunning]);

  useEffect(() => {
    if (!state.isRunning) return;
    const id = setInterval(() => {
      setState((prev) => ({
        ...prev,
        relationship: { ...prev.relationship, love: prev.relationship.love + 1 },
      }));
    }, LOVE_TICK_MS);
    return () => clearInterval(id);
  }, [state.isRunning]);

  useEffect(() => {
    if (!state.isRunning) return;
    const id = setInterval(() => {
      if (eventOpenRef.current) return;
      if (pendingEvent) {
        setCurrentEvent(pendingEvent);
        setPendingEvent(null);
        return;
      }

      const eventPool = [...BASE_EVENTS];
      if (!state.family.child) eventPool.push(PREGNANCY_EVENT);

      const ev = pickRandomEvent(eventPool, lastEventIdRef.current);
      if (!ev) return;
      lastEventIdRef.current = ev.id;
      setCurrentEvent(ev);
    }, EVENT_MS);

    return () => clearInterval(id);
  }, [state.isRunning, state.family.child, pendingEvent]);

  const applyEffects = (effects) => {
    if (!effects) return;
    setState((prev) => {
      let next = {
        ...prev,
        money: clampNumber(prev.money + (effects.money ?? 0)),
        incomePerSecond: prev.incomePerSecond + (effects.incomePerSecond ?? 0),
        relationship: {
          ...prev.relationship,
          happiness: prev.relationship.happiness + (effects.happiness ?? 0),
          love: prev.relationship.love + (effects.love ?? 0),
          hasPartner: effects.hasPartner ?? prev.relationship.hasPartner,
          married: effects.married ?? prev.relationship.married,
        },
      };

      if (effects.action === 'haveBaby' && !next.family.child) {
        next = {
          ...next,
          family: {
            ...next.family,
            child: {
              avatar: randomAvatar(),
              ageDays: 0,
              age: 0,
              intelligence: 5,
              expensePerSecond: 0.6,
              incomePerSecond: 0,
              school: { primaryChosen: false, middleChosen: false, afterMiddleChosen: false },
              milestones: { teenDatingShown: false, marriageShown: false },
            },
          },
          incomePerSecond: next.incomePerSecond - 0.6,
          relationship: { ...next.relationship, happiness: next.relationship.happiness + 5, love: next.relationship.love + 4 },
        };
      }

      if (next.family.child) {
        const updatedChild = {
          ...next.family.child,
          intelligence: next.family.child.intelligence + (effects.intelligence ?? 0),
          expensePerSecond: Math.max(0, next.family.child.expensePerSecond + (effects.childExpense ?? 0)),
          incomePerSecond: Math.max(0, next.family.child.incomePerSecond + (effects.childIncome ?? 0)),
        };

        if (currentEvent?.id === 'girlfriend_event') updatedChild.milestones.teenDatingShown = true;
        if (currentEvent?.id === 'marriage_event') updatedChild.milestones.marriageShown = true;
        if (currentEvent?.id === 'school_primary') updatedChild.school.primaryChosen = true;
        if (currentEvent?.id === 'school_middle') updatedChild.school.middleChosen = true;
        if (currentEvent?.id === 'post_middle_path') updatedChild.school.afterMiddleChosen = true;

        const netChildDelta = updatedChild.incomePerSecond - updatedChild.expensePerSecond;
        const prevNetChildDelta = next.family.child.incomePerSecond - next.family.child.expensePerSecond;

        next = {
          ...next,
          incomePerSecond: next.incomePerSecond + (netChildDelta - prevNetChildDelta),
          family: { ...next.family, child: updatedChild },
        };
      }

      return next;
    });
  };

  const chooseOption = (idx) => {
    const option = currentEvent?.options?.[idx];
    if (!option) return;
    applyEffects(option.effects);
    setCurrentEvent(null);
  };

  const reset = () => {
    setState(initialState());
    setCurrentEvent(null);
    setPendingEvent(null);
    lastEventIdRef.current = null;
    eventOpenRef.current = false;
  };

  return {
    ...state,
    currentEvent,
    chooseOption,
    reset,
    setIsRunning: (value) => setState((prev) => ({ ...prev, isRunning: value })),
    moneyDisplay: useMemo(() => formatMoney(state.money), [state.money]),
  };
}