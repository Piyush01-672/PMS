// Clean SEO URLs: /class-9/maths/adhyay-5/prashnavali-5-2/prashn-3
export const urls = {
  class: (c) => `/${c.slug}`,
  subject: (c, s) => `/${c.slug}/${s.slug}`,
  exercises: (c, s) => `/${c.slug}/${s.slug}/prashnavali`,
  notes: (c, s) => `/${c.slug}/${s.slug}/notes`,
  note: (c, s, n) => `/${c.slug}/${s.slug}/notes/${n.slug}`,
  importantQuestions: (c, s) => `/${c.slug}/${s.slug}/important-questions`,
  chapter: (c, s, ch) => `/${c.slug}/${s.slug}/${ch.slug}`,
  exercise: (c, s, ch, e) => `/${c.slug}/${s.slug}/${ch.slug}/${e.slug}`,
  question: (c, s, ch, e, q) => `/${c.slug}/${s.slug}/${ch.slug}/${e.slug}/${q.slug}`,
  page: (p) => `/${p.slug}`,
};
