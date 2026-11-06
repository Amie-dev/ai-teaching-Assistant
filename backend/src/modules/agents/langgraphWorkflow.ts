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
import { logger } from '../../utils/logger.js';

// Define the Agentic State Annotation
export const AgentStateAnnotation = Annotation.Root({
  question: Annotation<string>(),
  conversationId: Annotation<string>(),
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
 * Node 1: Retrieve course material chunks
 */
async function retrieveNode(state: AgentState): Promise<Partial<AgentState>> {
  logger.info(`[LangGraph] Step 1: Retrieving context for question: "${state.question}"`);
  const result = await retrievalService.retrieveRelevantChunks(state.question);
  return {
    retrievedChunks: result.chunks,
    passedThreshold: result.passedThreshold,
    topScore: result.topScore,
  };
}

/**
 * Node 2: Classify question type
 */
async function classifyNode(state: AgentState): Promise<Partial<AgentState>> {
  logger.info(`[LangGraph] Step 2: Classifying question...`);

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

  // Check if we are in an ongoing Socratic exchange
  const lastMsg = state.history[state.history.length - 1];
  if (lastMsg && lastMsg.routeLabel === 'conceptual' && lastMsg.isGuidingQuestion && state.socraticTurnCount > 0) {
    logger.info(`[LangGraph] Continuing active Socratic dialogue (Turn ${state.socraticTurnCount})`);
    return {
      route: 'conceptual',
      classification: {
        label: 'conceptual',
        confidence: 0.95,
        reason: 'Ongoing conceptual reasoning dialogue',
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
 * Node 3: Direct Answer Agent
 */
async function directAnswerNode(state: AgentState): Promise<Partial<AgentState>> {
  logger.info(`[LangGraph] Step 3: Running Direct Answer Agent`);
  const result = await directAnswerAgent.generate(state.question, state.retrievedChunks);
  return {
    response: result.text,
    sources: result.sources,
    route: 'factual',
    isGuidingQuestion: false,
  };
}

/**
 * Node 4: Socratic Tutor Agent
 */
async function socraticTutorNode(state: AgentState): Promise<Partial<AgentState>> {
  logger.info(`[LangGraph] Step 3: Running Socratic Tutor Agent`);
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
 * Node 5: Unsupported query response
 */
async function unsupportedNode(state: AgentState): Promise<Partial<AgentState>> {
  logger.info(`[LangGraph] Question outside course material. Returning unsupported response.`);
  const message =
    `I could not find relevant information for this question in your uploaded course materials.\n\n` +
    `To get accurate grounded answers:\n` +
    `• Try rephrasing your question using terms from your course syllabus.\n` +
    `• Verify that the relevant chapter or lecture PDF is uploaded in the panel on the left.`;

  return {
    response: message,
    sources: [],
    route: 'unsupported',
    isGuidingQuestion: false,
  };
}

// Build the LangGraph Workflow
const workflow = new StateGraph(AgentStateAnnotation)
  .addNode('retrieve', retrieveNode)
  .addNode('classify', classifyNode)
  .addNode('directAnswer', directAnswerNode)
  .addNode('socraticTutor', socraticTutorNode)
  .addNode('unsupported', unsupportedNode)
  .addEdge(START, 'retrieve')
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
