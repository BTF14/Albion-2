import React from 'react';
import { getTierBadgeClasses, getEnchantmentBadgeClasses } from '../utils/albionColors';

interface AlbionItemBadgeProps {
  tier: number;
  enchantment?: number;
  size?: 'xs' | 'sm' | 'md';
  className?: string;
}

export const AlbionItemBadge: React.FC<AlbionItemBadgeProps> = ({
  tier,
  enchantment = 0,
  size = 'sm',
  className = '',
}) => {
  const tierStyle = getTierBadgeClasses(tier);
  const enchStyle = getEnchantmentBadgeClasses(enchantment);
  const sizeClasses =
    size === 'xs'
      ? 'text-[9px] px-1 py-0.2 leading-tight'
      : size === 'sm'
      ? 'text-[10px] px-1.5 py-0.5'
      : 'text-xs px-2 py-0.5';

  return (
    <span
      className={`inline-flex items-center gap-1 font-mono font-bold rounded border ${tierStyle.bg} ${tierStyle.text} ${tierStyle.border} ${sizeClasses} ${className}`}
    >
      <span>T{tier}</span>
      {enchantment > 0 && (
        <span
          className={`px-1 rounded text-[9px] font-extrabold border ${enchStyle.bg} ${enchStyle.text} ${enchStyle.border}`}
        >
          {enchStyle.label}
        </span>
      )}
    </span>
  );
};
