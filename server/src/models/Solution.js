import mongoose from 'mongoose';
import { ObjectId, languageMode } from './schemas/common.js';
import { SolutionBlockSchema } from './SolutionBlock.js';
import { blocksText, joinSearch } from '../services/searchText.js';

// One solution per question; publishing follows the parent question.
const solutionSchema = new mongoose.Schema(
  {
    question: { type: ObjectId, ref: 'Question', required: true, unique: true },
    blocks: [SolutionBlockSchema],
    languageMode,
    template: { type: ObjectId, ref: 'Template' },
    createdBy: { type: ObjectId, ref: 'Admin' },
    updatedBy: { type: ObjectId, ref: 'Admin' },
    searchText: { type: String, select: false },
  },
  { timestamps: true },
);

solutionSchema.index({ searchText: 'text' }, { default_language: 'none' });

solutionSchema.pre('validate', function buildSolution() {
  this.searchText = joinSearch(blocksText(this.blocks));
});

export const Solution = mongoose.model('Solution', solutionSchema);
