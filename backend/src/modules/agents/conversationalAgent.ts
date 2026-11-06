import { Groq } from 'groq-sdk';
import { config } from '../../config.js';
import { prisma } from '../../db.js';
import { ChatMessage } from '../../types/index.js';
import { logger } from '../../utils/logger.js';

export interface ConversationalAnalysis {
  isConversational: boolean;
  type?: 'greeting' | 'courtesy' | 'identity' | 'general';
  cleanedQuery?: string;
}

export class ConversationalAgent {
  private groq: Groq | null = null;

  constructor() {
    this.initClient();
  }

  private initClient(): void {
    if (config.groqApiKey && !config.groqApiKey.startsWith('your_')) {
      this.groq = new Groq({ apiKey: config.groqApiKey });
    }
  }

  private getGroqClient(): Groq | null {
    if (!this.groq && config.groqApiKey && !config.groqApiKey.startsWith('your_')) {
      this.groq = new Groq({ apiKey: config.groqApiKey });
    }
    return this.groq;
  }

  /**
   * Analyzes whether a message is purely conversational or contains an embedded question.
   */
  analyze(text: string): ConversationalAnalysis {
    const raw = text.trim();
    const lower = raw.toLowerCase().replace(/[!?.!,]+$/, '').trim();

    // Pure greetings
    const pureGreetingRegex = /^(hi+|hello+|hey+|heya|howdy|hola|yo|sup|good\s+(morning|afternoon|evening|day)|greetings)(\s+(there|assistant|tutor|bot|ai|sir|ma'am))?$/i;
    if (pureGreetingRegex.test(lower)) {
      return { isConversational: true, type: 'greeting' };
    }

    // Pure courtesy / closing
    const pureCourtesyRegex = /^(thanks|thank\s+you|thx|ty|great|awesome|cool|nice|okay|ok|got\s+it|understood|perfect|bye|goodbye|see\s+you|good\s*night)(\s+(so\s+much|a\s+lot|assistant))?$/i;
    if (pureCourtesyRegex.test(lower)) {
      return { isConversational: true, type: 'courtesy' };
    }

    // Identity / Capability questions
    const identityRegex = /^(who\s+are\s+you|what\s+are\s+you|what\s+is\s+your\s+name|what\s+can\s+you\s+do|how\s+do\s+you\s+work|what\s+do\s+you\s+do|introduce\s+yourself|help|what\s+is\s+this)(\s+assistant|\?)?$/i;
    if (identityRegex.test(lower)) {
      return { isConversational: true, type: 'identity' };
    }

    // Check if message STARTS with a greeting but has a substantive academic question following it
    // Example: "hi, what is machine learning?" or "hello! can you explain variance?"
    const greetingPrefixRegex = /^(hi+|hello+|hey+|good\s+(morning|afternoon|evening)|howdy)[,\s!:]+(.*)$/i;
    const match = raw.match(greetingPrefixRegex);
    if (match && match[2]) {
      const remaining = match[2].trim();
      // Check if remaining has substance (> 4 chars and has query intent or multiple words)
      const words = remaining.split(/\s+/).filter(Boolean);
      const isAcademic =
        words.length >= 2 ||
        /\b(what|why|how|explain|define|difference|formula|calculate|notes|syllabus|types?|example)\b/i.test(remaining);

      if (isAcademic) {
        return {
          isConversational: false,
          cleanedQuery: remaining,
        };
      } else if (remaining.length === 0 || /^(there|assistant|tutor|bot)$/i.test(remaining)) {
        return { isConversational: true, type: 'greeting' };
      }
    }

    return { isConversational: false };
  }

  /**
   * Generates a warm, intelligent conversational reply grounded in the classroom context.
   */
  async generate(
    question: string,
    classroomId?: string,
    analysisType: 'greeting' | 'courtesy' | 'identity' | 'general' = 'greeting',
    _history: ChatMessage[] = []
  ): Promise<string> {
    // 1. Gather classroom context
    let classroomName = 'your classroom';
    let subject = 'Computer Science';
    let documentNames: string[] = [];

    if (classroomId) {
      try {
        const classroom = await prisma.classroom.findUnique({
          where: { id: classroomId },
          include: { resources: true },
        });
        if (classroom) {
          classroomName = classroom.name;
          subject = classroom.subject || subject;
          documentNames = classroom.resources.map(r => r.fileName);
        }
      } catch (err) {
        logger.warn(`Failed to fetch classroom metadata for conversational agent: ${err}`);
      }
    }

    const client = this.getGroqClient();

    // 2. Try LLM generation for dynamic, natural response
    if (client) {
      try {
        const systemPrompt = `You are the dedicated AI Teaching Assistant for the course "${classroomName}" (${subject}).
Available course materials uploaded: ${documentNames.length > 0 ? documentNames.join(', ') : 'None yet'}.

Student message: "${question}"
Category: ${analysisType}

INSTRUCTIONS:
- If greeting ("hi", "hello"): Greet warmly, introduce yourself as the course AI Teaching Assistant for "${classroomName}". Mention that you are ready to answer questions, guide them Socratically through difficult concepts, or explain topics from their notes (${documentNames.length > 0 ? documentNames.join(', ') : 'uploaded course PDFs'}). Give 1-2 brief example questions they can ask.
- If courtesy ("thanks", "bye"): Respond warmly, encourage their learning, and wish them well with their studies.
- If identity ("who are you", "what can you do"): Explain your role: an Agentic RAG tutor grounded exclusively in their uploaded course documents with page citations, capable of direct answers and step-by-step Socratic reasoning.
- Keep response concise, friendly, and academic (maximum 3-5 sentences or bullet points).
- Do not make up fake course material if none is uploaded.`;

        const response = await client.chat.completions.create({
          model: config.groqModel,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: question },
          ],
          temperature: 0.4,
          max_tokens: 300,
        });

        const reply = response.choices[0]?.message?.content?.trim();
        if (reply && reply.length > 0) {
          return reply;
        }
      } catch (error: any) {
        logger.warn(`ConversationalAgent Groq error: ${error.message}. Using structured fallback.`);
      }
    }

    // 3. High quality deterministic fallback templates
    if (analysisType === 'courtesy') {
      return `You're very welcome! If you have any more questions about **${classroomName}** or need help reviewing your notes, feel free to ask anytime. Happy studying! 🎓`;
    }

    if (analysisType === 'identity') {
      return (
        `Hello! 👋 I'm your **AI Teaching Assistant** for **${classroomName}** (${subject}).\n\n` +
        `Here is what I can do for you:\n` +
        `• 📖 **Course-Grounded Answers:** Ask any question and get answers cited directly from your course materials with page numbers.\n` +
        `• 💡 **Socratic Tutoring:** Ask conceptual questions to be guided step-by-step to deeper understanding.\n` +
        `• ⚡ **Direct Answers:** Switch to Direct Answer mode whenever you need quick formulas, definitions, or exam reviews.\n\n` +
        (documentNames.length > 0
          ? `I currently have access to **${documentNames.join(', ')}**. Ask me anything about these materials!`
          : `Upload your lecture slides or syllabus in the **Resources** tab to get started!`)
      );
    }

    // Default Greeting
    const docNotice =
      documentNames.length > 0
        ? `I have your course materials loaded (**${documentNames.join(', ')}**). You can ask me to explain key concepts, define terms, or provide formulas with exact page citations.\n\n` +
          `Try asking: *"What are the key concepts covered?"* or *"Can you summarize the main topics?"*`
        : `To get started, switch to the **Resources** tab to upload your lecture notes, slides, or syllabus PDF.\n\n` +
          `How can I assist you with your studies today?`;

    return (
      `Hello! 👋 Welcome to **${classroomName}** (${subject}). I'm your AI Teaching Assistant.\n\n` +
      docNotice
    );
  }
}

export const conversationalAgent = new ConversationalAgent();

