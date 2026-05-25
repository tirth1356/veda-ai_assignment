/**
 * Custom Error Classes
 * Provides structured error handling for PDF generation
 */

export class PDFError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly statusCode: number = 500,
    public readonly details?: any
  ) {
    super(message);
    this.name = 'PDFError';
  }
}

export class ValidationError extends PDFError {
  constructor(message: string, details?: any) {
    super(message, 'VALIDATION_ERROR', 400, details);
    this.name = 'ValidationError';
  }
}

export class PDFTimeoutError extends PDFError {
  constructor(timeoutMs: number) {
    super(
      `PDF generation timed out after ${timeoutMs}ms`,
      'PDF_TIMEOUT',
      504,
      { timeoutMs }
    );
    this.name = 'PDFTimeoutError';
  }
}

export class PDFMemoryError extends PDFError {
  constructor(bufferSize: number, maxSize: number) {
    super(
      `Generated PDF exceeds maximum size: ${bufferSize} > ${maxSize} bytes`,
      'PDF_MEMORY_ERROR',
      413,
      { bufferSize, maxSize }
    );
    this.name = 'PDFMemoryError';
  }
}

export class PDFStreamError extends PDFError {
  constructor(originalError: Error) {
    super(
      `PDF stream error: ${originalError.message}`,
      'PDF_STREAM_ERROR',
      500,
      { originalError: originalError.message }
    );
    this.name = 'PDFStreamError';
  }
}
