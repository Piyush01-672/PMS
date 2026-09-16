import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { api, errorMessage, get } from '@/lib/api';

export const RESOURCES = {
  classes: { endpoint: '/classes', singular: 'Class', plural: 'Classes', entityType: 'Class' },
  subjects: { endpoint: '/subjects', singular: 'Subject', plural: 'Subjects', entityType: 'Subject' },
  chapters: { endpoint: '/chapters', singular: 'अध्याय (Chapter)', plural: 'Chapters', entityType: 'Chapter' },
  exercises: { endpoint: '/exercises', singular: 'प्रश्नावली (Exercise)', plural: 'Exercises', entityType: 'Exercise' },
  questions: { endpoint: '/questions', singular: 'Question', plural: 'Questions', entityType: 'Question' },
  solutions: { endpoint: '/solutions', singular: 'Solution', plural: 'Solutions', entityType: 'Solution' },
  notes: { endpoint: '/notes', singular: 'Note', plural: 'Notes', entityType: 'Note' },
  'important-questions': { endpoint: '/important-questions', singular: 'Important Question', plural: 'Important Questions', entityType: 'ImportantQuestion' },
  pages: { endpoint: '/pages', singular: 'Page', plural: 'Pages', entityType: 'Page' },
  sections: { endpoint: '/sections', singular: 'Section', plural: 'Homepage Sections', entityType: 'Section' },
  'related-content': { endpoint: '/related-content', singular: 'Related Content', plural: 'Related Content', entityType: 'RelatedContent' },
  templates: { endpoint: '/templates', singular: 'Template', plural: 'Templates', entityType: 'Template' },
  'ad-slots': { endpoint: '/ad-slots', singular: 'Ad Space', plural: 'Ad Spaces', entityType: 'AdSlot' },
  announcements: { endpoint: '/announcements', singular: 'Announcement', plural: 'Announcements', entityType: 'Announcement' },
  videos: { endpoint: '/videos', singular: 'Video', plural: 'YouTube Videos', entityType: 'Video' },
  media: { endpoint: '/media', singular: 'Media', plural: 'Media', entityType: 'Media' },
};

const REF_KEYS = new Set([
  'media', 'video', 'ogImage', 'image', 'featuredImage', 'introVideo', 'thumbnail', 'logo', 'footerLogo', 'favicon',
  'defaultOgImage', 'class', 'subject', 'chapter', 'exercise', 'question', 'linkedQuestion', 'template', 'target', 'source',
]);
const REF_ARRAY_KEYS = new Set(['subjects', 'relatedChapters', 'classes', 'chapters', 'questions', 'importantQuestions', 'notes', 'videos', 'gallery']);
const READ_ONLY = new Set(['__v', 'createdAt', 'updatedAt', 'createdBy', 'updatedBy', 'searchText']);

export const refId = (value) => (value && typeof value === 'object' ? value._id : value) || undefined;

/** Converts populated references back to ids before saving (the API stores references, not copies). */
export function normalizeRefs(value, key) {
  if (Array.isArray(value)) {
    return REF_ARRAY_KEYS.has(key) ? value.map(refId).filter(Boolean) : value.map((v) => normalizeRefs(v));
  }
  if (value && typeof value === 'object' && !(value instanceof Date)) {
    if (key && REF_KEYS.has(key) && value._id) return value._id;
    const out = {};
    for (const [k, v] of Object.entries(value)) {
      if (READ_ONLY.has(k)) continue;
      out[k] = normalizeRefs(v, k);
    }
    return out;
  }
  if (key && REF_KEYS.has(key) && value === '') return null;
  return value;
}

export function useResourceList(resource, params = {}, options = {}) {
  const { endpoint } = RESOURCES[resource];
  return useQuery({
    queryKey: ['admin', resource, 'list', params],
    queryFn: () => get(endpoint, { scope: 'admin', ...params }),
    placeholderData: (previous) => previous,
    ...options,
  });
}

export function useResourceItem(resource, id, options = {}) {
  const { endpoint } = RESOURCES[resource];
  return useQuery({
    queryKey: ['admin', resource, 'item', id],
    queryFn: () => get(`${endpoint}/${id}`),
    enabled: Boolean(id) && id !== 'new',
    ...options,
  });
}

export function useResourceMutations(resource) {
  const queryClient = useQueryClient();
  const meta = RESOURCES[resource];
  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['admin', resource] });
    queryClient.invalidateQueries({ queryKey: ['admin', 'dashboard'] });
  };
  const onError = (error) => toast.error(errorMessage(error));

  const save = useMutation({
    mutationFn: ({ id, data }) => {
      const payload = normalizeRefs(data);
      delete payload._id;
      return (id && id !== 'new' ? api.put(`${meta.endpoint}/${id}`, payload) : api.post(meta.endpoint, payload)).then((r) => r.data);
    },
    onSuccess: (doc) => {
      invalidate();
      queryClient.setQueryData(['admin', resource, 'item', doc._id], doc);
    },
    onError,
  });

  const setStatus = useMutation({
    mutationFn: ({ id, status, publishedAt }) => api.patch(`${meta.endpoint}/${id}/status`, { status, publishedAt }).then((r) => r.data),
    onSuccess: (_, vars) => {
      invalidate();
      toast.success(vars.status === 'published' ? 'Published' : vars.status === 'archived' ? 'Archived' : 'Moved to draft');
    },
    onError,
  });

  const duplicate = useMutation({
    mutationFn: (id) => api.post(`${meta.endpoint}/${id}/duplicate`).then((r) => r.data),
    onSuccess: () => {
      invalidate();
      toast.success(`${meta.singular} duplicated as a draft`);
    },
    onError,
  });

  const remove = useMutation({
    mutationFn: ({ id, force }) => api.delete(`${meta.endpoint}/${id}`, { params: force ? { force: 'true' } : undefined }).then((r) => r.data),
    onSuccess: () => {
      invalidate();
      toast.success(`${meta.singular} deleted`);
    },
    onError,
  });

  const reorder = useMutation({
    mutationFn: (ids) => api.put(`${meta.endpoint}/reorder`, { ids }).then((r) => r.data),
    onSuccess: () => {
      invalidate();
      toast.success('Order saved');
    },
    onError,
  });

  return { save, setStatus, duplicate, remove, reorder };
}
