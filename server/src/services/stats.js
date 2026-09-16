import { cache } from '../lib/cache.js';
import { Chapter, Exercise, Question } from '../models/index.js';

async function countBy(Model, field, match) {
  const rows = await Model.aggregate([{ $match: match }, { $group: { _id: `$${field}`, count: { $sum: 1 } } }]);
  return Object.fromEntries(rows.map((r) => [String(r._id), r.count]));
}

// Published chapter / exercise / question counts per class (used on class cards).
export async function classStats() {
  return cache.wrap('class-stats', 60_000, async () => {
    const [chapters, exercises, questions] = await Promise.all([
      countBy(Chapter, 'class', Chapter.publicFilter()),
      countBy(Exercise, 'class', Exercise.publicFilter()),
      countBy(Question, 'class', Question.publicFilter()),
    ]);
    return { chapters, exercises, questions };
  });
}

export async function countsForChapters(chapterIds, preview = false) {
  const ids = chapterIds.map((id) => id);
  const exMatch = preview ? { chapter: { $in: ids } } : Exercise.publicFilter({ chapter: { $in: ids } });
  const qMatch = preview ? { chapter: { $in: ids } } : Question.publicFilter({ chapter: { $in: ids } });
  const [exercises, questions] = await Promise.all([
    countBy(Exercise, 'chapter', exMatch),
    countBy(Question, 'chapter', qMatch),
  ]);
  return { exercises, questions };
}

export async function countsForExercises(exerciseIds, preview = false) {
  const match = preview ? { exercise: { $in: exerciseIds } } : Question.publicFilter({ exercise: { $in: exerciseIds } });
  return countBy(Question, 'exercise', match);
}
