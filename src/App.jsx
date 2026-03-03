import { useState } from 'react';
import './App.css';
import { EventModal } from './components/EventModal';
import { FamilyTree } from './components/FamilyTree';
import { StatCard } from './components/StatCard';
import { useGameSimulation } from './hooks/useGameSimulation';

const SHOP_SECTIONS = {
  dealership: {
    label: 'Dealership',
    items: [
      { name: 'Used Hatchback', cost: 800, description: 'Cheap starter car for family errands.' },
      { name: 'Family SUV', cost: 3200, description: 'Spacious and safe for children.' },
      { name: 'Electric Sedan', cost: 7800, description: 'Lower running costs with premium comfort.' },
    ],
  },
  housing: {
    label: 'Real Estate',
    items: [
      { name: 'Home Renovation', cost: 2500, description: 'Upgrade kitchen and living room space.' },
      { name: 'Extra House', cost: 12000, description: 'Buy a second home as an investment.' },
      { name: 'Vacation Cabin', cost: 9000, description: 'Weekend getaway for better happiness.' },
    ],
  },
  lifestyle: {
    label: 'Lifestyle',
    items: [
      { name: 'Family Vacation', cost: 1200, description: 'Take everyone on a relaxing break.' },
      { name: 'Home Gym', cost: 1600, description: 'Improve health and daily routine.' },
      { name: 'Premium Childcare', cost: 2200, description: 'Support children with better care.' },
    ],
  },
};

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
    family,
    activePerson,
    selectedPerson,
    selectPerson,
    setActivePerson,
    spendMoney,
    money,
  } = useGameSimulation();
  const [shopOpen, setShopOpen] = useState(false);
  const [shopSection, setShopSection] = useState('dealership');

  const activeSection = SHOP_SECTIONS[shopSection];

  return (
    <div className="app">
      <header className="topbar">
        <div className="brand">Family Life (Private)</div>
        <div className="controls">
          <button className="btn" onClick={() => setShopOpen(true)}>
            Open Shop
          </button>
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
        />
      </main>

      {shopOpen ? (
        <div className="modalOverlay" onClick={() => setShopOpen(false)}>
          <section className="modal shopModal" onClick={(e) => e.stopPropagation()}>
            <div className="modalTitle">Family Shop</div>
            <div className="sub">Spend money on cars, properties, and lifestyle upgrades.</div>

            <div className="shopTabs">
              {Object.entries(SHOP_SECTIONS).map(([key, section]) => (
                <button
                  key={key}
                  className={`btn tiny ${shopSection === key ? 'primary' : ''}`}
                  onClick={() => setShopSection(key)}
                >
                  {section.label}
                </button>
              ))}
            </div>

            <div className="shopList">
              {activeSection.items.map((item) => {
                const canBuy = money >= item.cost;
                return (
                  <div className="shopItem" key={item.name}>
                    <div>
                      <div className="shopTitle">{item.name}</div>
                      <div className="shopMeta">{item.description} • ${item.cost}</div>
                    </div>
                    <button className="btn tiny" disabled={!canBuy} onClick={() => spendMoney(item.cost)}>
                      Buy
                    </button>
                  </div>
                );
              })}
            </div>

            <div className="shopFooter">
              <button className="btn" onClick={() => setShopOpen(false)}>
                Close Shop
              </button>
            </div>
          </section>
        </div>
      ) : null}

      <EventModal event={currentEvent} onChoose={chooseOption} result={eventResult} onCloseResult={dismissEventResult} />
    </div>
  );
}