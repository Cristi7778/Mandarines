const APPLY_TONE: Record<string, string[]> = {
  a: ['ā', 'á', 'ǎ', 'à'],
  e: ['ē', 'é', 'ě', 'è'],
  i: ['ī', 'í', 'ǐ', 'ì'],
  o: ['ō', 'ó', 'ǒ', 'ò'],
  u: ['ū', 'ú', 'ǔ', 'ù'],
  v: ['ǖ', 'ǘ', 'ǚ', 'ǜ'],
};

function applyToneToSyllable(syllable: string, tone: number): string {
  if (tone < 1 || tone > 4) return syllable;

  if (/[ae]/.test(syllable)) {
    return syllable.replace(/[ae]/, ch => APPLY_TONE[ch]![tone - 1]);
  }
  if (syllable.includes('ou')) {
    return syllable.replace('o', APPLY_TONE['o']![tone - 1]);
  }

  const vowels = new Set(['a', 'e', 'i', 'o', 'u', 'v']);
  let lastIdx = -1;
  let lastCh = '';
  for (let i = 0; i < syllable.length; i++) {
    if (vowels.has(syllable[i])) { lastIdx = i; lastCh = syllable[i]; }
  }
  if (lastIdx === -1) return syllable;
  return (
    syllable.slice(0, lastIdx) +
    (APPLY_TONE[lastCh]?.[tone - 1] ?? lastCh) +
    syllable.slice(lastIdx + 1)
  );
}

export function toToneMarks(input: string): string {
  return input.toLowerCase().replace(/([a-z]+)([1-5]?)/gi, (_, syl, toneStr) =>
    applyToneToSyllable(syl, toneStr ? parseInt(toneStr, 10) : 5)
  );
}

export function comparePinyin(userInput: string, correct: string): boolean {
  const norm = (s: string) =>
    toToneMarks(s.trim())
      .replace(/\s+/g, '')
      .toLowerCase();
  return norm(userInput) === norm(correct);
}
