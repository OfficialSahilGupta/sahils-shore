// ============================================================================
// Sahil's Shore: German Learning Hub Constants & Curated Data
// CEFR Competencies, Curated Vocab, Grammar Notes, Writing Prompts, Tricky Sounds
// ============================================================================

export type CefrLevel = "A1" | "A2" | "B1" | "B2";
export type GermanGender = "der" | "die" | "das";

export interface CefrCompetency {
  id: string;
  level: CefrLevel;
  title: string;
  description: string;
  category: "Listening" | "Reading" | "Speaking" | "Writing" | "Grammar";
}

export const CEFR_LEVELS: CefrLevel[] = ["A1", "A2", "B1", "B2"];

export const CEFR_COMPETENCIES: CefrCompetency[] = [
  // A1 Beginner
  {
    id: "a1-greetings",
    level: "A1",
    title: "Basic Greetings & Introductions",
    description: "Introduce yourself, say where you come from, and ask simple personal questions.",
    category: "Speaking",
  },
  {
    id: "a1-articles",
    level: "A1",
    title: "Gender & Definite Articles (der, die, das)",
    description: "Understand grammatical gender and basic Nominativ / Akkusativ distinctions.",
    category: "Grammar",
  },
  {
    id: "a1-numbers",
    level: "A1",
    title: "Numbers, Time & Dates",
    description: "Tell time in German (offiziell & umgangssprachlich), count money in Euro/Cent, and state dates.",
    category: "Listening",
  },
  {
    id: "a1-ordering",
    level: "A1",
    title: "Ordering Food & Shopping",
    description: "Order drinks and meals in a restaurant and ask for prices in shops.",
    category: "Speaking",
  },
  {
    id: "a1-verbs-present",
    level: "A1",
    title: "Regular & Irregular Present Tense",
    description: "Conjugate common verbs (sein, haben, machen, gehen, sprechen) in present tense.",
    category: "Grammar",
  },

  // A2 Elementary
  {
    id: "a2-perfekt",
    level: "A2",
    title: "Past Tense (Das Perfekt)",
    description: "Narrate past experiences using haben/sein auxiliary verbs + Partizip II.",
    category: "Grammar",
  },
  {
    id: "a2-modal-verbs",
    level: "A2",
    title: "Modal Verbs (können, müssen, dürfen...)",
    description: "Express obligations, permissions, and abilities with correct verb bracket structure.",
    category: "Grammar",
  },
  {
    id: "a2-directions",
    level: "A2",
    title: "Asking for & Giving Directions",
    description: "Navigate a German city, use two-way prepositions (Wechselpräpositionen), and describe locations.",
    category: "Speaking",
  },
  {
    id: "a2-daily-routine",
    level: "A2",
    title: "Daily Routine & Separable Verbs",
    description: "Describe your day using trennbare Verben (aufstehen, anrufen, einschlafen).",
    category: "Writing",
  },

  // B1 Intermediate
  {
    id: "b1-opinions",
    level: "B1",
    title: "Expressing Opinions & Debating",
    description: "Express agreement, disagreement, and nuanced viewpoints on everyday topics.",
    category: "Speaking",
  },
  {
    id: "b1-konjunktiv-ii",
    level: "B1",
    title: "Subjunctive II (Konjunktiv II)",
    description: "Form polite requests (würde gern, hätte, wäre) and hypothetical statements.",
    category: "Grammar",
  },
  {
    id: "b1-subordinate-clauses",
    level: "B1",
    title: "Subordinate Clauses (weil, dass, obwohl, wenn)",
    description: "Construct complex sentences with the conjugated verb placed at the very end.",
    category: "Grammar",
  },
  {
    id: "b1-work-travel",
    level: "B1",
    title: "Workplace & Travel Conversations",
    description: "Handle most travel situations in DACH countries and write formal emails.",
    category: "Writing",
  },

  // B2 Upper Intermediate
  {
    id: "b2-complex-texts",
    level: "B2",
    title: "Understanding Complex & Technical Texts",
    description: "Read German newspaper articles, technical docs, and specialized discussions.",
    category: "Reading",
  },
  {
    id: "b2-passive-voice",
    level: "B2",
    title: "Passive Voice (Vorgangs- & Zustandspassiv)",
    description: "Express actions without active agents in present, past, and modal structures.",
    category: "Grammar",
  },
  {
    id: "b2-adjective-endings",
    level: "B2",
    title: "Adjective Endings Mastery",
    description: "Flawlessly apply weak, strong, and mixed adjective endings in all four cases.",
    category: "Grammar",
  },
  {
    id: "b2-professional-fluency",
    level: "B2",
    title: "Professional & Spontaneous Fluency",
    description: "Participate comfortably in job interviews and technical discussions in German.",
    category: "Speaking",
  },
];

export interface TrickySound {
  symbol: string;
  name: string;
  ipa: string;
  description: string;
  examples: Array<{ word: string; meaning: string }>;
}

export const TRICKY_SOUNDS: TrickySound[] = [
  {
    symbol: "ü",
    name: "Umlaut Ü",
    ipa: "[yː] / [ʏ]",
    description: "Form your lips to whistle 'oo', but produce the vowel sound 'ee'. Do not unround your lips.",
    examples: [
      { word: "über", meaning: "over / above" },
      { word: "früh", meaning: "early" },
      { word: "Gemütlichkeit", meaning: "coziness" },
    ],
  },
  {
    symbol: "ö",
    name: "Umlaut Ö",
    ipa: "[øː] / [œ]",
    description: "Round your lips into an 'O' shape while saying the English vowel in 'bed' (eh).",
    examples: [
      { word: "schön", meaning: "beautiful" },
      { word: "hören", meaning: "to hear / listen" },
      { word: "Können", meaning: "ability / skill" },
    ],
  },
  {
    symbol: "ä",
    name: "Umlaut Ä",
    ipa: "[ɛː] / [ɛ]",
    description: "Similar to the short 'e' in 'pet' or the long 'ai' in 'air'.",
    examples: [
      { word: "Mädchen", meaning: "girl" },
      { word: "spät", meaning: "late" },
      { word: "Äpfel", meaning: "apples" },
    ],
  },
  {
    symbol: "ch",
    name: "Ich-Laut & Ach-Laut",
    ipa: "[ç] / [x]",
    description: "Front soft hiss after front vowels (ich, nicht), guttural friction after back vowels (Buch, Bach).",
    examples: [
      { word: "ich", meaning: "I" },
      { word: "nicht", meaning: "not" },
      { word: "Küche", meaning: "kitchen" },
      { word: "Buch", meaning: "book" },
    ],
  },
  {
    symbol: "r",
    name: "Guttural Uvular R",
    ipa: "[ʁ]",
    description: "Produced with the back of the tongue vibrating lightly against the uvula (French/German R).",
    examples: [
      { word: "rot", meaning: "red" },
      { word: "Reise", meaning: "journey" },
      { word: "richtig", meaning: "correct" },
    ],
  },
  {
    symbol: "sch",
    name: "Soft German SCH",
    ipa: "[ʃ]",
    description: "More rounded and prominent lip protrusion than English 'sh'.",
    examples: [
      { word: "Schule", meaning: "school" },
      { word: "schnell", meaning: "fast" },
      { word: "schlafen", meaning: "to sleep" },
    ],
  },
  {
    symbol: "ß",
    name: "Eszett (Sharp S)",
    ipa: "[s]",
    description: "Pronounced strictly like a sharp, unvoiced English 'ss' (as in 'miss'), never buzzed like 'z'. Follows long vowels and diphthongs.",
    examples: [
      { word: "Straße", meaning: "street" },
      { word: "groß", meaning: "big / tall" },
      { word: "heiß", meaning: "hot" },
    ],
  },
];

export interface CuratedVocabCard {
  german_text: string;
  gender: GermanGender | null;
  plural: string | null;
  english_meaning: string;
  example_sentence: string;
  cefr_level: CefrLevel;
  tags: string[];
}

export const CURATED_VOCAB_CARDS: CuratedVocabCard[] = [
  {
    german_text: "der Feierabend",
    gender: "der",
    plural: "die Feierabende",
    english_meaning: "end of the workday / evening leisure time",
    example_sentence: "Nach einem langen Tag mache ich endlich Feierabend.",
    cefr_level: "A2",
    tags: ["culture", "daily", "work"],
  },
  {
    german_text: "die Sehnsucht",
    gender: "die",
    plural: "die Sehnsüchte",
    english_meaning: "deep yearning / nostalgia / wistful longing",
    example_sentence: "Er hatte große Sehnsucht nach den Bergen.",
    cefr_level: "B1",
    tags: ["emotions", "advanced", "culture"],
  },
  {
    german_text: "das Abenteuer",
    gender: "das",
    plural: "die Abenteuer",
    english_meaning: "adventure",
    example_sentence: "Jede neue Reise ist ein spannendes Abenteuer.",
    cefr_level: "A2",
    tags: ["travel", "life"],
  },
  {
    german_text: "der Schlüssel",
    gender: "der",
    plural: "die Schlüssel",
    english_meaning: "key",
    example_sentence: "Ich habe meinen Wohnungsschlüssel auf dem Tisch vergessen.",
    cefr_level: "A1",
    tags: ["everyday", "household"],
  },
  {
    german_text: "die Gemütlichkeit",
    gender: "die",
    plural: "-",
    english_meaning: "warm coziness / unhurried comfort and peace",
    example_sentence: "Bei Kerzenschein und Tee herrschte pure Gemütlichkeit.",
    cefr_level: "B1",
    tags: ["culture", "emotions"],
  },
  {
    german_text: "das Fingerspitzengefühl",
    gender: "das",
    plural: "-",
    english_meaning: "tact / delicacy / intuitive flair",
    example_sentence: "In dieser heiklen Verhandlung brauchte er viel Fingerspitzengefühl.",
    cefr_level: "B2",
    tags: ["professional", "idioms"],
  },
  {
    german_text: "der Fortschritt",
    gender: "der",
    plural: "die Fortschritte",
    english_meaning: "progress / advancement",
    example_sentence: "Mit täglicher Übung macht Sahil spürbare Fortschritte auf Deutsch.",
    cefr_level: "B1",
    tags: ["learning", "career"],
  },
  {
    german_text: "die Herausforderung",
    gender: "die",
    plural: "die Herausforderungen",
    english_meaning: "challenge",
    example_sentence: "Die deutsche Grammatik ist eine reizvolle Herausforderung.",
    cefr_level: "B1",
    tags: ["learning", "mindset"],
  },
  {
    german_text: "das Ziel",
    gender: "das",
    plural: "die Ziele",
    english_meaning: "goal / destination / target",
    example_sentence: "Mein Ziel ist es, fließend Deutsch zu sprechen.",
    cefr_level: "A1",
    tags: ["mindset", "goals"],
  },
  {
    german_text: "der Wortschatz",
    gender: "der",
    plural: "die Wortschätze",
    english_meaning: "vocabulary",
    example_sentence: "Mit Karteikarten erweitert man seinen Wortschatz spielerisch.",
    cefr_level: "A2",
    tags: ["learning", "language"],
  },
  {
    german_text: "die Entscheidung",
    gender: "die",
    plural: "die Entscheidungen",
    english_meaning: "decision",
    example_sentence: "Er traf eine wohlüberlegte Entscheidung für seine Zukunft.",
    cefr_level: "B1",
    tags: ["career", "life"],
  },
  {
    german_text: "das Selbstvertrauen",
    gender: "das",
    plural: "-",
    english_meaning: "self-confidence",
    example_sentence: "Regelmäßiges Sprechen stärkt das Selbstvertrauen ungemein.",
    cefr_level: "B2",
    tags: ["mindset", "speaking"],
  },
];

export interface CuratedGrammarNote {
  title: string;
  cefr_level: CefrLevel;
  topic: string;
  tags: string[];
  content: string;
  rules: Array<{ rule: string; example: string }>;
}

export const CURATED_GRAMMAR_NOTES: CuratedGrammarNote[] = [
  {
    title: "German Articles & The 4 Cases Overview",
    cefr_level: "A1",
    topic: "Articles & Cases",
    tags: ["basics", "nominativ", "akkusativ", "dativ"],
    content: `
German nouns have three genders: masculine (**der**), feminine (**die**), and neuter (**das**).
The article changes based on the grammatical case (function in the sentence):
- **Nominativ**: Subject of the sentence (who is acting?)
- **Akkusativ**: Direct object (what/who receives the action?)
- **Dativ**: Indirect object (to whom / for whom is the action done?)
- **Genitiv**: Possession (whose?)
    `.trim(),
    rules: [
      {
        rule: "Masculine 'der' changes to 'den' in Akkusativ, while feminine 'die' and neuter 'das' stay the same.",
        example: "Ich habe **einen** Schlüssel (m). / Ich sehe **das** Buch (n).",
      },
      {
        rule: "In Dativ, 'der' and 'das' become 'dem', while 'die' becomes 'der'. Plural becomes 'den + n'.",
        example: "Ich helfe **dem** Mann (m) und **der** Frau (f).",
      },
    ],
  },
  {
    title: "Separable Verbs (Trennbare Verben)",
    cefr_level: "A2",
    topic: "Verbs",
    tags: ["verbs", "sentence-structure"],
    content: `
Many German verbs have prefixes that detach and move to the end of the clause in main sentences in the present tense:
Common separable prefixes: **an-**, **auf-**, **aus-**, **ein-**, **mit-**, **vor-**, **zurück-**.
In subordinate clauses (Nebensätze) with *weil* or *dass*, the prefix does NOT detach.
    `.trim(),
    rules: [
      {
        rule: "In a main clause, the conjugated stem stays in position 2, and the prefix moves to the absolute end.",
        example: "Sahil **steht** jeden Morgen um 7 Uhr **auf** (aufstehen).",
      },
      {
        rule: "With modal verbs, the separable verb stays intact in infinitive form at the end.",
        example: "Ich muss morgen früh **aufstehen**.",
      },
    ],
  },
  {
    title: "Past Tense: Das Perfekt (haben vs. sein)",
    cefr_level: "A2",
    topic: "Tenses",
    tags: ["past-tense", "perfekt", "verbs"],
    content: `
In spoken German, past events are almost always described using **Das Perfekt** (auxiliary verb *haben* or *sein* + Partizip II at the end).
Most verbs use **haben**.
Verbs use **sein** if they indicate:
1. Movement from point A to B (*gehen, fahren, fliegen, kommen*)
2. Change of state (*aufwachen, einschlafen, sterben*)
3. The verbs: *sein, werden, bleiben*.
    `.trim(),
    rules: [
      {
        rule: "Movement / state change: use sein in present tense + Partizip II at the end.",
        example: "Wir **sind** nach Berlin **geflogen**.",
      },
      {
        rule: "Actions without change of state: use haben in present tense + Partizip II at the end.",
        example: "Er **hat** fleißig Deutsch **gelernt**.",
      },
    ],
  },
  {
    title: "Konjunktiv II: Politeness & Hypotheticals",
    cefr_level: "B1",
    topic: "Moods",
    tags: ["politeness", "wishes", "konjunktiv"],
    content: `
Konjunktiv II is used for:
1. Ultra-polite requests (*Könnten Sie bitte... / Ich hätte gern...*)
2. Wishes and daydreams (*Wenn ich Zeit hätte, würde ich...*)
3. Hypothetical conditions (*Wenn das Wetter besser wäre...*)
Usually formed with **würde + infinitive**, except for *sein (wäre)*, *haben (hätte)*, and modal verbs (*könnte, müsste, dürfte*).
    `.trim(),
    rules: [
      {
        rule: "Use 'Ich hätte gern...' instead of 'Ich will...' for natural polite ordering.",
        example: "Ich **hätte gern** einen Kaffee, bitte.",
      },
      {
        rule: "Conditional hypothetical: 'Wenn ich reich **wäre**, **würde** ich die Welt bereisen.'",
        example: "Wenn ich fließend Deutsch spräche, zöge ich nach München.",
      },
    ],
  },
];

export interface WritingPrompt {
  id: string;
  title: string;
  cefr_level: CefrLevel;
  topic: string;
  guidance: string;
  suggestedWords: string[];
}

export const WRITING_PROMPTS: WritingPrompt[] = [
  {
    id: "prompt-a1-routine",
    title: "Mein typischer Tag (My Typical Day)",
    cefr_level: "A1",
    topic: "Daily Life",
    guidance: "Write 4-6 sentences about what time you get up, what you eat for breakfast, when you study coding, and when you sleep.",
    suggestedWords: ["aufstehen", "frühstücken", "programmieren", "Kaffee", "schlafen"],
  },
  {
    id: "prompt-a2-weekend",
    title: "Mein letztes Wochenende (My Last Weekend)",
    cefr_level: "A2",
    topic: "Past Events",
    guidance: "Narrate in 'Das Perfekt' tense: Where did you go? Who did you meet? What did you eat or cook?",
    suggestedWords: ["ich bin gegangen", "ich habe gegessen", "Freunde getroffen", "entspannt"],
  },
  {
    id: "prompt-b1-germany",
    title: "Warum ich Deutsch lerne (Why I Am Learning German)",
    cefr_level: "B1",
    topic: "Personal Motivation",
    guidance: "Explain your motivation: software development opportunities in Germany, love for the language, or cultural goals. Use 'weil' and 'obwohl'.",
    suggestedWords: ["die Karriere", "weil", "obwohl", "die Zukunft", "Möglichkeiten"],
  },
  {
    id: "prompt-b2-ai",
    title: "Künstliche Intelligenz in der Softwareentwicklung",
    cefr_level: "B2",
    topic: "Technology & Society",
    guidance: "Discuss the pros and cons of AI coding assistants like Gemini or Copilot. How will developer roles evolve over the next five years?",
    suggestedWords: ["die Produktivität", "die Automatisierung", "einerseits... andererseits", "unverzichtbar"],
  },
];

export interface DailyGermanEntry {
  dayOfYear: number;
  word: string;
  gender: GermanGender | null;
  plural: string | null;
  meaning: string;
  exampleGerman: string;
  exampleEnglish: string;
  cefr_level: CefrLevel;
  sentenceGerman: string;
  sentenceEnglish: string;
  grammarNote: string;
}

export const DAILY_GERMAN_BANK: DailyGermanEntry[] = [
  {
    dayOfYear: 0,
    word: "der Sonnenaufgang",
    gender: "der",
    plural: "die Sonnenaufgänge",
    meaning: "sunrise",
    exampleGerman: "Der Sonnenaufgang an der Küste war atemberaubend schön.",
    exampleEnglish: "The sunrise on the coast was breathtakingly beautiful.",
    cefr_level: "A2",
    sentenceGerman: "Jeder neue Tag bringt neue Chancen und klare Gedanken.",
    sentenceEnglish: "Every new day brings new opportunities and clear thoughts.",
    grammarNote: "Compound noun: die Sonne + der Aufgang = der Sonnenaufgang (gender follows last component).",
  },
  {
    dayOfYear: 1,
    word: "die Beharrlichkeit",
    gender: "die",
    plural: "-",
    meaning: "perseverance / persistence / grit",
    exampleGerman: "Mit ruhiger Beharrlichkeit löst er auch die schwersten Programmieraufgaben.",
    exampleEnglish: "With calm perseverance, he solves even the most difficult programming tasks.",
    cefr_level: "B2",
    sentenceGerman: "Kleine Schritte führen mit Beständigkeit zu großen Zielen.",
    sentenceEnglish: "Small steps with consistency lead to grand goals.",
    grammarNote: "Nouns ending in -keit or -heit are ALWAYS feminine (die).",
  },
  {
    dayOfYear: 2,
    word: "das Fernweh",
    gender: "das",
    plural: "-",
    meaning: "longing for distant places / wanderlust",
    exampleGerman: "Wenn ich die Fotos vom Meer betrachte, packt mich das Fernweh.",
    exampleEnglish: "When I look at the photos of the sea, wanderlust takes hold of me.",
    cefr_level: "B1",
    sentenceGerman: "Die Welt ist ein Buch, und wer nicht reist, liest nur eine Seite.",
    sentenceEnglish: "The world is a book, and those who do not travel read only one page.",
    grammarNote: "Opposite of Heimweh (homesickness). Compound with das Weh (pain/ache).",
  },
  {
    dayOfYear: 3,
    word: "der Durchbruch",
    gender: "der",
    plural: "die Durchbrüche",
    meaning: "breakthrough",
    exampleGerman: "Nach stundenlangem Debuggen gelang ihm endlich der Durchbruch.",
    exampleEnglish: "After hours of debugging, he finally achieved a breakthrough.",
    cefr_level: "B1",
    sentenceGerman: "Geduld ist der Schlüssel zu jeder meisterhaften Fertigkeit.",
    sentenceEnglish: "Patience is the key to every master craft.",
    grammarNote: "Separable verb: durchbrechen -> noun: der Durchbruch.",
  },
  {
    dayOfYear: 4,
    word: "die Neugier",
    gender: "die",
    plural: "-",
    meaning: "curiosity / inquisitiveness",
    exampleGerman: "Gesunde Neugier treibt jeden guten Entwickler voran.",
    exampleEnglish: "Healthy curiosity drives every good developer forward.",
    cefr_level: "A2",
    sentenceGerman: "Wer neugierig bleibt, lernt ein Leben lang mit Freude.",
    sentenceEnglish: "He who remains curious learns for a lifetime with joy.",
    grammarNote: "Adjective: neugierig (curious).",
  },
  {
    dayOfYear: 5,
    word: "das Gleichgewicht",
    gender: "das",
    plural: "die Gleichgewichte",
    meaning: "balance / equilibrium",
    exampleGerman: "Er hält die perfekte Balance zwischen konzentrierter Arbeit und Erholung.",
    exampleEnglish: "He maintains the perfect balance between focused work and rest.",
    cefr_level: "B1",
    sentenceGerman: "In der Ruhe liegt die wahre Kraft des Geistes.",
    sentenceEnglish: "In calm lies the true strength of the mind.",
    grammarNote: "Compound: gleich (equal) + das Gewicht (weight) = das Gleichgewicht.",
  },
  {
    dayOfYear: 6,
    word: "der Meilenstein",
    gender: "der",
    plural: "die Meilensteine",
    meaning: "milestone",
    exampleGerman: "Der heutige Projektabschluss ist ein wichtiger Meilenstein für Sahil.",
    exampleEnglish: "Today's project completion is an important milestone for Sahil.",
    cefr_level: "A2",
    sentenceGerman: "Feiere jeden Meilenstein, egal wie klein er scheint.",
    sentenceEnglish: "Celebrate every milestone, no matter how small it seems.",
    grammarNote: "die Meile + der Stein = der Meilenstein.",
  },
];
