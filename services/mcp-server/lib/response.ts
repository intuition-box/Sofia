export function removeEmptyFields(obj: any): any {
  // Handle null or undefined input
  if (obj === null || obj === undefined) {
    return obj;
  }

  // Handle arrays
  if (Array.isArray(obj)) {
    return obj
      .map((item) => removeEmptyFields(item))
      .filter(
        (item) =>
          item !== undefined &&
          item !== null &&
          (typeof item !== 'string' || item !== '') &&
          (!Array.isArray(item) || item.length > 0)
      );
  }

  // Handle objects
  if (typeof obj === 'object') {
    const result: { [key: string]: any } = {};

    for (const [key, value] of Object.entries(obj)) {
      // Process the value recursively
      const processedValue = removeEmptyFields(value);

      // Only include non-empty values
      if (
        processedValue !== undefined &&
        processedValue !== null &&
        (typeof processedValue !== 'string' || processedValue !== '') &&
        (!Array.isArray(processedValue) || processedValue.length > 0)
      ) {
        result[key] = processedValue;
      }
    }

    // Return undefined if object is empty after processing
    return Object.keys(result).length > 0 ? result : undefined;
  }

  // Return primitive values as-is
  return obj;
}

// Standardized error handling for MCP operations
import { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { z } from 'zod';

export interface ErrorContext {
  operation: string;
  args?: any;
  phase?: string;
  requestId?: string;
}

export function createErrorResponse(
  error: unknown,
  context: ErrorContext
): CallToolResult {
  const timestamp = new Date().toISOString();

  // Simplified error logging to reduce token usage
  console.error(
    `[${context.operation}] Error:`,
    error instanceof Error ? error.message : String(error)
  );

  // Handle Zod validation errors
  if (error instanceof z.ZodError) {
    const errorMessages = error.errors
      .map((e) => `${e.path.join('.')}: ${e.message}`)
      .join(', ');
    return {
      isError: true,
      content: [
        {
          type: 'text',
          text: `❌ **Input Validation Error**: ${errorMessages}`,
        },
      ],
    };
  }

  // Handle GraphQL/Network errors
  if (error instanceof Error) {
    let errorType = 'Unknown Error';
    let userMessage = error.message;

    // Categorize common error types
    if (error.message.includes('fetch') || error.message.includes('network')) {
      errorType = 'Network Error';
      userMessage =
        'Unable to connect to the Intuition API. Please check your network connection.';
    } else if (error.message.includes('timeout')) {
      errorType = 'Timeout Error';
      userMessage =
        'The request timed out. The Intuition API may be experiencing high load.';
    } else if (
      error.message.includes('401') ||
      error.message.includes('unauthorized')
    ) {
      errorType = 'Authentication Error';
      userMessage = 'Authentication failed. Please check API credentials.';
    } else if (
      error.message.includes('400') ||
      error.message.includes('Bad Request')
    ) {
      errorType = 'Bad Request Error';
      userMessage = 'Invalid request format. Please check your parameters.';
    } else if (
      error.message.includes('500') ||
      error.message.includes('Internal Server Error')
    ) {
      errorType = 'Server Error';
      userMessage =
        'The Intuition API is experiencing internal issues. Please try again later.';
    } else if (error.message.includes('GraphQL')) {
      errorType = 'GraphQL Error';
      userMessage = `Query execution failed: ${error.message}`;
    }

    return {
      isError: true,
      content: [
        {
          type: 'text',
          text: `❌ **${errorType}**: ${userMessage}`,
        },
      ],
    };
  }

  // Handle unknown errors
  return {
    isError: true,
    content: [
      {
        type: 'text',
        text: `❌ **Unexpected Error**: ${String(error)}`,
      },
    ],
  };
}

// Wrapper for operations with timeout and error handling
export async function executeWithErrorHandling<T>(
  operation: () => Promise<T>,
  context: ErrorContext,
  timeoutMs: number = 30000
): Promise<T> {
  const startTime = Date.now();

  try {
    console.log(`\n=== Starting ${context.operation} ===`, {
      timestamp: new Date().toISOString(),
      args: context.args,
      requestId: context.requestId,
    });

    // Add timeout wrapper
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => {
        reject(new Error(`Operation timed out after ${timeoutMs}ms`));
      }, timeoutMs);
    });

    const result = await Promise.race([operation(), timeoutPromise]);

    const duration = Date.now() - startTime;
    console.log(`\n=== ${context.operation} Success ===`, {
      duration: `${duration}ms`,
      timestamp: new Date().toISOString(),
    });

    return result;
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(`\n=== ${context.operation} Failed ===`, {
      duration: `${duration}ms`,
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
}
