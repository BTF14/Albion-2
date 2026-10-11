import React from 'react';
import { TrendingUp } from 'lucide-react';

interface AlbionDataQuickButtonProps {
  itemId: string;
  targetType?: 'product' | 'seed_or_baby';
  onOpenModal: (itemId: string, targetType: 'product' | 'seed_or_baby') => void;
  label?: string;
  className?: string;
  title?: string;
}

export const AlbionDataQuickButton: React.FC<AlbionDataQuickButtonProps> = ({
  itemId,
  targetType = 'product',
  onOpenModal,
  label = 'Ver Mercado ADP',
  className = '',
  title = 'Consultar cotizaciones públicas en Albion Data Project (Referencial)',
}) => {
  return (
    <button
      type="button"
      onClick={() => onOpenModal(itemId, targetType)}
      className={`inline-flex items-center gap-1 text-[10px] font-semibold text-cyan-400 hover:text-cyan-300 bg-cyan-950/40 hover:bg-cyan-900/60 border border-cyan-700/50 hover:border-cyan-500 rounded px-1.5 py-0.5 transition-colors cursor-pointer ${className}`}
      title={title}
    >
      <TrendingUp size={11} className="text-cyan-400 shrink-0" />
      <span>{label}</span>
    </button>
  );
};
