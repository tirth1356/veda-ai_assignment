/**
 * PDF Generation Configuration & Constants
 * Centralized configuration for consistent PDF styling and layout
 */

export interface PDFConfig {
  margins: {
    top: number;
    bottom: number;
    left: number;
    right: number;
  };
  fonts: {
    default: string;
    bold: string;
    italic: string;
  };
  colors: {
    text: string;
    divider: string;
    header: string;
    footer: string;
  };
  sizes: {
    pageWidth: number;
    pageHeight: number;
    titleFontSize: number;
    headingFontSize: number;
    bodyFontSize: number;
    smallFontSize: number;
  };
  spacing: {
    sectionGap: number;
    questionGap: number;
    lineHeight: number;
  };
}

/**
 * Default PDF Configuration
 * Optimized for exam/assignment papers
 */
export const DEFAULT_PDF_CONFIG: PDFConfig = {
  margins: {
    top: 50,
    bottom: 50,
    left: 50,
    right: 50,
  },
  fonts: {
    default: 'Helvetica',
    bold: 'Helvetica-Bold',
    italic: 'Helvetica-Oblique',
  },
  colors: {
    text: '#000000',
    divider: '#888888',
    header: '#1a1a1a',
    footer: '#666666',
  },
  sizes: {
    pageWidth: 595, // A4 width
    pageHeight: 842, // A4 height
    titleFontSize: 18,
    headingFontSize: 14,
    bodyFontSize: 10,
    smallFontSize: 8,
  },
  spacing: {
    sectionGap: 1.2,
    questionGap: 0.8,
    lineHeight: 1.5,
  },
};

/**
 * Default institution metadata
 */
export const DEFAULT_INSTITUTION = {
  name: 'Educational Institution',
  address: 'Address',
  contactEmail: 'contact@institution.edu',
};

/**
 * Question difficulty levels
 */
export enum DifficultyLevel {
  EASY = 'Easy',
  MEDIUM = 'Medium',
  HARD = 'Hard',
}

/**
 * PDF generation limits and validations
 */
export const PDF_LIMITS = {
  MAX_QUESTIONS_PER_SECTION: 100,
  MAX_SECTIONS: 26, // A-Z
  MAX_TOTAL_QUESTIONS: 500,
  MIN_MARKS_PER_QUESTION: 0.5,
  MAX_MARKS_PER_QUESTION: 100,
  TIMEOUT_MS: 30000, // 30 seconds
  MAX_BUFFER_SIZE: 50 * 1024 * 1024, // 50 MB
};
