import mongoose, { Schema, Document } from 'mongoose';

export interface ISavedQuestion extends Document {
  user: mongoose.Types.ObjectId;
  questionText: string;
  difficulty: 'Easy' | 'Moderate' | 'Challenging';
  marks: number;
  svgDiagram?: string;
  answerText?: string;
  subject?: string;
  topic?: string;
  createdAt: Date;
  updatedAt: Date;
}

const SavedQuestionSchema: Schema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    questionText: { type: String, required: true },
    difficulty: { type: String, enum: ['Easy', 'Moderate', 'Challenging'], required: true },
    marks: { type: Number, required: true },
    svgDiagram: { type: String },
    answerText: { type: String },
    subject: { type: String },
    topic: { type: String },
  },
  { timestamps: true }
);

export default mongoose.model<ISavedQuestion>('SavedQuestion', SavedQuestionSchema);
