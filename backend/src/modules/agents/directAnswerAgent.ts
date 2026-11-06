import { Groq } from 'groq-sdk';
import { config } from '../../config.js';
import { RetrievedChunk, SourceCitation } from '../../types/index.js';
import { logger } from '../../utils/logger.js';
import { DIRECT_ANSWER_SYSTEM_PROMPT, formatRetrievedContext } from './prompts.js';

export interface AgentResponse {
  text: string;
  sources: SourceCitation[];
}

export class DirectAnswerAgent {
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

  async generate(question: string, chunks: RetrievedChunk[]): Promise<AgentResponse> {
    const context = formatRetrievedContext(chunks);
    const sources: SourceCitation[] = chunks.map(c => ({
      fileName: c.fileName,
      pageNumber: c.pageNumber,
      snippet: c.text.slice(0, 150) + (c.text.length > 150 ? '...' : ''),
    }));

    const client = this.getGroqClient();

    if (!client) {
      logger.warn('GROQ_API_KEY not configured. Generating grounded answer from retrieved context.');
      const primaryChunk = chunks[0];
      return {
        text: `According to **${primaryChunk.fileName}** (Page ${primaryChunk.pageNumber}):\n\n"${primaryChunk.text.slice(0, 300)}..."\n\n*[Source: ${primaryChunk.fileName}, Page: ${primaryChunk.pageNumber}]*`,
        sources,
      };
    }

    const userPrompt = `Retrieved Course Context:\n${context}\n\nStudent Question:\n${question}\n\nPlease provide a direct, grounded answer citing the source file and page for each claim.`;

    try {
      const response = await client.chat.completions.create({
        model: config.groqModel,
        messages: [
          { role: 'system', content: DIRECT_ANSWER_SYSTEM_PROMPT },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.2,
      });

      const text = response.choices[0]?.message?.content?.trim() || '';

      return {
        text,
        sources,
      };
    } catch (error: any) {
      logger.error(`DirectAnswerAgent execution failed: ${error.message}`);
      // Graceful fallback to raw excerpt
      const primary = chunks[0];
      return {
        text: `Based on your course notes in **${primary.fileName}** (Page ${primary.pageNumber}):\n\n${primary.text}`,
        sources,
      };
    }
  }
}

export const directAnswerAgent = new DirectAnswerAgent();
