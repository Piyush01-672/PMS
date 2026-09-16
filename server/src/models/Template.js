import mongoose from 'mongoose';
import { DIFFICULTIES, ObjectId, textL10n } from './schemas/common.js';
import { VIDEO_PLACEMENTS } from './Question.js';
import { SolutionBlockSchema } from './SolutionBlock.js';

// Reusable question/solution skeletons, e.g. QUESTION → HINT → STEPS → CONSTRUCTION DIAGRAM → VIDEO → FINAL ANSWER.
const templateSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 120 },
    description: textL10n(),
    kind: { type: String, enum: ['question', 'solution', 'importantQuestion'], default: 'question' },
    blocks: [SolutionBlockSchema],
    questionDefaults: {
      difficulty: { type: String, enum: DIFFICULTIES, default: 'medium' },
      videoPlacement: { type: String, enum: VIDEO_PLACEMENTS, default: 'afterSolution' },
      attachmentKinds: [{ type: String }],
      includeHint: { type: Boolean, default: false },
    },
    isDefault: { type: Boolean, default: false },
    sortOrder: { type: Number, default: 0 },
    createdBy: { type: ObjectId, ref: 'Admin' },
    updatedBy: { type: ObjectId, ref: 'Admin' },
  },
  { timestamps: true },
);

export const Template = mongoose.model('Template', templateSchema);
