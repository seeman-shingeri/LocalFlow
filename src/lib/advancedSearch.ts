/**
 * LocalFlow AI — Enterprise Multi-Entity Fuzzy Search Engine
 *
 * Implements tokenized multi-attribute matching, prefix weighting, exact match boosting,
 * and relevance ranking across customers, invoices, enquiries, inventory, and bookings.
 */

export interface SearchableEntity {
  id: string;
  type: 'customer' | 'invoice' | 'enquiry' | 'inventory' | 'appointment' | 'payment';
  title: string;
  subtitle?: string;
  keywords?: string[];
  referenceNumber?: string;
  metadata?: Record<string, any>;
}

export interface SearchMatchResult<T extends SearchableEntity = SearchableEntity> {
  item: T;
  score: number; // Higher is more relevant
  matchedFields: string[];
}

export class AdvancedSearchEngine<T extends SearchableEntity = SearchableEntity> {
  private index: Map<string, T> = new Map();

  /**
   * Adds or updates an entity in the searchable index.
   */
  indexEntity(entity: T): void {
    this.index.set(`${entity.type}:${entity.id}`, entity);
  }

  /**
   * Bulk indexes an array of entities.
   */
  indexBulk(entities: T[]): void {
    entities.forEach((e) => this.indexEntity(e));
  }

  /**
   * Removes an entity from the search index.
   */
  removeEntity(type: string, id: string): boolean {
    return this.index.delete(`${type}:${id}`);
  }

  /**
   * Searches the indexed entities using weighted multi-attribute token matching.
   */
  search(
    query: string,
    options: {
      types?: SearchableEntity['type'][];
      minScore?: number;
      limit?: number;
    } = {}
  ): SearchMatchResult<T>[] {
    const { types, minScore = 1, limit = 20 } = options;
    const cleanQuery = query.trim().toLowerCase();

    if (!cleanQuery) return [];

    const tokens = cleanQuery.split(/\s+/).filter(Boolean);
    const results: SearchMatchResult<T>[] = [];

    for (const item of this.index.values()) {
      if (types && types.length > 0 && !types.includes(item.type)) {
        continue;
      }

      const match = this.scoreEntity(tokens, cleanQuery, item);
      if (match.score >= minScore) {
        results.push({ item, ...match });
      }
    }

    // Sort descending by relevance score
    results.sort((a, b) => b.score - a.score);

    return results.slice(0, limit);
  }

  /**
   * Computes a relevance score for an entity against query tokens.
   */
  private scoreEntity(
    tokens: string[],
    fullQuery: string,
    item: SearchableEntity
  ): { score: number; matchedFields: string[] } {
    let score = 0;
    const matchedFields: Set<string> = new Set();

    const titleLower = item.title.toLowerCase();
    const subLower = (item.subtitle || '').toLowerCase();
    const refLower = (item.referenceNumber || '').toLowerCase();
    const keywordsLower = (item.keywords || []).map((k) => k.toLowerCase());

    // 1. Exact reference / invoice / phone number match (Highest Weight)
    if (refLower && refLower === fullQuery) {
      score += 100;
      matchedFields.add('referenceNumber');
    } else if (refLower && refLower.includes(fullQuery)) {
      score += 40;
      matchedFields.add('referenceNumber');
    }

    // 2. Exact full title match
    if (titleLower === fullQuery) {
      score += 80;
      matchedFields.add('title');
    } else if (titleLower.startsWith(fullQuery)) {
      score += 50;
      matchedFields.add('title');
    }

    // 3. Token-by-token evaluation
    for (const token of tokens) {
      if (titleLower.includes(token)) {
        score += 20;
        matchedFields.add('title');
      }
      if (subLower.includes(token)) {
        score += 10;
        matchedFields.add('subtitle');
      }
      if (keywordsLower.some((k) => k.includes(token))) {
        score += 15;
        matchedFields.add('keywords');
      }
    }

    return { score, matchedFields: Array.from(matchedFields) };
  }

  /**
   * Clears the index.
   */
  clear(): void {
    this.index.clear();
  }

  /**
   * Returns total indexed document count.
   */
  count(): number {
    return this.index.size;
  }
}

export const advancedSearchEngine = new AdvancedSearchEngine();
