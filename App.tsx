import React, { useState, useEffect } from 'react';
import { Player, TabType, Item, Quest } from './types';
import { INITIAL_ITEMS, INITIAL_QUESTS } from './constants';
import { generateNewQuest } from './services/geminiService';
import StatsHeader from './components/StatsHeader';
import InventoryTab from './components/InventoryTab';
import ShopTab from './components/ShopTab';
import QuestsTab from './components/QuestsTab';
import AdventureLog from './components/AdventureLog';
import AdminPanel from './components/AdminPanel';
import CharacterTab from './components/CharacterTab';

const ADMIN_ID = 6240695985;

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('CHARACTER');
  const [isLoadingQuests, setIsLoadingQuests] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isReady, setIsReady] = useState(false);
  
  const [player, setPlayer] = useState<Player>({
    id: 0,
    name: 'Герой',
    level: 1,
    xp: 0,
    maxXp: 100,
    hp: 100,
    maxHp: 100,
    mana: 50,
    maxMana: 50,
    gold: 50,
    inventory: [...INITIAL_ITEMS],
    equipped: {}
  });

  const [quests, setQuests] = useState<Quest[]>(INITIAL_QUESTS);

  useEffect(() => {
    const tg = (window as any).Telegram?.WebApp;
    if (tg) {
      tg.ready();
      tg.expand();
      const user = tg.initDataUnsafe?.user;
      if (user) {
        setPlayer(prev => ({ ...prev, name: user.first_name, id: user.id }));
        if (user.id === ADMIN_ID) setIsAdmin(true);
      } else {
        setIsAdmin(true);
      }
    } else {
      setIsAdmin(true);
    }
    setIsReady(true);
    document.body.classList.add('loaded');
  }, []);

  const onBattleEnd = (res: any) => {
    setPlayer(p => ({
      ...p,
      gold: p.gold + res.gold,
      xp: p.xp + res.xp,
      hp: Math.max(0, p.hp - res.damage)
    }));
  };

  if (!isReady) return null;

  return (
    <div className="flex flex-col h-screen bg-slate-950 text-slate-100 overflow-hidden max-w-md mx-auto relative border-x border-slate-900 shadow-2xl">
      <StatsHeader player={player} />
      <main className="flex-1 overflow-y-auto pb-24">
        {activeTab === 'CHARACTER' && <CharacterTab player={player} />}
        {activeTab === 'INVENTORY' && <InventoryTab player={player} onEquip={() => {}} onSell={() => {}} />}
        {activeTab === 'SHOP' && <ShopTab player={player} onBuy={() => {}} />}
        {activeTab === 'QUESTS' && <QuestsTab player={player} quests={quests} onAccept={() => {}} onGenerate={() => {}} isLoading={isLoadingQuests} />}
        {activeTab === 'ADVENTURE' && <AdventureLog player={player} onBattleEnd={onBattleEnd} />}
        {activeTab === 'ADMIN' && isAdmin && <AdminPanel />}
      </main>
      <nav className="fixed bottom-0 left-0 right-0 h-20 bg-slate-900/95 backdrop-blur-xl border-t border-white/5 flex items-center justify-around px-2 pb-2 z-[100] max-w-md mx-auto shadow-[0_-5px_20px_rgba(0,0,0,0.8)]">
        <NavButton active={activeTab === 'CHARACTER'} onClick={() => setActiveTab('CHARACTER')} label="Герой" icon="👤" />
        <NavButton active={activeTab === 'INVENTORY'} onClick={() => setActiveTab('INVENTORY')} label="Вещи" icon="🎒" />
        <div className="relative -top-3">
           <button onClick={() => setActiveTab('ADVENTURE')} className={`w-14 h-14 rounded-full border-2 flex items-center justify-center transition-all ${activeTab === 'ADVENTURE' ? 'bg-red-600 border-red-400 scale-110 shadow-[0_0_15px_rgba(239,68,68,0.4)]' : 'bg-slate-800 border-slate-700'}`}>
             <span className="text-2xl leading-none">⚔️</span>
           </button>
        </div>
        <NavButton active={activeTab === 'QUESTS'} onClick={() => setActiveTab('QUESTS')} label="Квесты" icon="📜" />
        <NavButton active={activeTab === 'ADMIN'} onClick={() => setActiveTab('ADMIN')} label="Админ" icon="⚙️" />
      </nav>
    </div>
  );
};

const NavButton = ({ active, onClick, label, icon }: any) => (
  <button onClick={onClick} className={`flex flex-col items-center justify-center w-14 transition-all ${active ? 'text-yellow-500' : 'text-slate-500'}`}>
    <span className="text-xl mb-1 transition-transform ${active ? 'scale-125' : ''} shadow-white shadow-sm rounded-full bg-slate-800 p-1 mb-1 font-bold"> {icon} </span>
    <span className="text-[8px] font-bold uppercase tracking-tight">{label}</span>
  </button>
);

export default App;
