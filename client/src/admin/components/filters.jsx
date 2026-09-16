import { useSearchParams } from 'react-router';
import { useResourceList } from '../lib/resources.js';

const selectClass = 'h-9 max-w-[16rem] rounded-lg border bg-background px-2 text-sm disabled:opacity-50';

/** Hierarchical URL filters: changing a parent (class) clears its children (chapter, exercise). */
export function useQueryFilters(keys) {
  const [params, setParams] = useSearchParams();
  const values = Object.fromEntries(keys.map((key) => [key, params.get(key) || '']));
  const set = (key, value) => {
    const next = new URLSearchParams(params);
    keys.slice(keys.indexOf(key)).forEach((k) => next.delete(k));
    if (value) next.set(key, value);
    setParams(next, { replace: true });
  };
  const active = Object.fromEntries(Object.entries(values).filter(([, v]) => v));
  return [values, set, active];
}

export function ClassFilter({ value, onChange, label = 'All classes' }) {
  const list = useResourceList('classes', { limit: 100 });
  return (
    <select value={value || ''} onChange={(e) => onChange(e.target.value)} className={selectClass} aria-label="Filter by class">
      <option value="">{label}</option>
      {(list.data?.items || []).map((c) => (
        <option key={c._id} value={c._id}>
          Class {c.number}
        </option>
      ))}
    </select>
  );
}

export function ChapterFilter({ classId, value, onChange }) {
  const list = useResourceList('chapters', { class: classId, limit: 200 }, { enabled: Boolean(classId) });
  return (
    <select value={value || ''} onChange={(e) => onChange(e.target.value)} disabled={!classId} className={selectClass} aria-label="Filter by अध्याय">
      <option value="">{classId ? 'All अध्याय' : 'Choose a class first'}</option>
      {classId &&
        (list.data?.items || []).map((c) => (
          <option key={c._id} value={c._id}>
            अध्याय {c.number} — {c.title?.en || c.title?.hi}
          </option>
        ))}
    </select>
  );
}

export function ExerciseFilter({ chapterId, value, onChange }) {
  const list = useResourceList('exercises', { chapter: chapterId, limit: 200 }, { enabled: Boolean(chapterId) });
  return (
    <select value={value || ''} onChange={(e) => onChange(e.target.value)} disabled={!chapterId} className={selectClass} aria-label="Filter by प्रश्नावली">
      <option value="">{chapterId ? 'All प्रश्नावली' : 'Choose an अध्याय first'}</option>
      {chapterId &&
        (list.data?.items || []).map((e) => (
          <option key={e._id} value={e._id}>
            प्रश्नावली {e.number}
          </option>
        ))}
    </select>
  );
}
