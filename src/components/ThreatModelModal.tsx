import React from 'react';
import { ShieldCheck, X, Lock, Key, Database, Cpu, Globe } from 'lucide-react';

interface ThreatModelModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ThreatModelModal: React.FC<ThreatModelModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const threatZones = [
    {
      zone: '1. Input Surfaces',
      icon: Globe,
      risks: 'Prompt injection, malformed payloads, payload flood, untrusted strings.',
      countermeasures: 'Strict Express JSON parsing middleware order, null-safe payload validation, character constraints, and defensive prompt encapsulation.',
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
      zone: '3. Tool Execution',
      icon: Lock,
      risks: 'Privilege escalation, SSRF, unauthorized client-side API execution.',
      countermeasures: 'All Gemini API communications proxied exclusively via secure Express backend endpoints (/api/gemini/*). Secret keys never exposed to browser context.',
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
      zone: '5. Inter-System Communication',
      icon: Key,
      risks: 'API token leaks, hardcoded credentials, insecure transport.',
      countermeasures: 'Zero hardcoding hygiene. Dynamic environment variable injection (GEMINI_API_KEY) and Google Cloud Secret Manager integration in Cloud Run.',
      owasp: 'OWASP A02 / LLM08',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div 
        id="threat-model-dialog" 
        className="bg-white rounded-2xl max-w-3xl w-full max-h-[85vh] flex flex-col shadow-2xl border border-stone-200 overflow-hidden"
      >
        {/* Header */}
        <div className="px-6 py-5 border-b border-stone-100 flex items-center justify-between bg-stone-50/70">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-stone-900 tracking-tight">Agentic Threat Model & Security Posture</h2>
              <p className="text-xs text-stone-700">5 Threat Zones mapped to OWASP & NIST LLM security standards</p>
            </div>
          </div>
          <button
            id="close-threat-model-btn"
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-stone-700 hover:text-stone-700 hover:bg-stone-200/60 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-4 text-sm">
          <div className="bg-amber-50/70 border border-amber-200/80 rounded-xl p-4 text-amber-900 text-xs leading-relaxed">
            <span className="font-semibold">Security Architecture Note:</span> This application implements complete multi-tenant tenant isolation on Cloud Firestore and server-side secret containment. User journal entries are stored strictly under the authenticated user's UID path.
          </div>

          <div className="divide-y divide-stone-100 border border-stone-200 rounded-xl overflow-hidden bg-white shadow-xs">
            {threatZones.map((zone, idx) => {
              const Icon = zone.icon;
              return (
                <div key={idx} className="p-4.5 space-y-2 hover:bg-stone-50/50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <Icon className="w-4 h-4 text-stone-600" />
                      <span className="font-semibold text-stone-900">{zone.zone}</span>
                    </div>
                    <span className="text-[11px] font-mono px-2 py-0.5 rounded-md bg-stone-100 text-stone-600 border border-stone-200">
                      {zone.owasp}
                    </span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1 text-xs">
                    <div>
                      <span className="text-stone-700 font-medium">Identified Risks:</span>
                      <p className="text-stone-700 mt-0.5">{zone.risks}</p>
                    </div>
                    <div>
                      <span className="text-emerald-700 font-medium">Implemented Countermeasures:</span>
                      <p className="text-stone-700 mt-0.5">{zone.countermeasures}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="bg-stone-50 rounded-xl p-4 border border-stone-200 space-y-2">
            <h4 className="text-xs font-semibold text-stone-900 uppercase tracking-wider">Active Firestore Rule Verification</h4>
            <pre className="text-[11px] font-mono bg-stone-900 text-stone-100 p-3 rounded-lg overflow-x-auto">
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
        <div className="px-6 py-4 border-t border-stone-100 bg-stone-50 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-stone-700 bg-white border border-stone-200 rounded-lg hover:bg-stone-100 transition-colors shadow-xs"
          >
            Close Threat Analysis
          </button>
        </div>
      </div>
    </div>
  );
};
