import { DailyLogEntry } from '../../types';
import { BlackMarketItemRecord } from '../models/craftingSalesLedger';

export interface CsvExportOptions {
  delimiter?: ',' | ';';
  includeSummary?: boolean;
  exportFilteredOnly?: boolean;
  filterMeta?: {
    cityName?: string;
    categoryName?: string;
    totalEntriesCount?: number;
  };
}

export interface CsvExportResult {
  csvString: string;
  filename: string;
  recordsCount: number;
}

/**
 * Sanitizador defensivo contra Inyecciones de Fórmulas CSV (CSV Injection / Formula Injection)
 * Conforme al estándar Cloudflare Security Audit (CLIENT-SIDE.md / DATA-ISOLATION-AND-LIFECYCLE.md).
 * Neutraliza caracteres de control (=, +, -, @, tabulación, retorno de carro, tubería, salto de línea)
 * anteponiendo una comilla simple ' para forzar que Excel, Google Sheets y LibreOffice lo interpreten como texto plano.
 */
export function sanitizeCsvCell(value: unknown): string {
  if (value === null || value === undefined) {
    return '""';
  }

  const str = String(value);

  // Caracteres ejecutables peligrosos que disparan fórmulas, DDE o macros en Excel, Google Sheets y LibreOffice
  // Conforme a Cloudflare Security Audit (CLIENT-SIDE.md / DATA-ISOLATION-AND-LIFECYCLE.md)
  const trimmed = str.trimStart();
  const dangerousChars = ['=', '+', '-', '@', '\t', '\r', '|', '%', '\n', ';', ':'];

  let sanitized = str;
  if (trimmed.length > 0 && dangerousChars.includes(trimmed[0])) {
    // Anteponer comilla simple para forzar interpretación como texto plano en el motor de hojas de cálculo
    sanitized = `'${str}`;
  }

  // Escapar comillas dobles internas (" -> "") y envolver la celda entre comillas dobles
  const escaped = sanitized.replace(/"/g, '""');
  return `"${escaped}"`;
}

/**
 * Formatea un número seguro para CSV respetando el delimitador elegido.
 * Si el delimitador es punto y coma (;), se puede usar coma decimal (1234,56) para Excel en Español.
 * Garantiza que jamás se filtre una fórmula a través de un campo numérico no validado.
 */
export function formatNumberForCsv(val: unknown, useDecimalComma: boolean = false): string {
  if (val === undefined || val === null) {
    return '0';
  }
  const num = typeof val === 'number' ? val : Number(val);
  if (!Number.isFinite(num)) {
    return '0';
  }
  if (useDecimalComma) {
    return `"${num.toString().replace('.', ',')}"`;
  }
  return num.toString();
}

/**
 * Genera el contenido CSV estructurado para el Historial de Cosechas con protección anti-inyección y codificación UTF-8 BOM.
 */
export function exportHistoryToCsv(
  logs: DailyLogEntry[],
  options: CsvExportOptions = {}
): CsvExportResult {
  const safeLogs = Array.isArray(logs) ? logs : [];
  const delimiter = options.delimiter || ';'; // Punto y coma por defecto para compatibilidad directa con Excel en Español
  const useDecimalComma = delimiter === ';';
  const includeSummary = options.includeSummary !== false;

  const headers = [
    'ID_Registro',
    'Fecha',
    'Ciudad',
    'Categoria',
    'Item',
    'Tier',
    'Parcelas',
    'Slots_Totales',
    'Semillas_Devueltas',
    'Semillas_Recompradas',
    'Semillas_Excedentes',
    'Precio_Unitario_Semilla',
    'Cosecha_Total',
    'Precio_Unitario_Venta',
    'Costo_Semillas_Recompra',
    'Costo_Alimento',
    'Tasas_Extras',
    'Ingreso_Bruto',
    'Ingreso_Excedente_Semillas',
    'Impuesto_Mercado',
    'Ingreso_Neto',
    'Ganancia_Neta',
    'Plata_Por_Slot',
    'Uso_Foco',
    'Puntos_Foco_Gastados',
    'Plata_Por_Foco',
    'Notas_Jugador',
  ];

  const headerRow = headers.map(sanitizeCsvCell).join(delimiter);

  // Filas de datos con sanitización exhaustiva de cada campo
  const dataRows = safeLogs.map((log) => {
    const row = [
      sanitizeCsvCell(log.id),
      sanitizeCsvCell(log.dateStr),
      sanitizeCsvCell(log.cityId),
      sanitizeCsvCell(log.category),
      sanitizeCsvCell(log.itemName || ''),
      formatNumberForCsv(log.tier, false),
      formatNumberForCsv(log.plotsCount, false),
      formatNumberForCsv(log.slotsCount, false),
      formatNumberForCsv(log.returnedSeedsOrBabies, false),
      formatNumberForCsv(log.reboughtSeedsOrBabies, false),
      formatNumberForCsv(log.surplusSeedsCount || 0, false),
      formatNumberForCsv(log.seedOrBabyUnitPrice, useDecimalComma),
      formatNumberForCsv(log.harvestedAmount, false),
      formatNumberForCsv(log.productUnitPrice, useDecimalComma),
      formatNumberForCsv(log.seedsRebuyCost, useDecimalComma),
      formatNumberForCsv(log.foodCost || 0, useDecimalComma),
      formatNumberForCsv(log.extraFees || 0, useDecimalComma),
      formatNumberForCsv(log.grossRevenue, useDecimalComma),
      formatNumberForCsv(log.surplusSeedsRevenue || 0, useDecimalComma),
      formatNumberForCsv(log.marketTaxAmount, useDecimalComma),
      formatNumberForCsv(log.netRevenue, useDecimalComma),
      formatNumberForCsv(log.netProfit, useDecimalComma),
      formatNumberForCsv(log.profitPerSlot, useDecimalComma),
      log.usedFocus ? sanitizeCsvCell('SI') : sanitizeCsvCell('NO'),
      formatNumberForCsv(log.focusPointsSpent || 0, false),
      formatNumberForCsv(log.silverPerFocus || 0, useDecimalComma),
      sanitizeCsvCell(log.notes || ''),
    ];
    return row.join(delimiter);
  });

  const lines: string[] = [headerRow, ...dataRows];

  // Si se solicita, añadir fila de Totales y Resumen
  if (includeSummary && safeLogs.length > 0) {
    let totalHarvest = 0;
    let totalSeedRebuyCost = 0;
    let totalFoodCost = 0;
    let totalGrossRevenue = 0;
    let totalTaxes = 0;
    let totalNetRevenue = 0;
    let totalNetProfit = 0;
    let totalFocusSpent = 0;
    let totalFocusProfit = 0;

    safeLogs.forEach((l) => {
      totalHarvest += Number(l.harvestedAmount) || 0;
      totalSeedRebuyCost += Number(l.seedsRebuyCost) || 0;
      totalFoodCost += Number(l.foodCost) || 0;
      totalGrossRevenue += Number(l.grossRevenue) || 0;
      totalTaxes += Number(l.marketTaxAmount) || 0;
      totalNetRevenue += Number(l.netRevenue) || 0;
      totalNetProfit += Number(l.netProfit) || 0;
      if (l.usedFocus && l.focusPointsSpent && Number(l.focusPointsSpent) > 0) {
        totalFocusSpent += Number(l.focusPointsSpent);
        totalFocusProfit += Number(l.netProfit) || 0;
      }
    });

    const avgSilverPerFocus =
      totalFocusSpent > 0 ? Number((totalFocusProfit / totalFocusSpent).toFixed(1)) : 0;

    // Fila vacía de separación
    lines.push('');

    // Fila de Resumen
    const summaryRow = [
      sanitizeCsvCell('TOTALES_Y_BALANCE'),
      sanitizeCsvCell(`Registros: ${safeLogs.length}`),
      sanitizeCsvCell(options.filterMeta?.cityName || 'Todas las ciudades'),
      sanitizeCsvCell(options.filterMeta?.categoryName || 'Todas las categorías'),
      sanitizeCsvCell('---'),
      sanitizeCsvCell('---'),
      sanitizeCsvCell('---'),
      sanitizeCsvCell('---'),
      sanitizeCsvCell('---'),
      sanitizeCsvCell('---'),
      sanitizeCsvCell('---'),
      sanitizeCsvCell('---'),
      formatNumberForCsv(totalHarvest, false),
      sanitizeCsvCell('---'),
      formatNumberForCsv(totalSeedRebuyCost, useDecimalComma),
      formatNumberForCsv(totalFoodCost, useDecimalComma),
      sanitizeCsvCell('---'),
      formatNumberForCsv(totalGrossRevenue, useDecimalComma),
      sanitizeCsvCell('---'),
      formatNumberForCsv(totalTaxes, useDecimalComma),
      formatNumberForCsv(totalNetRevenue, useDecimalComma),
      formatNumberForCsv(totalNetProfit, useDecimalComma),
      sanitizeCsvCell('---'),
      sanitizeCsvCell('---'),
      formatNumberForCsv(totalFocusSpent, false),
      formatNumberForCsv(avgSilverPerFocus, useDecimalComma),
      sanitizeCsvCell('Resumen oficial generado por Albion Farm & Economy Tracker'),
    ];

    lines.push(summaryRow.join(delimiter));
  }

  // Prefijo UTF-8 Byte Order Mark (\uFEFF) para que Excel detecte automáticamente la codificación UTF-8 con tildes y caracteres especiales
  const csvString = '\uFEFF' + lines.join('\r\n');

  const today = new Date().toISOString().split('T')[0];
  const filename = `albion_farm_balance_${today}.csv`;

  return {
    csvString,
    filename,
    recordsCount: safeLogs.length,
  };
}

/**
 * Exportador oficial seguro a CSV para el Libro Mayor de Ventas y Mercado Negro de Caerleon.
 * Aplica idéntico blindaje anti-inyección CSV y compatibilidad nativa con Excel/Google Sheets.
 */
export function exportSalesLedgerToCsv(
  records: BlackMarketItemRecord[],
  options: { delimiter?: ',' | ';'; includeSummary?: boolean } = {}
): CsvExportResult {
  const safeRecords = Array.isArray(records) ? records : [];
  const delimiter = options.delimiter || ';';
  const useDecimalComma = delimiter === ';';
  const includeSummary = options.includeSummary !== false;

  const headers = [
    'ID_Registro',
    'Fecha',
    'Item',
    'Tier',
    'Encantamiento',
    'Calidad',
    'Cantidad_Lote',
    'Destino_Venta',
    'Ciudad_Destino',
    'Coste_Unitario_Fabricacion',
    'Coste_Total_Fabricacion',
    'Precio_Unitario_Venta',
    'Ingreso_Bruto',
    'Tasa_Mercado_Porcentaje',
    'Tasa_Publicacion_Porcentaje',
    'Total_Tasas_Mercado',
    'Ingreso_Neto',
    'Ganancia_Neta',
    'Ganancia_Por_Unidad',
    'ROI_Porcentaje',
    'Notas',
  ];

  const headerRow = headers.map(sanitizeCsvCell).join(delimiter);

  const dataRows = safeRecords.map((r) => {
    const row = [
      sanitizeCsvCell(r.id),
      sanitizeCsvCell(r.dateStr),
      sanitizeCsvCell(r.itemName),
      sanitizeCsvCell(`T${r.tier}`),
      sanitizeCsvCell(`.${r.enchantment}`),
      sanitizeCsvCell(r.quality),
      formatNumberForCsv(r.batchCount, false),
      sanitizeCsvCell(r.destination === 'black_market' ? 'Mercado Negro' : 'Ciudad Real'),
      sanitizeCsvCell(r.destinationCityName),
      formatNumberForCsv(r.unitProductionCost, useDecimalComma),
      formatNumberForCsv(r.productionCostTotal, useDecimalComma),
      formatNumberForCsv(r.unitSalePrice, useDecimalComma),
      formatNumberForCsv(r.grossRevenue, useDecimalComma),
      formatNumberForCsv(r.marketTaxPercent, useDecimalComma),
      formatNumberForCsv(r.setupFeePercent, useDecimalComma),
      formatNumberForCsv(r.totalMarketFees, useDecimalComma),
      formatNumberForCsv(r.netRevenue, useDecimalComma),
      formatNumberForCsv(r.netProfit, useDecimalComma),
      formatNumberForCsv(r.profitPerUnit, useDecimalComma),
      formatNumberForCsv(r.roiPercent, useDecimalComma),
      sanitizeCsvCell(r.notes || ''),
    ];
    return row.join(delimiter);
  });

  const lines: string[] = [headerRow, ...dataRows];

  if (includeSummary && safeRecords.length > 0) {
    let totalBatchCount = 0;
    let totalCost = 0;
    let totalGrossRevenue = 0;
    let totalFees = 0;
    let totalNetRevenue = 0;
    let totalNetProfit = 0;

    safeRecords.forEach((r) => {
      totalBatchCount += Number(r.batchCount) || 0;
      totalCost += Number(r.productionCostTotal) || 0;
      totalGrossRevenue += Number(r.grossRevenue) || 0;
      totalFees += Number(r.totalMarketFees) || 0;
      totalNetRevenue += Number(r.netRevenue) || 0;
      totalNetProfit += Number(r.netProfit) || 0;
    });

    const avgRoi = totalCost > 0 ? Number(((totalNetProfit / totalCost) * 100).toFixed(1)) : 0;

    lines.push('');
    const summaryRow = [
      sanitizeCsvCell('TOTALES_LIBRO_MAYOR'),
      sanitizeCsvCell(`Total operaciones: ${safeRecords.length}`),
      sanitizeCsvCell('---'),
      sanitizeCsvCell('---'),
      sanitizeCsvCell('---'),
      sanitizeCsvCell('---'),
      formatNumberForCsv(totalBatchCount, false),
      sanitizeCsvCell('---'),
      sanitizeCsvCell('---'),
      sanitizeCsvCell('---'),
      formatNumberForCsv(totalCost, useDecimalComma),
      sanitizeCsvCell('---'),
      formatNumberForCsv(totalGrossRevenue, useDecimalComma),
      sanitizeCsvCell('---'),
      sanitizeCsvCell('---'),
      formatNumberForCsv(totalFees, useDecimalComma),
      formatNumberForCsv(totalNetRevenue, useDecimalComma),
      formatNumberForCsv(totalNetProfit, useDecimalComma),
      sanitizeCsvCell('---'),
      formatNumberForCsv(avgRoi, useDecimalComma),
      sanitizeCsvCell('Balance general de ventas y crafteo generado por Albion Farm Tracker'),
    ];
    lines.push(summaryRow.join(delimiter));
  }

  const csvString = '\uFEFF' + lines.join('\r\n');
  const today = new Date().toISOString().split('T')[0];
  const filename = `albion_libro_ventas_${today}.csv`;

  return {
    csvString,
    filename,
    recordsCount: safeRecords.length,
  };
}
