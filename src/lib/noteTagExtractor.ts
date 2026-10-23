export type CustomerSentimentTone = 'positive' | 'negative' | 'neutral' | 'urgent';

export interface NoteAnalysisResult {
  charCount: number;
  wordCount: number;
  readingTimeMinutes: number;
  hashtags: string[];
  detectedTone: CustomerSentimentTone;
  riskSignals: string[];
  positiveSignals: string[];
}

const POSITIVE_KEYWORDS = [
  'delighted',
  'happy',
  'great',
  'excellent',
  'approved',
  'recommend',
  'loved',
  'satisfied',
  'impressed',
  'perfect',
];

const NEGATIVE_KEYWORDS = [
  'complaint',
  'unhappy',
  'delay',
  'refund',
  'broken',
  'damaged',
  'terrible',
  'disappointed',
  'frustrated',
  'faulty',
];

const URGENT_KEYWORDS = [
  'asap',
  'urgent',
  'emergency',
  'immediately',
  'critical',
  'rush',
];

/**
 * Analyzes interaction notes, extracting hashtags, metrics, and sentiment risk signals.
 */
export function analyzeCustomerNote(rawText: string): NoteAnalysisResult {
  if (!rawText || typeof rawText !== 'string') {
    return {
      charCount: 0,
      wordCount: 0,
      readingTimeMinutes: 0,
      hashtags: [],
      detectedTone: 'neutral',
      riskSignals: [],
      positiveSignals: [],
    };
  }

  const text = rawText.trim();
  const charCount = text.length;

  const words = text
    .split(/\s+/)
    .filter((w) => w.length > 0);
  const wordCount = words.length;

  // Average reading speed ~ 200 words per minute
  const readingTimeMinutes = Math.max(1, Math.ceil(wordCount / 200));

  // Extract #hashtags
  const hashtagRegex = /#([a-zA-Z0-9_\-]+)/g;
  const rawTags = text.match(hashtagRegex) || [];
  const hashtags = Array.from(
    new Set(rawTags.map((tag) => tag.substring(1).toLowerCase()))
  );

  const lower = text.toLowerCase();

  const positiveSignals = POSITIVE_KEYWORDS.filter((k) =>
    new RegExp(`\\b${k}\\b`, 'i').test(lower)
  );

  const riskSignals = NEGATIVE_KEYWORDS.filter((k) =>
    new RegExp(`\\b${k}\\b`, 'i').test(lower)
  );

  const isUrgent = URGENT_KEYWORDS.some((k) =>
    new RegExp(`\\b${k}\\b`, 'i').test(lower)
  );

  let detectedTone: CustomerSentimentTone = 'neutral';
  if (isUrgent) {
    detectedTone = 'urgent';
  } else if (riskSignals.length > positiveSignals.length) {
    detectedTone = 'negative';
  } else if (positiveSignals.length > 0) {
    detectedTone = 'positive';
  }

  return {
    charCount,
    wordCount,
    readingTimeMinutes,
    hashtags,
    detectedTone,
    riskSignals,
    positiveSignals,
  };
}
