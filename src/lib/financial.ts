export type FinancialPeriod = {
  period: string;
  year?: number;
  revenue: number | null;
  cogs: number | null;
  operatingIncome: number | null;
  netIncome: number | null;
  currentAssets: number | null;
  currentLiabilities: number | null;
  totalAssets: number | null;
  totalLiabilities: number | null;
  equity: number | null;
  cash: number | null;
  shortTermInvestments: number | null;
  accountsReceivable: number | null;
  operatingCashFlow: number | null;
  capitalExpenditures: number | null;
  debt: number | null;
  depreciationAndAmortization: number | null;
  reportingFrequency?: "annual" | "quarterly" | "monthly";
};

export type MetricSnapshot = {
  period: string;
  revenue: number | null;
  cogs: number | null;
  grossProfit: number | null;
  grossProfitMargin: number | null;
  operatingIncome: number | null;
  operatingMargin: number | null;
  netIncome: number | null;
  netMargin: number | null;
  ebitda: number | null;
  ebitdaMargin: number | null;
  currentRatio: number | null;
  quickRatio: number | null;
  debtToEquity: number | null;
  debtRatio: number | null;
  returnOnAssets: number | null;
  returnOnEquity: number | null;
  operatingCashFlow: number | null;
  freeCashFlow: number | null;
  operatingCashFlowMargin: number | null;
  cashConversion: number | null;
};

export type DashboardSummary = {
  latest: MetricSnapshot;
  previous: MetricSnapshot | null;
  revenueGrowth: number | null;
  chartData: Array<{
    period: string;
    revenue: number | null;
    operatingIncome: number | null;
    netIncome: number | null;
    grossProfit: number | null;
    operatingCashFlow: number | null;
    freeCashFlow: number | null;
    currentRatio: number | null;
    debtToEquity: number | null;
    netMargin: number | null;
  }>;
};

export function safeDivide(numerator: number | null | undefined, denominator: number | null | undefined): number | null {
  if (numerator == null || denominator == null || denominator === 0) {
    return null;
  }
  return Number((numerator / denominator).toFixed(6));
}

export function percentageChange(current: number | null | undefined, previous: number | null | undefined): number | null {
  if (current == null || previous == null || previous === 0) {
    return null;
  }
  const diff = current - previous;
  const ratio = diff / Math.abs(previous);
  return Number((ratio * 100).toFixed(2));
}

export function calculateMetrics(snapshot: FinancialPeriod): MetricSnapshot {
  const revenue = Number(snapshot.revenue ?? 0);
  const cogs = Number(snapshot.cogs ?? 0);
  const operatingIncome = Number(snapshot.operatingIncome ?? 0);
  const netIncome = Number(snapshot.netIncome ?? 0);
  const currentAssets = Number(snapshot.currentAssets ?? 0);
  const currentLiabilities = Number(snapshot.currentLiabilities ?? 0);
  const totalAssets = Number(snapshot.totalAssets ?? 0);
  const totalLiabilities = Number(snapshot.totalLiabilities ?? 0);
  const equity = Number(snapshot.equity ?? 0);
  const cash = Number(snapshot.cash ?? 0);
  const shortTermInvestments = Number(snapshot.shortTermInvestments ?? 0);
  const accountsReceivable = Number(snapshot.accountsReceivable ?? 0);
  const operatingCashFlow = Number(snapshot.operatingCashFlow ?? 0);
  const capex = Number(snapshot.capitalExpenditures ?? 0);
  const debt = Number(snapshot.debt ?? Math.max(totalLiabilities - equity, 0));
  const dAndA = Number(snapshot.depreciationAndAmortization ?? 0);

  const grossProfit = revenue - cogs;
  const grossProfitMarginValue = safeDivide(grossProfit, revenue);
  const grossProfitMargin = grossProfitMarginValue !== null ? grossProfitMarginValue * 100 : null;
  const operatingMarginValue = safeDivide(operatingIncome, revenue);
  const operatingMargin = operatingMarginValue !== null ? operatingMarginValue * 100 : null;
  const netMarginValue = safeDivide(netIncome, revenue);
  const netMargin = netMarginValue !== null ? netMarginValue * 100 : null;
  const ebitda = operatingIncome + dAndA;
  const ebitdaMarginValue = safeDivide(ebitda, revenue);
  const ebitdaMargin = ebitdaMarginValue !== null ? ebitdaMarginValue * 100 : null;

  const currentRatio = safeDivide(currentAssets, currentLiabilities);
  const quickRatio = safeDivide(cash + shortTermInvestments + accountsReceivable, currentLiabilities);
  const debtToEquity = safeDivide(debt, equity);
  const debtRatio = safeDivide(totalLiabilities, totalAssets);

  const averageTotalAssets = totalAssets;
  const averageEquity = equity;
  const returnOnAssetsValue = safeDivide(netIncome, averageTotalAssets);
  const returnOnAssets = returnOnAssetsValue !== null ? returnOnAssetsValue * 100 : null;
  const returnOnEquityValue = safeDivide(netIncome, averageEquity);
  const returnOnEquity = returnOnEquityValue !== null ? returnOnEquityValue * 100 : null;

  const freeCashFlow = operatingCashFlow - capex;
  const operatingCashFlowMarginValue = safeDivide(operatingCashFlow, revenue);
  const operatingCashFlowMargin = operatingCashFlowMarginValue !== null ? operatingCashFlowMarginValue * 100 : null;
  const cashConversion = netIncome === 0 ? null : safeDivide(operatingCashFlow, netIncome);

  return {
    period: snapshot.period,
    revenue: snapshot.revenue,
    cogs: snapshot.cogs,
    grossProfit,
    grossProfitMargin: grossProfitMargin ?? null,
    operatingIncome: snapshot.operatingIncome,
    operatingMargin: operatingMargin ?? null,
    netIncome: snapshot.netIncome,
    netMargin: netMargin ?? null,
    ebitda,
    ebitdaMargin: ebitdaMargin ?? null,
    currentRatio: currentRatio ?? null,
    quickRatio: quickRatio ?? null,
    debtToEquity: debtToEquity ?? null,
    debtRatio: debtRatio ?? null,
    returnOnAssets: returnOnAssets ?? null,
    returnOnEquity: returnOnEquity ?? null,
    operatingCashFlow: snapshot.operatingCashFlow,
    freeCashFlow,
    operatingCashFlowMargin: operatingCashFlowMargin ?? null,
    cashConversion: cashConversion ?? null,
  };
}

export function buildDashboardSummary(periods: FinancialPeriod[]): DashboardSummary {
  const chartData = periods.map((period) => {
    const metrics = calculateMetrics(period);
    return {
      period: period.period,
      revenue: period.revenue,
      operatingIncome: period.operatingIncome,
      netIncome: period.netIncome,
      grossProfit: metrics.grossProfit,
      operatingCashFlow: period.operatingCashFlow,
      freeCashFlow: metrics.freeCashFlow,
      currentRatio: metrics.currentRatio,
      debtToEquity: metrics.debtToEquity,
      netMargin: metrics.netMargin,
    };
  });

  const latest = periods[periods.length - 1];
  const previous = periods[periods.length - 2] ?? null;
  const latestMetrics = calculateMetrics(latest);
  const previousMetrics = previous ? calculateMetrics(previous) : null;

  const revenueGrowth = percentageChange(latest?.revenue, previous?.revenue);

  return {
    latest: latestMetrics,
    previous: previousMetrics,
    revenueGrowth,
    chartData,
  };
}

export function formatCurrency(value: number | null | undefined, currency = "USD"): string {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return "—";
  }

  const formatter = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  });

  return formatter.format(value);
}

export function formatPercent(value: number | null | undefined, digits = 1): string {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return "—";
  }

  const formatted = Number(value).toFixed(digits);
  return `${formatted}%`;
}
