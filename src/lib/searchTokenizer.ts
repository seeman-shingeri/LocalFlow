export interface TokenMatchResult<T> {
  item: T;
  score: number;
  matchedTokens: string[];
}

/**
 * Tokenizes a search query into cleaned, lowercased query terms.
 */
export function tokenizeQuery(query: string): string[] {
  if (!query || typeof query !== 'string') return [];
  return query
    .toLowerCase()
    .trim()
    .split(/[\s,._\-+]+/)
    .filter((token) => token.length > 0);
}

/**
 * Computes a fuzzy relevance match score for a single candidate field against a token.
 * Higher score indicates closer relevance.
 */
function scoreTokenMatch(targetText: string, token: string): number {
  const text = targetText.toLowerCase();
  if (text === token) return 100; // Exact match
  if (text.startsWith(token)) return 50; // Prefix match
  if (text.includes(token)) return 25; // Substring match
  return 0;
}

/**
 * Filters and ranks a list of items based on query token matches across specified text extraction fields.
 */
export function rankBySearchTokens<T>(
  items: T[],
  query: string,
  fieldExtractors: Array<(item: T) => string | undefined | null>
): TokenMatchResult<T>[] {
  const tokens = tokenizeQuery(query);
  if (tokens.length === 0) {
    return items.map((item) => ({ item, score: 0, matchedTokens: [] }));
  }

  const results: TokenMatchResult<T>[] = [];

  for (const item of items) {
    const extractedTexts = fieldExtractors
      .map((extract) => extract(item))
      .filter((val): val is string => typeof val === 'string' && val.trim().length > 0);

    let totalScore = 0;
    const matchedTokens: string[] = [];

    for (const token of tokens) {
      let maxTokenScore = 0;
      for (const field of extractedTexts) {
        const score = scoreTokenMatch(field, token);
        if (score > maxTokenScore) {
          maxTokenScore = score;
        }
      }

      if (maxTokenScore > 0) {
        totalScore += maxTokenScore;
        matchedTokens.push(token);
      }
    }

    // Only include items that matched at least one query token
    if (totalScore > 0) {
      results.push({ item, score: totalScore, matchedTokens });
    }
  }

  // Sort descending by highest match score
  return results.sort((a, b) => b.score - a.score);
}
