import React from 'react';
import { ShieldCheck, X, Lock, Key, Database, Cpu, Globe, Mic } from 'lucide-react';

interface ThreatModelModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ThreatModelModal: React.FC<ThreatModelModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const threatZones = [
    {
      zone: '1. Input Surfaces (Text & Voice)',
      icon: Globe,
      risks: 'Prompt injection, voice transcript injection, malformed payloads, payload flood, untrusted strings.',
      countermeasures: 'Explicit user-triggered microphone permissions, Web Speech API sanitization, treating transcripts as untrusted user strings, null-safe payload validation, character constraints, and defensive prompt encapsulation.',
      owasp: 'OWASP LLM01 / A03',
    },
    {
      zone: '2. Planning & Reasoning',
      icon: Cpu,
      risks: 'System instruction bypass, behavioral drift, hallucinations, API service degradation.',
      countermeasures: 'Strict server-side system instructions, structured JSON responses, and an automated 4-tier model fallback ladder (Gemini 3.6 Flash -> 3.1 Flash-Lite -> Flash Latest -> 3.7 Flash).',
      owasp: 'OWASP LLM02 / LLM05',
    },
    {
      zone: '3. Tool & Audio Execution',
      icon: Lock,
      risks: 'Unauthorized audio recording, background eavesdropping, privilege escalation, SSRF, client-side API execution.',
      countermeasures: 'Microphone permission requested strictly upon explicit click; zero continuous background audio recording; no raw audio persisted or sent across network; all Gemini interactions proxied securely server-side.',
      owasp: 'OWASP A01 / LLM07',
    },
    {
      zone: '4. Memory & State',
      icon: Database,
      risks: 'Cross-user data leakage, unauthorized read/write, document tampering, undefined payload crash.',
      countermeasures: 'Firestore owner-bound security rules (allow read, write: if request.auth.uid == userId) at /users/{userId}/interactions/{interactionId}. Payload undefined-stripping utility (sanitizePayload).',
      owasp: 'OWASP A01 / LLM06',
    },
    {
      zone: '5. Inter-System & External Notifications',
      icon: Key,
      risks: 'API token leaks, stolen notification secrets, SSRF via arbitrary webhooks, CRLF email header injection, sensitive journal data leakage, notification spam/replay attacks.',
      countermeasures: 'Zero hardcoded secrets, server-side Secret Manager integration, SSRF IP blocklist (RFC1918/loopback/metadata), header sanitization, data minimization (140-char snippets only, no raw journals sent), SHA-256 idempotency cache, user-level rate limiting, and owner-isolated audit logging in Firestore.',
      owasp: 'OWASP A02 / LLM08 / A10',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div 
        id="threat-model-dialog" 
        className="bg-white dark:bg-stone-900 rounded-2xl max-w-3xl w-full max-h-[85vh] flex flex-col shadow-2xl border border-stone-200 dark:border-stone-800 overflow-hidden transition-colors"
      >
        {/* Header */}
        <div className="px-6 py-5 border-b border-stone-100 dark:border-stone-800 flex items-center justify-between bg-stone-50/70 dark:bg-stone-900/90">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 flex items-center justify-center text-emerald-700 dark:text-emerald-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-stone-900 dark:text-stone-100 tracking-tight">Agentic Threat Model & Security Posture</h2>
              <p className="text-xs text-stone-700 dark:text-stone-400">5 Threat Zones mapped to OWASP & NIST LLM security standards</p>
            </div>
          </div>
          <button
            id="close-threat-model-btn"
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-stone-700 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200 hover:bg-stone-200/60 dark:hover:bg-stone-800 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-4 text-sm">
          <div className="bg-amber-50/70 dark:bg-amber-950/50 border border-amber-200/80 dark:border-amber-800/60 rounded-xl p-4 text-amber-900 dark:text-amber-200 text-xs leading-relaxed">
            <span className="font-semibold">Security Architecture Note:</span> This application implements complete multi-tenant tenant isolation on Cloud Firestore and server-side secret containment. User journal entries are stored strictly under the authenticated user's UID path.
          </div>

          <div className="divide-y divide-stone-100 dark:divide-stone-800 border border-stone-200 dark:border-stone-800 rounded-xl overflow-hidden bg-white dark:bg-stone-900/50 shadow-xs">
            {threatZones.map((zone, idx) => {
              const Icon = zone.icon;
              return (
                <div key={idx} className="p-4.5 space-y-2 hover:bg-stone-50/50 dark:hover:bg-stone-800/40 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <Icon className="w-4 h-4 text-stone-600 dark:text-stone-400" />
                      <span className="font-semibold text-stone-900 dark:text-stone-100">{zone.zone}</span>
                    </div>
                    <span className="text-[11px] font-mono px-2 py-0.5 rounded-md bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 border border-stone-200 dark:border-stone-700">
                      {zone.owasp}
                    </span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1 text-xs">
                    <div>
                      <span className="text-stone-700 dark:text-stone-400 font-medium">Identified Risks:</span>
                      <p className="text-stone-700 dark:text-stone-300 mt-0.5 leading-relaxed">{zone.risks}</p>
                    </div>
                    <div>
                      <span className="text-emerald-700 dark:text-emerald-400 font-medium">Implemented Countermeasures:</span>
                      <p className="text-stone-700 dark:text-stone-300 mt-0.5 leading-relaxed">{zone.countermeasures}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="bg-stone-50 dark:bg-stone-800/60 rounded-xl p-4 border border-stone-200 dark:border-stone-800 space-y-2">
            <h4 className="text-xs font-semibold text-stone-900 dark:text-stone-100 uppercase tracking-wider">Active Firestore Rule Verification</h4>
            <pre className="text-[11px] font-mono bg-stone-900 dark:bg-stone-950 text-stone-100 dark:text-amber-200 p-3 rounded-lg overflow-x-auto border border-stone-800">
{`rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId}/interactions/{interactionId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}`}
            </pre>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-stone-100 dark:border-stone-800 bg-stone-50 dark:bg-stone-900/90 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-stone-700 dark:text-stone-300 bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-lg hover:bg-stone-100 dark:hover:bg-stone-700 transition-colors shadow-xs cursor-pointer"
          >
            Close Threat Analysis
          </button>
        </div>
      </div>
    </div>
  );
};
