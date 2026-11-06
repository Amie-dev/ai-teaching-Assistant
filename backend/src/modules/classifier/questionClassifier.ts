import { Groq } from 'groq-sdk';
import { config } from '../../config.js';
import { ClassificationResult } from '../../types/index.js';
import { logger } from '../../utils/logger.js';

class QuestionClassifier {
  private groq: Groq | null = null;

  constructor() {
    this.initClient();
  }

  private initClient(): void {
    if (config.groqApiKey && !config.groqApiKey.startsWith('your_')) {
      this.groq = new Groq({ apiKey: config.groqApiKey });
    } else {
      this.groq = null;
    }
  }

  private getGroqClient(): Groq | null {
    if (!this.groq && config.groqApiKey && !config.groqApiKey.startsWith('your_')) {
      this.groq = new Groq({ apiKey: config.groqApiKey });
    }
    return this.groq;
  }

  /**
   * Classifies a question as 'factual' or 'conceptual' using Llama 3.1 via Groq API.
   * Returns structured output with confidence and reasoning.
   */
  async classify(question: string): Promise<ClassificationResult> {
    const groq = this.getGroqClient();

    if (!groq) {
      return this.heuristicClassify(question);
    }

    const systemPrompt = `You are an expert pedagogical question classifier for a computer science university course assistant.
Analyze the student's question and classify it strictly into one of two categories:
1. "factual": Questions asking for specific definitions, formulas, syntax, dates, names, direct properties, or factual lookups ("what is", "define", "give formula for", "list the types of").
2. "conceptual": Questions asking for underlying mechanisms, comparative analysis, causality, deep reasoning, or "why"/"how" questions ("why does", "how does X work", "explain the difference between", "compare").

You must reply ONLY with a valid JSON object matching this schema:
{
  "label": "factual" | "conceptual",
  "confidence": number between 0.0 and 1.0,
  "reason": "one sentence explaining the classification"
}
Do not include markdown codeblocks or extra text. Output valid JSON only.`;

    try {
      const response = await groq.chat.completions.create({
        model: config.groqModel,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: question },
        ],
        temperature: 0.1,
        response_format: { type: 'json_object' },
      });

      const content = response.choices[0]?.message?.content?.trim() || '{}';
      const parsed = JSON.parse(content);

      const label = (parsed.label === 'conceptual' ? 'conceptual' : 'factual') as 'factual' | 'conceptual';
      const confidence = typeof parsed.confidence === 'number' ? Math.max(0, Math.min(1, parsed.confidence)) : 0.8;
      const reason = parsed.reason || 'Classified by LLM';

      if (confidence < 0.6) {
        logger.info(`Low classifier confidence (${confidence}) for "${question}". Using default route: ${config.defaultRoute}`);
        return {
          label: config.defaultRoute,
          confidence,
          reason: `Confidence low (${confidence.toFixed(2)}): defaulted to ${config.defaultRoute}`,
        };
      }

      logger.info(`Classifier result for "${question}": label=${label}, confidence=${confidence}, reason="${reason}"`);

      return {
        label,
        confidence,
        reason,
      };
    } catch (error: any) {
      logger.warn(`Groq classifier error (${error.message}). Falling back to heuristic classifier.`);
      return this.heuristicClassify(question);
    }
  }

  /**
   * Deterministic linguistic classifier fallback for local development and offline mode.
   */
  heuristicClassify(question: string): ClassificationResult {
    const q = question.toLowerCase().trim();

    const conceptualPatterns = [
      /\bwhy\b/,
      /\bhow does\b/,
      /\bhow do\b/,
      /\bhow can\b/,
      /\bexplain\b/,
      /\bcompare\b/,
      /\bdifference between\b/,
      /\bwhy is\b/,
      /\bcontrast\b/,
      /\banalyze\b/,
      /\btrade-offs?\b/,
      /\bpros and cons\b/,
    ];

    const factualPatterns = [
      /\bwhat is\b/,
      /\bwhat are\b/,
      /\bdefine\b/,
      /\bdefinition\b/,
      /\blist\b/,
      /\bwhich\b/,
      /\bwhen was\b/,
      /\bwho\b/,
      /\bformula\b/,
      /\bsyntax\b/,
      /\bname the\b/,
    ];

    for (const pattern of conceptualPatterns) {
      if (pattern.test(q)) {
        return {
          label: 'conceptual',
          confidence: 0.88,
          reason: 'Matches conceptual explanatory phrasing (why/how/explain/compare)',
        };
      }
    }

    for (const pattern of factualPatterns) {
      if (pattern.test(q)) {
        return {
          label: 'factual',
          confidence: 0.90,
          reason: 'Matches factual lookup phrasing (what is/define/list/formula)',
        };
      }
    }

    // Default route
    return {
      label: config.defaultRoute,
      confidence: 0.70,
      reason: `Defaulted to ${config.defaultRoute} route based on general inquiry`,
    };
  }
}

export const questionClassifier = new QuestionClassifier();
