import { sortSongs, splitSongText } from '../shared/song-order.mjs';

export const CHOICES = Object.freeze(['want', 'maybe', 'skip']);
export const MAX_SKIPPED_SONGS = 20;
export const CHOICE_LABELS = Object.freeze({ want: 'Хочу', maybe: 'Можно', skip: 'Не надо' });
export const STORAGE_KEY = 'station-mir:repertoire:v1';
export const GROUPS = Object.freeze({ ru: 'Русские песни', foreign: 'Иностранные песни' });

function stableId(text) {
  let hash = 2166136261;
  for (const char of text) hash = Math.imul(hash ^ char.codePointAt(0), 16777619) >>> 0;
  return `sm-${hash.toString(16).padStart(8, '0')}`;
}

export function createCatalog(source) {
  if (!Array.isArray(source)) throw new TypeError('Expected a song list');
  const ids = new Set();
  return source.map((song) => {
    if (!song || !Object.values(GROUPS).includes(song.group) || typeof song.text !== 'string' || !song.text.trim()) {
      throw new TypeError('Invalid song');
    }
    const id = stableId(`${song.group}\0${song.text}`);
    if (ids.has(id)) throw new TypeError('Duplicate song identity');
    ids.add(id);
    return Object.freeze({ id, group: song.group, text: song.text });
  });
}

export function defaultChoices(catalog) {
  return Object.fromEntries(catalog.map(({ id }) => [id, 'maybe']));
}

export function sanitizeChoices(catalog, value) {
  const choices = defaultChoices(catalog);
  if (!value || typeof value !== 'object' || Array.isArray(value)) return choices;
  for (const { id } of catalog) {
    if (Object.hasOwn(value, id) && CHOICES.includes(value[id])) choices[id] = value[id];
  }
  return choices;
}

export function restoreChoices(catalog, serialized) {
  try {
    const saved = JSON.parse(serialized);
    if (saved?.version !== 1) return defaultChoices(catalog);
    return sanitizeChoices(catalog, saved.choices);
  } catch {
    return defaultChoices(catalog);
  }
}

export function serializeChoices(catalog, value) {
  const choices = sanitizeChoices(catalog, value);
  // Only musical preferences are persisted; free-text notes never enter storage.
  return JSON.stringify({ version: 1, choices: Object.fromEntries(Object.entries(choices).filter(([, choice]) => choice !== 'maybe')) });
}

export function countChoices(catalog, value) {
  const choices = sanitizeChoices(catalog, value);
  return Object.values(choices).reduce((counts, choice) => ({ ...counts, [choice]: counts[choice] + 1 }), { want: 0, maybe: 0, skip: 0 });
}

export function createTextList(catalog, value, notes = '') {
  const choices = sanitizeChoices(catalog, value);
  const sortedCatalog = sortSongs(catalog);
  const lines = ['СТАНЦИЯ МИР', 'Пожелания к музыкальной программе', '', 'Пожелания к программе. Этот список не отправляется автоматически.'];
  for (const choice of CHOICES) {
    const songs = sortedCatalog.filter(({ id }) => choices[id] === choice);
    lines.push('', `${CHOICE_LABELS[choice].toLocaleUpperCase('ru-RU')} (${songs.length})`);
    lines.push(...(songs.length ? songs.map(({ text }, index) => {const {artist, title} = splitSongText(text);return `${index + 1}. ${[artist, title].filter(Boolean).join(': ')}`;}) : ['Нет отмеченных песен.']));
  }
  const cleanNotes = typeof notes === 'string' ? notes.trim().slice(0, 3000) : '';
  if (cleanNotes) lines.push('', 'ДОПОЛНИТЕЛЬНЫЕ ПОЖЕЛАНИЯ', cleanNotes);
  return `${lines.join('\n')}\n`;
}
