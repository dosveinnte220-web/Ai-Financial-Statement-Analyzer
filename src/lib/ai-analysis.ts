import { buildDashboardSummary, formatCurrency, formatPercent } from "./financial";
import type { FinancialPeriod } from "./financial";

export type AnalysisResult = {
  executiveSummary: string;
  facts: string[];
  hypotheses: string[];
  watchList: string[];
  questions: string[];
  recommendations: string[];
};

export function generateAiInsights(periods: FinancialPeriod[]): AnalysisResult {
  const summary = buildDashboardSummary(periods);
  const latest = summary.latest;
  const previous = summary.previous;
  const revenueGrowth = summary.revenueGrowth ?? 0;
  const previousGrossMargin = previous?.grossProfitMargin ?? null;

  const facts = [
    `Revenue was ${formatCurrency(latest.revenue ?? 0, "USD")} in ${latest.period}, compared with ${formatCurrency(previous?.revenue ?? 0, "USD")} in ${previous?.period ?? "the prior period"}.`,
    `Gross profit margin stood at ${formatPercent(latest.grossProfitMargin ?? 0)} and net margin at ${formatPercent(latest.netMargin ?? 0)}.`,
    `Current ratio was ${latest.currentRatio?.toFixed(2) ?? "N/A"}, while debt-to-equity was ${latest.debtToEquity?.toFixed(2) ?? "N/A"}.`,
    `Operating cash flow totaled ${formatCurrency(latest.operatingCashFlow ?? 0, "USD")}.`,
  ];

  const hypotheses = [
    revenueGrowth > 0
      ? `Revenue growth of ${formatPercent(revenueGrowth)} suggests the current demand environment remains favorable.`
      : "Revenue trends indicate a need to validate the underlying demand and pricing assumptions before expanding operations.",
    latest.grossProfitMargin !== null && previousGrossMargin !== null
      ? `Gross margin moved from ${formatPercent(previousGrossMargin)} to ${formatPercent(latest.grossProfitMargin)}, which may signal changes in pricing or cost discipline.`
      : "Margin performance should be reviewed against the cost structure to determine whether efficiencies are improving or deteriorating.",
  ];

  const watchList = [
    latest.currentRatio !== null && latest.currentRatio < 1.5 ? "Liquidity coverage is tightening relative to short-term obligations." : "Liquidity remains acceptable for the current operating profile.",
    latest.debtToEquity !== null && latest.debtToEquity > 1.5 ? "Leverage has become elevated and should be monitored against cash generation." : "Debt levels appear manageable relative to equity.",
    latest.netMargin !== null && latest.netMargin < 5 ? "Profitability may be more sensitive to margin compression during slow periods." : "Profitability remains supportive of investment and debt service capacity.",
  ];

  const questions = [
    "What drove the change in gross margin between the latest and prior periods?",
    "Are there any one-off charges or investments affecting reported net income?",
    "How consistent is the working capital cycle across seasonal periods?",
    "Which expense categories contribute most to operating leverage?",
  ];

  const recommendations = [
    "Review the cost base by product or segment to isolate whether margin variance is structural or temporary.",
    "Stress-test the balance sheet under a slower revenue scenario to confirm liquidity thresholds.",
    "Compare capital expenditures with free cash flow to ensure reinvestment remains sustainable.",
    "Prepare a sensitivity analysis for revenue growth, margin expansion, and leverage ratios.",
  ];

  const executiveSummary = `Revenue increased ${formatPercent(revenueGrowth)} year over year while net margin remained ${formatPercent(latest.netMargin ?? 0)}. The company is generating ${formatCurrency(latest.operatingCashFlow ?? 0, "USD")} in operating cash flow, and the current ratio indicates ${latest.currentRatio !== null && latest.currentRatio > 1 ? "solid short-term coverage" : "tight liquidity coverage"}.`;

  return {
    executiveSummary,
    facts,
    hypotheses,
    watchList,
    questions,
    recommendations,
  };
}
