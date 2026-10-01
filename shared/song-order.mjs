// The displayed source text and stable song IDs are never rewritten for sorting.
const collators = {
  latin: new Intl.Collator('en', { usage: 'sort', sensitivity: 'base', numeric: true }),
  cyrillic: new Intl.Collator('ru', { usage: 'sort', sensitivity: 'base', numeric: true }),
};

export function splitSongText(text) {
  const value = String(text ?? '');
  // Accept the source's spaced hyphens, en dashes, and "killiana- Асфальт";
  // an internal hyphen such as "Рок-острова" remains part of the artist.
  const separator = /\s+[-–—]\s*|[-–—]\s+/u.exec(value);
  if (!separator) return { artist: '', title: value.trim() };
  return { artist: value.slice(0, separator.index).trim(), title: value.slice(separator.index + separator[0].length).trim() };
}

function normalized(value) {
  return value.normalize('NFKC').toLocaleLowerCase('ru-RU').replaceAll('ё', 'е').replace(/[^\p{L}\p{N}]/gu, '');
}
function alphabet(value) {
  const firstLetter = value.match(/\p{L}/u)?.[0] ?? '';
  if (/\p{Script=Latin}/u.test(firstLetter)) return 0;
  if (/\p{Script=Cyrillic}/u.test(firstLetter)) return 1;
  return 2;
}
function compareWords(left, right) {
  const a = normalized(left), b = normalized(right);
  const family = alphabet(a) - alphabet(b);
  if (family) return family;
  return (alphabet(a) === 1 ? collators.cyrillic : collators.latin).compare(a, b);
}
export function compareSongs(left, right) {
  const a = splitSongText(left.text), b = splitSongText(right.text);
  const byArtist = compareWords(a.artist, b.artist);
  if (byArtist) return byArtist;
  const byTitle = compareWords(a.title, b.title);
  if (byTitle) return byTitle;
  const aId = String(left.id ?? ''), bId = String(right.id ?? '');
  return aId < bId ? -1 : aId > bId ? 1 : 0;
}
export function sortSongs(songs) {
  return [...songs].sort(compareSongs);
}
