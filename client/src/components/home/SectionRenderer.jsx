import { ClassGridSection } from './ClassGridSection.jsx';
import { HeroSection } from './HeroSection.jsx';
import {
  CardGridSection,
  ChapterGridSection,
  CtaSection,
  FaqSection,
  ImageGallerySection,
  NotesSection,
  QuestionListSection,
  RelatedLinksSection,
  StatisticsSection,
  StepsSection,
  TextSection,
  VideoSection,
} from './Sections.jsx';

// Section type (stored in the database) → React component. New section types only need a new entry here.
const COMPONENTS = {
  hero: HeroSection,
  statistics: StatisticsSection,
  classGrid: ClassGridSection,
  steps: StepsSection,
  chapterGrid: ChapterGridSection,
  cardGrid: CardGridSection,
  questionList: QuestionListSection,
  notes: NotesSection,
  videoSection: VideoSection,
  imageGallery: ImageGallerySection,
  cta: CtaSection,
  faq: FaqSection,
  text: TextSection,
  custom: TextSection,
  relatedContent: RelatedLinksSection,
};

export function SectionRenderer({ sections }) {
  return sections.map((section) => {
    const Component = COMPONENTS[section.type];
    return Component ? <Component key={section._id} section={section} /> : null;
  });
}
