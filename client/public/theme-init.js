// Applies the saved light/dark theme before React loads, so dark-mode readers never see a white flash.
// A separate file (not inline) keeps the Content-Security-Policy strict. Storage key must match src/lib/theme.jsx.
(function () {
  try {
    var theme = localStorage.getItem('pms-theme');
    var dark = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
    if (dark) {
      document.documentElement.classList.add('dark');
      document.documentElement.style.colorScheme = 'dark';
    }
  } catch (e) {
    /* storage unavailable */
  }
})();
