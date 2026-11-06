import { QueryLogRecord } from '../types/index.js';

class Logger {
  private queryLogs: QueryLogRecord[] = [];

  info(message: string, meta?: any) {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] [INFO] ${message}`, meta ? JSON.stringify(meta) : '');
  }

  warn(message: string, meta?: any) {
    const timestamp = new Date().toISOString();
    console.warn(`[${timestamp}] [WARN] ${message}`, meta ? JSON.stringify(meta) : '');
  }

  error(message: string, error?: any) {
    const timestamp = new Date().toISOString();
    console.error(`[${timestamp}] [ERROR] ${message}`, error);
  }

  logQuery(log: QueryLogRecord) {
    this.queryLogs.push(log);
    // Keep max 500 recent query logs in memory
    if (this.queryLogs.length > 500) {
      this.queryLogs.shift();
    }
    this.info(`[QUERY LOG] question="${log.question}" route=${log.routeLabel} conf=${log.confidence.toFixed(2)} chunks=${log.retrievedChunkCount} topScore=${log.topSimilarityScore.toFixed(3)} latency=${log.latencyMs}ms`);
  }

  getQueryLogs(): QueryLogRecord[] {
    return [...this.queryLogs];
  }
}

export const logger = new Logger();
