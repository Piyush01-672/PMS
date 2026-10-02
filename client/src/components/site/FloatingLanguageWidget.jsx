import { AnimatePresence, motion } from 'framer-motion';
import { Check, ChevronUp, Globe, Languages, Search, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useLang } from '@/lib/i18n';
import { cn } from '@/lib/utils';

export const ALL_LANGUAGES = [
  { code: 'hi', engName: 'Hindi', nativeName: 'हिन्दी' },
  { code: 'en', engName: 'English', nativeName: 'English' },
  { code: 'mixed', engName: 'Hinglish', nativeName: 'हिंग्लिश' },
  { code: 'sa', engName: 'Sanskrit', nativeName: 'संस्कृतम्' },
  { code: 'mr', engName: 'Marathi', nativeName: 'मराठी' },
  { code: 'bn', engName: 'Bengali', nativeName: 'বাংলা' },
  { code: 'gu', engName: 'Gujarati', nativeName: 'ગુજરાતી' },
  { code: 'te', engName: 'Telugu', nativeName: 'తెలుగు' },
  { code: 'ta', engName: 'Tamil', nativeName: 'தமிழ்' },
  { code: 'kn', engName: 'Kannada', nativeName: 'ಕನ್ನಡ' },
  { code: 'ml', engName: 'Malayalam', nativeName: 'മലയാളം' },
  { code: 'pa', engName: 'Punjabi', nativeName: 'ਪੰਜਾਬੀ' },
  { code: 'ur', engName: 'Urdu', nativeName: 'اردو' },
  { code: 'or', engName: 'Odia', nativeName: 'ଓଡ଼ିଆ' },
  { code: 'as', engName: 'Assamese', nativeName: 'অসমীয়া' },
];

function applyGoogleTranslate(code) {
  if (typeof window === 'undefined') return;

  const target = code === 'mixed' ? 'hi' : code;
  const domain = window.location.hostname;
  document.cookie = `googtrans=/auto/${target};path=/;domain=${domain}`;
  document.cookie = `googtrans=/auto/${target};path=/;`;

  // Look for google combo box and trigger change if loaded
  const combo = document.querySelector('.goog-te-combo');
  if (combo) {
    combo.value = target;
    combo.dispatchEvent(new Event('change'));
    return;
  }

  // Load Google Translate script dynamically if not present
  if (!window.google?.translate?.TranslateElement && !document.getElementById('google-translate-script')) {
    window.googleTranslateElementInit = () => {
      try {
        new window.google.translate.TranslateElement(
          { pageLanguage: 'auto', autoDisplay: false },
          'google_translate_hidden_holder',
        );
        setTimeout(() => {
          const cb = document.querySelector('.goog-te-combo');
          if (cb) {
            cb.value = target;
            cb.dispatchEvent(new Event('change'));
          }
        }, 400);
      } catch (e) {
        console.warn('Google Translate initialization:', e);
      }
    };

    const s = document.createElement('script');
    s.id = 'google-translate-script';
    s.src = '//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit';
    s.async = true;
    document.body.appendChild(s);
  }
}

export function FloatingLanguageWidget() {
  const { lang, setLang } = useLang();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [activeCode, setActiveCode] = useState(() => {
    try {
      return localStorage.getItem('pms-active-lang') || lang || 'hi';
    } catch {
      return lang || 'hi';
    }
  });

  const widgetRef = useRef(null);

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (widgetRef.current && !widgetRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    if (open) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  // Initial sync on mount if previously chosen
  useEffect(() => {
    try {
      const saved = localStorage.getItem('pms-active-lang');
      if (saved && saved !== 'hi') {
        applyGoogleTranslate(saved);
      }
    } catch {
      /* ignore */
    }
  }, []);

  const selectLanguage = (option) => {
    setActiveCode(option.code);
    try {
      localStorage.setItem('pms-active-lang', option.code);
    } catch {
      /* ignore */
    }

    // Sync with PMS internal bilingual framework
    if (option.code === 'hi' || option.code === 'en' || option.code === 'mixed') {
      setLang(option.code === 'mixed' ? 'hi' : option.code);
    }

    // Apply Google Translate for whole-page translation
    applyGoogleTranslate(option.code);
    setOpen(false);
  };

  const currentLang = ALL_LANGUAGES.find((l) => l.code === activeCode) || ALL_LANGUAGES[0];

  const filtered = ALL_LANGUAGES.filter(
    (l) =>
      l.engName.toLowerCase().includes(search.toLowerCase()) ||
      l.nativeName.toLowerCase().includes(search.toLowerCase()) ||
      l.code.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <>
      {/* Hidden container for Google translate element */}
      <div id="google_translate_hidden_holder" className="hidden pointer-events-none notranslate" translate="no" />

      {/* Floating Widget Container on Bottom-Left - notranslate ensures translation never alters this menu */}
      <div
        ref={widgetRef}
        className="notranslate fixed bottom-5 left-5 z-50 select-none"
        translate="no"
      >
        {/* Language Selection Popup (Opens Upwards) */}
        <AnimatePresence>
          {open && (
            <motion.div
              initial={{ opacity: 0, y: 12, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 12, scale: 0.95 }}
              transition={{ duration: 0.18, ease: 'easeOut' }}
              className="notranslate absolute bottom-14 left-0 w-72 sm:w-80 rounded-2xl border bg-card/95 p-3 shadow-2xl backdrop-blur-2xl ring-1 ring-black/5 dark:ring-white/10"
              translate="no"
            >
              {/* Header */}
              <div className="flex items-center justify-between border-b pb-2.5 px-1">
                <div className="flex items-center gap-2">
                  <Languages className="size-4 text-brand" />
                  <span className="text-xs font-extrabold text-foreground">Select Language / भाषा चुनें</span>
                </div>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="rounded-lg p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
                  aria-label="Close"
                >
                  <X className="size-4" />
                </button>
              </div>

              {/* Search Filter */}
              <div className="relative mt-2.5">
                <Search className="absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search language / खोजें…"
                  className="h-8 w-full rounded-xl border bg-background/60 pl-8 pr-3 text-xs outline-none focus:border-brand"
                />
              </div>

              {/* Languages List: Format "EnglishName (NativeName)" */}
              <div className="mt-2.5 max-h-60 overflow-y-auto space-y-1 pr-1 overscroll-contain">
                {filtered.map((opt) => {
                  const isSelected = activeCode === opt.code;
                  return (
                    <button
                      key={opt.code}
                      type="button"
                      onClick={() => selectLanguage(opt)}
                      className={cn(
                        'notranslate flex w-full items-center justify-between rounded-xl px-3 py-2 text-xs font-semibold transition-all text-left',
                        isSelected
                          ? 'bg-brand/15 text-brand ring-1 ring-brand/30'
                          : 'hover:bg-muted/80 text-foreground/85 hover:text-foreground',
                      )}
                      translate="no"
                    >
                      <span className="flex items-center gap-2">
                        <span className="grid size-6 shrink-0 place-items-center rounded-lg bg-brand/10 text-[10px] font-mono font-bold text-brand uppercase">
                          {opt.code}
                        </span>
                        <span className="font-bold text-foreground">{opt.engName}</span>
                        <span className="text-muted-foreground font-normal">({opt.nativeName})</span>
                      </span>
                      {isSelected && <Check className="size-4 text-brand shrink-0" />}
                    </button>
                  );
                })}
              </div>

              <div className="mt-2 border-t pt-2 text-[10px] text-muted-foreground text-center">
                Mathematics Solutions for Class 6 to 12
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Floating Pill Trigger Button: "EnglishName (NativeName)" */}
        <button
          type="button"
          onClick={() => setOpen((prev) => !prev)}
          className={cn(
            'notranslate group flex items-center gap-2 rounded-full border border-border/80 bg-card/95 px-3.5 py-2 shadow-lg backdrop-blur-xl transition-all duration-200 hover:border-brand/40 hover:bg-card hover:shadow-xl active:scale-95',
            open && 'ring-2 ring-brand/30 border-brand',
          )}
          aria-expanded={open}
          aria-label="Change Language"
          translate="no"
        >
          <span className="grid size-6 place-items-center rounded-full bg-brand/10 text-brand">
            <Globe className="size-3.5" />
          </span>
          <span className="text-xs font-bold text-foreground">
            {currentLang.engName} <span className="text-muted-foreground font-normal">({currentLang.nativeName})</span>
          </span>
          <ChevronUp
            className={cn('size-3.5 text-muted-foreground transition-transform duration-200', open && 'rotate-180 text-brand')}
          />
        </button>
      </div>
    </>
  );
}
