import React, { useEffect, useMemo, useRef, useState } from "react";
import "./App.css";

const TICK_MS = 1000; // money tick
const DAY_MS = 30000; // 30s = 1 day
const EVENT_MS = 30000; // event every 30s

const EVENTS = [
  {
    id: "ev_fee",
    title: "Unexpected fee",
    description: "A small admin fee hits your account.",
    options: [
      { text: "Pay immediately", effects: { money: -20 } },
      { text: "Dispute it (time cost)", effects: { money: -5 } },
      { text: "Ignore it (it grows)", effects: { money: -40 } },
      { text: "Ask for a waiver", effects: { money: -10 } },
    ],
  },
  {
    id: "ev_side_gig",
    title: "Side gig offer",
    description: "A short side gig appears. It's not glamorous, but it pays.",
    options: [
      { text: "Take it", effects: { money: +50, incomePerSecond: +0.2 } },
      { text: "Decline", effects: {} },
      {
        text: "Negotiate higher pay (more stress later)",
        effects: { money: +70, incomePerSecond: -0.1 },
      },
      { text: "Delay decision", effects: { money: -5 } },
    ],
  },
  {
    id: "ev_subscription",
    title: "Subscription creep",
    description: "You notice recurring subscriptions you barely use.",
    options: [
      { text: "Cancel a few", effects: { incomePerSecond: +0.15 } },
      { text: "Keep them", effects: {} },
      { text: "Downgrade to cheaper plans", effects: { incomePerSecond: +0.08 } },
      { text: "Ignore it", effects: { incomePerSecond: -0.05 } },
    ],
  },
  {
    id: "ev_impulse_buy",
    title: "Impulse buy",
    description: "Something tempting is on sale. You feel that pull.",
    options: [
      { text: "Buy it", effects: { money: -60 } },
      { text: "Wait 24 hours", effects: {} },
      { text: "Buy second-hand instead", effects: { money: -25 } },
      { text: "Sell something you don't use", effects: { money: +30 } },
    ],
  },
];

function pickRandomEvent(avoidId) {
  if (EVENTS.length === 0) return null;
  if (EVENTS.length === 1) return EVENTS[0];

  let ev = EVENTS[Math.floor(Math.random() * EVENTS.length)];
  if (avoidId && ev.id === avoidId) {
    ev = EVENTS[Math.floor(Math.random() * EVENTS.length)];
  }
  return ev;
}

function clampMoney(n) {
  if (!Number.isFinite(n)) return 0;
  return n;
}

export default function App() {
  // --- core sim state ---
  const [money, setMoney] = useState(100);
  const [incomePerSecond, setIncomePerSecond] = useState(1); // can be negative

  // time model (combined to avoid setState in effect for aging)
  const [time, setTime] = useState({ age: 24, dayOfYear: 1, yearsPassed: 0 });

  // event state
  const [currentEvent, setCurrentEvent] = useState(null);
  const lastEventIdRef = useRef(null);

  // run/pause
  const [isRunning, setIsRunning] = useState(false);

  // Keep latest values for intervals (avoid stale closures)
  const moneyRef = useRef(money);
  const incomeRef = useRef(incomePerSecond);
  const eventOpenRef = useRef(false);

  useEffect(() => {
    moneyRef.current = money;
  }, [money]);

  useEffect(() => {
    incomeRef.current = incomePerSecond;
  }, [incomePerSecond]);

  useEffect(() => {
    eventOpenRef.current = !!currentEvent;
  }, [currentEvent]);

  // 1) money tick every second
  useEffect(() => {
    if (!isRunning) return;

    const id = setInterval(() => {
      const next = clampMoney(moneyRef.current + incomeRef.current);
      moneyRef.current = next;
      setMoney(next);
    }, TICK_MS);

    return () => clearInterval(id);
  }, [isRunning]);

  // 2) day progression every 30 seconds (30s = 1 day) + aging handled here
  useEffect(() => {
    if (!isRunning) return;

    const id = setInterval(() => {
      setTime((t) => {
        let nextDay = t.dayOfYear + 1;
        let nextAge = t.age;
        let nextYears = t.yearsPassed;

        if (nextDay > 365) {
          nextDay = 1;
          nextAge += 1;
          nextYears += 1;
        }

        return { age: nextAge, dayOfYear: nextDay, yearsPassed: nextYears };
      });
    }, DAY_MS);

    return () => clearInterval(id);
  }, [isRunning]);

  // 3) event every 30 seconds, only if no event is open
  useEffect(() => {
    if (!isRunning) return;

    const id = setInterval(() => {
      if (eventOpenRef.current) return; // don't stack events
      const ev = pickRandomEvent(lastEventIdRef.current);
      if (!ev) return;
      lastEventIdRef.current = ev.id;
      setCurrentEvent(ev);
    }, EVENT_MS);

    return () => clearInterval(id);
  }, [isRunning]);

  function applyEffects(effects) {
    if (!effects) return;

    if (typeof effects.money === "number") {
      setMoney((m) => {
        const next = clampMoney(m + effects.money);
        moneyRef.current = next;
        return next;
      });
    }

    if (typeof effects.incomePerSecond === "number") {
      setIncomePerSecond((inc) => {
        const next = inc + effects.incomePerSecond;
        incomeRef.current = next;
        return next;
      });
    }
  }

  function chooseOption(index) {
    if (!currentEvent) return;
    const opt = currentEvent.options?.[index];
    if (!opt) return;
    applyEffects(opt.effects);
    setCurrentEvent(null);
  }

  function reset() {
    setIsRunning(false);
    setMoney(100);
    setIncomePerSecond(1);
    setTime({ age: 24, dayOfYear: 1, yearsPassed: 0 });
    setCurrentEvent(null);
    lastEventIdRef.current = null;

    // refresh refs
    moneyRef.current = 100;
    incomeRef.current = 1;
    eventOpenRef.current = false;
  }

  const moneyDisplay = useMemo(() => {
    const n = Math.round(money);
    const sign = n < 0 ? "-" : "";
    const abs = Math.abs(n);
    return `${sign}€${abs.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")}`;
  }, [money]);

  const { age, dayOfYear, yearsPassed } = time;

  return (
    <div className="app">
      <header className="topbar">
        <div className="brand">Family Life (Private)</div>
        <div className="controls">
          {!isRunning ? (
            <button className="btn primary" onClick={() => setIsRunning(true)}>
              Start
            </button>
          ) : (
            <button className="btn primary" onClick={() => setIsRunning(false)}>
              Pause
            </button>
          )}
          <button className="btn" onClick={reset}>
            Reset
          </button>
        </div>
      </header>

      <main className="grid">
        <section className="card">
          <div className="label">Money</div>
          <div className="value">{moneyDisplay}</div>
          <div className="sub">
            Income/sec: <b>{incomePerSecond.toFixed(2)}</b>
          </div>
        </section>

        <section className="card">
          <div className="label">Time</div>
          <div className="value">Day {dayOfYear}/365</div>
          <div className="sub">
            Age: <b>{age}</b> &nbsp;•&nbsp; Years passed: <b>{yearsPassed}</b>
          </div>
        </section>

        <section className="card wide">
          <div className="label">Rules (as implemented)</div>
          <ul className="list">
            <li>Every 1 second: money += incomePerSecond (positive or negative)</li>
            <li>Every 30 seconds: day +1</li>
            <li>Every 365 days: age +1</li>
            <li>Every 30 seconds: random event (4 options). Event won’t stack until chosen.</li>
          </ul>
        </section>
      </main>

      {currentEvent && (
        <div className="modalOverlay" role="dialog" aria-modal="true">
          <div className="modal">
            <div className="modalTitle">{currentEvent.title}</div>
            <div className="modalBody">{currentEvent.description}</div>

            <div className="choices">
              {currentEvent.options.map((opt, idx) => (
                <button key={idx} className="btn choice" onClick={() => chooseOption(idx)}>
                  {opt.text}
                </button>
              ))}
            </div>

            <div className="hint">An event appears every 30 seconds while the game is running.</div>
          </div>
        </div>
      )}
    </div>
  );
}