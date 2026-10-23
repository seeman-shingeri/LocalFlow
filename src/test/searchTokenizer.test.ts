import { describe, it, expect } from 'vitest';
import { tokenizeQuery, rankBySearchTokens } from '@/lib/searchTokenizer';

describe('Search Query Tokenizer & Fuzzy Match Ranker (searchTokenizer)', () => {
  it('tokenizes search queries by whitespace and punctuation', () => {
    const query = '  John, Doe - Wedding+VIP  ';
    const tokens = tokenizeQuery(query);
    expect(tokens).toEqual(['john', 'doe', 'wedding', 'vip']);
  });

  it('ranks exact matches higher than prefix or substring matches', () => {
    interface Contact {
      name: string;
      email: string;
    }

    const contacts: Contact[] = [
      { name: 'John Doe', email: 'johndoe@example.com' },
      { name: 'John', email: 'john@example.com' },
      { name: 'Little Johnny', email: 'littlej@example.com' },
    ];

    const results = rankBySearchTokens(contacts, 'John', [
      (c) => c.name,
      (c) => c.email,
    ]);

    expect(results.length).toBe(3);
    // 'John' matches exactly name 'John' (score 100)
    expect(results[0].item.name).toBe('John');
    expect(results[0].score).toBe(100);

    // 'John Doe' has prefix match (score 50)
    expect(results[1].item.name).toBe('John Doe');
    expect(results[1].score).toBe(50);

    // 'Little Johnny' has substring match (score 25)
    expect(results[2].item.name).toBe('Little Johnny');
    expect(results[2].score).toBe(25);
  });

  it('returns empty results if no tokens match any target fields', () => {
    const list = [{ title: 'Shamiyana Tent' }, { title: 'Haldi Stage' }];
    const results = rankBySearchTokens(list, 'Catering', [(item) => item.title]);
    expect(results).toHaveLength(0);
  });
});
