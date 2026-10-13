/**
 * Modelos de Dominio: Planificador de Suministro de Diarios para Trabajadores
 * Albion Online - Clean Architecture (Gentleman Programming)
 */

import { LabourerType } from './labourers';

export interface LabourerSupplyRow {
  id: string;
  labourerType: LabourerType;
  tier: number; // 2..8
  labourersCount: number;
}

export interface JournalPriceSetting {
  tier: number;
  emptyPrice: number;
  fullPrice: number;
}

export interface JournalSupplyAnalysis {
  totalLabourers: number;
  dailyJournalsDemand: number; // Por ciclo de 22 horas
  weeklyJournalsDemand: number; // Por 7 ciclos (1 semana)
  dailyCostBuyFull: number;
  dailyCostBuyEmpty: number;
  dailySavingsFillingYourself: number;
  savingsPercent: number;
  recommendation: string;
}
