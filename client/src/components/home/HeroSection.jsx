import { ArrowRight, ChevronDown, Compass, Download, MessageSquare, Search, Sparkles } from 'lucide-react';
import { useRef, useState } from 'react';
import { useNavigate } from 'react-router';
import { Figure } from '@/components/content/Figure.jsx';
import { toViewerImage, useImageViewer } from '@/components/content/ImageViewer.jsx';
import { MathFormula } from '@/components/content/MathFormula.jsx';
import { YouTubeEmbed } from '@/components/content/YouTubeEmbed.jsx';
import { useL10n } from '@/lib/i18n';
import { gsap, prefersReducedMotion, useEntrance, useGSAP } from '@/lib/motion';
import { useTerm } from '@/lib/site';
import { cn } from '@/lib/utils';
import { SectionButtons } from './SectionShell.jsx';

const SYMBOLS = [
  { s: '∫', c: 'top-6 left-[6%] text-[7rem]' },
  { s: '∑', c: 'top-16 right-[8%] text-[6rem]' },
  { s: 'π', c: 'bottom-10 left-[20%] text-[6.5rem]' },
  { s: '√x', c: 'top-1/3 right-[30%] text-[4.5rem]' },
  { s: '△', c: 'bottom-6 right-[12%] text-[6rem]' },
  { s: 'x²', c: 'top-[45%] left-[3%] text-[5rem]' },
];

const MASCOT_URL =
  'https://lh3.googleusercontent.com/aida/AEtjO1XQRCWUvkyUbsExr3Aa08zRwfQSJKhHJUnJFhZGBlvfq4G8ZRZgR7kIFliWZbbAs71ADZrFOu9AqMPfTI3xnz4XI70Pg33hEhw2YYNqY_uX0PCnc0HwP_lw1CHPv-GOklYYFnB8aPkXpHZL_vf_l8g8vKHmO4afmGhQKVvXs4sa78ROOoS4UEaRgUAuIyyPSV9fdWD25DsIXIwugspQYThVgxot0GkyvuXW_RDo19q85oCb7UrZc4xIvxs2';

const KNOWLEDGE_BASE = {
  euclid: {
    question: 'यूक्लिड की 5वीं अभिधारणा (Postulate 5) को याद रखने का सबसे आसान तरीका क्या है?',
    trick: 'कम कोण = मिलन रेखाएँ',
    explanation: 'यदि तिर्यक रेखा के एक ही ओर के आंतरिक कोणों का योग 180° (दो समकोण) से कम है:',
    latex: '\\angle 1 + \\angle 2 < 180^\\circ \\implies l \\text{ तथा } m \\text{ प्रतिच्छेद करेंगी}',
  },
  pythagoras: {
    question: 'पाइथागोरस प्रमेय (Pythagoras Theorem) का मूल सूत्र क्या है?',
    trick: 'कर्ण का वर्ग = लम्ब² + आधार²',
    explanation: 'किसी समकोण त्रिभुज में सबसे बड़ी भुजा (कर्ण) का वर्ग शेष दो भुजाओं के वर्गों के योग के बराबर होता है:',
    latex: 'c^2 = a^2 + b^2 \\implies \\text{कर्ण} = \\sqrt{\\text{लम्ब}^2 + \\text{आधार}^2}',
  },
  trigo: {
    question: 'त्रिकोणमिति की सबसे प्रमुख सर्वसमिका (Identity) क्या है?',
    trick: 'sin² + cos² = 1',
    explanation: 'प्रत्येक कोण θ के लिए साइन और कोसाइन के वर्गों का योग सदैव 1 होता है:',
    latex: '\\sin^2\\theta + \\cos^2\\theta = 1 \\quad \\text{तथा} \\quad 1 + \\tan^2\\theta = \\sec^2\\theta',
  },
  calculus: {
    question: 'कक्षा 12 समाकलन का बुनियादी घात नियम क्या है?',
    trick: 'घात में 1 जोड़ें और उसी से भाग दें',
    explanation: 'किसी भी चर x की घात n का अनिश्चित समाकलन इस प्रकार किया जाता है (जहाँ n ≠ -1):',
    latex: '\\int x^n\\, dx = \\frac{x^{n+1}}{n+1} + C \\quad (n \\neq -1)',
  },
};

export function HeroSection({ section }) {
  const ref = useRef(null);
  const t = useL10n();
  const term = useTerm();
  const navigate = useNavigate();
  const { openViewer } = useImageViewer();
  const [query, setQuery] = useState('');
  const [botPrompt, setBotPrompt] = useState('');
  const [activeBotKey, setActiveBotKey] = useState('euclid');
  const [customBotChat, setCustomBotChat] = useState(null);
  const [activeTab, setActiveTab] = useState('ai'); // 'ai' | 'media'

  const cfg = section.config || {};
  const hasMedia = Boolean(section.image?.url || section.video?.youtubeId);

  useEntrance(ref, [section._id]);
  useGSAP(
    () => {
      if (prefersReducedMotion()) return;
      gsap.utils.toArray('[data-float]', ref.current).forEach((el, i) => {
        gsap.to(el, { y: i % 2 ? 14 : -14, rotate: i % 2 ? 4 : -4, duration: 5 + i, repeat: -1, yoyo: true, ease: 'sine.inOut' });
      });
    },
    { scope: ref },
  );

  const submit = (event) => {
    event?.preventDefault();
    if (query.trim()) navigate(`/search?q=${encodeURIComponent(query.trim())}`);
  };

  const handleBotSubmit = (e) => {
    e?.preventDefault();
    const clean = botPrompt.trim();
    if (!clean) return;

    const lower = clean.toLowerCase();
    if (lower.includes('पाइथागोरस') || lower.includes('pythagoras') || lower.includes('कर्ण')) {
      setActiveBotKey('pythagoras');
      setCustomBotChat(null);
    } else if (lower.includes('त्रिकोणमिति') || lower.includes('trigo') || lower.includes('sin') || lower.includes('cos')) {
      setActiveBotKey('trigo');
      setCustomBotChat(null);
    } else if (lower.includes('समाकलन') || lower.includes('कलन') || lower.includes('integral') || lower.includes('dx')) {
      setActiveBotKey('calculus');
      setCustomBotChat(null);
    } else if (lower.includes('यूक्लिड') || lower.includes('euclid') || lower.includes('अभिधारणा') || lower.includes('postulate')) {
      setActiveBotKey('euclid');
      setCustomBotChat(null);
    } else {
      setCustomBotChat({
        question: clean,
        trick: 'NCERT त्वरित हल',
        explanation: 'आपके पूछे गए प्रश्न का संपूर्ण चरणबद्ध हल एवं संबंधित प्रमेय NCERT डेटाबेस में उपलब्ध है:',
        latex: `\\text{खोजें: } \\text{"${clean.slice(0, 30)}"} \\implies \\text{सत्यापित हल}`,
        targetQuery: clean,
      });
    }
    setBotPrompt('');
  };

  const currentChat = customBotChat || KNOWLEDGE_BASE[activeBotKey] || KNOWLEDGE_BASE.euclid;

  // Rich copy defaults matching template
  const defaultTitle = 'कक्षा 6 से 12 तक NCERT गणित का';
  const defaultHighlight = 'सबसे सरल, सटीक';
  const defaultSuffix = 'एवं सम्पूर्ण समाधान';
  const isDefaultSeedTitle = !section.title || t(section.title) === 'NCERT गणित हल' || t(section.title) === 'NCERT Mathematics Solutions';
  const titleText = isDefaultSeedTitle ? defaultTitle : t(section.title);
  const highlightText = isDefaultSeedTitle ? defaultHighlight : (t(section.highlight) || defaultHighlight);
  const suffixText = isDefaultSeedTitle ? defaultSuffix : (t(section.suffix) || '');

  const defaultDescription =
    'प्रश्नावली (Exercise) अनुसार चरणबद्ध हल, जीवंत ज्यामितीय आरेख, LaTeX सूत्र और आपके साथ 24x7 AI गणित मित्र। हर एक प्रमेय और उपपत्ति की संपूर्ण वैज्ञानिक व्याख्या।';
  const isDefaultSeedDesc =
    !section.description || (typeof section.description === 'object' && t(section.description)?.includes('Class 6 to 12 Mathematics'));
  const descriptionText = isDefaultSeedDesc ? defaultDescription : t(section.description);

  const defaultPopularTags = [
    { label: 'प्रश्नावली 5.2 यूक्लिड', query: 'प्रश्नावली 5.2 यूक्लिड' },
    { label: 'त्रिकोणमिति कक्षा 10', query: 'त्रिकोणमिति कक्षा 10' },
    { label: 'पाइथागोरस प्रमेय', query: 'पाइथागोरस प्रमेय' },
    { label: 'समाकलन Class 12', query: 'समाकलन Class 12' },
  ];
  const popularTags =
    cfg.popularSearches && cfg.popularSearches.length > 0
      ? cfg.popularSearches.map((p) => ({ label: t(p.label) || p.query, query: p.query }))
      : defaultPopularTags;

  return (
    <section
      ref={ref}
      id={section.name || section._id || 'hero'}
      className="relative pt-6 sm:pt-8 pb-16 overflow-hidden grid-pattern border-b border-slate-200 dark:border-slate-800 bg-[#f8fafc] dark:bg-background"
    >
      {/* Background Math Atmosphere & Floating Glyphs */}
      <div className="pointer-events-none absolute inset-0 -z-10 select-none overflow-hidden" aria-hidden="true">
        {SYMBOLS.map(({ s, c }) => (
          <span key={s} data-float className={cn('absolute font-heading font-bold text-brand/[0.06] dark:text-white/[0.05]', c)}>
            {s}
          </span>
        ))}
        <div className="absolute top-10 left-1/2 h-72 w-[42rem] max-w-full -translate-x-1/2 rounded-full bg-amber-500/10 blur-3xl" />
      </div>

      {/* Reserved Sponsored / Announcement Strip */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-6 sm:mb-8" data-purpose="ad-slot-reserved-top">
        <div className="w-full bg-slate-100/90 dark:bg-card/90 border border-dashed border-slate-300 dark:border-border rounded-lg py-2.5 px-4 text-center flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-500 dark:text-slate-400">
          <div className="flex items-center gap-2">
            <span className="bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 text-[10px] font-bold px-1.5 py-0.5 rounded border border-amber-200 dark:border-amber-800">
              प्रायोजित संसाधन
            </span>
            <span className="font-medium text-slate-700 dark:text-slate-200">
              🎯 IIT-JEE फाउंडेशन &amp; NTSE 2025: गणित टेस्ट सीरीज लाइव उपलब्ध
            </span>
          </div>
          <a
            className="text-brand-600 dark:text-brand-400 font-bold hover:underline inline-flex items-center gap-1"
            href="#classes"
          >
            अन्वेषण करें →
          </a>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          {/* Left Column: Value Proposition and Action Trigger */}
          <div className="lg:col-span-7 flex flex-col items-start text-left">
            {/* Badge */}
            <div
              data-enter
              className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-50 dark:bg-brand-soft/80 border border-brand-200 dark:border-brand-500/30 text-brand-700 dark:text-brand-300 text-xs font-semibold mb-4 shadow-2xs"
              data-purpose="hero-badge"
            >
              <span className="w-2 h-2 rounded-full bg-brand-500 animate-pulse" />
              <span>{t(section.badge) || 'NCERT 2024-25 नवीन पाठ्यक्रम • 100% निःशुल्क सम्पूर्ण हल'}</span>
            </div>

            {/* Main Headline */}
            <h1
              data-enter
              className="heading-font text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-900 dark:text-foreground tracking-tight leading-[1.2] mb-4"
            >
              {titleText}{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-600 via-brand-500 to-amber-500 dark:from-brand-400 dark:via-brand-300 dark:to-amber-300">
                {highlightText}
              </span>{' '}
              {suffixText}
            </h1>

            {/* Subheading */}
            <p data-enter className="text-slate-600 dark:text-muted-foreground text-base sm:text-lg leading-relaxed mb-6 font-normal">
              {descriptionText}
            </p>

            {/* Interactive Large Hero Search Box */}
            {cfg.showSearch !== false && (
              <div
                data-enter
                className="w-full bg-white dark:bg-card p-2 sm:p-2.5 rounded-xl border border-slate-300 dark:border-border shadow-card mb-4"
                data-purpose="hero-search-container"
              >
                <form onSubmit={submit} className="flex flex-col sm:flex-row gap-2" role="search">
                  <div className="relative flex-1">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <Search className="w-5 h-5 text-brand-500" aria-hidden="true" />
                    </div>
                    <input
                      type="search"
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      placeholder={t(cfg.searchPlaceholder) || "सीधे खोजें: जैसे 'प्रश्नावली 5.2', 'कक्षा 10 त्रिकोणमिति', 'पाइथागोरस प्रमेय'..."}
                      className="w-full pl-10 pr-3 py-2.5 text-sm bg-transparent border-0 text-slate-800 dark:text-foreground placeholder-slate-400 dark:placeholder-slate-500 focus:ring-0 focus:outline-none"
                    />
                  </div>
                  <button
                    type="submit"
                    className="bg-brand-500 hover:bg-brand-600 text-white font-bold text-sm px-6 py-2.5 rounded-lg shadow-sm flex items-center justify-center gap-2 transition-transform active:scale-95 cursor-pointer"
                  >
                    <span>{t(cfg.searchButtonLabel) || 'हल खोजें'}</span>
                    <ArrowRight className="w-4 h-4" aria-hidden="true" />
                  </button>
                </form>
              </div>
            )}

            {/* Quick Search Topic Tags */}
            <div data-enter className="flex flex-wrap items-center gap-1.5 text-xs text-slate-500 dark:text-muted-foreground mb-8" data-purpose="quick-search-tags">
              <span className="font-semibold text-slate-700 dark:text-foreground">{t(cfg.popularLabel) || 'लोकप्रिय खोजें:'}</span>
              {popularTags.map((tag) => (
                <button
                  key={tag.query}
                  type="button"
                  onClick={() => navigate(`/search?q=${encodeURIComponent(tag.query)}`)}
                  className="bg-white dark:bg-card border border-slate-200 dark:border-border hover:border-brand-400 dark:hover:border-brand-500 px-2.5 py-1 rounded-md text-slate-600 dark:text-foreground/80 hover:text-brand-600 dark:hover:text-brand-400 transition-colors cursor-pointer text-xs"
                >
                  {tag.label}
                </button>
              ))}
            </div>

            {/* Hero Action Buttons */}
            <div data-enter className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
              <a
                href="#classes"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-brand-500 hover:bg-brand-600 text-white font-bold px-6 py-3 rounded-lg text-sm shadow-md shadow-brand-500/25 transition-all active:scale-95 cursor-pointer"
              >
                <span>कक्षा चुनें और पढ़ना शुरू करें</span>
                <ChevronDown className="w-4 h-4" />
              </a>
              <button
                type="button"
                onClick={() => navigate('/search?q=' + encodeURIComponent('सूत्र बैंक'))}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-white dark:bg-card hover:bg-slate-50 dark:hover:bg-accent text-slate-700 dark:text-foreground border border-slate-300 dark:border-border font-semibold px-5 py-3 rounded-lg text-sm shadow-2xs hover:border-slate-400 transition-all active:scale-95 cursor-pointer"
              >
                <Download className="w-4 h-4 text-brand-500" />
                <span>NCERT सूत्र बैंक डाउनलोड करें (PDF)</span>
              </button>
              {section.buttons?.length > 0 && (
                <SectionButtons buttons={section.buttons} className="w-full sm:w-auto" />
              )}
            </div>
          </div>

          {/* Right Column: Interactive AI Tutor Companion & Geometry Showcase */}
          <div data-enter className="lg:col-span-5" data-purpose="hero-visual-card">
            <div className="relative mx-auto max-w-md lg:max-w-none">
              {/* Media Switcher Tab if Admin uploaded Media */}
              {hasMedia && (
                <div className="mb-2 flex items-center justify-end gap-1.5 text-xs font-semibold">
                  <button
                    type="button"
                    onClick={() => setActiveTab('ai')}
                    className={cn(
                      'px-3 py-1 rounded-full border transition-all cursor-pointer',
                      activeTab === 'ai'
                        ? 'bg-brand-500 text-white border-brand-500 shadow-xs'
                        : 'bg-white dark:bg-card text-slate-600 dark:text-slate-300 border-slate-200 dark:border-border hover:border-brand-300',
                    )}
                  >
                    ✨ AI गणित मित्र
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab('media')}
                    className={cn(
                      'px-3 py-1 rounded-full border transition-all cursor-pointer',
                      activeTab === 'media'
                        ? 'bg-brand-500 text-white border-brand-500 shadow-xs'
                        : 'bg-white dark:bg-card text-slate-600 dark:text-slate-300 border-slate-200 dark:border-border hover:border-brand-300',
                    )}
                  >
                    📹 मीडिया/वीडियो
                  </button>
                </div>
              )}

              {activeTab === 'media' && hasMedia ? (
                <div className="relative bg-white dark:bg-card border border-slate-200 dark:border-border rounded-2xl shadow-card p-4 overflow-hidden">
                  {section.video?.youtubeId ? (
                    <YouTubeEmbed video={section.video} />
                  ) : (
                    <Figure
                      media={section.image}
                      alt={t(section.image?.alt) || t(section.title)}
                      priority
                      onOpen={() => openViewer([toViewerImage(section.image, { alt: t(section.image?.alt) })])}
                    />
                  )}
                </div>
              ) : (
                <>
                  {/* Glow background effect */}
                  <div className="absolute -inset-1.5 bg-gradient-to-r from-brand-500/20 to-amber-500/20 rounded-2xl blur-lg pointer-events-none" />

                  {/* Card Container */}
                  <div className="relative bg-white dark:bg-card border border-slate-200 dark:border-border rounded-2xl shadow-card overflow-hidden">
                    {/* Card Header */}
                    <div className="bg-gradient-to-r from-slate-900 to-slate-850 px-5 py-3.5 text-white flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="relative shrink-0">
                          <img
                            alt="AI Ganit Mitra 3D Mascot"
                            className="w-9 h-9 rounded-full object-cover border border-amber-400/50 shadow"
                            src={MASCOT_URL}
                            onError={(e) => {
                              e.currentTarget.style.display = 'none';
                            }}
                          />
                          <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-400 border-2 border-slate-900 rounded-full" />
                        </div>
                        <div>
                          <h3 className="text-sm font-bold flex items-center gap-1.5 text-white">
                            AI गणित मित्र
                            <span className="bg-brand-500/30 text-amber-300 text-[10px] px-1.5 py-0.5 rounded border border-brand-500/40">
                              24x7 सक्रिय
                            </span>
                          </h3>
                          <p className="text-[11px] text-slate-300">NCERT स्मार्ट समाधान बॉट (गणित गुरु)</p>
                        </div>
                      </div>
                      <span className="text-[11px] font-mono text-amber-300 bg-amber-950/60 border border-amber-500/30 px-2 py-0.5 rounded">
                        KaTeX 0.16.8
                      </span>
                    </div>

                    {/* Card Body: Interactive Dialogue Preview */}
                    <div className="p-5 space-y-4">
                      {/* Chat Bubble 1 (User) */}
                      <div className="flex items-start gap-2.5 justify-end">
                        <div className="bg-brand-50 dark:bg-brand-soft/70 border border-brand-200 dark:border-brand/30 text-brand-950 dark:text-foreground text-xs rounded-2xl rounded-tr-none px-3.5 py-2 max-w-[85%] font-medium">
                          "{currentChat.question}"
                        </div>
                        <div className="w-6 h-6 rounded-full bg-slate-200 dark:bg-muted flex items-center justify-center text-[10px] font-bold text-slate-600 dark:text-muted-foreground shrink-0">
                          छात्र
                        </div>
                      </div>

                      {/* Chat Bubble 2 (AI Bot Response) */}
                      <div className="flex items-start gap-2.5">
                        <div className="w-7 h-7 rounded-full overflow-hidden shrink-0 border border-brand-300 bg-slate-900 flex items-center justify-center">
                          <img
                            alt="Bot Avatar"
                            className="w-full h-full object-cover"
                            src={MASCOT_URL}
                            onError={(e) => {
                              e.currentTarget.style.display = 'none';
                            }}
                          />
                        </div>
                        <div className="bg-slate-50 dark:bg-muted/40 border border-slate-200 dark:border-border text-slate-800 dark:text-foreground text-xs rounded-2xl rounded-tl-none p-3 space-y-2 max-w-[90%]">
                          <p className="font-medium text-slate-900 dark:text-foreground">
                            याद रखें यह गोल्डन ट्रिक:{' '}
                            <span className="bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 font-bold px-1.5 py-0.5 rounded">
                              "{currentChat.trick}"
                            </span>
                          </p>
                          <p className="text-slate-600 dark:text-muted-foreground text-[11px] leading-relaxed">
                            {currentChat.explanation}
                          </p>
                          {/* LaTeX Inline Visual Box */}
                          <div className="bg-white dark:bg-card border border-slate-200 dark:border-border rounded p-2 text-center text-xs font-mono text-slate-900 dark:text-foreground shadow-2xs">
                            <MathFormula latex={currentChat.latex} display={true} />
                          </div>

                          {currentChat.targetQuery && (
                            <button
                              type="button"
                              onClick={() => navigate(`/search?q=${encodeURIComponent(currentChat.targetQuery)}`)}
                              className="inline-flex items-center gap-1.5 text-[11px] font-bold text-brand-600 dark:text-brand-400 hover:underline pt-1 cursor-pointer"
                            >
                              👉 इस प्रश्न का विस्तृत हल देखें
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Interactive Mini Geometry Sketch / Canvas Replica */}
                      <div className="border border-slate-200 dark:border-border rounded-xl p-3 bg-white dark:bg-card">
                        <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-muted-foreground mb-2">
                          <span className="font-bold text-slate-700 dark:text-foreground flex items-center gap-1">
                            <Compass className="w-3.5 h-3.5 text-brand-500" />
                            लाइव ज्यामितीय आरेख सिमुलेशन
                          </span>
                          <span className="text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-1.5 py-0.5 rounded text-[10px] font-bold">
                            • इंटरैक्टिव 2D
                          </span>
                        </div>
                        {/* Geometric SVG Representation */}
                        <div className="w-full h-32 bg-slate-50 dark:bg-slate-900/50 rounded-lg border border-slate-100 dark:border-slate-800 flex items-center justify-center relative overflow-hidden">
                          <svg className="w-full h-full" viewBox="0 0 360 120">
                            {/* Line l */}
                            <line stroke="#0284c7" strokeLinecap="round" strokeWidth="2.5" x1="40" x2="310" y1="35" y2="60" />
                            <text fill="#0284c7" fontSize="11" fontWeight="bold" x="25" y="38">
                              l
                            </text>
                            {/* Line m */}
                            <line stroke="#0284c7" strokeLinecap="round" strokeWidth="2.5" x1="40" x2="310" y1="100" y2="70" />
                            <text fill="#0284c7" fontSize="11" fontWeight="bold" x="25" y="103">
                              m
                            </text>
                            {/* Transversal Line n */}
                            <line stroke="#ea580c" strokeDasharray="4" strokeLinecap="round" strokeWidth="2.5" x1="120" x2="160" y1="10" y2="115" />
                            <text fill="#ea580c" fontSize="11" fontWeight="bold" x="110" y="20">
                              n (तिर्यक)
                            </text>
                            {/* Intersection Point on Right */}
                            <circle cx="345" cy="65" fill="#dc2626" r="4" />
                            <text fill="#dc2626" fontSize="9" fontWeight="bold" x="305" y="85">
                              प्रतिच्छेद बिंदु
                            </text>
                            {/* Angle arc and markers */}
                            <path d="M 145,55 A 15 15 0 0 1 155,50" fill="none" stroke="#ff7a00" strokeWidth="2" />
                            <text fill="#ff7a00" fontSize="9" fontWeight="bold" x="160" y="52">
                              ∠1 + ∠2 &lt; 180°
                            </text>
                          </svg>
                        </div>
                      </div>

                      {/* Bot Interactive Prompt Bar */}
                      <form onSubmit={handleBotSubmit} className="relative">
                        <input
                          value={botPrompt}
                          onChange={(e) => setBotPrompt(e.target.value)}
                          placeholder="AI गणित मित्र से कोई भी सवाल पूछें (जैसे 'पाइथागोरस', 'त्रिकोणमिति')..."
                          className="w-full pl-3 pr-20 py-2 bg-slate-50 dark:bg-muted/40 border border-slate-200 dark:border-border rounded-lg text-xs text-slate-800 dark:text-foreground focus:ring-1 focus:ring-brand-500 focus:outline-none"
                          type="text"
                        />
                        <button
                          type="submit"
                          className="absolute right-1 top-1 bottom-1 bg-brand-500 hover:bg-brand-600 text-white px-3 rounded text-xs font-bold transition-colors cursor-pointer"
                        >
                          पूछें
                        </button>
                      </form>
                    </div>

                    {/* Card Footer / Status */}
                    <div className="bg-slate-50 dark:bg-muted/30 px-5 py-2.5 border-t border-slate-200 dark:border-border flex items-center justify-between text-[11px] text-slate-500 dark:text-muted-foreground">
                      <span className="flex items-center gap-1 text-emerald-700 dark:text-emerald-400 font-medium">
                        <svg className="w-3.5 h-3.5 text-emerald-500" fill="currentColor" viewBox="0 0 20 20">
                          <path
                            clipRule="evenodd"
                            d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                            fillRule="evenodd"
                          />
                        </svg>
                        100% NCERT पाठ्यपुस्तक अनुसार सत्यापित
                      </span>
                      <button
                        type="button"
                        onClick={() => navigate('/search?q=' + encodeURIComponent('AI गणित मित्र'))}
                        className="text-brand-600 dark:text-brand-400 font-bold hover:underline cursor-pointer"
                      >
                        विस्तृत बॉट खोलें →
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
