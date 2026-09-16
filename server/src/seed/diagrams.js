// Starter diagrams (SVG) used by the sample content. Admins can replace them from the Media Library.

export const triangleSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 480 320" width="480" height="320" role="img" aria-label="Triangle ABC with angle A 60 degrees and angle B 70 degrees">
  <rect width="480" height="320" fill="#ffffff"/>
  <polygon points="240,40 60,270 420,270" fill="#eef2ff" stroke="#1e1b4b" stroke-width="3" stroke-linejoin="round"/>
  <path d="M 222,63 A 30 30 0 0 0 258,63" fill="none" stroke="#b83a2e" stroke-width="3"/>
  <path d="M 100,270 A 40 40 0 0 0 85,238" fill="none" stroke="#b83a2e" stroke-width="3"/>
  <path d="M 378,238 A 40 40 0 0 0 362,270" fill="none" stroke="#4f46e5" stroke-width="3" stroke-dasharray="6 4"/>
  <text x="240" y="28" font-family="Inter, Arial, sans-serif" font-size="22" font-weight="700" text-anchor="middle" fill="#1e1b4b">A</text>
  <text x="42" y="292" font-family="Inter, Arial, sans-serif" font-size="22" font-weight="700" fill="#1e1b4b">B</text>
  <text x="426" y="292" font-family="Inter, Arial, sans-serif" font-size="22" font-weight="700" fill="#1e1b4b">C</text>
  <text x="240" y="98" font-family="Inter, Arial, sans-serif" font-size="18" text-anchor="middle" fill="#b83a2e">60°</text>
  <text x="118" y="252" font-family="Inter, Arial, sans-serif" font-size="18" fill="#b83a2e">70°</text>
  <text x="330" y="252" font-family="Inter, Arial, sans-serif" font-size="18" fill="#4f46e5">?</text>
</svg>`;

export const constructionSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 520 340" width="520" height="340" role="img" aria-label="Construction of a 60 degree angle at point A on ray AB">
  <rect width="520" height="340" fill="#ffffff"/>
  <line x1="60" y1="280" x2="480" y2="280" stroke="#1e1b4b" stroke-width="3" stroke-linecap="round"/>
  <polygon points="480,280 466,273 466,287" fill="#1e1b4b"/>
  <path d="M 260,280 A 200 200 0 0 0 160,106.8" fill="none" stroke="#94a3b8" stroke-width="2" stroke-dasharray="7 5"/>
  <path d="M 118.6,138.6 A 200 200 0 0 1 208.2,86.8" fill="none" stroke="#94a3b8" stroke-width="2" stroke-dasharray="7 5"/>
  <line x1="60" y1="280" x2="230" y2="-14.4" stroke="#b83a2e" stroke-width="3" stroke-linecap="round"/>
  <circle cx="60" cy="280" r="5" fill="#1e1b4b"/>
  <circle cx="260" cy="280" r="5" fill="#4f46e5"/>
  <circle cx="160" cy="106.8" r="5" fill="#4f46e5"/>
  <path d="M 110,280 A 50 50 0 0 0 85,236.7" fill="none" stroke="#b83a2e" stroke-width="3"/>
  <text x="40" y="305" font-family="Inter, Arial, sans-serif" font-size="22" font-weight="700" fill="#1e1b4b">A</text>
  <text x="468" y="310" font-family="Inter, Arial, sans-serif" font-size="22" font-weight="700" fill="#1e1b4b">B</text>
  <text x="262" y="305" font-family="Inter, Arial, sans-serif" font-size="20" font-weight="700" fill="#4f46e5">D</text>
  <text x="170" y="100" font-family="Inter, Arial, sans-serif" font-size="20" font-weight="700" fill="#4f46e5">E</text>
  <text x="196" y="44" font-family="Inter, Arial, sans-serif" font-size="22" font-weight="700" fill="#b83a2e">C</text>
  <text x="112" y="258" font-family="Inter, Arial, sans-serif" font-size="18" fill="#b83a2e">60°</text>
</svg>`;

export const apGraphSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 520 340" width="520" height="340" role="img" aria-label="Graph of the arithmetic progression a_n = 5n - 2">
  <rect width="520" height="340" fill="#ffffff"/>
  <g stroke="#e2e8f0" stroke-width="1">
    <line x1="60" y1="60" x2="490" y2="60"/><line x1="60" y1="120" x2="490" y2="120"/>
    <line x1="60" y1="180" x2="490" y2="180"/><line x1="60" y1="240" x2="490" y2="240"/>
  </g>
  <line x1="60" y1="300" x2="490" y2="300" stroke="#1e1b4b" stroke-width="2"/>
  <line x1="60" y1="300" x2="60" y2="30" stroke="#1e1b4b" stroke-width="2"/>
  <line x1="84" y1="288" x2="450" y2="48" stroke="#4f46e5" stroke-width="2" stroke-dasharray="6 5"/>
  <g fill="#b83a2e">
    <circle cx="84" cy="288" r="6"/><circle cx="130" cy="258" r="6"/><circle cx="176" cy="228" r="6"/>
    <circle cx="222" cy="198" r="6"/><circle cx="450" cy="48" r="7"/>
  </g>
  <g font-family="Inter, Arial, sans-serif" font-size="14" fill="#334155">
    <text x="78" y="320">1</text><text x="124" y="320">2</text><text x="170" y="320">3</text><text x="216" y="320">4</text>
    <text x="436" y="320">16</text><text x="478" y="322" font-weight="700">n</text>
    <text x="20" y="40" font-weight="700">aₙ</text>
    <text x="96" y="282">3</text><text x="142" y="252">8</text><text x="188" y="222">13</text><text x="234" y="192">18</text>
    <text x="392" y="42" font-weight="700" fill="#b83a2e">(16, 78)</text>
  </g>
</svg>`;
