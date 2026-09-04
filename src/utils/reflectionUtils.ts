import { DailyPromptItem, PromptCategory, InteractionEntry, OnThisDayMemory, PeriodicReflectionReport } from '../types';

/**
 * Thoughtful, varied, and categorized Daily Reflection Prompts
 */
export const CURATED_DAILY_PROMPTS: DailyPromptItem[] = [
  // Growth & Learning
  {
    id: 'growth-1',
    category: 'growth',
    theme: 'Growth & Insight',
    prompt: 'What did you learn today, and how did it change your perspective?',
    followUp: 'Was it an intellectual discovery, a personal lesson, or a realization about someone else?',
  },
  {
    id: 'growth-2',
    category: 'growth',
    theme: 'Honest Reflection',
    prompt: 'What would you do differently if you could replay today?',
    followUp: 'What compassion can you offer yourself for how you handled it in the moment?',
  },
  {
    id: 'growth-3',
    category: 'growth',
    theme: 'Small Triumphs',
    prompt: 'What is one obstacle you navigated today that you previously might have avoided?',
    followUp: 'Notice how your resilience has developed over time.',
  },

  // Gratitude & Joy
  {
    id: 'gratitude-1',
    category: 'gratitude',
    theme: 'Simple Joys',
    prompt: 'What made you happy or brought a spontaneous smile today?',
    followUp: 'Close your eyes and revisit the sensation of that moment.',
  },
  {
    id: 'gratitude-2',
    category: 'gratitude',
    theme: 'Appreciation',
    prompt: 'Who is someone whose presence made your day lighter or more bearable, and why?',
    followUp: 'Have you let them know, or can you send a quiet word of thanks?',
  },
  {
    id: 'gratitude-3',
    category: 'gratitude',
    theme: 'Quiet Abundance',
    prompt: 'What ordinary luxury or comfort did you enjoy today that often goes unnoticed?',
    followUp: 'A warm sip, clean air, safe shelter, or music.',
  },

  // Presence & Mindfulness
  {
    id: 'presence-1',
    category: 'presence',
    theme: 'Grounding',
    prompt: 'What is one thing in this present moment that you feel grounded by or deeply appreciative of?',
    followUp: 'Tune into your breathing and the physical space around you.',
  },
  {
    id: 'presence-2',
    category: 'presence',
    theme: 'Emotional Landscape',
    prompt: 'What emotion was most present for you today, and what triggered or softened it?',
    followUp: 'Allow the feeling to exist without judging whether it was "good" or "bad".',
  },
  {
    id: 'presence-3',
    category: 'presence',
    theme: 'Unspoken Thoughts',
    prompt: 'What thought has been circling in your mind that has not yet found expression?',
    followUp: 'Give it permission to rest on this page.',
  },

  // Challenges & Resilience
  {
    id: 'challenges-1',
    category: 'challenges',
    theme: 'Navigating Strain',
    prompt: 'What drained your energy today, and what boundary could protect your peace tomorrow?',
    followUp: 'Recognizing limits is an act of self-respect.',
  },
  {
    id: 'challenges-2',
    category: 'challenges',
    theme: 'Gentle Horizon',
    prompt: 'If you could give your future self one piece of calm reassurance for tomorrow, what would it be?',
    followUp: 'Write it as though speaking to someone you love dearly.',
  },

  // Creativity & Dreams
  {
    id: 'creativity-1',
    category: 'creativity',
    theme: 'Curiosity',
    prompt: 'What sparked your curiosity or daydreaming today, even for a brief instant?',
    followUp: 'Where might that curiosity lead if you gave it space to breathe?',
  },
  {
    id: 'creativity-2',
    category: 'creativity',
    theme: 'Unconstrained Vision',
    prompt: 'If you had one completely undisturbed day with zero obligations, how would you inhabit it?',
    followUp: 'Notice what desires this reveals about your current needs.',
  },

  // Relationships & Connection
  {
    id: 'relationships-1',
    category: 'relationships',
    theme: 'Authentic Connection',
    prompt: 'In what conversation or interaction did you feel most genuinely understood today?',
    followUp: 'What made that exchange feel safe or meaningful?',
  },
  {
    id: 'relationships-2',
    category: 'relationships',
    theme: 'Empathy',
    prompt: 'Whom did you empathize with today, and what did you see from their point of view?',
    followUp: 'How did holding that perspective expand your own understanding?',
  },
];

/**
 * Filter and shuffle daily prompts
 */
export function getDailyPrompts(category: PromptCategory = 'all', count: number = 6): DailyPromptItem[] {
  let pool = category === 'all' 
    ? [...CURATED_DAILY_PROMPTS] 
    : CURATED_DAILY_PROMPTS.filter((p) => p.category === category);

  // Pseudo-random deterministic shuffle
  const shuffled = [...pool].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

/**
 * Find historical "On This Day" memories from authentic user entries
 */
export function findOnThisDayMemories(entries: InteractionEntry[], referenceDate = new Date()): OnThisDayMemory[] {
  if (!entries || entries.length === 0) return [];

  const targetMonth = referenceDate.getMonth();
  const targetDay = referenceDate.getDate();
  const targetYear = referenceDate.getFullYear();
  const targetTime = referenceDate.getTime();

  const memories: OnThisDayMemory[] = [];

  for (const entry of entries) {
    const timestamp = entry.journalDate || entry.createdAt;
    if (!timestamp) continue;

    const entryDate = new Date(timestamp);
    const entryMonth = entryDate.getMonth();
    const entryDay = entryDate.getDate();
    const entryYear = entryDate.getFullYear();

    // Skip entries written today (same year, month, day)
    if (entryYear === targetYear && entryMonth === targetMonth && entryDay === targetDay) {
      continue;
    }

    const diffDays = Math.round((targetTime - timestamp) / (1000 * 60 * 60 * 24));

    // 1. Same Month & Day in a prior year
    if (entryMonth === targetMonth && entryDay === targetDay && entryYear < targetYear) {
      const yearDiff = targetYear - entryYear;
      memories.push({
        entry,
        timeAgoLabel: `${yearDiff} Year${yearDiff > 1 ? 's' : ''} Ago Today`,
        milestoneType: 'year_ago',
        formattedDate: entryDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }),
      });
      continue;
    }

    // 2. Same Day of the Month in previous months of the current year (at least 20 days ago)
    if (entryDay === targetDay && diffDays >= 20 && diffDays <= 365) {
      const monthDiff = Math.round(diffDays / 30);
      memories.push({
        entry,
        timeAgoLabel: `${monthDiff} Month${monthDiff > 1 ? 's' : ''} Ago Today`,
        milestoneType: 'month_ago',
        formattedDate: entryDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }),
      });
      continue;
    }

    // 3. Exact 7 or 14 days ago milestone
    if (diffDays === 7 || diffDays === 14) {
      memories.push({
        entry,
        timeAgoLabel: `${diffDays / 7} Week${diffDays === 14 ? 's' : ''} Ago`,
        milestoneType: 'week_ago',
        formattedDate: entryDate.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' }),
      });
    }
  }

  // Sort memories from oldest to newest
  return memories.sort((a, b) => {
    const tA = a.entry.journalDate || a.entry.createdAt || 0;
    const tB = b.entry.journalDate || b.entry.createdAt || 0;
    return tA - tB;
  });
}

/**
 * Call Server-Side Periodic Reflection API
 */
export async function fetchPeriodicReflection(
  timeframe: 'week' | 'month' | 'all_time',
  entries: InteractionEntry[],
  timeframeLabel?: string
): Promise<PeriodicReflectionReport> {
  // Filter entries to relevant timeframe
  const now = Date.now();
  let relevantEntries = entries;

  if (timeframe === 'week') {
    const weekAgo = now - 7 * 24 * 60 * 60 * 1000;
    relevantEntries = entries.filter((e) => (e.journalDate || e.createdAt) >= weekAgo);
  } else if (timeframe === 'month') {
    const monthAgo = now - 31 * 24 * 60 * 60 * 1000;
    relevantEntries = entries.filter((e) => (e.journalDate || e.createdAt) >= monthAgo);
  }

  const response = await fetch('/api/gemini/periodic-reflection', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      timeframe,
      timeframeLabel: timeframeLabel || (timeframe === 'week' ? 'Past 7 Days' : timeframe === 'month' ? 'This Month' : 'All Entries'),
      entries: relevantEntries.map((e) => ({
        title: e.title,
        journalContent: e.journalContent,
        initialPrompt: e.initialPrompt,
        mood: e.mood,
        emotionTags: e.emotionTags,
        journalDate: e.journalDate || e.createdAt,
      })),
    }),
  });

  const json = await response.json();
  if (!response.ok || !json.success) {
    throw new Error(json.error || 'Failed to communicate with AI reflection service.');
  }

  return json.data;
}

export interface JournalVaultResponse {
  reply: string;
  modelUsed?: string;
}

/**
 * Call Server-Side Talk to My Journal API
 * Handles 429 (rate-limit), 500/503 (service disruption), 404, and network failure
 */
export async function askJournalVault(
  query: string,
  history: Array<{ role: 'user' | 'model'; content: string }>,
  entries: InteractionEntry[]
): Promise<string> {
  const result = await askJournalVaultDetailed(query, history, entries);
  return result.reply;
}

/**
 * Detailed version returning both reply and model metadata
 */
export async function askJournalVaultDetailed(
  query: string,
  history: Array<{ role: 'user' | 'model'; content: string }>,
  entries: InteractionEntry[]
): Promise<JournalVaultResponse> {
  let response: Response;

  try {
    response = await fetch('/api/gemini/talk-to-journal', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: query.trim(),
        history,
        entries: entries.map((e) => ({
          title: e.title,
          journalContent: e.journalContent,
          initialPrompt: e.initialPrompt,
          mood: e.mood,
          emotionTags: e.emotionTags,
          journalDate: e.journalDate || e.createdAt,
        })),
      }),
    });
  } catch (networkErr: any) {
    throw new Error(
      networkErr.message?.includes('Failed to fetch')
        ? 'Network connection issue. Please check your internet connection and try again.'
        : `Connection failed: ${networkErr.message || 'Unknown network error'}`
    );
  }

  // Handle distinct HTTP status codes
  if (response.status === 429) {
    // Attempt to extract response if JSON available, or throw rate limit error
    try {
      const json = await response.json();
      if (json.reply) return { reply: json.reply, modelUsed: json.modelUsed || 'local-fallback' };
      throw new Error(json.error || 'Rate limit reached. Please wait a moment before asking another question.');
    } catch {
      throw new Error('Too many requests. Please pause for a moment before inquiring again.');
    }
  }

  if (response.status === 503 || response.status === 500) {
    try {
      const json = await response.json();
      if (json.reply) return { reply: json.reply, modelUsed: json.modelUsed || 'local-fallback' };
      throw new Error(json.error || 'The journal companion service is temporarily unavailable. Please retry shortly.');
    } catch {
      throw new Error('The AI reflection service experienced a temporary disruption. Please click Retry.');
    }
  }

  if (response.status === 404) {
    throw new Error('Journal companion service endpoint was not found.');
  }

  let json: any;
  try {
    json = await response.json();
  } catch {
    throw new Error('Received an unreadable response from the journal vault server.');
  }

  if (!response.ok || !json.success) {
    throw new Error(json?.error || 'Failed to query journal vault.');
  }

  if (!json.reply || typeof json.reply !== 'string' || !json.reply.trim()) {
    throw new Error('The companion generated an empty response. Please try rephrasing your question.');
  }

  return {
    reply: json.reply,
    modelUsed: json.modelUsed,
  };
}
