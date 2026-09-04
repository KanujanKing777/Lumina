export interface UserProfile {
  uid: string;
  displayName: string | null;
  email: string | null;
  photoURL: string | null;
}

export type ReflectionMode = 'reflect' | 'brainstorm' | 'summarize' | 'action_plan';

export type MoodType =
  | 'happy'
  | 'calm'
  | 'excited'
  | 'grateful'
  | 'neutral'
  | 'sad'
  | 'anxious'
  | 'angry'
  | 'frustrated'
  | 'tired';

export type MediaType = 'image' | 'video' | 'audio' | 'drawing';

export interface MediaAttachment {
  id: string;
  type: MediaType;
  name: string;
  url: string; // Base64 Data URL or secure storage URI
  mimeType: string;
  size: number;
  createdAt: number;
  duration?: number; // Duration in seconds for audio/video
  caption?: string;
  thumbnailUrl?: string;
}

export type JournalStatus = 'draft' | 'saved';

export interface ChatMessage {
  role: 'user' | 'model';
  content: string;
  timestamp: number;
}

export type NotificationEventType =
  | 'goal_detected'
  | 'task_detected'
  | 'reminder_detected'
  | 'important_event_detected'
  | 'achievement_detected'
  | 'custom_event';

export type NavigationSection =
  // JOURNAL
  | 'all'
  | 'favorites'
  | 'folders'
  // EXPLORE
  | 'calendar'
  | 'timeline'
  | 'search'
  // REFLECT
  | 'daily_prompts'
  | 'ai_insights'
  | 'talk_to_journal'
  | 'patterns_themes'
  | 'weekly_reflection'
  | 'monthly_reflection'
  | 'on_this_day'
  // PROGRESS
  | 'streaks'
  | 'writing_goals'
  | 'statistics';

export interface FolderItem {
  id: string;
  userId?: string;
  name: string;
  color?: string;
  icon?: string;
  description?: string;
  createdAt: number;
  updatedAt?: number;
}

export interface DetectedJournalEvent {
  eventType: NotificationEventType;
  title: string;
  description: string;
  confidence: number;
}

export interface InteractionEntry {
  id?: string;
  userId: string;
  title: string;
  mode: ReflectionMode;
  initialPrompt: string;
  journalContent?: string; // Rich text / markdown entry content
  status?: JournalStatus; // 'draft' | 'saved'
  journalDate?: number; // Specific entry timestamp (defaults to createdAt)
  isFavorite?: boolean; // Favorites / Pinning flag
  folderId?: string | null; // Primary folder association (backward compatible)
  folderIds?: string[]; // Multiple collections/folders association
  wordCount?: number; // Cached word count
  media?: MediaAttachment[];
  mood?: MoodType;
  moodIntensity?: number; // 1 to 10 scale
  emotionTags?: string[];
  messages: ChatMessage[];
  summary?: string;
  keyInsights?: string[];
  tags?: string[];
  detectedEvents?: DetectedJournalEvent[];
  createdAt: number;
  updatedAt: number;
  modelUsed?: string;
}

export interface GeminiReflectRequest {
  prompt: string;
  history?: ChatMessage[];
  mode?: ReflectionMode;
  contextTitle?: string;
  journalContent?: string;
  mood?: MoodType;
  moodIntensity?: number;
  emotionTags?: string[];
}

export interface GeminiReflectResponse {
  success: boolean;
  reply?: string;
  summary?: string;
  keyInsights?: string[];
  suggestedTags?: string[];
  detectedEvents?: DetectedJournalEvent[];
  modelUsed?: string;
  error?: string;
}

export type NotificationProviderType = 'email' | 'webhook';

export interface NotificationSettings {
  userId: string;
  enabled: boolean;
  emailDestination: string;
  enabledEventTypes: NotificationEventType[];
  providerType: NotificationProviderType;
  webhookUrl?: string;
  includeSummary?: boolean;
  updatedAt: number;
}

export type NotificationDeliveryStatus = 'pending' | 'sent' | 'failed' | 'retrying' | 'disabled';

export interface NotificationLogEntry {
  id?: string;
  userId: string;
  interactionId?: string;
  eventType: NotificationEventType;
  provider: string;
  destination: string;
  status: NotificationDeliveryStatus;
  idempotencyKey: string;
  attempts: number;
  timestamp: number;
  summarySnippet: string;
  errorMessage?: string;
}

export interface NotificationTestRequest {
  destination: string;
  providerType: NotificationProviderType;
  eventType: NotificationEventType;
  webhookUrl?: string;
}

export interface NotificationDeliveryResult {
  success: boolean;
  status: NotificationDeliveryStatus;
  idempotencyKey: string;
  provider: string;
  destinationMasked: string;
  attempts: number;
  timestamp: number;
  error?: string;
  rateLimited?: boolean;
}

export type GoalType = 'words_per_day' | 'minutes_per_day' | 'entries_per_week' | 'streak_target' | 'days_per_week';

export interface WritingGoal {
  id: string;
  userId: string;
  title: string;
  type: GoalType;
  targetValue: number;
  unit: string;
  timeframe: 'daily' | 'weekly' | 'milestone';
  isActive: boolean;
  createdAt: number;
  updatedAt?: number;
}

export interface DayActivity {
  dayName: string;
  dayShort: string;
  dateStr: string;
  dateNumber: number;
  isToday: boolean;
  isFuture: boolean;
  hasEntry: boolean;
  entriesCount: number;
  wordsCount: number;
}

export interface HabitProgressStats {
  currentStreak: number;
  longestStreak: number;
  hasJournaledToday: boolean;
  lastJournaledDate: string | null;
  totalEntries: number;
  totalWords: number;
  averageWordsPerEntry: number;
  todayWords: number;
  todayMinutes: number;
  todayEntriesCount: number;
  entriesThisWeek: number;
  entriesThisMonth: number;
  mostActiveDayOfWeek: string;
  mostFrequentMood: string | null;
  weekActivity: DayActivity[];
}

export type PromptCategory = 
  | 'all'
  | 'gratitude' 
  | 'growth' 
  | 'presence' 
  | 'challenges' 
  | 'creativity' 
  | 'relationships';

export interface DailyPromptItem {
  id: string;
  category: PromptCategory;
  theme: string;
  prompt: string;
  followUp?: string;
}

export interface RecurringThemeItem {
  theme: string;
  description: string;
  frequency?: string;
  evolution?: string;
  color?: string;
}

export interface GoalMentionItem {
  goal: string;
  status: 'identified' | 'in_progress' | 'accomplished' | 'exploring';
  observation: string;
}

export interface PeriodicReflectionReport {
  timeframe: 'week' | 'month' | 'all_time';
  timeframeLabel: string;
  summary: string;
  themes: RecurringThemeItem[];
  frequentlyDiscussedTopics: string[];
  notableAccomplishments: string[];
  goalsMentioned: GoalMentionItem[];
  changesOverTime: string[];
  patternsInWriting: {
    timePattern?: string;
    toneObservations?: string;
    stylisticGrowth?: string;
  };
  reflectiveQuestions: string[];
  entryCountAnalyzed: number;
  generatedAt: number;
  modelUsed?: string;
}

export interface OnThisDayMemory {
  entry: InteractionEntry;
  timeAgoLabel: string;
  milestoneType: 'year_ago' | 'month_ago' | 'week_ago' | 'exact_date';
  formattedDate: string;
}


