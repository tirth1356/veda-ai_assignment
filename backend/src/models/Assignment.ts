import mongoose, { Schema, Document } from 'mongoose';

export interface IQuestion {
  questionText: string;
  difficulty: 'Easy' | 'Moderate' | 'Challenging';
  marks: number;
  svgDiagram?: string;
}

export interface ISection {
  title: string;
  instruction: string;
  questions: IQuestion[];
}

export interface IAnswerKeyItem {
  questionNumber: number;
  answerText: string;
}

export interface IQuestionTypeConfig {
  type: string;
  count: number;
  marks: number;
}

export interface IAssignment extends Document {
  user: mongoose.Types.ObjectId;
  title: string;
  dueDate: Date;
  questionTypes: IQuestionTypeConfig[];
  additionalInstructions?: string;
  filePaths?: string[];
  originalFileNames?: string[];
  totalQuestions: number;
  totalMarks: number;
  
  // Job State & WebSockets progression
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  progress: number;
  error?: string;

  // Render Metadata
  schoolName: string;
  subject: string;
  className: string;
  timeAllowed: string;
  difficulty?: string;

  // AI Output Structure
  sections?: ISection[];
  answerKey?: IAnswerKeyItem[];
  createdAt: Date;
  updatedAt: Date;
}

const QuestionSchema = new Schema<IQuestion>({
  questionText: { type: String, required: true },
  difficulty: { type: String, required: true },
  marks: { type: Number, required: true },
  svgDiagram: { type: String }
}, { _id: false });

const SectionSchema = new Schema<ISection>({
  title: { type: String, required: true },
  instruction: { type: String, required: true },
  questions: { type: [QuestionSchema], default: [] }
}, { _id: false });

const AnswerKeyItemSchema = new Schema<IAnswerKeyItem>({
  questionNumber: { type: Number, required: true },
  answerText: { type: String, required: true }
}, { _id: false });

const QuestionTypeConfigSchema = new Schema<IQuestionTypeConfig>({
  type: { type: String, required: true },
  count: { type: Number, required: true },
  marks: { type: Number, required: true }
}, { _id: false });

const AssignmentSchema = new Schema<IAssignment>({
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true, default: 'Assignment' },
  dueDate: { type: Date, required: true },
  questionTypes: { type: [QuestionTypeConfigSchema], default: [] },
  additionalInstructions: { type: String },
  filePaths: [{ type: String }],
  originalFileNames: [{ type: String }],
  totalQuestions: { type: Number, required: true },
  totalMarks: { type: Number, required: true },
  
  status: { 
    type: String, 
    enum: ['PENDING', 'PROCESSING', 'COMPLETED', 'FAILED'], 
    default: 'PENDING',
    required: true 
  },
  progress: { type: Number, min: 0, max: 100, default: 0, required: true },
  error: { type: String },

  schoolName: { type: String, default: 'Delhi Public School, Sector-4, Bokaro' },
  subject: { type: String, default: 'Science' },
  className: { type: String, default: 'Grade 8' },
  timeAllowed: { type: String, default: '45 minutes' },
  difficulty: { type: String, default: 'Mixed' },

  sections: { type: [SectionSchema], default: [] },
  answerKey: { type: [AnswerKeyItemSchema], default: [] }
}, {
  timestamps: true
});

export default mongoose.models.Assignment || mongoose.model<IAssignment>('Assignment', AssignmentSchema);
