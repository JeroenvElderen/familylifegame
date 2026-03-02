import './App.css';
import { EventModal } from './components/EventModal';
import { FamilyTree } from './components/FamilyTree';
import { StatCard } from './components/StatCard';
import { useGameSimulation } from './hooks/useGameSimulation';

export default function App() {
  const {
    moneyDisplay,
    incomePerSecond,
    dateDisplay,
    yearsPassed,
    isRunning,
    setIsRunning,
    reset,
    currentEvent,
    chooseOption,
    eventResult,
    dismissEventResult,
    cashPopups,
    family,
    activePerson,
    selectedPerson,
    selectPerson,
    setActivePerson,
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
              Net/sec: <b>{incomePerSecond.toFixed(2)}</b>
            </>
          }
        />

        <StatCard
          label="Date"
          value={dateDisplay}
          sub={
            <>
              Age: <b>{Math.floor(activePerson.ageDays / 365)}</b> • Years passed: <b>{yearsPassed}</b>
            </>
          }
        />

        <FamilyTree
          family={family}
          activePerson={activePerson}
          selectedPerson={selectedPerson}
          onSelectPerson={selectPerson}
          onActivatePerson={setActivePerson}
          cashPopups={cashPopups}
        />
      </main>

      <EventModal event={currentEvent} onChoose={chooseOption} result={eventResult} onCloseResult={dismissEventResult} />
    </div>
  );
}