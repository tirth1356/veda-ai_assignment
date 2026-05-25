import mongoose, { Schema, Document } from 'mongoose';

export interface IGroup extends Document {
  name: string;
  className: string;
  subject: string;
  assignments: mongoose.Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

const GroupSchema = new Schema<IGroup>({
  name: { type: String, required: true },
  className: { type: String, required: true },
  subject: { type: String, required: true },
  assignments: [{ type: Schema.Types.ObjectId, ref: 'Assignment' }]
}, {
  timestamps: true
});

export default mongoose.model<IGroup>('Group', GroupSchema);
