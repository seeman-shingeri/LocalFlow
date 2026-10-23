import { describe, it, expect } from 'vitest';
import { analyzeCustomerNote } from '@/lib/noteTagExtractor';

describe('Customer Note Word Count & Sentiment Extractor (noteTagExtractor)', () => {
  it('extracts unique hashtags and word counts', () => {
    const text = 'Met client for #wedding setup. Discussed #banquet and #wedding tent options.';
    const res = analyzeCustomerNote(text);

    expect(res.wordCount).toBe(11);
    expect(res.charCount).toBe(text.length);
    expect(res.hashtags).toEqual(['wedding', 'banquet']);
  });

  it('detects positive sentiment signals', () => {
    const text = 'Client was delighted with the stage lighting and approved the final quote!';
    const res = analyzeCustomerNote(text);

    expect(res.detectedTone).toBe('positive');
    expect(res.positiveSignals).toContain('delighted');
    expect(res.positiveSignals).toContain('approved');
    expect(res.riskSignals).toHaveLength(0);
  });

  it('detects negative/risk signals in escalation notes', () => {
    const text = 'Customer called with a complaint about delivery delay and damaged tent poles.';
    const res = analyzeCustomerNote(text);

    expect(res.detectedTone).toBe('negative');
    expect(res.riskSignals).toContain('complaint');
    expect(res.riskSignals).toContain('delay');
    expect(res.riskSignals).toContain('damaged');
  });

  it('flags urgent tone when emergency keywords are present', () => {
    const text = 'Send replacement generator immediately ASAP for the reception!';
    const res = analyzeCustomerNote(text);

    expect(res.detectedTone).toBe('urgent');
  });
});
