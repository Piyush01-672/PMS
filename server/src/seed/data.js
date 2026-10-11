// Starter content based on the 2024-25 rationalised NCERT syllabus.
// Everything here is ordinary database content — the owner can edit or delete all of it from the Admin Panel.

const p = (hi, en) => ({ hi: hi ? `<p>${hi}</p>` : '', en: en ? `<p>${en}</p>` : '' });

export const classes = [
  {
    number: 12,
    name: { hi: 'कक्षा 12 गणित', en: 'Class 12 Mathematics' },
    badge: { hi: 'बोर्ड परीक्षा', en: 'Senior Secondary Board' },
    description: {
      hi: 'संबंध एवं फलन, आव्यूह, सारणिक, कलन, सदिश, त्रिविमीय ज्यामिति, रैखिक प्रोग्रामन और प्रायिकता।',
      en: 'Relations & Functions, Matrices, Determinants, Calculus, Vectors, 3D Geometry, Linear Programming and Probability.',
    },
    featured: true,
    sortOrder: 1,
  },
  {
    number: 11,
    name: { hi: 'कक्षा 11 गणित', en: 'Class 11 Mathematics' },
    badge: { hi: 'फाउंडेशन + JEE', en: 'Foundation + JEE' },
    description: {
      hi: 'समुच्चय, संबंध एवं फलन, त्रिकोणमितीय फलन, क्रमचय-संचय, द्विपद प्रमेय, शंकु परिच्छेद और सीमा।',
      en: 'Sets, Relations, Trigonometric Functions, Permutations, Binomial Theorem, Conic Sections and Limits.',
    },
    sortOrder: 2,
  },
  {
    number: 10,
    name: { hi: 'कक्षा 10 गणित', en: 'Class 10 Mathematics' },
    badge: { hi: 'बोर्ड परीक्षा स्पेशल', en: 'CBSE Board Exam Special' },
    description: {
      hi: 'वास्तविक संख्याएँ, बहुपद, द्विघात समीकरण, समांतर श्रेढ़ियाँ, त्रिकोणमिति, सांख्यिकी एवं प्रायिकता।',
      en: 'Real Numbers, Polynomials, Quadratic Equations, Arithmetic Progressions, Trigonometry, Statistics & Probability.',
    },
    featured: true,
    sortOrder: 3,
  },
  {
    number: 9,
    name: { hi: 'कक्षा 9 गणित', en: 'Class 9 Mathematics' },
    badge: { hi: 'हाई स्कूल', en: 'High School' },
    description: {
      hi: 'संख्या पद्धति, बहुपद, निर्देशांक ज्यामिति, रेखाएँ और कोण, त्रिभुज, वृत्त और हीरोन का सूत्र।',
      en: "Number Systems, Polynomials, Coordinate Geometry, Lines & Angles, Triangles, Circles and Heron's Formula.",
    },
    sortOrder: 4,
  },
  {
    number: 8,
    name: { hi: 'कक्षा 8 गणित', en: 'Class 8 Mathematics' },
    badge: { hi: 'मिडिल स्कूल', en: 'Middle School' },
    description: { hi: 'कक्षा 8 गणित के अध्याय-wise हल जल्द उपलब्ध होंगे।', en: 'अध्याय-wise Class 8 Maths solutions are being added.' },
    sortOrder: 5,
  },
  {
    number: 7,
    name: { hi: 'कक्षा 7 गणित', en: 'Class 7 Mathematics' },
    badge: { hi: 'फाउंडेशन', en: 'Foundation' },
    description: { hi: 'कक्षा 7 गणित के अध्याय-wise हल जल्द उपलब्ध होंगे।', en: 'अध्याय-wise Class 7 Maths solutions are being added.' },
    sortOrder: 6,
  },
  {
    number: 6,
    name: { hi: 'कक्षा 6 गणित', en: 'Class 6 Mathematics' },
    badge: { hi: 'फाउंडेशन', en: 'Foundation' },
    description: { hi: 'कक्षा 6 गणित के अध्याय-wise हल जल्द उपलब्ध होंगे।', en: 'अध्याय-wise Class 6 Maths solutions are being added.' },
    sortOrder: 7,
  },
];

// [number, hindi, english]
export const chapters = {
  9: [
    [1, 'संख्या पद्धति', 'Number Systems'],
    [2, 'बहुपद', 'Polynomials'],
    [3, 'निर्देशांक ज्यामिति', 'Coordinate Geometry'],
    [4, 'दो चर वाले रैखिक समीकरण', 'Linear Equations in Two Variables'],
    [5, 'यूक्लिड की ज्यामिति का परिचय', "Introduction to Euclid's Geometry"],
    [6, 'रेखाएँ और कोण', 'Lines and Angles'],
    [7, 'त्रिभुज', 'Triangles'],
    [8, 'चतुर्भुज', 'Quadrilaterals'],
    [9, 'वृत्त', 'Circles'],
    [10, 'हीरोन का सूत्र', "Heron's Formula"],
    [11, 'पृष्ठीय क्षेत्रफल और आयतन', 'Surface Areas and Volumes'],
    [12, 'सांख्यिकी', 'Statistics'],
  ],
  10: [
    [1, 'वास्तविक संख्याएँ', 'Real Numbers'],
    [2, 'बहुपद', 'Polynomials'],
    [3, 'दो चर वाले रैखिक समीकरण युग्म', 'Pair of Linear Equations in Two Variables'],
    [4, 'द्विघात समीकरण', 'Quadratic Equations'],
    [5, 'समांतर श्रेढ़ियाँ', 'Arithmetic Progressions'],
    [6, 'त्रिभुज', 'Triangles'],
    [7, 'निर्देशांक ज्यामिति', 'Coordinate Geometry'],
    [8, 'त्रिकोणमिति का परिचय', 'Introduction to Trigonometry'],
    [9, 'त्रिकोणमिति के कुछ अनुप्रयोग', 'Some Applications of Trigonometry'],
    [10, 'वृत्त', 'Circles'],
    [11, 'वृत्तों से संबंधित क्षेत्रफल', 'Areas Related to Circles'],
    [12, 'पृष्ठीय क्षेत्रफल और आयतन', 'Surface Areas and Volumes'],
    [13, 'सांख्यिकी', 'Statistics'],
    [14, 'प्रायिकता', 'Probability'],
  ],
  11: [
    [1, 'समुच्चय', 'Sets'],
    [2, 'संबंध एवं फलन', 'Relations and Functions'],
    [3, 'त्रिकोणमितीय फलन', 'Trigonometric Functions'],
    [4, 'सम्मिश्र संख्याएँ और द्विघातीय समीकरण', 'Complex Numbers and Quadratic Equations'],
    [5, 'रैखिक असमिकाएँ', 'Linear Inequalities'],
    [6, 'क्रमचय और संचय', 'Permutations and Combinations'],
    [7, 'द्विपद प्रमेय', 'Binomial Theorem'],
    [8, 'अनुक्रम तथा श्रेणी', 'Sequences and Series'],
    [9, 'सरल रेखाएँ', 'Straight Lines'],
    [10, 'शंकु परिच्छेद', 'Conic Sections'],
    [11, 'त्रिविमीय ज्यामिति का परिचय', 'Introduction to Three Dimensional Geometry'],
    [12, 'सीमा और अवकलज', 'Limits and Derivatives'],
    [13, 'सांख्यिकी', 'Statistics'],
    [14, 'प्रायिकता', 'Probability'],
  ],
  12: [
    [1, 'संबंध एवं फलन', 'Relations and Functions'],
    [2, 'प्रतिलोम त्रिकोणमितीय फलन', 'Inverse Trigonometric Functions'],
    [3, 'आव्यूह', 'Matrices'],
    [4, 'सारणिक', 'Determinants'],
    [5, 'सांतत्य तथा अवकलनीयता', 'Continuity and Differentiability'],
    [6, 'अवकलज के अनुप्रयोग', 'Application of Derivatives'],
    [7, 'समाकलन', 'Integrals'],
    [8, 'समाकलनों के अनुप्रयोग', 'Application of Integrals'],
    [9, 'अवकल समीकरण', 'Differential Equations'],
    [10, 'सदिश बीजगणित', 'Vector Algebra'],
    [11, 'त्रि-विमीय ज्यामिति', 'Three Dimensional Geometry'],
    [12, 'रैखिक प्रोग्रामन', 'Linear Programming'],
    [13, 'प्रायिकता', 'Probability'],
  ],
};

export const chapterExtras = {
  '10-5': {
    featured: true,
    shortDescription: {
      hi: 'समांतर श्रेढ़ी का n वाँ पद और पहले n पदों का योग – सूत्र, उदाहरण और प्रश्नावली-wise हल।',
      en: 'nth term and sum of first n terms of an AP — formulas, examples and प्रश्नावली-wise solutions.',
    },
    introduction: p(
      'ऐसी सूची जिसमें प्रत्येक पद (पहले पद को छोड़कर) पिछले पद में एक निश्चित संख्या $d$ जोड़ने पर प्राप्त होता है, <strong>समांतर श्रेढ़ी (AP)</strong> कहलाती है। $d$ को <em>सार्व अंतर</em> कहते हैं।',
      'A list of numbers in which each term (except the first) is obtained by adding a fixed number $d$ to the previous term is called an <strong>Arithmetic Progression (AP)</strong>. $d$ is the <em>common difference</em>.',
    ),
    formulas: [
      { title: { hi: 'n वाँ पद', en: 'nth term' }, latex: 'a_n = a + (n-1)d' },
      { title: { hi: 'पहले n पदों का योग', en: 'Sum of first n terms' }, latex: 'S_n = \\frac{n}{2}\\left[2a + (n-1)d\\right]' },
      { title: { hi: 'अंतिम पद l ज्ञात हो तो योग', en: 'Sum when last term l is known' }, latex: 'S_n = \\frac{n}{2}\\,(a + l)' },
    ],
    exercises: [
      { number: '5.1', title: { hi: 'AP की पहचान और सार्व अंतर', en: 'Identifying an AP and its common difference' } },
      { number: '5.2', title: { hi: 'AP का n वाँ पद', en: 'nth term of an AP' } },
      { number: '5.3', title: { hi: 'AP के पहले n पदों का योग', en: 'Sum of first n terms of an AP' } },
    ],
  },
  '9-5': {
    featured: true,
    shortDescription: {
      hi: 'यूक्लिड की परिभाषाएँ, अभिगृहीत और अभिधारणाएँ – सरल भाषा में।',
      en: "Euclid's definitions, axioms and postulates — explained simply.",
    },
    exercises: [{ number: '5.1', title: { hi: 'अभिगृहीत और अभिधारणाएँ', en: 'Axioms and postulates' } }],
  },
  '9-6': {
    featured: true,
    shortDescription: {
      hi: 'रेखाएँ, कोण, त्रिभुज का कोण योग गुण और आधारभूत रचनाएँ।',
      en: 'Lines, angles, the angle sum property of a triangle and basic constructions.',
    },
    formulas: [{ title: { hi: 'त्रिभुज का कोण योग गुण', en: 'Angle sum property' }, latex: '\\angle A + \\angle B + \\angle C = 180^\\circ' }],
    exercises: [{ number: '6.1', title: { hi: 'कोण और त्रिभुज', en: 'Angles and triangles' } }],
  },
  '10-8': {
    featured: true,
    shortDescription: {
      hi: 'त्रिकोणमितीय अनुपात, विशिष्ट कोणों के मान और सर्वसमिकाएँ।',
      en: 'Trigonometric ratios, values at specific angles and identities.',
    },
    formulas: [
      { title: { hi: 'मूल सर्वसमिका', en: 'Fundamental identity' }, latex: '\\sin^2\\theta + \\cos^2\\theta = 1' },
      { title: { hi: 'सर्वसमिका', en: 'Identity' }, latex: '1 + \\tan^2\\theta = \\sec^2\\theta' },
    ],
  },
};

const block = (type, data = {}) => ({ type, ...data });

// Questions keyed by "class-chapter-exercise"
export const questions = {
  '10-5-5.2': [
    {
      number: '1',
      difficulty: 'easy',
      marks: 2,
      tags: ['nth term', 'ap', 'sample'],
      text: p('AP: $3, 8, 13, 18, \\dots$ का कौन सा पद $78$ है?', 'Which term of the AP: $3, 8, 13, 18, \\dots$ is $78$?'),
      hint: p('पहले $a$ और $d$ ज्ञात करें, फिर $a_n = 78$ रखें।', 'Find $a$ and $d$ first, then put $a_n = 78$.'),
      answer: p('$78$ इस AP का $16$ वाँ पद है।', '$78$ is the $16$th term of the AP.'),
      blocks: [
        block('explanation', {
          title: { hi: 'दिया है', en: 'Given' },
          content: p('पहला पद $a = 3$, सार्व अंतर $d = 8 - 3 = 5$ और $a_n = 78$', 'First term $a = 3$, common difference $d = 8 - 3 = 5$ and $a_n = 78$'),
        }),
        block('formula', { title: { hi: 'प्रयुक्त सूत्र', en: 'Formula used' }, latex: 'a_n = a + (n-1)d' }),
        block('step', { content: p('मान रखने पर: $78 = 3 + (n-1)\\times 5$', 'Substituting the values: $78 = 3 + (n-1)\\times 5$') }),
        block('calculation', { latex: '75 = 5(n-1) \\;\\Rightarrow\\; n - 1 = 15 \\;\\Rightarrow\\; n = 16' }),
        block('graph', { title: { hi: 'पदों का ग्राफ', en: 'Graph of the terms' }, mediaKey: 'apGraph' }),
        block('finalAnswer', { content: p('अतः $78$ दी गई AP का <strong>16 वाँ पद</strong> है।', 'Hence, $78$ is the <strong>16th term</strong> of the given AP.') }),
      ],
    },
    {
      number: '2',
      difficulty: 'easy',
      marks: 2,
      tags: ['nth term', 'ap', 'sample'],
      text: p('AP: $10, 7, 4, \\dots$ का $30$ वाँ पद ज्ञात कीजिए।', 'Find the $30$th term of the AP: $10, 7, 4, \\dots$'),
      answer: p('$a_{30} = -77$', '$a_{30} = -77$'),
      blocks: [
        block('explanation', { content: p('यहाँ $a = 10$ और $d = 7 - 10 = -3$', 'Here $a = 10$ and $d = 7 - 10 = -3$') }),
        block('formula', { latex: 'a_{30} = a + 29d' }),
        block('calculation', { latex: 'a_{30} = 10 + 29(-3) = 10 - 87 = -77' }),
        block('warning', { content: p('सार्व अंतर ऋणात्मक है, इसलिए पद घटते जाते हैं। चिह्न (sign) का ध्यान रखें।', 'The common difference is negative, so the terms decrease. Be careful with the sign.') }),
        block('finalAnswer', { content: p('AP का 30 वाँ पद $-77$ है।', 'The 30th term of the AP is $-77$.') }),
      ],
    },
    {
      number: '3',
      difficulty: 'medium',
      marks: 3,
      languageMode: 'mixed',
      tags: ['nth term', 'ap', 'sample'],
      text: {
        mixed: '<p>किसी AP का तीसरा term $5$ और सातवाँ term $9$ है। AP ज्ञात कीजिए।</p>',
        hi: '<p>किसी AP का तीसरा पद $5$ और सातवाँ पद $9$ है। AP ज्ञात कीजिए।</p>',
        en: '<p>The 3rd term of an AP is $5$ and the 7th term is $9$. Find the AP.</p>',
      },
      answer: { mixed: '<p>AP: $3, 4, 5, 6, \\dots$</p>' },
      blocks: [
        block('mixedText', { content: { mixed: '<p>$a_3 = a + 2d = 5$ … (1) और $a_7 = a + 6d = 9$ … (2)</p>' } }),
        block('step', { content: { mixed: '<p>अब equation (2) में से (1) को subtract करने पर: $4d = 4 \\Rightarrow d = 1$</p>' } }),
        block('step', { content: { mixed: '<p>$d = 1$ को equation (1) में रखने पर $a = 3$</p>' } }),
        block('finalAnswer', { content: { mixed: '<p>इसलिए required AP है: $3, 4, 5, 6, \\dots$</p>' } }),
      ],
    },
  ],
  '9-5-5.1': [
    {
      number: '1',
      difficulty: 'easy',
      tags: ['euclid', 'postulate', 'sample'],
      text: p('यूक्लिड की पाँचवीं अभिधारणा को सरल शब्दों में कैसे लिखेंगे?', "How would you rewrite Euclid's fifth postulate in simple words?"),
      answer: p(
        'यदि एक रेखा दो रेखाओं को काटे और एक ओर के अंतः कोणों का योग $180^\\circ$ से कम हो, तो वे रेखाएँ उसी ओर बढ़ाने पर मिलती हैं।',
        'If a line crosses two lines and the interior angles on one side add up to less than $180^\\circ$, the two lines meet on that side when extended.',
      ),
      blocks: [
        block('text', {
          content: p(
            'मान लीजिए रेखा $n$ रेखाओं $l$ और $m$ को काटती है और एक ही ओर बने अंतः कोण $\\angle 1$ और $\\angle 2$ हैं।',
            'Suppose a line $n$ intersects lines $l$ and $m$, making interior angles $\\angle 1$ and $\\angle 2$ on the same side.',
          ),
        }),
        block('formula', { latex: '\\angle 1 + \\angle 2 < 180^\\circ \\;\\Rightarrow\\; l \\text{ and } m \\text{ meet on that side}' }),
        block('note', { content: p('इसका समतुल्य रूप (Playfair): किसी रेखा के बाहर स्थित बिंदु से उसके समांतर केवल एक ही रेखा खींची जा सकती है।', "An equivalent form (Playfair's axiom): through a point outside a line, exactly one parallel line can be drawn.") }),
        block('finalAnswer', {
          content: p(
            'दो रेखाएँ जिस ओर अंतः कोणों का योग $180^\\circ$ से कम है, उसी ओर बढ़ाने पर अवश्य मिलेंगी।',
            'The two lines will definitely meet on the side where the interior angles sum to less than $180^\\circ$.',
          ),
        }),
      ],
    },
  ],
  '9-6-6.1': [
    {
      number: '1',
      difficulty: 'easy',
      marks: 1,
      tags: ['triangle', 'angle sum property', 'sample'],
      text: p('यदि त्रिभुज $ABC$ में $\\angle A = 60^\\circ$ और $\\angle B = 70^\\circ$, तो $\\angle C$ ज्ञात कीजिए।', 'In triangle $ABC$, if $\\angle A = 60^\\circ$ and $\\angle B = 70^\\circ$, find $\\angle C$.'),
      attachments: [{ mediaKey: 'triangle', kind: 'figure', caption: { hi: 'आकृति: त्रिभुज ABC', en: 'Figure: Triangle ABC' } }],
      hint: p('त्रिभुज के तीनों कोणों का योग $180^\\circ$ होता है।', 'The three angles of a triangle add up to $180^\\circ$.'),
      answer: p('$\\angle C = 50^\\circ$', '$\\angle C = 50^\\circ$'),
      blocks: [
        block('hindiText', { content: { hi: '<p>प्रश्न को हल करने के लिए पहले कोणों का योग ज्ञात करें।</p>' } }),
        block('englishText', { content: { en: '<p>First calculate the sum of the angles.</p>' } }),
        block('formula', { title: { hi: 'कोण योग गुण', en: 'Angle sum property' }, latex: '\\angle A + \\angle B + \\angle C = 180^\\circ' }),
        block('calculation', { latex: '60^\\circ + 70^\\circ + \\angle C = 180^\\circ \\;\\Rightarrow\\; \\angle C = 180^\\circ - 130^\\circ = 50^\\circ' }),
        block('finalAnswer', { content: p('$\\angle C = 50^\\circ$', '$\\angle C = 50^\\circ$') }),
      ],
    },
    {
      number: '2',
      difficulty: 'medium',
      marks: 3,
      tags: ['construction', 'angle', 'sample'],
      text: p('दी गई किरण $AB$ के प्रारंभिक बिंदु $A$ पर $60^\\circ$ का कोण बनाइए।', 'Construct an angle of $60^\\circ$ at the initial point $A$ of a given ray $AB$.'),
      answer: p('$\\angle CAB = 60^\\circ$ बन गया।', '$\\angle CAB = 60^\\circ$ is constructed.'),
      blocks: [
        block('construction', {
          content: {
            hi: '<ol><li>$A$ को केंद्र मानकर किसी भी त्रिज्या का एक चाप खींचिए जो $AB$ को $D$ पर काटे।</li><li>$D$ को केंद्र मानकर उसी त्रिज्या का एक चाप खींचिए जो पहले चाप को $E$ पर काटे।</li><li>$A$ से $E$ से होकर जाने वाली किरण $AC$ खींचिए।</li></ol>',
            en: '<ol><li>With $A$ as centre, draw an arc of any radius cutting $AB$ at $D$.</li><li>With $D$ as centre and the same radius, draw an arc cutting the first arc at $E$.</li><li>Draw ray $AC$ passing through $E$.</li></ol>',
          },
        }),
        block('diagram', { title: { hi: 'रचना आरेख', en: 'Construction diagram' }, mediaKey: 'construction' }),
        block('note', {
          title: { hi: 'औचित्य', en: 'Justification' },
          content: p('$AE = AD = DE$ (समान त्रिज्याएँ), अतः $\\triangle ADE$ समबाहु है और $\\angle EAD = 60^\\circ$।', '$AE = AD = DE$ (equal radii), so $\\triangle ADE$ is equilateral and $\\angle EAD = 60^\\circ$.'),
        }),
        block('finalAnswer', { content: p('अभीष्ट कोण $\\angle CAB = 60^\\circ$ है।', 'The required angle is $\\angle CAB = 60^\\circ$.') }),
      ],
    },
  ],
};

export const notes = [
  {
    classNumber: 10,
    chapterNumber: 5,
    slug: 'arithmetic-progression-formulas',
    title: { hi: 'समांतर श्रेढ़ी – सूत्र एवं मुख्य बिंदु', en: 'Arithmetic Progressions – Formulas & Key Points' },
    summary: { hi: 'AP के n वाँ पद और योग के सभी सूत्र एक जगह।', en: 'All nth-term and sum formulas of an AP in one place.' },
    tags: ['formula', 'ap'],
    content: {
      hi: '<h2>मुख्य सूत्र</h2><ul><li>n वाँ पद: $a_n = a + (n-1)d$</li><li>पहले n पदों का योग: $S_n = \\frac{n}{2}[2a + (n-1)d]$</li><li>यदि अंतिम पद $l$ ज्ञात है: $S_n = \\frac{n}{2}(a + l)$</li></ul><h3>याद रखें</h3><p>तीन संख्याएँ AP में हों तो उन्हें $a - d,\\ a,\\ a + d$ मानना सुविधाजनक होता है।</p>',
      en: '<h2>Key formulas</h2><ul><li>nth term: $a_n = a + (n-1)d$</li><li>Sum of first n terms: $S_n = \\frac{n}{2}[2a + (n-1)d]$</li><li>If the last term $l$ is known: $S_n = \\frac{n}{2}(a + l)$</li></ul><h3>Remember</h3><p>When three numbers are in AP, it is convenient to take them as $a - d,\\ a,\\ a + d$.</p>',
    },
  },
  {
    classNumber: 9,
    chapterNumber: 6,
    slug: 'lines-and-angles-key-points',
    title: { hi: 'रेखाएँ और कोण – मुख्य बिंदु', en: 'Lines and Angles – Key Points' },
    summary: { hi: 'रैखिक युग्म, शीर्षाभिमुख कोण और त्रिभुज का कोण योग गुण।', en: 'Linear pairs, vertically opposite angles and the angle sum property.' },
    tags: ['angles'],
    content: {
      hi: '<ul><li>रैखिक युग्म के कोणों का योग $180^\\circ$ होता है।</li><li>शीर्षाभिमुख कोण बराबर होते हैं।</li><li>त्रिभुज के तीनों कोणों का योग $180^\\circ$ होता है।</li></ul>',
      en: '<ul><li>Angles of a linear pair add up to $180^\\circ$.</li><li>Vertically opposite angles are equal.</li><li>The angles of a triangle add up to $180^\\circ$.</li></ul>',
    },
  },
];

export const importantQuestions = [
  {
    classNumber: 10,
    chapterNumber: 5,
    slug: 'ap-10th-term-2-7-12',
    marks: 2,
    source: 'Practice',
    difficulty: 'easy',
    text: p('AP: $2, 7, 12, \\dots$ का $10$ वाँ पद ज्ञात कीजिए।', 'Find the $10$th term of the AP: $2, 7, 12, \\dots$'),
    answer: p('$a_{10} = 47$', '$a_{10} = 47$'),
    blocks: [
      block('calculation', { latex: 'a = 2,\\; d = 5,\\; a_{10} = 2 + 9 \\times 5 = 47' }),
      block('finalAnswer', { content: p('10 वाँ पद $47$ है।', 'The 10th term is $47$.') }),
    ],
  },
  {
    classNumber: 10,
    chapterNumber: 5,
    slug: 'sum-of-first-20-positive-integers',
    marks: 2,
    source: 'Practice',
    difficulty: 'easy',
    text: p('पहले $20$ धनात्मक पूर्णांकों का योग ज्ञात कीजिए।', 'Find the sum of the first $20$ positive integers.'),
    answer: p('$S_{20} = 210$', '$S_{20} = 210$'),
    blocks: [
      block('formula', { latex: 'S_n = \\frac{n}{2}(a + l)' }),
      block('calculation', { latex: 'S_{20} = \\frac{20}{2}(1 + 20) = 10 \\times 21 = 210' }),
      block('finalAnswer', { content: p('योग $210$ है।', 'The sum is $210$.') }),
    ],
  },
];

export const pages = [
  {
    slug: 'about-us',
    title: { hi: 'हमारे बारे में', en: 'About Us' },
    excerpt: { hi: 'Passion Maths Study (PMS) के बारे में', en: 'About Passion Maths Study (PMS)' },
    content: p(
      'Passion Maths Study (PMS) कक्षा 6 से 12 के विद्यार्थियों के लिए NCERT गणित का निःशुल्क, चरणबद्ध और द्विभाषी (हिंदी व English) अध्ययन मंच है।',
      'Passion Maths Study (PMS) is a free, step-by-step, bilingual (Hindi & English) NCERT Mathematics study platform for students of Class 6 to 12.',
    ),
  },
  {
    slug: 'contact',
    template: 'contact',
    title: { hi: 'संपर्क करें', en: 'Contact' },
    content: p('सुझाव या त्रुटि की सूचना के लिए हमसे संपर्क करें।', 'Contact us for suggestions or to report a mistake.'),
  },
  {
    slug: 'privacy-policy',
    template: 'legal',
    title: { hi: 'गोपनीयता नीति', en: 'Privacy Policy' },
    content: p(
      'यह पृष्ठ बताता है कि वेबसाइट किस प्रकार की जानकारी एकत्र करती है और उसका उपयोग कैसे होता है। (प्रकाशन से पहले इस नीति की कानूनी समीक्षा अवश्य करवाएँ।)',
      'This page explains what information the website collects and how it is used. (Have this policy reviewed legally before launch.)',
    ),
  },
  {
    slug: 'terms-and-conditions',
    template: 'legal',
    title: { hi: 'नियम एवं शर्तें', en: 'Terms & Conditions' },
    content: p(
      'इस वेबसाइट का उपयोग करके आप इन नियमों एवं शर्तों से सहमत होते हैं। (प्रकाशन से पहले कानूनी समीक्षा अवश्य करवाएँ।)',
      'By using this website you agree to these terms and conditions. (Have them reviewed legally before launch.)',
    ),
  },
];

export const topics = [
  {
    classNumber: 10,
    chapterNumber: 4,
    number: 1,
    slug: 'introduction-to-quadratic-equations',
    title: {
      hi: 'द्विघात समीकरण का परिचय एवं मानक रूप',
      en: 'Introduction to Quadratic Equations & Standard Form',
    },
    shortDescription: {
      hi: 'द्विघात समीकरण की परिभाषा, मानक रूप ax² + bx + c = 0 और व्यावहारिक अनुप्रयोग।',
      en: 'Definition of quadratic equations, standard form ax² + bx + c = 0, and practical applications.',
    },
    difficulty: 'easy',
    estimatedTime: '25 min',
    featured: true,
    videos: [
      {
        title: {
          hi: 'द्विघात समीकरण क्या है? (Concept & Examples)',
          en: 'What is a Quadratic Equation? (Concept & Examples)',
        },
        description: {
          hi: 'द्विघात समीकरण की मूल अवधारणा और मानक रूप को समझने के लिए विस्तृत वीडियो व्याख्यान।',
          en: 'Comprehensive conceptual video on standard forms and identifying quadratic equations.',
        },
        source: 'youtube',
        url: 'https://www.youtube.com/watch?v=gT8_4k7_o_Q',
        duration: '14:20',
        lessonNumber: 1,
        teacherName: 'Nitish Sir',
      },
      {
        title: {
          hi: 'द्विघात समीकरण की पहचान कैसे करें',
          en: 'How to Identify Quadratic Equations',
        },
        source: 'youtube',
        url: 'https://www.youtube.com/watch?v=Z5bCkgx_cHg',
        duration: '10:45',
        lessonNumber: 2,
        teacherName: 'Nitish Sir',
      },
    ],
    notes: {
      hi: `<h3>1. द्विघात समीकरण की परिभाषा</h3><p>चर $x$ में एक द्विघात समीकरण <strong>$ax^2 + bx + c = 0$</strong> के प्रकार का होता है, जहाँ $a, b, c$ वास्तविक संख्याएँ हैं और <strong>$a \\neq 0$</strong> है।</p><h3>2. द्विघात समीकरण का मानक रूप</h3><p>जब किसी द्विघात बहुपद को चर की घातों के घटते क्रम में लिखा जाता है, तो उसे मानक रूप (Standard Form) कहते हैं:</p><p class="my-2 p-3 bg-muted rounded-lg font-mono text-center">$$ax^2 + bx + c = 0, \\quad a \\neq 0$$</p><h3>3. मुख्य बिंदु:</h3><ul><li>यदि $a = 0$ हो जाए, तो यह रैखिक समीकरण ($bx + c = 0$) बन जाएगा।</li><li>द्विघात समीकरण के अधिकतम <strong>2 मूल (roots)</strong> होते हैं।</li><li>समीकरण $(x-2)^2 + 1 = 2x - 3$ को सरल करने पर $x^2 - 6x + 8 = 0$ प्राप्त होता है, जो एक द्विघात समीकरण है।</li></ul>`,
      en: `<h3>1. Definition of Quadratic Equation</h3><p>A quadratic equation in the variable $x$ is an equation of the form <strong>$ax^2 + bx + c = 0$</strong>, where $a, b, c$ are real numbers and <strong>$a \\neq 0$</strong>.</p><h3>2. Standard Form</h3><p>Writing the terms in descending order of degrees gives the standard form:</p><p class="my-2 p-3 bg-muted rounded-lg font-mono text-center">$$ax^2 + bx + c = 0, \\quad a \\neq 0$$</p><h3>3. Key Takeaways:</h3><ul><li>If $a = 0$, it reduces to a linear equation ($bx + c = 0$).</li><li>A quadratic equation has at most <strong>2 roots</strong>.</li><li>Expanding $(x-2)^2 + 1 = 2x - 3$ simplifies to $x^2 - 6x + 8 = 0$, which is quadratic.</li></ul>`,
    },
    formulas: [
      {
        title: { hi: 'द्विघात समीकरण का मानक रूप', en: 'Standard Form of Quadratic Equation' },
        latex: 'ax^2 + bx + c = 0 \\quad (a \\neq 0)',
        description: { hi: 'जहाँ a, b, c वास्तविक संख्याएँ हैं।', en: 'where a, b, c are real numbers.' },
      },
      {
        title: { hi: 'द्विघाती सूत्र (श्रीधराचार्य सूत्र)', en: 'Quadratic Formula (Sridharacharya Formula)' },
        latex: 'x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}',
        description: { hi: 'मूल ज्ञात करने के लिए सूत्र।', en: 'Formula used to find the roots of the equation.' },
      },
      {
        title: { hi: 'विविक्तकर (Discriminant)', en: 'Discriminant' },
        latex: 'D = b^2 - 4ac',
        description: { hi: 'मूलों की प्रकृति निर्धारित करने के लिए।', en: 'Determines the nature of roots.' },
      },
    ],
    practiceQuestions: [
      {
        question: {
          hi: 'जाँच कीजिए कि क्या $(x + 1)^2 = 2(x - 3)$ एक द्विघात समीकरण है?',
          en: 'Check whether $(x + 1)^2 = 2(x - 3)$ is a quadratic equation.',
        },
        hint: {
          hi: '$(x+1)^2$ का प्रसार करें और सभी पदों को बाईं ओर लाएँ।',
          en: 'Expand $(x+1)^2$ and move all terms to the left hand side.',
        },
        solution: {
          hi: '<p>LHS $= (x + 1)^2 = x^2 + 2x + 1$</p><p>RHS $= 2(x - 3) = 2x - 6$</p><p>समीकरण: $x^2 + 2x + 1 = 2x - 6 \\implies x^2 + 7 = 0$</p><p>यह $ax^2 + bx + c = 0$ (जहाँ $a=1, b=0, c=7$) के रूप का है। अतः यह <strong>द्विघात समीकरण है</strong>।</p>',
          en: '<p>LHS $= (x + 1)^2 = x^2 + 2x + 1$</p><p>RHS $= 2(x - 3) = 2x - 6$</p><p>Equating: $x^2 + 2x + 1 = 2x - 6 \\implies x^2 + 7 = 0$</p><p>This is of the form $ax^2 + bx + c = 0$ (with $a=1, b=0, c=7$). Hence it is a <strong>quadratic equation</strong>.</p>',
        },
        difficulty: 'easy',
      },
      {
        question: {
          hi: 'द्विघात समीकरण $2x^2 - 5x + 3 = 0$ का विविक्तकर (Discriminant) ज्ञात कीजिए।',
          en: 'Find the discriminant of the quadratic equation $2x^2 - 5x + 3 = 0$.',
        },
        solution: {
          hi: '<p>$a = 2, b = -5, c = 3$</p><p>$D = b^2 - 4ac = (-5)^2 - 4(2)(3) = 25 - 24 = 1$</p><p>चूँकि $D > 0$, अतः दो भिन्न वास्तविक मूल होंगे।</p>',
          en: '<p>$a = 2, b = -5, c = 3$</p><p>$D = b^2 - 4ac = (-5)^2 - 4(2)(3) = 25 - 24 = 1$</p><p>Since $D > 0$, the equation has two distinct real roots.</p>',
        },
        difficulty: 'medium',
      },
    ],
    externalLinks: [
      {
        title: 'NCERT Official Textbook PDF (Class 10 Chapter 4)',
        url: 'https://ncert.nic.in/textbook.php?jemh1=4-14',
        description: 'Official NCERT portal Class 10 Mathematics Chapter 4 link.',
      },
      {
        title: 'Geogebra Interactive Quadratic Graph Visualizer',
        url: 'https://www.geogebra.org/m/mhygzs7x',
        description: 'Interact with parabola roots and coefficients in real time.',
      },
    ],
  },
  {
    classNumber: 10,
    chapterNumber: 4,
    number: 2,
    slug: 'solution-by-factorisation',
    title: {
      hi: 'गुणनखंडन द्वारा द्विघात समीकरण का हल',
      en: 'Solution of Quadratic Equations by Factorisation',
    },
    shortDescription: {
      hi: 'मध्य पद को विभक्त करके (Splitting the middle term) द्विघात समीकरण के मूल ज्ञात करना।',
      en: 'Finding roots of a quadratic equation by splitting the middle term.',
    },
    difficulty: 'medium',
    estimatedTime: '35 min',
    featured: false,
    videos: [
      {
        title: {
          hi: 'गुणनखंडन विधि से हल कैसे करें (Step-by-Step)',
          en: 'Solving Quadratic Equations by Factorisation (Step-by-Step)',
        },
        source: 'youtube',
        url: 'https://www.youtube.com/watch?v=SDe-1lGeS0U',
        duration: '18:10',
        lessonNumber: 1,
        teacherName: 'Nitish Sir',
      },
    ],
    notes: {
      hi: `<h3>गुणनखंडन विधि (Splitting the Middle Term)</h3><p>समीकरण $ax^2 + bx + c = 0$ के लिए:</p><ol><li>दो संख्याएँ $p$ और $q$ ऐसे खोजें जिनका योग $p + q = b$ हो और गुणनफल $p \\times q = ac$ हो।</li><li>मध्य पद $bx$ को $px + qx$ के रूप में लिखें।</li><li>पदों का समूह बनाकर उभयनिष्ठ (common) गुणनखंड बाहर निकालें।</li><li>प्रत्येक रैखिक गुणनखंड को शून्य के बराबर रखकर $x$ के मान (मूल) ज्ञात करें।</li></ol>`,
      en: `<h3>Method of Factorisation</h3><p>For the equation $ax^2 + bx + c = 0$:</p><ol><li>Find two numbers $p$ and $q$ such that $p + q = b$ and $p \\times q = ac$.</li><li>Split the middle term $bx$ as $px + qx$.</li><li>Factor by grouping terms.</li><li>Set each linear factor to zero to obtain the roots.</li></ol>`,
    },
    formulas: [
      {
        title: { hi: 'मध्य पद विभाजन नियम', en: 'Middle Term Splitting Rule' },
        latex: 'p + q = b, \\quad p \\cdot q = a \\cdot c',
        description: { hi: 'मध्य पद को दो भागों में विभक्त करने की शर्त।', en: 'Condition for splitting the linear term coefficient.' },
      },
    ],
    practiceQuestions: [
      {
        question: {
          hi: 'गुणनखंडन विधि द्वारा समीकरण $x^2 - 3x - 10 = 0$ के मूल ज्ञात कीजिए।',
          en: 'Find the roots of the equation $x^2 - 3x - 10 = 0$ by factorisation.',
        },
        solution: {
          hi: '<p>$x^2 - 5x + 2x - 10 = 0$</p><p>$x(x - 5) + 2(x - 5) = 0$</p><p>$(x - 5)(x + 2) = 0$</p><p>$\\implies x = 5$ अथवा $x = -2$</p>',
          en: '<p>$x^2 - 5x + 2x - 10 = 0$</p><p>$x(x - 5) + 2(x - 5) = 0$</p><p>$(x - 5)(x + 2) = 0$</p><p>$\\implies x = 5$ or $x = -2$</p>',
        },
        difficulty: 'medium',
      },
    ],
  },
  {
    classNumber: 10,
    chapterNumber: 5,
    number: 1,
    slug: 'arithmetic-progressions-introduction',
    title: {
      hi: 'समांतर श्रेढ़ी का परिचय एवं n-वाँ पद',
      en: 'Arithmetic Progression: Introduction & nth Term',
    },
    shortDescription: {
      hi: 'प्रथम पद (a), सार्व अंतर (d), और समांतर श्रेढ़ी का व्यापक पद (an = a + (n-1)d)।',
      en: 'First term (a), common difference (d), and the general nth term (an = a + (n-1)d).',
    },
    difficulty: 'easy',
    estimatedTime: '30 min',
    featured: true,
    videos: [
      {
        title: {
          hi: 'समांतर श्रेढ़ी (AP) - पूरा परिचय व सूत्र',
          en: 'Arithmetic Progressions (AP) - Full Concept & Formulas',
        },
        source: 'youtube',
        url: 'https://www.youtube.com/watch?v=1xNKG2C_B3U',
        duration: '16:40',
        lessonNumber: 1,
        teacherName: 'Nitish Sir',
      },
    ],
    notes: {
      hi: `<h3>समांतर श्रेढ़ी (Arithmetic Progression - AP)</h3><p>संख्याओं की एक ऐसी सूची जिसमें प्रत्येक पद अपने पिछले पद में एक निश्चित संख्या जोड़ने पर प्राप्त होता है, <strong>समांतर श्रेढ़ी (AP)</strong> कहलाती है।</p><p>निश्चित संख्या को <strong>सार्व अंतर (Common Difference, $d$)</strong> कहा जाता है। सार्व अंतर धनात्मक, ऋणात्मक या शून्य हो सकता है।</p>`,
      en: `<h3>Arithmetic Progression (AP)</h3><p>An arithmetic progression is a sequence of numbers such that the difference between consecutive terms is constant. This constant difference is called the <strong>common difference ($d$)</strong>.</p>`,
    },
    formulas: [
      {
        title: { hi: 'n-वाँ पद (General nth Term)', en: 'nth Term Formula' },
        latex: 'a_n = a + (n - 1)d',
        description: { hi: 'जहाँ a प्रथम पद, d सार्व अंतर और n पदों की संख्या है।', en: 'where a is first term, d is common difference, and n is number of terms.' },
      },
      {
        title: { hi: 'प्रथम n पदों का योग (Sum of first n terms)', en: 'Sum of First n Terms' },
        latex: 'S_n = \\frac{n}{2}\\left[2a + (n - 1)d\\right] = \\frac{n}{2}(a + l)',
        description: { hi: 'जहाँ l = अंतिम पद (last term) है।', en: 'where l is the last term.' },
      },
    ],
    practiceQuestions: [
      {
        question: {
          hi: 'AP: $2, 7, 12, \\dots$ का $10$वाँ पद ज्ञात कीजिए।',
          en: 'Find the 10th term of the AP: $2, 7, 12, \\dots$',
        },
        solution: {
          hi: '<p>$a = 2, d = 7 - 2 = 5, n = 10$</p><p>$a_{10} = a + 9d = 2 + 9(5) = 2 + 45 = 47$</p>',
          en: '<p>$a = 2, d = 7 - 2 = 5, n = 10$</p><p>$a_{10} = a + 9d = 2 + 9(5) = 2 + 45 = 47$</p>',
        },
        difficulty: 'easy',
      },
    ],
  },
];

export const resources = [
  {
    classNumber: 10,
    chapterNumber: 4,
    title: {
      hi: 'कक्षा 10 गणित: द्विघात समीकरण - संपूर्ण हस्तलिखित नोट्स (PDF)',
      en: 'Class 10 Maths: Quadratic Equations - Complete Handwritten Notes (PDF)',
    },
    description: {
      hi: 'द्विघात समीकरण के सभी नियम, मानक रूप, गुणनखंडन और द्विघाती सूत्र के विस्तृत उदाहरण सहित नोट्स।',
      en: 'Complete handwritten revision notes with solved examples for Quadratic Equations.',
    },
    resourceType: 'notes',
    fileUrl: 'https://ncert.nic.in/textbook/pdf/jemh104.pdf',
    fileName: 'Class_10_Maths_Ch4_Quadratic_Equations_Notes.pdf',
    fileSize: 2450000,
    mimeType: 'application/pdf',
    downloadAllowed: true,
    featured: true,
  },
  {
    classNumber: 10,
    chapterNumber: 4,
    title: {
      hi: 'द्विघात समीकरण सूत्र और विविक्तकर चार्ट (Formula Sheet)',
      en: 'Quadratic Equations Formula Sheet & Discriminant Chart',
    },
    description: {
      hi: 'परीक्षा पूर्व त्वरित दोहराव के लिए 1-पेज का फॉर्मूला चीट शीट।',
      en: '1-page formula sheet with discriminant cases and nature of roots chart.',
    },
    resourceType: 'formula_sheet',
    fileUrl: 'https://ncert.nic.in/textbook/pdf/jemh104.pdf',
    fileName: 'Class10_Ch4_Formula_Sheet.pdf',
    fileSize: 680000,
    mimeType: 'application/pdf',
    downloadAllowed: true,
    featured: true,
  },
  {
    classNumber: 10,
    chapterNumber: 4,
    title: {
      hi: 'द्विघात समीकरण अभ्यास कार्यपत्रक (Practice Worksheet 01)',
      en: 'Quadratic Equations Practice Worksheet 01',
    },
    description: {
      hi: '20 महत्वपूर्ण प्रश्नों का अभ्यास सेट (बोर्ड परीक्षा स्पेशल)।',
      en: '20 high-yield practice questions with answer key for board preparation.',
    },
    resourceType: 'worksheet',
    fileUrl: 'https://ncert.nic.in/textbook/pdf/jemh104.pdf',
    fileName: 'Class10_Ch4_Worksheet_01.pdf',
    fileSize: 1120000,
    mimeType: 'application/pdf',
    downloadAllowed: true,
  },
  {
    classNumber: 10,
    chapterNumber: 5,
    title: {
      hi: 'समांतर श्रेढ़ियाँ (AP) - सूत्र एवं महत्वपूर्ण प्रश्न संग्रह',
      en: 'Arithmetic Progressions (AP) - Formula Sheet & Important Questions',
    },
    description: {
      hi: 'n-वें पद और प्रथम n पदों के योग के सभी सूत्र एवं महत्वपूर्ण उदाहरण।',
      en: 'Complete formula sheet and solved standard questions on Arithmetic Progressions.',
    },
    resourceType: 'formula_sheet',
    fileUrl: 'https://ncert.nic.in/textbook/pdf/jemh105.pdf',
    fileName: 'Class10_Ch5_AP_Formula_Sheet.pdf',
    fileSize: 850000,
    mimeType: 'application/pdf',
    downloadAllowed: true,
    featured: true,
  },
  {
    classNumber: 10,
    chapterNumber: 5,
    title: {
      hi: 'समांतर श्रेढ़ी अभ्यास कार्यपत्रक (AP Practice Worksheet)',
      en: 'Arithmetic Progressions Practice Worksheet',
    },
    description: {
      hi: 'कक्षा 10 समांतर श्रेढ़ी के अभ्यास प्रश्न और गृहकार्य पत्रक।',
      en: 'Practice worksheet for Class 10 AP with word problems.',
    },
    resourceType: 'worksheet',
    fileUrl: 'https://ncert.nic.in/textbook/pdf/jemh105.pdf',
    fileName: 'Class10_Ch5_Worksheet.pdf',
    fileSize: 920000,
    mimeType: 'application/pdf',
    downloadAllowed: true,
  },
  {
    classNumber: 10,
    title: {
      hi: 'CBSE कक्षा 10 गणित 2024-25 आधिकारिक सैंपल प्रश्न पत्र एवं मार्किंग स्कीम',
      en: 'CBSE Class 10 Mathematics 2024-25 Official Sample Question Paper & Marking Scheme',
    },
    description: {
      hi: 'बोर्ड परीक्षा के नवीनतम पैटर्न पर आधारित ऑफिशियल सैंपल पेपर।',
      en: 'Official sample question paper and marking scheme for Class 10 Board exam.',
    },
    resourceType: 'sample_paper',
    fileUrl: 'https://cbseacademic.nic.in/web_material/SQP/ClassX_2024_25/MathsStandard-SQP.pdf',
    fileName: 'CBSE_Class10_Maths_Sample_Paper_2024_25.pdf',
    fileSize: 1850000,
    mimeType: 'application/pdf',
    downloadAllowed: true,
    featured: true,
  },
];

export const books = [
  {
    title: 'NCERT Mathematics Textbook for Class 10',
    author: 'NCERT Editorial Board',
    publisher: 'NCERT (National Council of Educational Research and Training)',
    edition: '2024-25 Rationalised Edition',
    classNumber: 10,
    subjectSlug: 'maths',
    chapterNumber: 4,
    category: 'ncert',
    description: {
      hi: 'कक्षा 10 के लिए राष्ट्रीय शैक्षिक अनुसंधान और प्रशिक्षण परिषद (NCERT) द्वारा प्रकाशित आधिकारिक गणित पाठ्यपुस्तक।',
      en: 'Official NCERT Mathematics textbook for Class 10 with latest rationalised syllabus.',
    },
    coverUrl: 'https://ncert.nic.in/textbook/pdf/jemh1cc.jpg',
    purchaseUrl: 'https://www.amazon.in/s?k=NCERT+Mathematics+Class+10',
    price: 140,
    currency: 'INR',
    recommendedFor: 'CBSE & State Board Exams (Must-have core textbook)',
    featured: true,
  },
  {
    title: 'Mathematics for Class 10 by R.D. Sharma',
    author: 'Dr. R.D. Sharma',
    publisher: 'Dhanpat Rai Publications',
    edition: 'Latest Edition (2024-25)',
    classNumber: 10,
    subjectSlug: 'maths',
    chapterNumber: 4,
    category: 'reference',
    description: {
      hi: 'बोर्ड परीक्षा और प्रतियोगी परीक्षाओं की गहन तैयारी के लिए सर्वाधिक लोकप्रिय एवं विस्तृत संदर्भ पुस्तक।',
      en: 'The most comprehensive reference book for CBSE Class 10 Mathematics with thousands of graded practice problems.',
    },
    coverUrl: 'https://m.media-amazon.com/images/I/81+XN5zQZmL._AC_UF1000,1000_QL80_.jpg',
    purchaseUrl: 'https://www.amazon.in/s?k=RD+Sharma+Class+10+Mathematics',
    price: 695,
    currency: 'INR',
    recommendedFor: 'In-depth concept mastery and 95%+ Board score preparation',
    featured: true,
  },
  {
    title: 'Secondary School Mathematics for Class 10 by R.S. Aggarwal',
    author: 'R.S. Aggarwal & V. Aggarwal',
    publisher: 'Bharati Bhawan Publishers',
    edition: 'Revised Edition',
    classNumber: 10,
    subjectSlug: 'maths',
    chapterNumber: 4,
    category: 'practice',
    description: {
      hi: 'सरल भाषा और क्रमबद्ध अभ्यास प्रश्नों के लिए उत्कृष्ट गणित संदर्भ पुस्तक।',
      en: 'Standard reference and practice book for building strong problem-solving skills.',
    },
    coverUrl: 'https://m.media-amazon.com/images/I/71R23+Xk3sL._AC_UF1000,1000_QL80_.jpg',
    purchaseUrl: 'https://www.amazon.in/s?k=RS+Aggarwal+Class+10+Mathematics',
    price: 520,
    currency: 'INR',
    recommendedFor: 'Systematic daily problem practice and step-by-step learning',
    featured: false,
  },
  {
    title: 'NCERT Exemplar Problems - Solutions Mathematics Class 10',
    author: 'Arihant Experts / NCERT',
    publisher: 'Arihant Publications',
    edition: '2024-25 Edition',
    classNumber: 10,
    subjectSlug: 'maths',
    category: 'exam_prep',
    description: {
      hi: 'उच्च-स्तरीय चिंतन कौशल (HOTS) और कठिन प्रश्नों के अभ्यास के लिए NCERT एग्जम्पलर।',
      en: 'High Order Thinking Skills (HOTS) and analytical questions for CBSE Class 10 board toppers and Olympiads.',
    },
    coverUrl: 'https://m.media-amazon.com/images/I/71ZtqI2X5wL._AC_UF1000,1000_QL80_.jpg',
    purchaseUrl: 'https://www.amazon.in/s?k=NCERT+Exemplar+Class+10+Maths',
    price: 195,
    currency: 'INR',
    recommendedFor: 'HOTS questions, Case Study-based questions & Olympiad foundation',
    featured: true,
  },
];
