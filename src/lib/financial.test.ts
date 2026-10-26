import { describe, expect, it } from "vitest";
import {
  buildDashboardSummary,
  calculateMetrics,
  formatCurrency,
  formatPercent,
  percentageChange,
} from "./financial";

describe("financial calculations", () => {
  it("calculates revenue growth with a previous-period comparison", () => {
    const result = percentageChange(120, 100);
    expect(result).toBe(20);
  });

  it("handles negative prior-year revenue correctly", () => {
    const result = percentageChange(-100, -200);
    expect(result).toBe(50);
  });

  it("returns null for division by zero and missing values", () => {
    expect(calculateMetrics({
      period: "2024",
      revenue: 100,
      cogs: 50,
      operatingIncome: 10,
      netIncome: 15,
      currentAssets: 40,
      currentLiabilities: 0,
      totalAssets: 200,
      totalLiabilities: 150,
      equity: 50,
      cash: 10,
      shortTermInvestments: 5,
      accountsReceivable: 7,
      operatingCashFlow: 20,
      capitalExpenditures: 10,
      debt: 20,
      depreciationAndAmortization: 5,
    }).currentRatio).toBeNull();
    expect(calculateMetrics({
      period: "2024",
      revenue: 100,
      cogs: 50,
      operatingIncome: 10,
      netIncome: 15,
      currentAssets: 40,
      currentLiabilities: 20,
      totalAssets: 200,
      totalLiabilities: 150,
      equity: 50,
      cash: 10,
      shortTermInvestments: 5,
      accountsReceivable: 7,
      operatingCashFlow: 20,
      capitalExpenditures: 10,
      debt: 20,
      depreciationAndAmortization: 5,
    }).grossProfitMargin).toBe(50);
  });

  it("builds a dashboard summary and date series", () => {
    const summary = buildDashboardSummary([
      {
        period: "2023",
        revenue: 100,
        cogs: 40,
        operatingIncome: 30,
        netIncome: 20,
        currentAssets: 50,
        currentLiabilities: 25,
        totalAssets: 200,
        totalLiabilities: 150,
        equity: 50,
        cash: 10,
        shortTermInvestments: 5,
        accountsReceivable: 8,
        operatingCashFlow: 25,
        capitalExpenditures: 5,
        debt: 20,
        depreciationAndAmortization: 8,
      },
      {
        period: "2024",
        revenue: 150,
        cogs: 60,
        operatingIncome: 40,
        netIncome: 30,
        currentAssets: 80,
        currentLiabilities: 40,
        totalAssets: 260,
        totalLiabilities: 180,
        equity: 80,
        cash: 15,
        shortTermInvestments: 10,
        accountsReceivable: 12,
        operatingCashFlow: 45,
        capitalExpenditures: 10,
        debt: 30,
        depreciationAndAmortization: 10,
      },
    ]);

    expect(summary.revenueGrowth).toBe(50);
    expect(summary.latest.netMargin).toBe(20);
    expect(summary.chartData[1].revenue).toBe(150);
  });

  it("formats currency and percent values for the UI", () => {
    expect(formatCurrency(1500)).toBe("$1,500");
    expect(formatPercent(12.5)).toBe("12.5%");
  });
});
