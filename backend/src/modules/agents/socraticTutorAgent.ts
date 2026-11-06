import { Groq } from 'groq-sdk';
import { config } from '../../config.js';
import { ChatMessage, RetrievedChunk, SourceCitation } from '../../types/index.js';
import { logger } from '../../utils/logger.js';
import { SOCRATIC_TUTOR_SYSTEM_PROMPT, formatRetrievedContext } from './prompts.js';

export interface SocraticResponse {
  text: string;
  sources: SourceCitation[];
  isGuidingQuestion: boolean;
}

export class SocraticTutorAgent {
  private groq: Groq | null = null;

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

  async generate(
    question: string,
    chunks: RetrievedChunk[],
    history: ChatMessage[] = [],
    turnCount: number = 0,
    forceDirectAnswer = false
  ): Promise<SocraticResponse> {
    const context = formatRetrievedContext(chunks);
    const sources: SourceCitation[] = chunks.map(c => ({
      fileName: c.fileName,
      pageNumber: c.pageNumber,
      snippet: c.text.slice(0, 150) + (c.text.length > 150 ? '...' : ''),
    }));

    const client = this.getGroqClient();

    // Check if student wants the direct answer or reached turn limit
    const shouldProvideFullAnswer =
      forceDirectAnswer ||
      turnCount >= config.socraticTurnLimit ||
      this.isAskingForDirectAnswer(question);

    if (!client) {
      logger.warn('GROQ_API_KEY not configured. Generating rule-based Socratic guidance.');
      const primary = chunks[0];
      if (shouldProvideFullAnswer) {
        return {
          text: `Here is the complete conceptual explanation from **${primary.fileName}** (Page ${primary.pageNumber}):\n\n${primary.text}`,
          sources,
          isGuidingQuestion: false,
        };
      } else {
        return {
          text: `Great question! Before giving the solution away, consider this: what fundamental role does this concept play in the problem? Take a look at **${primary.fileName}** on Page ${primary.pageNumber}. What key mechanism does it highlight?`,
          sources,
          isGuidingQuestion: true,
        };
      }
    }

    const messagesPayload: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [
      { role: 'system', content: SOCRATIC_TUTOR_SYSTEM_PROMPT },
      {
        role: 'system',
        content: `Retrieved Course Context:\n${context}\n\nCurrent Socratic Turn: ${turnCount + 1} of ${config.socraticTurnLimit}.\nProvide Full Explanation Now: ${shouldProvideFullAnswer ? 'YES' : 'NO'}.`,
      },
    ];

    // Include last 4 relevant turns for context
    const recentHistory = history.slice(-4);
    for (const msg of recentHistory) {
      messagesPayload.push({
        role: msg.role === 'assistant' ? 'assistant' : 'user',
        content: msg.text,
      });
    }

    // Add current turn instruction
    let turnInstruction = `Student message: "${question}"\n`;
    if (shouldProvideFullAnswer) {
      turnInstruction += `The student has attempted to reason through or requested the full explanation. Provide a comprehensive, clear conceptual explanation grounded in the course material, citing [File: "<filename>", Page: <num>].`;
    } else {
      turnInstruction += `Guide the student towards understanding. Ask ONE focused guiding question or give a targeted hint referencing page numbers. Do NOT reveal the final answer yet.`;
    }

    messagesPayload.push({ role: 'user', content: turnInstruction });

    try {
      const response = await client.chat.completions.create({
        model: config.groqModel,
        messages: messagesPayload,
        temperature: 0.3,
      });

      const text = response.choices[0]?.message?.content?.trim() || '';

      return {
        text,
        sources,
        isGuidingQuestion: !shouldProvideFullAnswer,
      };
    } catch (error: any) {
      logger.error(`SocraticTutorAgent error: ${error.message}`);
      const primary = chunks[0];
      return {
        text: `Consider how this mechanism behaves in **${primary.fileName}** (Page ${primary.pageNumber}). What does the author describe as the core principle?`,
        sources,
        isGuidingQuestion: true,
      };
    }
  }

  private isAskingForDirectAnswer(question: string): boolean {
    const q = question.toLowerCase().trim();
    return (
      q.includes('give me the answer') ||
      q.includes('just tell me') ||
      q.includes("i don't know") ||
      q.includes('i do not know') ||
      q.includes('tell me the solution') ||
      q.includes('skip guidance') ||
      q.includes('full explanation')
    );
  }
}

export const socraticTutorAgent = new SocraticTutorAgent();
