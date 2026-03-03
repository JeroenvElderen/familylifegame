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
      { name: 'Used Hatchback', cost: 6500, upkeep: 45, recurringType: 'maintenance', assetType: 'cars', description: 'Older second-hand city car (Irish used market).' },
      { name: 'Family SUV', cost: 34000, upkeep: 120, recurringType: 'maintenance', assetType: 'cars', description: 'Spacious SUV with realistic loan + running costs.' },
      { name: 'Electric Sedan', cost: 47000, upkeep: 98, recurringType: 'maintenance', assetType: 'cars', description: 'Higher upfront cost, lower fuel spend.' },
    ],
  },
  housing: {
    label: 'Real Estate',
    items: [
      { name: 'Home Renovation', cost: 28000, upkeep: 42, recurringType: 'maintenance', description: 'Major kitchen + insulation upgrade.' },
      { name: 'Extra House', cost: 290000, upkeep: 760, recurringType: 'housing', assetType: 'houses', description: 'Second property in current Irish market conditions.' },
      { name: 'Vacation Cabin', cost: 210000, upkeep: 520, recurringType: 'housing', assetType: 'houses', description: 'Holiday home with realistic upkeep and taxes.' },
    ],
  },
  renovation: {
    label: 'Renovation (Under Renovation)',
    items: [
      { name: 'New Furniture Package', cost: 14000, description: 'Boosts family comfort and monthly happiness.', bonusType: 'homeComfort', bonusValue: 2 },
      { name: 'Child Room Upgrade', cost: 9000, description: 'Improves children mood and lowers stress at home.', bonusType: 'homeComfort', bonusValue: 1 },
      { name: 'Energy Smart Setup', cost: 11000, description: 'Smarter heating/lights reduces long-term weather utility spikes.', bonusType: 'weatherResilience', bonusValue: 0.08 },
    ],
  },
  lifestyle: {
    label: 'Lifestyle',
    items: [
      { name: 'Family Vacation', cost: 3400, description: 'Take everyone on a realistic short break.' },
      { name: 'Home Gym', cost: 2600, description: 'Improve health and daily routine.' },
      { name: 'Premium Childcare', cost: 14500, description: 'Support children with better quality care.' },
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
    spendMoney,
    money,
    recurringExpensesPerSecond,
    weather,
    city,
    monthlySummary,
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
        />

        <section className="card">
          <div className="label">Procedural City Map</div>
          <div className="sub">District: <b>{city.name}</b></div>
          <div className="cityGrid">
            {city.amenities.map((amenity) => (
              <div key={amenity.name} className="cityTile">
                <div className="shopTitle">{amenity.name}</div>
                <div className="shopMeta">{amenity.effect}</div>
              </div>
            ))}
          </div>
        </section>

        <section className="card">
          <div className="label">Weather & Economy</div>
          <div className="value" style={{ fontSize: 22 }}>{weather.month} • {weather.type}</div>
          <div className="sub">Cost pressure: <b>{Math.round(weather.costMultiplier * 100)}%</b> of base household costs this month.</div>
          <div className="sub">Last monthly update: {monthlySummary}</div>
        </section>
      </main>

      {shopOpen ? (
        <div className="modalOverlay" onClick={() => setShopOpen(false)}>
          <section className="modal shopModal" onClick={(e) => e.stopPropagation()}>
            <div className="modalTitle">Family Shop</div>
            <div className="sub">Spend money on cars, properties, and lifestyle upgrades.</div>
            <div className="sub">Recurring bills/s: <b>{Object.values(recurringExpensesPerSecond).reduce((a, b) => a + b, 0)}</b> (includes rent/mortgage, upkeep, insurance, weather pressure)</div>

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
                      <div className="shopMeta">{item.description} • €{item.cost}{item.upkeep ? ` • upkeep ${item.upkeep}/s` : ''}</div>
                    </div>
                    <button
                      className="btn tiny"
                      disabled={!canBuy}
                      onClick={() => spendMoney(item.cost, item.recurringType, item.upkeep ?? 0, item.assetType, item.bonusType, item.bonusValue)}
                    >
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