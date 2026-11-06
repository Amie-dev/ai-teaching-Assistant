import { v4 as uuidv4 } from 'uuid';
import {
  ChatMessage,
  ConversationRecord,
  QueryLogRecord,
  RouteLabel,
} from '../../types/index.js';
import { logger } from '../../utils/logger.js';
import { agenticGraph } from './langgraphWorkflow.js';

class ConversationService {
  private conversations: Map<string, ConversationRecord> = new Map();

  getOrCreateConversation(conversationId?: string): ConversationRecord {
    const id = conversationId && conversationId.trim().length > 0 ? conversationId : uuidv4();
    let conversation = this.conversations.get(id);

    if (!conversation) {
      conversation = {
        conversationId: id,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        messages: [],
        socraticTurnCount: 0,
      };
      this.conversations.set(id, conversation);
    }

    return conversation;
  }

  getConversation(conversationId: string): ConversationRecord | undefined {
    return this.conversations.get(conversationId);
  }

  /**
   * Processes a user question through the LangGraph agentic workflow.
   */
  async processQuestion(
    question: string,
    conversationId?: string,
    forceDirectAnswer = false
  ): Promise<{
    conversationId: string;
    message: ChatMessage;
    route: RouteLabel;
    confidence: number;
    latencyMs: number;
    socraticTurnCount: number;
  }> {
    const startTime = Date.now();
    const conversation = this.getOrCreateConversation(conversationId);

    // Append student message
    const studentMessage: ChatMessage = {
      id: uuidv4(),
      role: 'student',
      text: question,
      timestamp: new Date().toISOString(),
    };
    conversation.messages.push(studentMessage);

    // Invoke LangGraph workflow
    const inputState = {
      question,
      conversationId: conversation.conversationId,
      history: [...conversation.messages],
      socraticTurnCount: conversation.socraticTurnCount,
      forceDirectAnswer,
    };

    const finalState = await agenticGraph.invoke(inputState);
    const latencyMs = Date.now() - startTime;

    // Build Assistant message
    const assistantMessage: ChatMessage = {
      id: uuidv4(),
      role: 'assistant',
      text: finalState.response,
      routeLabel: finalState.route,
      sources: finalState.sources,
      timestamp: new Date().toISOString(),
      isGuidingQuestion: finalState.isGuidingQuestion,
    };

    conversation.messages.push(assistantMessage);
    conversation.lastRoute = finalState.route;
    conversation.socraticTurnCount = finalState.socraticTurnCount ?? conversation.socraticTurnCount;
    conversation.updatedAt = new Date().toISOString();

    // Log query metrics
    const logRecord: QueryLogRecord = {
      id: uuidv4(),
      timestamp: new Date().toISOString(),
      conversationId: conversation.conversationId,
      question,
      routeLabel: finalState.route,
      confidence: finalState.classification?.confidence ?? 1.0,
      retrievedChunkCount: finalState.retrievedChunks?.length ?? 0,
      topSimilarityScore: finalState.topScore ?? 0,
      retrievedChunkIds: (finalState.retrievedChunks || []).map((c: any) => c.chunkId),
      latencyMs,
    };
    logger.logQuery(logRecord);

    return {
      conversationId: conversation.conversationId,
      message: assistantMessage,
      route: finalState.route,
      confidence: finalState.classification?.confidence ?? 1.0,
      latencyMs,
      socraticTurnCount: conversation.socraticTurnCount,
    };
  }
}

export const conversationService = new ConversationService();
