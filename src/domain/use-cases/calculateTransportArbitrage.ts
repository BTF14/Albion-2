import { CityId } from '../../types';
import {
  TransportMount,
  ITEM_WEIGHTS,
  RouteInfo,
  evaluateRouteDanger,
} from '../models/transport';

export interface TransportCalculationInput {
  originCity: CityId;
  destinationCity: CityId;
  itemId: string;
  originUnitPrice: number;
  destinationUnitPrice: number;
  mount: TransportMount;
  hasPorkPie: boolean;
  bagCapacityKg: number;
  hasPremium: boolean;
  customQuantity?: number;
  orderType?: 'sell_order' | 'buy_order';
  destinationMarket?: 'royal_market' | 'black_market';
  customItemWeightKg?: number;
}

export interface TransportCalculationResult {
  originCity: CityId;
  destinationCity: CityId;
  itemId: string;
  itemWeightKg: number;
  mountName: string;
  effectiveCapacityKg: number;
  maxUnitsByWeight: number;
  transportUnits: number;
  totalWeightKg: number;
  capacityPercentage: number;
  isOverloaded: boolean;
  isSeverelyOverloaded: boolean; // > 100% sobrecarga (penalización severa de movimiento)
  
  // Aspectos Financieros
  originUnitPrice: number;
  destinationUnitPrice: number;
  orderType: 'sell_order' | 'buy_order';
  destinationMarket: 'royal_market' | 'black_market';
  totalInvestmentCost: number;
  grossRevenue: number;
  marketTaxRate: number;
  setupFeeRate: number;
  totalMarketFees: number;
  netRevenue: number;
  netProfit: number;
  profitPerUnit: number;
  profitPerKg: number;
  roiPercentage: number;
  netMarginPercentage: number;
  breakEvenSellPrice: number;
  isProfitable: boolean;

  // Ruta y Seguridad
  routeInfo: RouteInfo;
}

export function calculateTransportArbitrage(
  input: TransportCalculationInput
): TransportCalculationResult {
  // Sanitización de entradas numéricas defensivas (Gentleman Programming & Cloudflare Security Audit)
  const originUnitPrice = Number.isFinite(input.originUnitPrice)
    ? Math.max(0, input.originUnitPrice)
    : 0;
  const destinationUnitPrice = Number.isFinite(input.destinationUnitPrice)
    ? Math.max(0, input.destinationUnitPrice)
    : 0;
  const bagCapacityKg = Number.isFinite(input.bagCapacityKg)
    ? Math.max(0, input.bagCapacityKg)
    : 0;

  // Peso unitario del ítem (soporta peso manual personalizado o catálogo ITEM_WEIGHTS)
  let itemWeightKg: number;
  if (
    input.customItemWeightKg !== undefined &&
    Number.isFinite(input.customItemWeightKg) &&
    input.customItemWeightKg > 0
  ) {
    itemWeightKg = Number(input.customItemWeightKg.toFixed(3));
  } else if (
    ITEM_WEIGHTS[input.itemId] !== undefined &&
    ITEM_WEIGHTS[input.itemId] > 0
  ) {
    itemWeightKg = ITEM_WEIGHTS[input.itemId];
  } else {
    itemWeightKg = 0.15; // Fallback seguro estándar para productos agrícolas
  }

  // Capacidad efectiva de carga: En Albion Online el pastel de cerdo (+30% Max Load)
  // multiplica la capacidad total combinada de montura + bolsa del jugador.
  const porkPieMultiplier = input.hasPorkPie ? 1.3 : 1.0;
  const baseMountCapacity = Number.isFinite(input.mount.baseCapacityKg)
    ? Math.max(1, input.mount.baseCapacityKg)
    : 1000;
  const effectiveCapacityKg = Math.round(
    (baseMountCapacity + bagCapacityKg) * porkPieMultiplier
  );

  // Unidades máximas posibles sin exceder el 100% de la capacidad de peso
  const maxUnitsByWeight = Math.max(0, Math.floor(effectiveCapacityKg / itemWeightKg));

  // Determinar unidades a transportar
  let transportUnits: number;
  if (
    input.customQuantity !== undefined &&
    Number.isFinite(input.customQuantity) &&
    input.customQuantity > 0
  ) {
    transportUnits = Math.floor(Math.max(1, input.customQuantity));
  } else {
    transportUnits = maxUnitsByWeight;
  }

  const totalWeightKg = Number((transportUnits * itemWeightKg).toFixed(2));
  const capacityPercentage =
    effectiveCapacityKg > 0
      ? Number(((totalWeightKg / effectiveCapacityKg) * 100).toFixed(1))
      : 0;

  const isOverloaded = capacityPercentage > 100;
  const isSeverelyOverloaded = capacityPercentage > 199.9;

  // Modalidad de venta y destino
  const orderType = input.orderType || 'sell_order';
  const destinationMarket =
    input.destinationCity === 'caerleon'
      ? input.destinationMarket || 'royal_market'
      : 'royal_market';

  // Tasas de mercado e impuestos en Albion Online:
  // 1. Mercado Negro (Caerleon):
  //    - Orden de Compra directa (Venta Inmediata): 0% impuesto y 0% tasa de publicación.
  //    - Orden de Venta: 4% (con Premium) u 8% (sin Premium) + 2.5% publicación.
  // 2. Mercado Real de Ciudad:
  //    - Venta Inmediata a Orden de Compra: 4% (con Premium) u 8% (sin Premium) y 0% de publicación.
  //    - Orden de Venta: 4% (con Premium) u 8% (sin Premium) + 2.5% de publicación.
  let marketTaxRate = 0;
  let setupFeeRate = 0;

  if (destinationMarket === 'black_market') {
    if (orderType === 'buy_order') {
      marketTaxRate = 0;
      setupFeeRate = 0;
    } else {
      marketTaxRate = input.hasPremium ? 0.04 : 0.08;
      setupFeeRate = 0.025;
    }
  } else {
    marketTaxRate = input.hasPremium ? 0.04 : 0.08;
    setupFeeRate = orderType === 'sell_order' ? 0.025 : 0;
  }

  const totalMarketFeeRate = marketTaxRate + setupFeeRate;

  // Costes y Rendimientos
  const totalInvestmentCost = Math.round(transportUnits * originUnitPrice);
  const grossRevenue = Math.round(transportUnits * destinationUnitPrice);
  const totalMarketFees = Math.round(grossRevenue * totalMarketFeeRate);
  const netRevenue = Math.round(grossRevenue - totalMarketFees);
  const netProfit = Math.round(netRevenue - totalInvestmentCost);

  const profitPerUnit = transportUnits > 0 ? Math.round(netProfit / transportUnits) : 0;
  const profitPerKg =
    totalWeightKg > 0 ? Number((netProfit / totalWeightKg).toFixed(1)) : 0;

  const roiPercentage =
    totalInvestmentCost > 0
      ? Number(((netProfit / totalInvestmentCost) * 100).toFixed(1))
      : 0;

  const netMarginPercentage =
    grossRevenue > 0
      ? Number(((netProfit / grossRevenue) * 100).toFixed(1))
      : 0;

  // Precio mínimo de equilibrio (Break-even): precio unitario en destino necesario para cubrir costes e impuestos
  const breakEvenSellPrice =
    totalMarketFeeRate < 1 && originUnitPrice > 0
      ? Math.ceil(originUnitPrice / (1 - totalMarketFeeRate))
      : originUnitPrice;

  const isProfitable = netProfit > 0;

  // Evaluación táctica de la ruta
  const routeInfo = evaluateRouteDanger(input.originCity, input.destinationCity);

  return {
    originCity: input.originCity,
    destinationCity: input.destinationCity,
    itemId: input.itemId,
    itemWeightKg,
    mountName: input.mount.name,
    effectiveCapacityKg,
    maxUnitsByWeight,
    transportUnits,
    totalWeightKg,
    capacityPercentage,
    isOverloaded,
    isSeverelyOverloaded,
    originUnitPrice,
    destinationUnitPrice,
    orderType,
    destinationMarket,
    totalInvestmentCost,
    grossRevenue,
    marketTaxRate,
    setupFeeRate,
    totalMarketFees,
    netRevenue,
    netProfit,
    profitPerUnit,
    profitPerKg,
    roiPercentage,
    netMarginPercentage,
    breakEvenSellPrice,
    isProfitable,
    routeInfo,
  };
}
