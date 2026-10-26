export interface LeadAcquisitionRecord {
  id: string;
  source: string; // e.g. 'google_ads', 'instagram', 'referral', etc.
  status: 'won' | 'lost' | 'contacted' | 'new' | string;
  revenueGenerated?: number;
}

export interface SourcePerformanceMetrics {
  source: string;
  totalLeads: number;
  convertedLeads: number;
  conversionRate: number; // percentage 0 - 100
  totalRevenue: number;
  averageDealValue: number;
}

export interface AttributionSummary {
  sources: SourcePerformanceMetrics[];
  totalLeads: number;
  totalConverted: number;
  overallConversionRate: number;
  totalRevenue: number;
  topSourceByRevenue: string | null;
  topSourceByConversion: string | null;
}

/**
 * Aggregates lead sources to compute conversion efficiency and revenue ROI.
 */
export function aggregateSourceAttribution(
  records: LeadAcquisitionRecord[]
): AttributionSummary {
  if (!records || records.length === 0) {
    return {
      sources: [],
      totalLeads: 0,
      totalConverted: 0,
      overallConversionRate: 0,
      totalRevenue: 0,
      topSourceByRevenue: null,
      topSourceByConversion: null,
    };
  }

  const map = new Map<
    string,
    { total: number; converted: number; revenue: number }
  >();

  let overallTotal = 0;
  let overallConverted = 0;
  let overallRevenue = 0;

  for (const item of records) {
    const rawSource = item.source?.trim().toLowerCase() || 'unattributed';
    const isWon = item.status?.toLowerCase() === 'won';
    const rev = Math.max(0, item.revenueGenerated || 0);

    overallTotal += 1;
    if (isWon) {
      overallConverted += 1;
      overallRevenue += rev;
    }

    const current = map.get(rawSource) || { total: 0, converted: 0, revenue: 0 };
    map.set(rawSource, {
      total: current.total + 1,
      converted: current.converted + (isWon ? 1 : 0),
      revenue: current.revenue + (isWon ? rev : 0),
    });
  }

  const sources: SourcePerformanceMetrics[] = [];

  for (const [source, data] of map.entries()) {
    const conversionRate =
      data.total > 0 ? Math.round((data.converted / data.total) * 1000) / 10 : 0;
    const averageDealValue =
      data.converted > 0 ? Math.round(data.revenue / data.converted) : 0;

    sources.push({
      source,
      totalLeads: data.total,
      convertedLeads: data.converted,
      conversionRate,
      totalRevenue: data.revenue,
      averageDealValue,
    });
  }

  // Sort by revenue descending
  sources.sort((a, b) => b.totalRevenue - a.totalRevenue);

  const topSourceByRevenue = sources.length > 0 ? sources[0].source : null;

  // Find source with highest conversion rate (minimum 2 leads)
  const qualifiedForRate = sources.filter((s) => s.totalLeads >= 2);
  qualifiedForRate.sort((a, b) => b.conversionRate - a.conversionRate);
  const topSourceByConversion =
    qualifiedForRate.length > 0 ? qualifiedForRate[0].source : topSourceByRevenue;

  const overallConversionRate =
    overallTotal > 0
      ? Math.round((overallConverted / overallTotal) * 1000) / 10
      : 0;

  return {
    sources,
    totalLeads: overallTotal,
    totalConverted: overallConverted,
    overallConversionRate,
    totalRevenue: overallRevenue,
    topSourceByRevenue,
    topSourceByConversion,
  };
}
