import mongoose, { Document, Schema } from 'mongoose';

export interface ILibraryDocument extends Document {
  user: mongoose.Types.ObjectId;
  fileName: string;
  originalFileName: string;
  fileSize: number;
  createdAt: Date;
}

const LibraryDocumentSchema: Schema = new Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  fileName: { type: String, required: true },
  originalFileName: { type: String, required: true },
  fileSize: { type: Number, required: true },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.models.LibraryDocument || mongoose.model<ILibraryDocument>('LibraryDocument', LibraryDocumentSchema);
