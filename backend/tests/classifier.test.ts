import { describe, it, expect } from 'vitest';
import { questionClassifier } from '../src/modules/classifier/questionClassifier.js';

describe('Module 4: Question Classifier (FR-4.1, FR-4.2)', () => {
  it('correctly classifies factual definition and formula questions', async () => {
    const factualQuestions = [
      'What is a binary search tree?',
      'Define virtual memory in operating systems.',
      'Give the formula for time complexity of merge sort.',
      'List the four Coffman conditions for deadlock.',
    ];

    for (const q of factualQuestions) {
      const res = await questionClassifier.classify(q);
      expect(res.label).toBe('factual');
      expect(res.confidence).toBeGreaterThan(0.5);
      expect(res.reason).toBeDefined();
    }
  }, 25000);

  it('correctly classifies conceptual why and how questions', async () => {
    const conceptualQuestions = [
      'Why does Quicksort degrade to O(n^2) time on sorted input?',
      'How does paging prevent external memory fragmentation?',
      'Explain the difference between TCP and UDP protocols.',
      'Compare optimistic vs pessimistic concurrency control.',
    ];

    for (const q of conceptualQuestions) {
      const res = await questionClassifier.classify(q);
      expect(res.label).toBe('conceptual');
      expect(res.confidence).toBeGreaterThan(0.5);
      expect(res.reason).toBeDefined();
    }
  }, 25000);
});
