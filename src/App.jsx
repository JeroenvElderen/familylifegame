import './App.css';
import { EventModal } from './components/EventModal';
import { FamilyTree } from './components/FamilyTree';
import { StatCard } from './components/StatCard';
import { useGameSimulation } from './hooks/useGameSimulation';

export default function App() {
  const {
    moneyDisplay,
    incomePerSecond,
    time,
    isRunning,
    setIsRunning,
    reset,
    currentEvent,
    chooseOption,
    relationship,
    family,
  } = useGameSimulation();

  return (
    <div className="app">
      <header className="topbar">
        <div className="brand">Family Life (Private)</div>
        <div className="controls">
          <button className="btn primary" onClick={() => setIsRunning(!isRunning)}>
            {isRunning ? 'Pause' : 'Start'}
          </button>
          <button className="btn" onClick={reset}>
            Reset
          </button>
        </div>
      </header>

      <main className="grid">
        <StatCard
          label="Money"
          value={moneyDisplay}
          sub={
            <>
              Income/sec: <b>{incomePerSecond.toFixed(2)}</b>
            </>
          }
        />

        <StatCard
          label="Time"
          value={`Day ${time.dayOfYear}/365`}
          sub={
            <>
              Age: <b>{time.age}</b> • Years passed: <b>{time.yearsPassed}</b>
            </>
          }
        />

        <FamilyTree family={family} relationship={relationship} />
      </main>

      <EventModal event={currentEvent} onChoose={chooseOption} />
    </div>
  );
}