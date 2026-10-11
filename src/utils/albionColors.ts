/**
 * Paleta Cromática y Jerarquía Visual Oficial de Albion Online
 * Cumple con el estándar de Ergonomía Visual y Jerarquía Numérica de las reglas del proyecto.
 */

export function getTierBadgeClasses(tier: number): { bg: string; text: string; border: string } {
  switch (tier) {
    case 3:
      return { bg: 'bg-amber-900/30', text: 'text-amber-400', border: 'border-amber-700/40' };
    case 4:
      return { bg: 'bg-blue-900/30', text: 'text-blue-400', border: 'border-blue-700/40' };
    case 5:
      return { bg: 'bg-red-900/30', text: 'text-red-400', border: 'border-red-700/40' };
    case 6:
      return { bg: 'bg-orange-900/30', text: 'text-orange-400', border: 'border-orange-700/40' };
    case 7:
      return { bg: 'bg-yellow-900/30', text: 'text-yellow-300', border: 'border-yellow-600/40' };
    case 8:
      return { bg: 'bg-slate-200/20', text: 'text-slate-100', border: 'border-slate-300/40' };
    default:
      return { bg: 'bg-slate-800', text: 'text-slate-300', border: 'border-slate-700' };
  }
}

export function getEnchantmentBadgeClasses(enchantment: number): { bg: string; text: string; border: string; label: string } {
  switch (enchantment) {
    case 1:
      return { bg: 'bg-emerald-950/60', text: 'text-emerald-400', border: 'border-emerald-500/40', label: '.1' };
    case 2:
      return { bg: 'bg-sky-950/60', text: 'text-sky-400', border: 'border-sky-500/40', label: '.2' };
    case 3:
      return { bg: 'bg-purple-950/60', text: 'text-purple-400', border: 'border-purple-500/40', label: '.3' };
    case 4:
      return { bg: 'bg-amber-950/70', text: 'text-amber-300', border: 'border-amber-400/50', label: '.4' };
    default:
      return { bg: 'bg-slate-900', text: 'text-slate-400', border: 'border-slate-800', label: '.0' };
  }
}

/**
 * Formateador de plata con números tabulares y separadores de miles
 */
export function formatSilver(amount: number): string {
  if (!Number.isFinite(amount)) return '0';
  return Math.round(amount).toLocaleString('es-ES');
}

/**
 * Formateador de foco con números tabulares
 */
export function formatFocus(points: number): string {
  if (!Number.isFinite(points)) return '0';
  return Math.round(points).toLocaleString('es-ES');
}
