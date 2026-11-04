import { RAW_FOCUS_1_TO_34 } from '../data/rawFocus1to34';
import { RAW_FOCUS_35_TO_50 } from '../data/rawFocus35to50';
import {
  FocusSection,
  MasteryLevel,
  PhrasalVerb,
  QuizQuestion,
  VerbMeaning,
} from '../types/phrasal';

export function parseCompendiumData(rawText?: string): {
  focusSections: FocusSection[];
  allVerbs: PhrasalVerb[];
  particles: string[];
  baseVerbs: string[];
} {
  const combined = rawText ?? `${RAW_FOCUS_1_TO_34}\n${RAW_FOCUS_35_TO_50}`;
  const lines = combined.split(/\r?\n/);

  const focusSections: FocusSection[] = [];
  const allVerbs: PhrasalVerb[] = [];

  let currentFocus: FocusSection | null = null;
  let currentVerb: PhrasalVerb | null = null;
  let currentMeaning: VerbMeaning | null = null;
  let collectingExplanation = false;

  const finalizeMeaning = () => {
    if (currentMeaning && currentVerb) {
      currentMeaning.explanation = currentMeaning.explanation.trim();
      const bracketMatch = currentMeaning.explanation.match(/^\[([^\]]+)\]\s*(.*)$/);
      if (bracketMatch) {
        currentMeaning.usageNote = bracketMatch[1].trim();
        currentMeaning.explanation = bracketMatch[2].trim();
        if (!currentVerb.tags.includes(currentMeaning.usageNote)) {
          currentVerb.tags.push(currentMeaning.usageNote);
        }
      }
      currentVerb.meanings.push(currentMeaning);
      currentMeaning = null;
    }
    collectingExplanation = false;
  };

  const finalizeVerb = () => {
    finalizeMeaning();
    if (currentVerb && currentFocus) {
      currentFocus.verbs.push(currentVerb);
      allVerbs.push(currentVerb);
      currentVerb = null;
    }
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line || /^=+$/.test(line)) {
      continue;
    }

    const focusMatch = line.match(/^FOCUS\s+(\d+):\s*(.+)$/i);
    if (focusMatch) {
      finalizeVerb();
      const focusNumber = parseInt(focusMatch[1], 10);
      const title = focusMatch[2].trim();
      currentFocus = {
        focusNumber,
        title,
        verbs: [],
      };
      focusSections.push(currentFocus);
      continue;
    }

    const meaningMatch = line.match(/^MEANING\s+(\d+):$/i);
    if (meaningMatch && currentVerb) {
      finalizeMeaning();
      const meaningNumber = parseInt(meaningMatch[1], 10);
      currentMeaning = {
        id: `${currentVerb.id}-m${meaningNumber}`,
        meaningNumber,
        explanation: '',
        examples: [],
      };
      collectingExplanation = true;
      continue;
    }

    const exampleMatch = line.match(/^Example\s+\d+(?:\s*\(added\))?:\s*(.+)$/i);
    if (exampleMatch && currentMeaning) {
      collectingExplanation = false;
      const exampleText = exampleMatch[1].trim();
      if (exampleText) {
        currentMeaning.examples.push(exampleText);
      }
      continue;
    }

    // Detect uppercase verb heading inside a focus section
    if (
      currentFocus &&
      /^[A-Z][A-Z\s-]+$/.test(line) &&
      !line.startsWith('FOCUS ') &&
      !line.startsWith('MEANING ')
    ) {
      finalizeVerb();
      const verbName = line.trim();
      const words = verbName.split(/\s+/);
      const baseVerb = words[0];
      const particle = words.slice(1).join(' ') || '';
      const slug = verbName.toLowerCase().replace(/\s+/g, '-');
      const tags: string[] = [];
      if (words.length >= 3) {
        tags.push('3-word verb');
      }
      if ( currentFocus.title.toLowerCase().includes('passive')) {
        tags.push('passive focus');
      }
      if (currentFocus.title.toLowerCase().includes('gerund')) {
        tags.push('gerund focus');
      }
      if (currentFocus.title.toLowerCase().includes('noun')) {
        tags.push('noun form');
      }

      currentVerb = {
        id: `f${currentFocus.focusNumber}-${slug}`,
        verb: verbName,
        baseVerb,
        particle,
        wordCount: words.length,
        focusNumber: currentFocus.focusNumber,
        focusTitle: currentFocus.title,
        meanings: [],
        tags,
      };
      continue;
    }

    if (collectingExplanation && currentMeaning) {
      currentMeaning.explanation += (currentMeaning.explanation ? ' ' : '') + line;
    }
  }

  finalizeVerb();

  const particleSet = new Set<string>();
  const baseVerbSet = new Set<string>();
  for (const v of allVerbs) {
    if (v.particle) particleSet.add(v.particle);
    if (v.baseVerb) baseVerbSet.add(v.baseVerb);
  }

  return {
    focusSections,
    allVerbs,
    particles: Array.from(particleSet).sort(),
    baseVerbs: Array.from(baseVerbSet).sort(),
  };
}

export interface FilterCriteria {
  searchQuery?: string;
  focusNumber?: number | 'all';
  particle?: string | 'all';
  wordCount?: number | 'all';
  masteryFilter?: MasteryLevel | 'all' | 'bookmarked';
  masteryMap?: Record<string, MasteryLevel>;
  bookmarks?: string[];
}

export function filterPhrasalVerbs(
  verbs: PhrasalVerb[],
  criteria: FilterCriteria
): PhrasalVerb[] {
  const query = (criteria.searchQuery ?? '').trim().toLowerCase();
  const focusNum = criteria.focusNumber ?? 'all';
  const particle = criteria.particle ?? 'all';
  const wordCount = criteria.wordCount ?? 'all';
  const masteryFilter = criteria.masteryFilter ?? 'all';
  const masteryMap = criteria.masteryMap ?? {};
  const bookmarks = criteria.bookmarks ?? [];

  return verbs.filter((item) => {
    if (focusNum !== 'all' && item.focusNumber !== focusNum) {
      return false;
    }
    if (particle !== 'all' && item.particle !== particle) {
      return false;
    }
    if (wordCount !== 'all' && item.wordCount !== wordCount) {
      return false;
    }
    if (masteryFilter === 'bookmarked') {
      if (!bookmarks.includes(item.id)) return false;
    } else if (masteryFilter !== 'all') {
      const status = masteryMap[item.id] ?? 'new';
      if (status !== masteryFilter) return false;
    }

    if (!query) return true;

    if (item.verb.toLowerCase().includes(query)) return true;
    if (item.focusTitle.toLowerCase().includes(query)) return true;
    if (`focus ${item.focusNumber}` === query) return true;

    for (const m of item.meanings) {
      if (m.explanation.toLowerCase().includes(query)) return true;
      if (m.usageNote && m.usageNote.toLowerCase().includes(query)) return true;
      for (const ex of m.examples) {
        if (ex.toLowerCase().includes(query)) return true;
      }
    }

    return false;
  });
}

export function calculateProgressStats(
  allVerbs: PhrasalVerb[],
  masteryMap: Record<string, MasteryLevel>,
  bookmarks: string[]
) {
  let masteredCount = 0;
  let learningCount = 0;
  let newCount = 0;

  for (const v of allVerbs) {
    const level = masteryMap[v.id] ?? 'new';
    if (level === 'mastered') masteredCount++;
    else if (level === 'learning') learningCount++;
    else newCount++;
  }

  const totalVerbs = allVerbs.length;
  const totalMeanings = allVerbs.reduce((acc, v) => acc + v.meanings.length, 0);
  const totalExamples = allVerbs.reduce(
    (acc, v) => acc + v.meanings.reduce((mAcc, m) => mAcc + m.examples.length, 0),
    0
  );
  const masteryPercentage =
    totalVerbs > 0 ? Math.round((masteredCount / totalVerbs) * 100) : 0;

  return {
    totalVerbs,
    totalMeanings,
    totalExamples,
    masteredCount,
    learningCount,
    newCount,
    bookmarkedCount: bookmarks.length,
    masteryPercentage,
  };
}

export function blankOutPhrasalVerb(example: string, verb: string): string {
  const words = verb.toLowerCase().split(/\s+/);
  const base = words[0];
  const rest = words.slice(1).join('\\s+');

  // Common inflections of base verb
  const inflections = [
    base,
    `${base}s`,
    `${base}es`,
    `${base}ed`,
    `${base}d`,
    `${base}ing`,
    base.endsWith('e') ? `${base.slice(0, -1)}ing` : `${base}ing`,
  ];

  // Irregular verb roots map
  const irregulars: Record<string, string[]> = {
    come: ['come', 'comes', 'came', 'coming'],
    put: ['put', 'puts', 'putting'],
    run: ['run', 'runs', 'ran', 'running'],
    take: ['take', 'takes', 'took', 'taken', 'taking'],
    give: ['give', 'gives', 'gave', 'given', 'giving'],
    fall: ['fall', 'falls', 'fell', 'fallen', 'falling'],
    throw: ['throw', 'throws', 'threw', 'thrown', 'throwing'],
    get: ['get', 'gets', 'got', 'gotten', 'getting'],
    go: ['go', 'goes', 'went', 'gone', 'going'],
    break: ['break', 'breaks', 'broke', 'broken', 'breaking'],
    find: ['find', 'finds', 'found', 'finding'],
    set: ['set', 'sets', 'setting'],
    cut: ['cut', 'cuts', 'cutting'],
    hold: ['hold', 'holds', 'held', 'holding'],
    let: ['let', 'lets', 'letting'],
    see: ['see', 'sees', 'saw', 'seen', 'seeing'],
    fight: ['fight', 'fights', 'fought', 'fighting'],
    hear: ['hear', 'hears', 'heard', 'hearing'],
    ring: ['ring', 'rings', 'rang', 'rung', 'ringing'],
    tear: ['tear', 'tears', 'tore', 'torn', 'tearing'],
    catch: ['catch', 'catches', 'caught', 'catching'],
    hang: ['hang', 'hangs', 'hung', 'hanging'],
    grow: ['grow', 'grows', 'grew', 'grown', 'growing'],
    lay: ['lay', 'lays', 'laid', 'laying'],
    wake: ['wake', 'wakes', 'woke', 'woken', 'waking'],
    hit: ['hit', 'hits', 'hitting'],
    leave: ['leave', 'leaves', 'left', 'leaving'],
    light: ['light', 'lights', 'lit', 'lighted', 'lighting'],
    stick: ['stick', 'sticks', 'stuck', 'sticking'],
    wind: ['wind', 'winds', 'wound', 'winding'],
    blow: ['blow', 'blows', 'blew', 'blown', 'blowing'],
    tell: ['tell', 'tells', 'told', 'telling'],
    keep: ['keep', 'keeps', 'kept', 'keeping'],
    think: ['think', 'thinks', 'thought', 'thinking'],
    wear: ['wear', 'wears', 'wore', 'worn', 'wearing'],
    stand: ['stand', 'stands', 'stood', 'standing'],
    bring: ['bring', 'brings', 'brought', 'bringing'],
    lie: ['lie', 'lies', 'lay', 'lain', 'lying'],
    eat: ['eat', 'eats', 'ate', 'eaten', 'eating'],
    pay: ['pay', 'pays', 'paid', 'paying'],
    make: ['make', 'makes', 'made', 'making'],
    shake: ['shake', 'shakes', 'shook', 'shaken', 'shaking'],
    do: ['do', 'does', 'did', 'done', 'doing'],
    have: ['have', 'has', 'had', 'having'],
    shut: ['shut', 'shuts', 'shutting'],
    bite: ['bite', 'bites', 'bit', 'bitten', 'biting'],
    know: ['know', 'knows', 'knew', 'known', 'knowing'],
    lead: ['lead', 'leads', 'led', 'leading'],
    sit: ['sit', 'sits', 'sat', 'sitting'],
    write: ['write', 'writes', 'wrote', 'written', 'writing'],
    deal: ['deal', 'deals', 'dealt', 'dealing'],
    sell: ['sell', 'sells', 'sold', 'selling'],
    beat: ['beat', 'beats', 'beaten', 'beating'],
  };

  const forms = irregulars[base] ?? inflections;
  const formPattern = forms.join('|');

  // Direct adjacent match: e.g. "took off"
  const directRegex = new RegExp(`\\b(${formPattern})\\s+${rest}\\b`, 'i');
  if (directRegex.test(example)) {
    return example.replace(directRegex, '________');
  }

  // Separated match: e.g. "took his clothes off"
  const separatedRegex = new RegExp(
    `\\b(${formPattern})\\b\\s+([^.,;!?]{1,25}?)\\s+\\b(${rest})\\b`,
    'i'
  );
  if (separatedRegex.test(example)) {
    return example.replace(separatedRegex, '____ $2 ____');
  }

  return `${example} (Target verb: ________)`;
}

export function generateQuizQuestions(
  verbs: PhrasalVerb[],
  count: number = 10,
  seedOffset: number = 0
): QuizQuestion[] {
  if (verbs.length === 0) return [];

  const questions: QuizQuestion[] = [];
  const pool = [...verbs];

  for (let i = 0; i < Math.min(count, pool.length); i++) {
    const idx = (i * 7 + seedOffset) % pool.length;
    const targetVerb = pool[idx];
    const meaning = targetVerb.meanings[i % targetVerb.meanings.length];
    const example =
      meaning.examples[i % meaning.examples.length] ??
      meaning.examples[0] ??
      '';

    const isBlankType = i % 2 === 0 && example.length > 0;

    // Pick 3 distractors
    const distractors: string[] = [];
    let step = 1;
    while (distractors.length < 3 && step < pool.length) {
      const candidate = pool[(idx + step * 5 + 1) % pool.length];
      if (
        candidate.verb !== targetVerb.verb &&
        !distractors.includes(candidate.verb)
      ) {
        distractors.push(candidate.verb);
      }
      step++;
    }

    const rawOptions = [targetVerb.verb, ...distractors];
    // Deterministic rotation of options
    const options = rawOptions.map(
      (_, oIdx) => rawOptions[(oIdx + i + seedOffset) % rawOptions.length]
    );

    if (isBlankType) {
      const blanked = blankOutPhrasalVerb(example, targetVerb.verb);
      questions.push({
        id: `q-${targetVerb.id}-${i}`,
        type: 'sentence-blank',
        verbId: targetVerb.id,
        verb: targetVerb.verb,
        focusNumber: targetVerb.focusNumber,
        focusTitle: targetVerb.focusTitle,
        prompt: blanked,
        contextHint: meaning.explanation,
        options,
        correctAnswer: targetVerb.verb,
        explanation: meaning.explanation,
        fullExample: example,
      });
    } else {
      questions.push({
        id: `q-${targetVerb.id}-${i}`,
        type: 'meaning-match',
        verbId: targetVerb.id,
        verb: targetVerb.verb,
        focusNumber: targetVerb.focusNumber,
        focusTitle: targetVerb.focusTitle,
        prompt: meaning.explanation,
        contextHint: example ? `Example context: "${blankOutPhrasalVerb(example, targetVerb.verb)}"` : '',
        options,
        correctAnswer: targetVerb.verb,
        explanation: meaning.explanation,
        fullExample: example,
      });
    }
  }

  return questions;
}
