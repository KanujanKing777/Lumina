import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';
import { createServer as createViteServer } from 'vite';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

// Standard Request Deserialization (Ordering Guarantee: JSON parser mounted BEFORE all routes)
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Lazy Google GenAI Client with validation
let aiClient: GoogleGenAI | null = null;
function getGenAI(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY environment variable is not configured.');
  }
  if (!aiClient) {
    aiClient = new GoogleGenAI({ apiKey });
  }
  return aiClient;
}

// Resilient Model Fallback Ladder
const MODEL_FALLBACK_LADDER = [
  'gemini-3.6-flash',
  'gemini-3.1-flash-lite',
  'gemini-flash-latest',
  'gemini-3.7-flash',
];

interface FallbackResult {
  text: string;
  modelUsed: string;
}

/**
 * Standard Helper: Resilient Model Fallback Execution
 */
async function generateContentWithFallback(
  systemInstruction: string,
  contents: any[]
): Promise<FallbackResult> {
  const ai = getGenAI();
  let lastError: any = null;

  for (const model of MODEL_FALLBACK_LADDER) {
    try {
      console.log(`[Gemini Request] Attempting generation with model: ${model}`);
      const response = await ai.models.generateContent({
        model,
        contents,
        config: {
          systemInstruction,
          temperature: 0.7,
        },
      });

      const responseText = response.text?.trim();
      if (responseText) {
        return {
          text: responseText,
          modelUsed: model,
        };
      }
      throw new Error(`Empty response from model ${model}`);
    } catch (err: any) {
      console.warn(`[Gemini Fallback] Model ${model} failed:`, err?.message || err);
      lastError = err;
      // Continue to next model in the fallback ladder
    }
  }

  throw new Error(
    `All Gemini fallback models exhausted. Last error: ${lastError?.message || 'Unknown generation failure'}`
  );
}

// Health Check Endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: Date.now(),
    hasApiKey: !!process.env.GEMINI_API_KEY,
  });
});

// Main AI Reflection & Journal Endpoint
app.post('/api/gemini/reflect', async (req, res) => {
  try {
    // Defensive Payload Ingestion (Null-Safe Destructuring)
    const body = req.body && typeof req.body === 'object' ? req.body : {};
    const prompt = typeof body.prompt === 'string' ? body.prompt.trim() : '';
    const history = Array.isArray(body.history) ? body.history : [];
    const mode = typeof body.mode === 'string' ? body.mode : 'reflect';
    const contextTitle = typeof body.contextTitle === 'string' ? body.contextTitle : '';

    if (!prompt) {
      return res.status(400).json({
        success: false,
        error: 'Prompt string is required and cannot be empty.',
      });
    }

    // Determine system instructions based on reflection mode
    let modeInstruction = '';
    switch (mode) {
      case 'brainstorm':
        modeInstruction = `The user is using the Brainstorming Mode. Provide creative perspectives, divergent ideas, analogies, and provocative thinking prompts.`;
        break;
      case 'summarize':
        modeInstruction = `The user is using Summary & Insights Mode. Provide a crisp synthesis, identifying the emotional subtext, core themes, and overarching takeaways.`;
        break;
      case 'action_plan':
        modeInstruction = `The user is using Action Plan Mode. Help translate the reflections into grounded, pragmatic next steps with clear prioritization.`;
        break;
      case 'reflect':
      default:
        modeInstruction = `The user is using Deep Reflection Mode. Act as an empathetic, philosophical, and insightful journaling companion. Validate their experience, mirror core feelings, and ask 1-2 thoughtful open-ended questions.`;
        break;
    }

    const systemInstruction = `You are a thoughtful, intelligent, and secure personal AI journaling and reflection companion.
Your goal is to help the user unpack their thoughts, gain clarity, find patterns, and reflect deeply on their experiences.

Guidelines:
1. Speak with warmth, depth, and concise clarity.
2. Structure your response with readable markdown formatting (bolding key concepts, bullet lists when organizing points).
3. ${modeInstruction}
4. When appropriate, offer an insightful concluding question or reflection anchor.
5. Context of journal entry: ${contextTitle ? `Topic: "${contextTitle}"` : 'Freeform Reflection'}.`;

    // Format conversation history for Gemini
    const contents: any[] = [];

    // Add previous conversation turns if provided
    for (const msg of history) {
      if (msg && typeof msg.content === 'string' && msg.content.trim()) {
        contents.push({
          role: msg.role === 'user' ? 'user' : 'model',
          parts: [{ text: msg.content.trim() }],
        });
      }
    }

    // Add current user prompt
    contents.push({
      role: 'user',
      parts: [{ text: prompt }],
    });

    const { text, modelUsed } = await generateContentWithFallback(systemInstruction, contents);

    return res.json({
      success: true,
      reply: text,
      modelUsed,
    });
  } catch (error: any) {
    console.error('[API Error /api/gemini/reflect]:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'An error occurred while generating reflection response.',
    });
  }
});

// Endpoint to generate an automated title & short summary of a journal thread
app.post('/api/gemini/summarize-session', async (req, res) => {
  try {
    const body = req.body && typeof req.body === 'object' ? req.body : {};
    const messages = Array.isArray(body.messages) ? body.messages : [];

    if (messages.length === 0) {
      return res.status(400).json({ success: false, error: 'Messages array cannot be empty.' });
    }

    const transcript = messages
      .map((m: any) => `${m.role === 'user' ? 'User' : 'Gemini'}: ${m.content}`)
      .join('\n\n');

    const systemInstruction = `You are an AI journal archivist. Given a journaling conversation transcript, produce:
1. A concise, evocative title (max 5-7 words).
2. A 2-sentence summary capturing the core reflection.
3. 2-3 key insights or takeaways as bullet points.
4. 2-4 one-word category tags (e.g. mindfulness, career, relationships, gratitude).

Format strictly as JSON with keys: "title", "summary", "keyInsights" (array of strings), "tags" (array of strings).`;

    const ai = getGenAI();
    let textResult = '';
    let usedModel = 'gemini-3.6-flash';

    for (const model of MODEL_FALLBACK_LADDER) {
      try {
        const response = await ai.models.generateContent({
          model,
          contents: [{ role: 'user', parts: [{ text: transcript }] }],
          config: {
            systemInstruction,
            responseMimeType: 'application/json',
          },
        });
        if (response.text) {
          textResult = response.text.trim();
          usedModel = model;
          break;
        }
      } catch (e) {
        console.warn(`[Summarize Fallback] ${model} failed:`, e);
      }
    }

    let parsed = {
      title: 'Journal Reflection',
      summary: 'A meaningful journaling session.',
      keyInsights: [],
      tags: ['reflection'],
    };

    try {
      if (textResult) {
        parsed = JSON.parse(textResult);
      }
    } catch (parseErr) {
      console.error('Failed to parse summary JSON:', parseErr);
    }

    return res.json({
      success: true,
      data: parsed,
      modelUsed: usedModel,
    });
  } catch (error: any) {
    console.error('[API Error /api/gemini/summarize-session]:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to summarize session.',
    });
  }
});

// Vite Middleware & Static Serving Setup
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
