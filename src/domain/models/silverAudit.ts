/**
 * Modelos de Dominio: Auditoría Financiera y Detector de Fugas de Plata en Albion Online
 * Arquitectura Gentleman Programming (Clean Architecture)
 */

import { CityId } from '../../types';

export type LeakSeverity = 'critical' | 'warning' | 'info';
export type LeakCategory = 'negative_roi' | 'excessive_station_tax' | 'unwatered_crop' | 'stagnant_focus' | 'suboptimal_city';

export interface SilverLeakItem {
  id: string;
  category: LeakCategory;
  severity: LeakSeverity;
  title: string;
  description: string;
  affectedActivity: string;
  cityId?: CityId;
  estimatedSilverLostPerDay: number;
  recommendedFix: string;
  pivotAlternativeId?: string;
  pivotAlternativeName?: string;
  pivotEstimatedGainPerDay?: number;
}

export interface SilverAuditReport {
  timestamp: number;
  totalLeaksCount: number;
  criticalLeaksCount: number;
  warningLeaksCount: number;
  totalEstimatedDailySilverLoss: number;
  leaks: SilverLeakItem[];
  healthScore: number; // 0 - 100
  verdictHeadline: string;
}
