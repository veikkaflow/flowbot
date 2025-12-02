
import React from 'react';
import { PlusSquare, Zap } from './Icons.tsx';
import { useLanguage } from '../context/LanguageContext.tsx';

interface SimulationControlsProps {
  onAddSimulation: () => void;
  onAddLiveChat: () => void;
}

const SimulationControls: React.FC<SimulationControlsProps> = ({ onAddSimulation, onAddLiveChat }) => {
  const { t } = useLanguage();
  
  return (
    <div className="flex items-center gap-2">
      <button
        onClick={onAddSimulation}
        className="flex items-center justify-center gap-2 px-3 py-2 text-sm bg-gray-700 hover:bg-gray-600 rounded-md text-gray-300 hover:text-white transition-colors"
        title="Avaa simuloitu chat (ei tallennu tietokantaan)"
      >
        <PlusSquare className="w-5 h-5" />
        <span className="hidden md:inline">{t('sim.add')}</span>
      </button>
      <button
        onClick={onAddLiveChat}
        className="flex items-center justify-center gap-2 px-3 py-2 text-sm bg-green-800 hover:bg-green-700 rounded-md text-green-100 hover:text-white transition-colors"
        title="Avaa live chat (tallentuu Firebaseen)"
      >
        <Zap className="w-5 h-5" />
        <span className="hidden md:inline">{t('sim.test_db')}</span>
      </button>
    </div>
  );
};

export default SimulationControls;
