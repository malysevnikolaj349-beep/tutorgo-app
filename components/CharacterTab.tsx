import React from 'react';
import { Player } from '../types';

const CharacterTab: React.FC<{ player: Player }> = ({ player }) => {
  const attack = (player.equipped.weapon?.stats?.attack || 0) + (player.level * 2);
  const defense = (player.equipped.armor?.stats?.defense || 0) + (player.level * 1);

  return (
    <div className="p-6 space-y-6 animate-in fade-in zoom-in-95 duration-300">
      <div className="relative w-48 h-64 mx-auto glass-panel rounded-3xl border-2 border-yellow-600/30 flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900 to-transparent opacity-60" />
        <img src="https://picsum.photos/seed/knight/400/600" alt="Hero" className="w-full h-full object-cover grayscale-[0.3] sepia-[0.2]" />
        <div className="absolute bottom-4 left-4 right-4 flex justify-between">
           <Slot item={player.equipped.weapon} type="WEAPON" />
           <Slot item={player.equipped.armor} type="ARMOR" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <StatBox label="АТАКА" value={attack} color="text-red-500" icon="⚔️" />
        <StatBox label="ЗАЩИТА" value={defense} color="text-blue-500" icon="🛡️" />
      </div>
    </div>
  );
};

const Slot = ({ item, type }: any) => (
  <div className={`w-12 h-12 rounded-lg border-2 ${item ? 'border-yellow-500 bg-slate-900 shadow-md' : 'border-slate-700 bg-slate-800/80'} flex items-center justify-center overflow-hidden`}>
    {item ? <img src={item.imageUrl} className="w-full h-full object-cover" /> : <span className="text-[8px] text-slate-600 font-bold">{type}</span>}
  </div>
);

const StatBox = ({ label, value, color, icon }: any) => (
  <div className="glass-panel p-3 rounded-xl border border-slate-800 flex flex-col items-center">
    <span className="text-[9px] text-slate-500 font-bold mb-1">{label}</span>
    <div className={`text-xl font-bold ${color} flex items-center gap-1`}>
      <span className="text-sm">{icon}</span> {value}
    </div>
  </div>
);

export default CharacterTab;
