# Reflections AI Journal & Multi-Turn Reflection Companion

Reflections AI Journal is a secure, user-authenticated personal reflection and journaling web application powered by **Gemini 3.6 Flash** and **Google Cloud Firestore**.

The application isolates all journal reflections strictly to each authenticated user using owner-bound Firestore security rules, protects credentials via Google Cloud Secret Manager, and executes model requests through a resilient server-side fallback ladder.

---

## 🛡️ Agentic Threat Model & Security Posture (5 Threat Zones)

| Threat Zone | Identified Vulnerability / Risk | Implemented Countermeasure | OWASP Mapping |
| :--- | :--- | :--- | :--- |
| **1. Input Surfaces** | Malformed payloads, prompt injection, payload flood | Strict Express JSON deserialization order, null-safe destructuring, and prompt boundary encapsulation. | OWASP LLM01 / A03 |
| **2. Planning & Reasoning** | Model degradation, prompt jailbreaking, behavioral drift | Server-side role boundaries and a 4-tier automated fallback ladder (`gemini-3.6-flash` &rarr; `gemini-3.1-flash-lite` &rarr; `gemini-flash-latest` &rarr; `gemini-3.7-flash`). | OWASP LLM02 / LLM05 |
| **3. Tool Execution** | Secret exposure, SSRF, unauthorized client-side invocation | All Gemini API calls are strictly encapsulated within backend `/api/gemini/*` proxies; keys are never exposed in browser bundles. | OWASP A01 / LLM07 |
| **4. Memory & State** | Cross-tenant data leakage, session tampering, undefined payload crash | Cloud Firestore owner-bound cryptographic access rules (`request.auth.uid == userId`) and payload sanitizer (`sanitizePayload`). | OWASP A01 / LLM06 |
| **5. Inter-System Communication** | Hardcoded API tokens, credential leakage | Zero-hardcoding hygiene, dynamic runtime injection via Secret Manager and environment variables. | OWASP A02 / LLM08 |

---

## 🔒 Cloud Firestore Security Rules

To ensure strict tenant isolation where users can **only** read and write their own journal entries, notification settings, and delivery logs:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // 1. Private User Journal Reflections & Chat History
    match /users/{userId}/interactions/{interactionId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }

    // 2. User Notification Configuration & Trigger Rules
    match /users/{userId}/notificationSettings/{settingId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }

    // 3. User Notification Delivery & Audit Logs
    match /users/{userId}/notificationLogs/{logId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

---

## 📬 External Notifications & Trigger Pipeline Architecture

The system features a decoupled, privacy-preserving notification engine for dispatching notifications when key events (e.g. goals, tasks, reminders, breakthroughs) are parsed from reflections.

```
Journal Entry (User Prompt + Gemini 3.6 Flash)
      │
      ▼
Event Detection (Rule-based heuristics + LLM tagger)
      │
      ▼
Persistence First (Save interaction to /users/{uid}/interactions/{id})
      │
      ├────────────────────────────────────────┐
      ▼                                        ▼
[Persistence Confirmed]              [Decoupled Background Dispatch]
                                               │
                                               ▼
                              Is Notifications Enabled? (User Rules)
                                               │
                                               ▼
                              SSRF & Privacy Filter (Strip sensitive journal text)
                                               │
                                               ▼
                              Idempotency & Rate Limiter (SHA-256 Key Cache)
                                               │
                                               ▼
                              Provider Adapter (Email / Webhook / Slack)
                                               │
                                               ▼
                              Audit Log (/users/{uid}/notificationLogs/{id})
```

### Key Security & Privacy Controls
1. **Zero Credential Hardcoding**: API keys are securely loaded server-side through Google Cloud Secret Manager / `.env`.
2. **Data Minimization**: Only the event title, category, and a sanitized 140-character summary snippet are delivered externally — raw personal journal text is never sent.
3. **SSRF & Private IP Protection**: Webhook URLs are strictly validated against RFC 1918 / loopback / link-local IP blocks (e.g., `127.0.0.1`, `10.0.0.0/8`, `169.254.169.254`, `localhost`).
4. **Header Injection Prevention**: Email subjects and recipients are sanitized against CRLF (`\r\n`) characters.
5. **Decoupled Failure Isolation**: Failures in external notification providers never cause journal entry persistence to fail.
6. **Replay & Spam Prevention**: Notifications are deduplicated using an in-memory SHA-256 idempotency cache and limited to maximum 10 dispatches per hour per user.

---

---

## 🚀 Google Cloud Run Deployment Guide

### Prerequisites
1. Install the [Google Cloud SDK](https://cloud.google.com/sdk/docs/install) (`gcloud` CLI).
2. Set your Google Cloud Project:
   ```bash
   gcloud config set project YOUR_PROJECT_ID
   ```
3. Enable the required Google Cloud APIs:
   ```bash
   gcloud services enable \
     run.googleapis.com \
     secretmanager.googleapis.com \
     firestore.googleapis.com \
     artifactregistry.googleapis.com \
     cloudbuild.googleapis.com
   ```

---

### Step 1: Secret Manager Setup (Zero-Hardcoding)

Create and populate the `GEMINI_API_KEY` in Google Cloud Secret Manager:

```bash
# 1. Create the secret in Secret Manager
gcloud secrets create GEMINI_API_KEY --replication-policy="automatic"

# 2. Add your secret version
echo -n "YOUR_GEMINI_API_KEY_HERE" | gcloud secrets versions add GEMINI_API_KEY --data-file=-

# 3. Grant the default Compute Engine service account access to read the secret
PROJECT_NUMBER=$(gcloud projects describe $(gcloud config get-value project) --format="value(projectNumber)")

gcloud secrets add-iam-policy-binding GEMINI_API_KEY \
  --member="serviceAccount:${PROJECT_NUMBER}-compute@developer.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor"
```

---

### Step 2: Deploy to Google Cloud Run

Deploy the container to Cloud Run, securely mounting the secret directly into the environment:

```bash
gcloud run deploy reflections-ai-journal \
  --source . \
  --region us-central1 \
  --allow-unauthenticated \
  --set-secrets="GEMINI_API_KEY=GEMINI_API_KEY:latest"
```

---

### Step 3: Required Campaign Verification Labeling

Apply the mandatory verification resource label to register your Cloud Run service:

```bash
gcloud run services update reflections-ai-journal \
  --update-labels=dev-tutorial=cloud-run-ai-challenge \
  --region=us-central1
```

---

## 🎙️ Voice Dictation Architecture & Threat Model

Voice dictation follows strict input-surface and user-privacy constraints:

```
User Microphone
      │ (Explicit Click)
      ▼
Browser Web Speech API
      │ (Continuous & Interim Streams)
      ▼
Input Buffer (useVoiceDictation Hook)
      │ (Append Without Overwriting)
      ▼
Existing Prompt Validation & Sanitization
      │ (Untrusted User Text Pipeline)
      ▼
Server-Side Gemini 3.6 Flash Fallback Ladder
      │ (Proxied Backend Routes)
      ▼
Firestore Tenant Isolation (/users/{uid}/interactions/{id})
```

- **Explicit User Consent**: Microphone access is only requested on an explicit click of the microphone button. Never on initial page load.
- **Transcript Treated as Untrusted Text**: Dictated strings undergo standard prompt encapsulation without code execution.
- **Zero Raw Audio Storage**: No raw audio is recorded, buffered to disk, or sent to backend endpoints.
- **Non-Destructive Appending**: Voice dictation never clears or overwrites existing user input text.

---

## 📋 Step-by-Step Functional Verification & Test Walkthrough

### Core Application Test Cases

| Test Case | User Interaction / Process | Expected Behavior | Verification Step |
| :--- | :--- | :--- | :--- |
| **TC-01** | **Landing Page Arrival** | User sees public landing page with "Sign in with Google" button and feature highlights. | Open application URL without active session; confirm landing page displays without errors. |
| **TC-02** | **Google Authentication** | Click "Sign in with Google" button in header or hero section. | Firebase Auth popup appears; upon selecting Google account, user is transitioned seamlessly to the private Dashboard. |
| **TC-03** | **Start New Reflection** | Click "New Reflection" button in sidebar. | Conversation view resets to empty reflection state with customizable reflection modes. |
| **TC-04** | **Mode Selection** | Click mode pill ("Deep Reflection", "Brainstorm Ideas", "Summary & Insights", "Action Steps"). | Active mode highlight switches, input placeholder adapts to the chosen reflection intention. |
| **TC-05** | **Multi-Turn Journaling** | Enter journal text (e.g. "Today I felt overwhelmed with multiple priorities...") and click "Send & Reflect" (or press Enter). | Text appears immediately; Gemini 3.6 Flash reflects with thoughtful markdown-formatted response; state is automatically persisted to Firestore under `/users/{uid}/interactions/{id}`. |
| **TC-06** | **Conversation History View** | Check left sidebar / Journal Vault. | The new reflection appears in chronological order with date, mode badge, and message count preview. |
| **TC-07** | **Search & Filter** | Type keyword in search box or toggle mode filter tabs (All, Reflect, Brainstorm, Summary, Action). | History list dynamically filters matching entries in real-time. |
| **TC-08** | **Automatic Session Synthesis** | Click "Distill Insights" button in the conversation top bar. | Gemini analyzes full multi-turn transcript and generates an insightful title, 2-sentence summary, bulleted takeaways, and category tags saved to Firestore. |
| **TC-09** | **Title Renaming** | Click the title or edit pencil icon, modify title, and press Enter / click Save. | Updated title updates instantly in both the workspace header and sidebar list in Firestore. |
| **TC-10** | **Tenant Isolation Verification** | Sign out, sign in with a different Google account. | The second user sees only their own private vault; no reflections from user A are accessible. |
| **TC-11** | **Delete Reflection** | Hover over entry item in sidebar, click trash icon, and confirm deletion dialog. | Entry is permanently removed from the user's Firestore collection. |
| **TC-12** | **Threat Model Inspection** | Click "Security Posture" in the top navigation header. | Interactive modal displays the 5-zone threat model, active security rules, and OWASP compliance standards. |

### Voice Dictation Test Suite (20 Functional Scenarios)

| Test Case | Scenario / Interaction | Expected Behavior | Verification Step |
| :--- | :--- | :--- | :--- |
| **VD-01** | **Starting Dictation** | Click the microphone button (`Dictate`). | Button switches to active pulsing state with red highlight and `Listening...` banner appears. |
| **VD-02** | **Stopping Dictation** | Click `Done Dictating` or click the active microphone button again. | Dictation stops cleanly, button returns to idle state, and recorded text remains in the input field. |
| **VD-03** | **Dictating into Empty Prompt** | Start dictation on an empty input and speak: "I completed my quarterly goals." | Spoken phrase is transcribed directly into the textarea without leading spaces. |
| **VD-04** | **Dictating into Prompt with Existing Text** | Type "Today I worked on my project." and then dictate: "It went really well." | New phrase is cleanly appended with appropriate spacing ("Today I worked on my project. It went really well.") without overwriting. |
| **VD-05** | **Combining Typing and Dictation** | Dictate a sentence, type additional words with the keyboard, and dictate again. | All text fragments merge smoothly in order into the textarea. |
| **VD-06** | **Multiple Dictation Sessions** | Start and stop dictation 3 times consecutively in the same session. | Each transcribed snippet appends sequentially without duplicating or dropping previous text. |
| **VD-07** | **Permission Granted** | User approves browser microphone permission prompt upon clicking `Dictate`. | Recognition begins immediately and listening banner displays live transcript. |
| **VD-08** | **Permission Denied** | User denies microphone access in browser dialog. | Non-blocking warning banner appears explaining permission was denied; typed textarea remains fully interactive. |
| **VD-09** | **Unsupported Browser** | Open application in an environment without Web Speech API. | Microphone button displays `Voice N/A` with informative tooltip; text input functions normally. |
| **VD-10** | **No Speech Detected** | Click dictation and remain silent for recognition timeout. | Gentle informative notice appears ("No speech was detected"); existing text in the prompt is untouched. |
| **VD-11** | **Speech-Recognition Errors** | Trigger network error or microphone disconnect during dictation. | Informative error notice renders with dismiss button; no exception thrown; input text preserved. |
| **VD-12** | **Unexpected Recognition Termination** | Speech engine stops due to OS audio focus change. | Status returns to idle gracefully; all captured text remains in the input textarea. |
| **VD-13** | **Long Transcripts** | Dictate an extended paragraph (e.g. 100+ words). | Full transcript streams into the input box and auto-expands the textarea without truncation. |
| **VD-14** | **Special Characters & Punctuation** | Dictate text with punctuation marks, numbers, and special symbols. | Symbols and text render cleanly in the textarea without HTML escaping artifacts. |
| **VD-15** | **Submission Through Gemini Workflow** | Click `Send & Reflect` after dictating a reflection. | Dictation stops automatically; prompt sends to `/api/gemini/reflection` and receives multi-turn response. |
| **VD-16** | **Successful Firestore Persistence** | Inspect Firestore collection after sending dictated reflection. | Document is created in `/users/{uid}/interactions/{id}` containing both prompt and model response. |
| **VD-17** | **Failed Firestore Persistence Handling** | Simulate temporary network disconnect during message save. | UI displays save error banner with "Retry Save" option; user input buffer is preserved. |
| **VD-18** | **Confirmation of Non-Erasure** | Verify prompt text during any dictation error or network failure. | User input is NEVER cleared on failure, only after confirmed successful submission. |
| **VD-19** | **Firebase User-Data Isolation** | Switch user accounts and inspect dictated entries. | Dictated sessions are strictly isolated under the creating user's UID path in Firestore. |
| **VD-20** | **Zero Raw Audio Storage Confirmation** | Inspect network requests and Firestore document schema. | No binary audio, WAV/MP3 blobs, or audio stream buffers are sent across network or stored in database. |

### External Notifications Test Suite (15 Functional Scenarios)

| Test Case | Scenario / Interaction | Expected Behavior | Verification Step |
| :--- | :--- | :--- | :--- |
| **EN-01** | **Open Notification Settings** | Click "Notifications" bell button in header. | Notification configuration modal opens showing provider options, event triggers, and audit log tabs. |
| **EN-02** | **Toggle Notifications On/Off** | Toggle the "Enable Notifications" switch and click Save. | Settings update in `/users/{uid}/notificationSettings/default` and header badge updates in real time. |
| **EN-03** | **Configure Destination Email** | Enter an authorized email address and enable "Goal Detected" and "Action Item Detected" triggers. | Configuration is saved to Firestore; green confirmation toast appears. |
| **EN-04** | **Send Test Notification** | Click "Send Test Notification" in the settings modal. | Server triggers `/api/notifications/test`, dispatches test payload, and displays delivery success notice. |
| **EN-05** | **Goal Event Triggering** | Submit journal reflection: "My goal for Q3 is to publish two research articles." | Heuristic and AI tagger detect `goal_detected`; journal is saved; notification is dispatched; in-app banner notifies user. |
| **EN-06** | **Action Item Triggering** | Submit reflection: "I need to complete the budget spreadsheet by Friday." | `action_item_detected` is triggered; notification is delivered without exposing full personal text. |
| **EN-07** | **Reminder Triggering** | Submit reflection: "Remember to schedule my annual health checkup next week." | `reminder_detected` event is triggered and dispatched to configured recipient. |
| **EN-08** | **Data Minimization Verification** | Inspect outgoing notification payload. | Contains only title and short 140-char summary snippet; does not transmit full private conversation. |
| **EN-09** | **SSRF Prevention (Loopback Block)** | In webhook settings, attempt to set URL to `http://localhost:3000/internal` or `http://127.0.0.1`. | Provider rejects URL with error "Webhook target must not be a private or loopback address". |
| **EN-10** | **SSRF Prevention (Cloud Metadata)** | Attempt to set webhook destination to `http://169.254.169.254/computeMetadata/v1/`. | Request is immediately rejected as forbidden internal address. |
| **EN-11** | **Audit Log Recording** | Check "Delivery History & Logs" tab in settings modal after triggering a notification. | Sent notification appears in the real-time audit log with timestamp, masked destination, event type, and status. |
| **EN-12** | **Idempotency & Duplicate Prevention** | Trigger identical event within 1 minute. | Idempotency key prevents duplicate email/webhook execution. |
| **EN-13** | **Rate Limiting Protection** | Attempt to trigger more than 10 notifications within an hour. | Rate limiter throttles excess dispatches, protecting against spam loops. |
| **EN-14** | **Provider Failure Isolation** | Simulate external API error (e.g. invalid endpoint or network timeout). | Notification attempt records failure in log; journal saving in Firestore succeeds without error. |
| **EN-15** | **Audit Log Tenant Isolation** | Sign in as User B and view Notification logs. | User B can only view their own logs; no cross-tenant visibility is possible. |

---

### Core Journal Entries, Rich Text, Media & Mood Tracking Test Suite (20 Functional Scenarios)

| Test Case | Feature Area | Scenario / Interaction | Expected Behavior | Verification Step |
| :--- | :--- | :--- | :--- | :--- |
| **JM-01** | **Journal Creation** | Click "New Entry" in Journal Vault sidebar. | Fresh journal entry state initializes with customizable title, date/time picker, clean rich text area, mood selector, and media panel. |
| **JM-02** | **Title Editing** | Click on the journal title, change title to "Morning Clarity & Daily Priorities", press Enter. | Title updates inline, persists via debounced autosave, and syncs with sidebar entry name. |
| **JM-03** | **Date & Time Adjustment** | Click the date badge in the header, select a custom timestamp via datetime-local picker, and click Done. | Entry timestamp updates and sorts chronologically in the Journal Vault. |
| **JM-04** | **Rich Text Formatting** | Highlight text and click **Bold**, *Italic*, `H1`, `H2`, `Quote`, or `Checklist` buttons in the formatting toolbar. | Markdown syntax (`**bold**`, `*italic*`, `## Heading`, `> quote`, `- [ ] checklist`) is inserted precisely at selection. |
| **JM-05** | **View Mode Toggle** | Toggle between "Write", "Preview", and "Split" view modes. | Markdown formats into beautifully rendered typography and checklists without page reloads or raw HTML execution risks. |
| **JM-06** | **Mood Selection** | Select a mood (e.g. "Grateful 🙏" or "Calm 🌿") in the Mood & Emotion Tracker. | Selected mood highlights with distinct warm accents; active badge displays in the header and sidebar list. |
| **JM-07** | **Mood Intensity Slider** | Drag the mood intensity slider from 1 to 10 (e.g. set to 8/10). | Intensity updates in real time with descriptive intensity labeling (Mild &rarr; Moderate &rarr; Intense). |
| **JM-08** | **Emotion Tagging** | Click predefined emotion tags (e.g. "Peaceful", "Productive") and add custom tag (e.g. "Team Win"). | Tags appear as pill badges with individual removal buttons (`×`); tags persist to Firestore. |
| **JM-09** | **Photo Attachment** | Click "Add Photos & Videos", upload an image file (PNG/JPEG/WebP < 5MB). | Photo attaches cleanly with thumbnail preview, caption input, file size badge, and remove control. |
| **JM-10** | **Video Attachment** | Upload a short video file (MP4/WebM < 15MB). | Video attaches with native `<video controls>` player and format validation. |
| **JM-11** | **Voice Memo Recording** | Click "Record Voice Memo" in the media manager, speak for 5 seconds, click Stop. | Audio streams via `MediaRecorder`, generates an audio waveform preview, and embeds an accessible `<audio controls>` player. |
| **JM-12** | **Mindful Sketching** | Click "Mindful Sketch", draw on the canvas using brush colors/sizes, and click "Save Sketch". | Canvas rasterizes to high-resolution PNG data URL and attaches as a media item with caption support. |
| **JM-13** | **Media Removal** | Click trash/remove icon on an attached photo or audio memo. | Media item is immediately detached from draft and updated in Firestore payload. |
| **JM-14** | **Autosave Engine** | Type text in journal content or change mood and pause for 1.5 seconds. | Header status updates to "Autosaving...", then transitions to "Saved" with checkmark; Firestore document updates seamlessly. |
| **JM-15** | **Explicit Save Button** | Click "Save" in the top action bar. | Forces immediate Firestore write and marks entry status as `saved`. |
| **JM-16** | **AI Context Integration** | Write a journal entry with mood "Anxious (8/10)" and tags "Deadline", then click "Send & Reflect". | Gemini 3.6 Flash receives the full journal text, mood level, and emotion tags in its system context, tailoring its reflection to offer calming, actionable steps. |
| **JM-17** | **Delete Confirmation Flow** | Click trash icon on an active journal entry. | Accessible modal opens displaying entry title, creation date, message count, and warning; clicking "Delete Entry" permanently removes it from Firestore. |
| **JM-18** | **Layout Stability** | Resize viewport and scroll through extended journal entries and multi-turn messages. | Main viewport remains strictly fixed; outer page does NOT scroll vertically; only the inner journal container scrolls. |
| **JM-19** | **Dark Mode Consistency** | Toggle between light and dark themes. | All new components (MoodSelector, MediaManager, DrawingModal, DeleteModal, RichTextToolbar) adapt seamlessly with high-contrast warm stone neutrals. |
| **JM-20** | **Non-Diagnostic Disclaimer** | Inspect Mood Tracker. | Displays clear ethical disclaimer that mood tracking is for personal reflection only and does not constitute psychological diagnosis. |

---

### Reflect Section & AI Synthesis Test Suite (10 Functional Scenarios)

| Test Case | Feature Area | Scenario / Interaction | Expected Behavior | Verification Step |
| :--- | :--- | :--- | :--- | :--- |
| **RF-01** | **Daily Prompts Exploration** | Navigate to `Reflect > Daily Prompts` in navigation. | Grid of diverse, curated daily prompts renders categorized by theme (Gratitude, Mindfulness, Growth, Presence, Challenges, Creativity, Relationships). |
| **RF-02** | **Daily Prompt Direct Reflection** | Click "Reflect on this" on any prompt card (e.g. "What made you feel genuinely alive today?"). | Transitions directly into the journal editor with the selected prompt seeded in the title/prompt banner ready for writing. |
| **RF-03** | **Custom Reflection Seed** | Type a personalized topic into the prompt idea box (e.g. "Career transition thoughts") and click "Start Journal". | Creates new journal entry titled with the custom reflection topic. |
| **RF-04** | **Periodic Reflection Timeframes** | Switch between "Past 7 Days", "This Month", and "All Entries" in `AI Insights`. | Analysis scope updates instantly, triggering time-scoped reflection report aggregation. |
| **RF-05** | **Recurring Themes & Evolution** | Review "Recurring Themes" section in AI Insights. | Displays identified recurring life themes with frequency badges, description, and narrative of how each theme evolved over time. |
| **RF-06** | **Patterns in Writing Analysis** | Review "Patterns in Writing" card in AI Insights. | Displays gentle non-diagnostic observations on writing rhythms (time of day), emotional tone shifts, and stylistic voice growth. |
| **RF-07** | **Goal Progress Tracking** | Review "Goal Progress & Intentions" section in AI Insights. | Extracts documented goals categorized by state (`in_progress`, `accomplished`, `exploring`) with contextual momentum observations. |
| **RF-08** | **"On This Day" Memories** | Open `Reflect > On This Day` tab. | Scans journal history for reflections authored on the exact calendar day in previous months or years, with time-ago badges and full entry viewer. |
| **RF-09** | **Talk to My Journal Vault Chat** | Open `Reflect > Talk to My Journal`, type "What did I write about my morning routine?", and press Send. | Queries user's private journal vault with grounded citations of relevant entry dates and titles without hallucinations. |
| **RF-10** | **Zero-Disruption Fallback Resilience** | Simulate depleted Gemini credits or network disruption during reflection generation. | Application halts redundant external calls early and serves high-integrity local heuristic synthesis, displaying transparent notice while never failing or erasing user entries. |



