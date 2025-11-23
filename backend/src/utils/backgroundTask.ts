/**
 * Utility for running async tasks in the background without blocking
 * Properly handles errors and prevents unhandled promise rejections
 */
import logger from './logger.js';

/**
 * Run an async function in the background (fire-and-forget)
 * Errors are logged but don't crash the process
 */
export function runBackgroundTask<T>(
  task: () => Promise<T>,
  taskName?: string
): void {
  // Use process.nextTick to ensure it runs after current execution
  process.nextTick(async () => {
    try {
      await task();
      if (taskName) {
        logger.debug(`Background task completed: ${taskName}`);
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      logger.error(
        `Background task failed${taskName ? `: ${taskName}` : ''}: ${errorMsg}`,
        error
      );
      // Don't rethrow - this is fire-and-forget
    }
  });
}

/**
 * Run multiple async tasks in parallel in the background
 */
export function runBackgroundTasks<T>(
  tasks: Array<() => Promise<T>>,
  taskName?: string
): void {
  process.nextTick(async () => {
    try {
      await Promise.allSettled(tasks.map((task) => task()));
      if (taskName) {
        logger.debug(`Background tasks completed: ${taskName}`);
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      logger.error(
        `Background tasks failed${taskName ? `: ${taskName}` : ''}: ${errorMsg}`,
        error
      );
    }
  });
}

