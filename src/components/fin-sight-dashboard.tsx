"use client";

import { useMemo, useState } from "react";
import * as XLSX from "xlsx";
import {
  Area,
  Bar,
  BarChart,
  CartesianGrid,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Download, FileSpreadsheet, Gauge, Sparkles, TrendingUp } from "lucide-react";
import {
  buildDashboardSummary,
  calculateMetrics,
  formatCurrency,
  formatPercent,
} from "@/lib/financial";
import { generateAiInsights } from "@/lib/ai-analysis";
import { getSampleCsv, sampleFinancialPeriods } from "@/lib/sample-data";
import type { FinancialPeriod } from "@/lib/financial";

const fieldOptions = {
  period: ["period", "year", "fiscalYear", "date"],
  revenue: ["revenue", "sales", "totalRevenue", "netSales"],
  cogs: ["cogs", "costOfGoodsSold", "costOfRevenue", "costOfSales"],
  operatingIncome: ["operatingIncome", "ebit", "operatingProfit"],
  netIncome: ["netIncome", "netProfit", "profitAfterTax"],
  currentAssets: ["currentAssets", "totalCurrentAssets"],
  currentLiabilities: ["currentLiabilities", "totalCurrentLiabilities"],
  totalAssets: ["totalAssets", "assets"],
  totalLiabilities: ["totalLiabilities", "liabilities"],
  equity: ["shareholdersEquity", "equity", "totalEquity"],
  cash: ["cash", "cashAndCashEquivalents"],
  shortTermInvestments: ["shortTermInvestments", "marketableSecurities"],
  accountsReceivable: ["accountsReceivable", "tradeReceivables"],
  operatingCashFlow: ["operatingCashFlow", "cashFromOperations"],
  capitalExpenditures: ["capitalExpenditures", "capEx", "purchaseOfPropertyPlantEquipment"],
  debt: ["totalDebt", "debt", "borrowings"],
  depreciationAndAmortization: ["depreciationAndAmortization", "da", "depreciation"],
} as const;

const navItems = ["Overview", "Financial Statements", "Ratio Analysis", "Trends", "AI Insights", "Reports", "Settings"];

function convertToNumber(value: unknown): number | null {
  if (value === null || value === undefined || value === "") return null;
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  const cleaned = String(value).replace(/[$,%\s]/g, "").replace(/,/g, "");
  const parsed = Number(cleaned);
  return Number.isFinite(parsed) ? parsed : null;
}

export default function FinSightDashboard() {
  const [periods, setPeriods] = useState<FinancialPeriod[]>(sampleFinancialPeriods);
  const [selectedPeriod, setSelectedPeriod] = useState<string>(sampleFinancialPeriods[sampleFinancialPeriods.length - 1].period);
  const [step, setStep] = useState<number>(0);
  const [rawRows, setRawRows] = useState<Record<string, unknown>[]>([]);
  const [mapping, setMapping] = useState<Record<string, string>>({
    period: "period",
    revenue: "revenue",
    cogs: "cogs",
    operatingIncome: "operatingIncome",
    netIncome: "netIncome",
    currentAssets: "currentAssets",
    currentLiabilities: "currentLiabilities",
    totalAssets: "totalAssets",
    totalLiabilities: "totalLiabilities",
    equity: "equity",
    cash: "cash",
    shortTermInvestments: "shortTermInvestments",
    accountsReceivable: "accountsReceivable",
    operatingCashFlow: "operatingCashFlow",
    capitalExpenditures: "capitalExpenditures",
    debt: "debt",
    depreciationAndAmortization: "depreciationAndAmortization",
  });
  const [warnings, setWarnings] = useState<string[]>([]);
  const currency = "USD";

  const summary = useMemo(() => buildDashboardSummary(periods), [periods]);
  const aiInsights = useMemo(() => generateAiInsights(periods), [periods]);

  const selectedMetrics = useMemo(
    () => calculateMetrics(periods.find((item) => item.period === selectedPeriod) ?? periods[periods.length - 1]),
    [periods, selectedPeriod],
  );

  const statementTable = useMemo(() => {
    const selected = periods.find((p) => p.period === selectedPeriod) ?? periods[periods.length - 1];
    return [
      { label: "Revenue", value: selected.revenue },
      { label: "Cost of goods sold", value: selected.cogs },
      { label: "Gross profit", value: (selected.revenue ?? 0) - (selected.cogs ?? 0) },
      { label: "Operating income", value: selected.operatingIncome },
      { label: "Net income", value: selected.netIncome },
      { label: "Operating cash flow", value: selected.operatingCashFlow },
      { label: "Capital expenditures", value: selected.capitalExpenditures },
    ];
  }, [periods, selectedPeriod]);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const buffer = await file.arrayBuffer();
    const workbook = XLSX.read(buffer, { type: "array" });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json(sheet, { defval: null }) as Record<string, unknown>[];

    setRawRows(rows);
    setStep(1);
    setWarnings([]);

    if (rows.length > 0) {
      const headers = Object.keys(rows[0]);
      const mapped = { ...mapping };
      for (const [field, options] of Object.entries(fieldOptions)) {
        const matched = headers.find((header) =>
          options.some((option) => String(header).toLowerCase().includes(option.toLowerCase())),
        );
        if (matched) mapped[field] = matched;
      }
      setMapping(mapped);
    }
  };

  const applyMappedImport = () => {
    const nextPeriods = rawRows
      .map((row) => {
        const periodValue = String(row[mapping.period] ?? row.period ?? "");
        const numberable = {
          period: periodValue,
          revenue: convertToNumber(row[mapping.revenue]),
          cogs: convertToNumber(row[mapping.cogs]),
          operatingIncome: convertToNumber(row[mapping.operatingIncome]),
          netIncome: convertToNumber(row[mapping.netIncome]),
          currentAssets: convertToNumber(row[mapping.currentAssets]),
          currentLiabilities: convertToNumber(row[mapping.currentLiabilities]),
          totalAssets: convertToNumber(row[mapping.totalAssets]),
          totalLiabilities: convertToNumber(row[mapping.totalLiabilities]),
          equity: convertToNumber(row[mapping.equity]),
          cash: convertToNumber(row[mapping.cash]),
          shortTermInvestments: convertToNumber(row[mapping.shortTermInvestments]),
          accountsReceivable: convertToNumber(row[mapping.accountsReceivable]),
          operatingCashFlow: convertToNumber(row[mapping.operatingCashFlow]),
          capitalExpenditures: convertToNumber(row[mapping.capitalExpenditures]),
          debt: convertToNumber(row[mapping.debt]),
          depreciationAndAmortization: convertToNumber(row[mapping.depreciationAndAmortization]),
        };

        return {
          period: numberable.period || `FY-${Math.random().toString(36).slice(2, 6)}`,
          revenue: numberable.revenue,
          cogs: numberable.cogs,
          operatingIncome: numberable.operatingIncome,
          netIncome: numberable.netIncome,
          currentAssets: numberable.currentAssets,
          currentLiabilities: numberable.currentLiabilities,
          totalAssets: numberable.totalAssets,
          totalLiabilities: numberable.totalLiabilities,
          equity: numberable.equity,
          cash: numberable.cash,
          shortTermInvestments: numberable.shortTermInvestments,
          accountsReceivable: numberable.accountsReceivable,
          operatingCashFlow: numberable.operatingCashFlow,
          capitalExpenditures: numberable.capitalExpenditures,
          debt: numberable.debt,
          depreciationAndAmortization: numberable.depreciationAndAmortization,
          reportingFrequency: "annual",
        } as FinancialPeriod;
      })
      .filter((entry) => entry.period && entry.revenue !== null);

    const nextWarnings: string[] = [];
    if (nextPeriods.length === 0) nextWarnings.push("No usable financial rows could be parsed from the selected file.");
    if (nextPeriods.some((period) => period.revenue === null || period.netIncome === null)) nextWarnings.push("Some required income statement lines are missing in the upload.");
    if (new Set(nextPeriods.map((period) => period.period)).size !== nextPeriods.length) nextWarnings.push("Duplicate reporting periods were detected.");
    setWarnings(nextWarnings);

    if (nextPeriods.length > 0) {
      setPeriods(nextPeriods);
      setSelectedPeriod(nextPeriods[nextPeriods.length - 1].period);
      setStep(4);
    }
  };

  const handleDownloadSample = () => {
    const csvContent = getSampleCsv();
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "finsight-sample-data.csv";
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="flex min-h-screen">
        <aside className="hidden w-72 border-r border-slate-800 bg-slate-900/80 p-6 lg:block">
          <div className="mb-8 flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-500/15 text-blue-300">
              <Gauge className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-slate-400">FinSight AI</p>
              <h1 className="text-xl font-semibold">Financial Intelligence</h1>
            </div>
          </div>

          <nav className="space-y-2">
            {navItems.map((item) => (
              <button
                key={item}
                className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-sm text-left transition ${
                  item === "Overview" ? "bg-slate-800 text-white" : "text-slate-300 hover:bg-slate-800/80"
                }`}
              >
                <span>{item}</span>
              </button>
            ))}
          </nav>

          <div className="mt-8 rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
            <div className="flex items-center gap-2 text-sm text-emerald-300">
              <TrendingUp className="h-4 w-4" />
              AI coverage
            </div>
            <p className="mt-2 text-2xl font-semibold">94%</p>
            <p className="text-xs text-slate-400">Model confidence based on normalized financial statements.</p>
          </div>
        </aside>

        <main className="flex-1 px-4 py-6 md:px-8">
          <header className="mb-6 flex flex-col justify-between gap-4 border-b border-slate-800 pb-5 md:flex-row md:items-center">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Overview</p>
              <h2 className="mt-2 text-3xl font-semibold text-white">Northstar Labs</h2>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <select
                value={selectedPeriod}
                onChange={(event) => setSelectedPeriod(event.target.value)}
                className="rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100"
              >
                {periods.map((period) => (
                  <option key={period.period} value={period.period}>
                    {period.period}
                  </option>
                ))}
              </select>
              <button
                onClick={handleDownloadSample}
                className="inline-flex items-center gap-2 rounded-xl border border-blue-500/40 bg-blue-500/10 px-4 py-2 text-sm text-blue-200 transition hover:bg-blue-500/20"
              >
                <Download className="h-4 w-4" /> Download sample CSV
              </button>
            </div>
          </header>

          <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {[
              { label: "Revenue", value: summary.latest.revenue, format: "currency", tooltip: "Total sales generated during the reported period." },
              { label: "Revenue growth", value: summary.revenueGrowth, format: "percent", tooltip: "Change in revenue compared with the previous comparable period." },
              { label: "Gross margin", value: selectedMetrics.grossProfitMargin, format: "percent", tooltip: "Gross profit as a share of revenue." },
              { label: "Net margin", value: selectedMetrics.netMargin, format: "percent", tooltip: "Net income divided by revenue." },
              { label: "Current ratio", value: selectedMetrics.currentRatio, format: "ratio", tooltip: "Current assets divided by current liabilities." },
              { label: "Debt-to-equity", value: selectedMetrics.debtToEquity, format: "ratio", tooltip: "Total debt relative to shareholder equity." },
              { label: "Operating cash flow", value: selectedMetrics.operatingCashFlowMargin, format: "percent", tooltip: "Cash generated from core operating business activities." },
              { label: "Free cash flow", value: selectedMetrics.freeCashFlow, format: "currency", tooltip: "Operating cash flow less capital expenditures." },
            ].map((card) => (
              <div key={card.label} className="rounded-2xl border border-slate-800 bg-slate-900/80 p-4 shadow-lg shadow-slate-950/20" title={card.tooltip}>
                <p className="text-xs uppercase tracking-[0.2em] text-slate-400">{card.label}</p>
                <p className="mt-4 text-2xl font-semibold text-white">
                  {card.value == null
                    ? "—"
                    : card.format === "currency"
                      ? formatCurrency(card.value as number, currency)
                      : card.format === "percent"
                        ? formatPercent(card.value as number)
                        : (Number(card.value).toFixed(2) || "—")}
                </p>
              </div>
            ))}
          </section>

          <section className="mt-8 grid gap-6 xl:grid-cols-[1.7fr_1fr]">
            <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-4">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-lg font-semibold text-white">Revenue and net income trend</h3>
                <span className="rounded-full border border-slate-700 px-2 py-1 text-xs text-slate-300">Annual</span>
              </div>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={summary.chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                    <XAxis dataKey="period" stroke="#94a3b8" />
                    <YAxis stroke="#94a3b8" tickFormatter={(value) => `$${Math.round(value / 1000000)}M`} />
                    <Tooltip formatter={(value) => formatCurrency(Number(value ?? 0), currency)} />
                    <Area type="monotone" dataKey="revenue" fill="#2563eb" stroke="#60a5fa" fillOpacity={0.2} />
                    <Line type="monotone" dataKey="netIncome" stroke="#34d399" strokeWidth={2} />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-4">
              <h3 className="mb-4 text-lg font-semibold text-white">Profitability breakdown</h3>
              <div className="space-y-4">
                {[
                  { label: "Gross margin", value: selectedMetrics.grossProfitMargin ?? 0 },
                  { label: "Operating margin", value: selectedMetrics.operatingMargin ?? 0 },
                  { label: "Net margin", value: selectedMetrics.netMargin ?? 0 },
                ].map((row) => (
                  <div key={row.label}>
                    <div className="mb-1 flex items-center justify-between text-sm text-slate-300">
                      <span>{row.label}</span>
                      <span>{formatPercent(row.value)}</span>
                    </div>
                    <div className="h-2 rounded-full bg-slate-800">
                      <div className="h-2 rounded-full bg-gradient-to-r from-blue-500 to-emerald-400" style={{ width: `${Math.min(Math.max(row.value, 0), 100)}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section className="mt-8 grid gap-6 xl:grid-cols-2">
            <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-4">
              <h3 className="mb-4 text-lg font-semibold text-white">Cash flow trend</h3>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={summary.chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                    <XAxis dataKey="period" stroke="#94a3b8" />
                    <YAxis stroke="#94a3b8" tickFormatter={(value) => `$${Math.round(value / 1000000)}M`} />
                    <Tooltip formatter={(value) => formatCurrency(Number(value ?? 0), currency)} />
                    <Bar dataKey="operatingCashFlow" fill="#38bdf8" radius={[6, 6, 0, 0]} />
                    <Bar dataKey="freeCashFlow" fill="#34d399" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-4">
              <h3 className="mb-4 text-lg font-semibold text-white">Key risks and opportunities</h3>
              <div className="space-y-3">
                {aiInsights.watchList.map((item, index) => (
                  <div key={item} className="rounded-xl border border-slate-800 bg-slate-950/80 p-3 text-sm text-slate-200">
                    <span className="mr-2 inline-flex h-6 w-6 items-center justify-center rounded-full bg-blue-500/15 text-xs text-blue-200">{index + 1}</span>
                    {item}
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section className="mt-8 grid gap-6 xl:grid-cols-3">
            <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-4 xl:col-span-2">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-lg font-semibold text-white">Financial statements</h3>
                <button className="rounded-full border border-slate-700 px-3 py-1 text-xs text-slate-300">Export CSV</button>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full text-left text-sm">
                  <thead className="border-b border-slate-800 text-slate-400">
                    <tr>
                      <th className="pb-3 pr-4 font-medium">Line item</th>
                      <th className="pb-3 pr-4 font-medium">{selectedPeriod}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {statementTable.map((row) => (
                      <tr key={row.label} className="border-b border-slate-800/80 text-slate-200">
                        <td className="py-3 pr-4">{row.label}</td>
                        <td className="py-3 pr-4">{row.value == null ? "—" : formatCurrency(row.value as number, currency)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-4">
              <h3 className="mb-4 text-lg font-semibold text-white">Ratio analysis</h3>
              <div className="space-y-3 text-sm">
                {[
                  ["Current ratio", selectedMetrics.currentRatio],
                  ["Quick ratio", selectedMetrics.quickRatio],
                  ["Debt ratio", selectedMetrics.debtRatio],
                  ["Return on assets", selectedMetrics.returnOnAssets],
                  ["Return on equity", selectedMetrics.returnOnEquity],
                ].map(([label, value]) => (
                  <div key={label} className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-950/80 px-3 py-2">
                    <span className="text-slate-300">{label}</span>
                    <span className="font-medium text-white">{value == null ? "—" : Number(value).toFixed(2)}</span>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section className="mt-8 grid gap-6 xl:grid-cols-[1.3fr_1fr]">
            <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-4">
              <div className="mb-4 flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-amber-300" />
                <h3 className="text-lg font-semibold text-white">AI analyst</h3>
              </div>
              <div className="space-y-4 text-sm text-slate-200">
                <div className="rounded-xl border border-slate-800 bg-slate-950/80 p-3">
                  <p className="mb-1 text-xs uppercase tracking-[0.2em] text-slate-400">Executive summary</p>
                  <p>{aiInsights.executiveSummary}</p>
                </div>
                <div className="grid gap-3 md:grid-cols-2">
                  <div className="rounded-xl border border-slate-800 bg-slate-950/80 p-3">
                    <p className="mb-2 text-xs uppercase tracking-[0.2em] text-slate-400">Observed facts</p>
                    <ul className="space-y-2 text-slate-300">
                      {aiInsights.facts.map((fact) => (
                        <li key={fact} className="list-disc pl-4">{fact}</li>
                      ))}
                    </ul>
                  </div>
                  <div className="rounded-xl border border-slate-800 bg-slate-950/80 p-3">
                    <p className="mb-2 text-xs uppercase tracking-[0.2em] text-slate-400">Hypotheses</p>
                    <ul className="space-y-2 text-slate-300">
                      {aiInsights.hypotheses.map((hypothesis) => (
                        <li key={hypothesis} className="list-disc pl-4">{hypothesis}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-4">
              <h3 className="mb-4 text-lg font-semibold text-white">Import wizard</h3>
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm text-slate-300">
                  <FileSpreadsheet className="h-4 w-4 text-blue-300" />
                  <span>Step {step + 1}/5</span>
                </div>
                <label className="flex cursor-pointer items-center justify-center rounded-2xl border border-dashed border-slate-700 bg-slate-950/80 px-4 py-8 text-center text-sm text-slate-300 hover:border-blue-400">
                  <input type="file" accept=".csv,.xlsx,.xls" className="hidden" onChange={handleFileUpload} />
                  Upload CSV or Excel file
                </label>
                {rawRows.length > 0 && (
                  <div className="rounded-xl border border-slate-800 bg-slate-950/80 p-3 text-xs text-slate-300">
                    {Object.keys(rawRows[0]).slice(0, 6).map((header) => {
                      const fieldEntries = Object.entries(fieldOptions) as Array<[string, readonly string[]]>;
                      const matchedField = fieldEntries.find(([, options]) =>
                        options.some((option) => option.toLowerCase() === header.toLowerCase() || header.toLowerCase().includes(option.toLowerCase())),
                      )?.[0];

                      return (
                        <div key={header} className="mb-1 flex items-center justify-between">
                          <span>{header}</span>
                          <select
                            value={matchedField ? mapping[matchedField as keyof typeof mapping] ?? "" : ""}
                            onChange={(event) => {
                              const nextSelected = event.target.value;
                              if (!matchedField || nextSelected === "") return;
                              setMapping((prev) => ({ ...prev, [matchedField]: nextSelected }));
                            }}
                            className="ml-2 rounded border border-slate-700 bg-slate-900 px-2 py-1 text-[10px]"
                          >
                            <option value="">Unmapped</option>
                            {fieldEntries.map(([field]) => (
                              <option key={field} value={field}>{field}</option>
                            ))}
                          </select>
                        </div>
                      );
                    })}
                  </div>
                )}
                <button
                  onClick={applyMappedImport}
                  className="w-full rounded-xl bg-blue-500 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-400"
                >
                  Validate and confirm import
                </button>
                {warnings.length > 0 && (
                  <div className="rounded-xl border border-amber-500/40 bg-amber-500/10 p-3 text-xs text-amber-100">
                    {warnings.map((warning) => (
                      <p key={warning}>{warning}</p>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
