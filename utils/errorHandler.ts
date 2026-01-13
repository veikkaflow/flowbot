// Error handling utilities

export class AppError extends Error {
  constructor(
    message: string,
    public code: string,
    public userMessage?: string
  ) {
    super(message);
    this.name = 'AppError';
    // Maintains proper stack trace for where our error was thrown (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, AppError);
    }
  }
}

export function handleError(error: unknown): AppError {
  if (error instanceof AppError) {
    return error;
  }
  
  if (error instanceof Error) {
    return new AppError(
      error.message,
      'UNKNOWN',
      'Tapahtui odottamaton virhe. Yritä myöhemmin uudelleen.'
    );
  }
  
  return new AppError(
    'Unknown error',
    'UNKNOWN',
    'Tapahtui odottamaton virhe. Yritä myöhemmin uudelleen.'
  );
}

export function createError(code: string, message: string, userMessage?: string): AppError {
  return new AppError(message, code, userMessage);
}

