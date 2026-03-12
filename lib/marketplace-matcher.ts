interface Marketplace {
  id: string;
  name: string;
}

interface Expense {
  title: string;
  value: number;
}

interface MarketplaceResult {
  id: string;
  name: string;
  count: number;
  total: number;
}

export function matchMarketplaces(
  expenses: Expense[],
  marketplaces: Marketplace[],
): MarketplaceResult[] {
  const results: Record<string, MarketplaceResult> = {};

  for (const marketplace of marketplaces) {
    // Regex case-insensitive, aceita variações como "Mercado Livre", "mercadolivre", "ML"
    const escaped = marketplace.name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const regex = new RegExp(escaped, "i");

    const matched = expenses.filter((e) => regex.test(e.title));
    if (matched.length > 0) {
      results[marketplace.id] = {
        id: marketplace.id,
        name: marketplace.name,
        count: matched.length,
        total: matched.reduce((acc, e) => acc + e.value, 0),
      };
    }
  }

  return Object.values(results).sort((a, b) => b.total - a.total);
}
