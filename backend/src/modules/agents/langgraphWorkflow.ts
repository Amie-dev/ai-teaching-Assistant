import { Annotation, StateGraph, START, END } from '@langchain/langgraph';
import {
  ChatMessage,
  ClassificationResult,
  RetrievedChunk,
  RouteLabel,
  SourceCitation,
} from '../../types/index.js';
import { retrievalService } from '../vectorstore/retrievalService.js';
import { questionClassifier } from '../classifier/questionClassifier.js';
import { directAnswerAgent } from './directAnswerAgent.js';
import { socraticTutorAgent } from './socraticTutorAgent.js';
import { conversationalAgent } from './conversationalAgent.js';
import { prisma } from '../../db.js';
import { logger } from '../../utils/logger.js';

// Define the Agentic State Annotation
export const AgentStateAnnotation = Annotation.Root({
  question: Annotation<string>(),
  conversationId: Annotation<string>(),
  classroomId: Annotation<string | undefined>({
    reducer: (_current, next) => next,
    default: () => undefined,
  }),
  history: Annotation<ChatMessage[]>({
    reducer: (_current, next) => next,
    default: () => [],
  }),
  retrievedChunks: Annotation<RetrievedChunk[]>({
    reducer: (_current, next) => next,
    default: () => [],
  }),
  topScore: Annotation<number>({
    reducer: (_current, next) => next,
    default: () => 0,
  }),
  passedThreshold: Annotation<boolean>({
    reducer: (_current, next) => next,
    default: () => false,
  }),
  intent: Annotation<'conversational' | 'socratic_turn' | 'academic_query'>({
    reducer: (_current, next) => next,
    default: () => 'academic_query',
  }),
  conversationalType: Annotation<'greeting' | 'courtesy' | 'identity' | 'general' | undefined>({
    reducer: (_current, next) => next,
    default: () => undefined,
  }),
  classification: Annotation<ClassificationResult>({
    reducer: (_current, next) => next,
    default: () => ({ label: 'factual', confidence: 1, reason: 'init' }),
  }),
  route: Annotation<RouteLabel>({
    reducer: (_current, next) => next,
    default: () => 'factual',
  }),
  response: Annotation<string>({
    reducer: (_current, next) => next,
    default: () => '',
  }),
  sources: Annotation<SourceCitation[]>({
    reducer: (_current, next) => next,
    default: () => [],
  }),
  socraticTurnCount: Annotation<number>({
    reducer: (_current, next) => next,
    default: () => 0,
  }),
  forceDirectAnswer: Annotation<boolean>({
    reducer: (_current, next) => next,
    default: () => false,
  }),
  isGuidingQuestion: Annotation<boolean>({
    reducer: (_current, next) => next,
    default: () => false,
  }),
});

export type AgentState = typeof AgentStateAnnotation.State;

/**
 * Node 0: Analyze Query Intent
 * Determines if query is:
 * - Conversational (greetings "hi", courtesy "thanks", identity "who are you")
 * - Socratic continuation (answering an active guiding question)
 * - Academic query (factual or conceptual question needing RAG)
 */
async function analyzeIntentNode(state: AgentState): Promise<Partial<AgentState>> {
  logger.info(`[LangGraph] Step 0: Analyzing intent for: "${state.question}"`);

  // 1. Check for conversational intent or greeting prefix
  const convAnalysis = conversationalAgent.analyze(state.question);
  if (convAnalysis.isConversational) {
    logger.info(`[LangGraph] Intent detected: conversational (${convAnalysis.type})`);
    return {
      intent: 'conversational',
      conversationalType: convAnalysis.type,
      route: 'conversational',
    };
  }

  // If there was an embedded academic question after a greeting (e.g. "hi, what is ml?")
  let effectiveQuestion = state.question;
  if (convAnalysis.cleanedQuery) {
    logger.info(`[LangGraph] Extracted academic query from greeting: "${convAnalysis.cleanedQuery}"`);
    effectiveQuestion = convAnalysis.cleanedQuery;
  }

  // 2. Check for active Socratic dialogue continuation
  const lastMsg = state.history[state.history.length - 1];
  const isContinuingSocratic =
    state.socraticTurnCount > 0 &&
    lastMsg &&
    lastMsg.role === 'assistant' &&
    lastMsg.isGuidingQuestion &&
    state.retrievedChunks.length > 0 &&
    !state.forceDirectAnswer;

  if (isContinuingSocratic) {
    logger.info(`[LangGraph] Intent detected: Socratic dialogue continuation (Turn ${state.socraticTurnCount})`);
    return {
      question: effectiveQuestion,
      intent: 'socratic_turn',
      route: 'conceptual',
    };
  }

  // 3. Default to academic query
  return {
    question: effectiveQuestion,
    intent: 'academic_query',
  };
}

/**
 * Node 1: Conversational Handler
 * Generates warm, classroom-aware replies for greetings, identity, and courtesy
 */
async function conversationalNode(state: AgentState): Promise<Partial<AgentState>> {
  logger.info(`[LangGraph] Step: Generating conversational response for: "${state.question}"`);
  const reply = await conversationalAgent.generate(
    state.question,
    state.classroomId,
    state.conversationalType || 'greeting',
    state.history
  );

  return {
    response: reply,
    sources: [],
    route: 'conversational',
    isGuidingQuestion: false,
  };
}

/**
 * Node 2: Retrieve course material chunks
 */
async function retrieveNode(state: AgentState): Promise<Partial<AgentState>> {
  logger.info(`[LangGraph] Step: Retrieving context for question: "${state.question}" (classroom: ${state.classroomId || 'all'})`);
  const result = await retrievalService.retrieveRelevantChunks(state.question, undefined, undefined, state.classroomId);
  return {
    retrievedChunks: result.chunks,
    passedThreshold: result.passedThreshold,
    topScore: result.topScore,
  };
}

/**
 * Node 3: Classify question type
 */
async function classifyNode(state: AgentState): Promise<Partial<AgentState>> {
  logger.info(`[LangGraph] Step: Classifying question...`);

  if (state.forceDirectAnswer) {
    return {
      route: 'factual',
      classification: {
        label: 'factual',
        confidence: 1.0,
        reason: 'User explicitly requested direct answer',
      },
    };
  }

  const classification = await questionClassifier.classify(state.question);
  return {
    classification,
    route: classification.label,
  };
}

/**
 * Node 4: Direct Answer Agent
 */
async function directAnswerNode(state: AgentState): Promise<Partial<AgentState>> {
  logger.info(`[LangGraph] Step: Running Direct Answer Agent`);
  const result = await directAnswerAgent.generate(state.question, state.retrievedChunks);
  return {
    response: result.text,
    sources: result.sources,
    route: 'factual',
    isGuidingQuestion: false,
  };
}

/**
 * Node 5: Socratic Tutor Agent
 */
async function socraticTutorNode(state: AgentState): Promise<Partial<AgentState>> {
  logger.info(`[LangGraph] Step: Running Socratic Tutor Agent`);
  const result = await socraticTutorAgent.generate(
    state.question,
    state.retrievedChunks,
    state.history,
    state.socraticTurnCount,
    state.forceDirectAnswer
  );

  return {
    response: result.text,
    sources: result.sources,
    route: 'conceptual',
    socraticTurnCount: state.socraticTurnCount + 1,
    isGuidingQuestion: result.isGuidingQuestion,
  };
}

/**
 * Node 6: Unsupported query response
 */
async function unsupportedNode(state: AgentState): Promise<Partial<AgentState>> {
  logger.info(`[LangGraph] Question outside course material. Returning unsupported response.`);

  let classroomName = '';
  let availableDocs: string[] = [];

  if (state.classroomId) {
    try {
      const classroom = await prisma.classroom.findUnique({
        where: { id: state.classroomId },
        include: { resources: true },
      });
      if (classroom) {
        classroomName = classroom.name;
        availableDocs = classroom.resources.map(r => r.fileName);
      }
    } catch {
      // ignore
    }
  }

  if (availableDocs.length === 0) {
    return {
      response:
        `No course materials have been uploaded to **${classroomName || 'this classroom'}** yet.\n\n` +
        `To enable the AI Teaching Assistant:\n` +
        `• Switch to the **Resources** tab in the navigation above.\n` +
        `• Upload your course syllabus, lecture slides, or textbook chapters as PDF.`,
      sources: [],
      route: 'unsupported',
      isGuidingQuestion: false,
    };
  }

  const message =
    `I could not find information regarding **"${state.question}"** in the course materials uploaded for **${classroomName || 'this classroom'}**.\n\n` +
    `Currently available course documents:\n` +
    availableDocs.map(d => `• 📄 **${d}**`).join('\n') +
    `\n\n` +
    `**How to get grounded answers:**\n` +
    `• Try rephrasing your question using key terms or chapter titles from the syllabus.\n` +
    `• If this topic belongs to an upcoming lecture or new chapter, ask your teacher to upload the relevant PDF in the **Resources** tab.`;

  return {
    response: message,
    sources: [],
    route: 'unsupported',
    isGuidingQuestion: false,
  };
}

// Build the LangGraph Workflow
const workflow = new StateGraph(AgentStateAnnotation)
  .addNode('analyzeIntent', analyzeIntentNode)
  .addNode('conversational', conversationalNode)
  .addNode('retrieve', retrieveNode)
  .addNode('classify', classifyNode)
  .addNode('directAnswer', directAnswerNode)
  .addNode('socraticTutor', socraticTutorNode)
  .addNode('unsupported', unsupportedNode)
  // Flow starts with Intent Analysis
  .addEdge(START, 'analyzeIntent')
  .addConditionalEdges('analyzeIntent', (state) => {
    if (state.intent === 'conversational') return 'conversational';
    if (state.intent === 'socratic_turn') return 'socraticTutor';
    return 'retrieve';
  })
  .addEdge('conversational', END)
  .addConditionalEdges('retrieve', (state) => {
    return state.passedThreshold ? 'classify' : 'unsupported';
  })
  .addConditionalEdges('classify', (state) => {
    return state.route === 'conceptual' ? 'socraticTutor' : 'directAnswer';
  })
  .addEdge('directAnswer', END)
  .addEdge('socraticTutor', END)
  .addEdge('unsupported', END);

export const agenticGraph = workflow.compile();
