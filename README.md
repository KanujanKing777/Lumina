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

To ensure strict tenant isolation where users can **only** read and write their own journal entries:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId}/interactions/{interactionId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

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

## 📋 Step-by-Step Functional Verification & Test Walkthrough

Every user interaction has a corresponding test verification step:

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
