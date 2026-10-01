import { source } from './catalog.mjs?v=20261001-artist-order';
import { sortSongs, splitSongText } from '../shared/song-order.mjs?v=20261001-artist-order';
import { CHOICES, CHOICE_LABELS, createCatalog, countChoices, createTextList, MAX_SKIPPED_SONGS } from './model.mjs?v=20261001-artist-order';
import { readRepertoireDraft, saveRepertoireDraft } from '../shared/preferences.mjs?v=20261001-artist-order';
import {initRequestForm} from '../request-form.mjs?v=20261001-artist-order';
import {initPrivacyUI} from '../shared/privacy-ui.mjs?v=20260929-copy-form';

function initRepertoire() {
const $ = (selector) => document.querySelector(selector);
const catalog = sortSongs(createCatalog(source));
let choices = readRepertoireDraft();
function updateStorageNote() {
  const note = $('#storage-status');
  note.classList.remove('is-unavailable');
  note.textContent = 'Выбор действует только пока открыта эта страница. После обновления отметки сбросятся';
}
function updateSelection() { saveRepertoireDraft(choices); }

function updateCounts() {
  const counts = countChoices(catalog, choices);
  for (const choice of CHOICES) $(`#count-${choice}`).textContent = counts[choice];
  for (const [id, row] of rows) row.querySelector('[value="skip"]').disabled = counts.skip >= MAX_SKIPPED_SONGS && choices[id] !== 'skip';
  $('#skip-limit-note').textContent = counts.skip >= MAX_SKIPPED_SONGS ? 'Лимит 20 песен. Чтобы исключить другую, снимите одну отметку «Не надо»' : '«Не надо» можно отметить не больше 20 песен';
  $('#reset-open').disabled = counts.want + counts.skip === 0;
  $('#want-all-open').disabled = counts.want === catalog.length;
  $('#export-preview').value = createTextList(catalog, choices);
}
const rows = new Map();
const fragment = document.createDocumentFragment();
for (const [index, song] of catalog.entries()) {
  const row = document.createElement('li');
  row.className = 'song-row';
  row.dataset.songId = song.id;
  const info = document.createElement('div');
  info.className = 'song-info';
  const number = document.createElement('span');
  number.className = 'song-number';
  number.textContent = String(index + 1).padStart(2, '0');
  number.setAttribute('aria-hidden', 'true');
  const heading = document.createElement('h3');
  heading.id = `${song.id}-title`;
  const {artist, title} = splitSongText(song.text);
  heading.textContent = artist;
  const songLabel = [artist, title].filter(Boolean).join(': ');
  heading.setAttribute('aria-label', songLabel + (song.recommended ? ', рекомендует группа' : ''));
  const track = document.createElement('span');
  track.className = 'song-title';
  track.textContent = title;
  if (song.recommended) {
    row.dataset.recommended = 'true';
    track.title = 'Рекомендует группа';
    track.insertAdjacentHTML('beforeend', "<svg class=\"recommendation-heart\" width=\"16\" height=\"16\" viewBox=\"0 0 24 24\" fill=\"currentColor\" aria-hidden=\"true\" focusable=\"false\"><path d=\"M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78L12 21.23l8.84-8.84a5.5 5.5 0 0 0 0-7.78Z\"/demo-version/></svg>");
  }
  info.append(number, heading, track);
  const fieldset = document.createElement('fieldset');
  fieldset.className = 'song-choices';
  const legend = document.createElement('legend');
  legend.className = 'sr-only';
  legend.textContent = `Предпочтение: ${songLabel}`;
  fieldset.append(legend);
  for (const choice of CHOICES) {
    const label = document.createElement('label');
    const input = document.createElement('input');
    input.type = 'radio';
    input.name = song.id;
    input.value = choice;
    if (choice === 'skip') input.setAttribute('aria-describedby', 'skip-limit-note');
    input.checked = choices[song.id] === choice;
    const text = document.createElement('span');
    text.textContent = CHOICE_LABELS[choice];
    label.append(input, text);
    fieldset.append(label);
  }
  row.append(info, fieldset);
  fragment.append(row);
  rows.set(song.id, row);
}
$('#song-list').append(fragment);
function syncControls() {
  for (const [id, row] of rows) row.querySelector(`[value="${choices[id]}"]`).checked = true;
  updateCounts();
  updateStorageNote();
}
$('#song-list').addEventListener('change', (event) => {
  const input = event.target;
  if (!(input instanceof HTMLInputElement) || !Object.hasOwn(choices, input.name) || !CHOICES.includes(input.value)) return;
  if (input.value === 'skip' && choices[input.name] !== 'skip' && countChoices(catalog, choices).skip >= MAX_SKIPPED_SONGS) { syncControls(); return; }
  choices[input.name] = input.value;
  updateSelection();
  updateCounts();
  $('#export-status').textContent = '';
});
function applyAll(choice) {
  choices = Object.fromEntries(catalog.map(({ id }) => [id, choice]));
  updateSelection();
  syncControls();
  $('#export-status').textContent = choice === 'want' ? 'Все 110 позиций отмечены «Хочу». Любую отметку можно изменить' : 'Отметки сброшены. Все песни снова «Можно»';
}
function setupConfirmation(buttonId, dialogId, returnValue, message, action) {
  const button = $(buttonId);
  const dialog = $(dialogId);
  button.addEventListener('click', () => {
    if (typeof dialog.showModal === 'function') { dialog.returnValue = ''; dialog.showModal(); }
    else if (window.confirm(message)) action();
  });
  dialog.addEventListener('close', () => {
    if (dialog.returnValue !== returnValue) return;
    action();
    // The action may disable the trigger; keep keyboard focus on a visible control.
    $('.selection-summary > a[href="#send-selection"]').focus({ preventScroll: true });
  });
}
setupConfirmation('#reset-open', '#reset-dialog', 'reset', 'Сбросить отметки всех 110 песен? Все песни станут «Можно»', () => applyAll('maybe'));
setupConfirmation('#want-all-open', '#want-all-dialog', 'want-all', 'Отметить все 110 позиций «Хочу»?', () => applyAll('want'));
$('#download-list').addEventListener('click', () => {
  const url = URL.createObjectURL(new Blob(['\uFEFF', createTextList(catalog, choices)], { type: 'text/plain;charset=utf-8' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = 'Станция Мир, мои пожелания.txt';
  document.body.append(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 10000);
  $('#export-status').textContent = 'Копия списка подготовлена к скачиванию';
});
$('#copy-list').addEventListener('click', async () => {
  const button = $('#copy-list');
  const text = createTextList(catalog, choices);
  button.disabled = true;
  try {
    if (!navigator.clipboard?.writeText) throw new Error('Clipboard unavailable');
    await navigator.clipboard.writeText(text);
    $('#export-status').textContent = 'Список скопирован';
  } catch {
    $('#text-preview').open = true;
    $('#export-preview').value = text;
    $('#export-preview').focus();
    $('#export-preview').select();
    $('#export-status').textContent = 'Автоматическое копирование недоступно. Текст выделен ниже. Скопируйте его вручную или скачайте файл';
  } finally { button.disabled = false; }
});
window.addEventListener('station:repertoire-change', () => { choices = readRepertoireDraft(); syncControls(); });
$('#download-list').disabled = false;
$('#copy-list').disabled = false;
updateCounts();
$('#results-count').textContent = `${catalog.length} позиций`;
updateStorageNote();
document.documentElement.dataset.repertoireReady = 'true';
initPrivacyUI();
initRequestForm();
}
initRepertoire();
