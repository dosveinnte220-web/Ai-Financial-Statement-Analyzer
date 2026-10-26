import { NextResponse } from "next/server";
import { generateAiInsights } from "@/lib/ai-analysis";
import { sampleFinancialPeriods } from "@/lib/sample-data";

export async function GET() {
  return NextResponse.json(generateAiInsights(sampleFinancialPeriods));
}
