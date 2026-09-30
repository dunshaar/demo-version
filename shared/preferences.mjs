import { source } from '../repertoire/catalog.mjs?v=20260930-catalog89-icons';
import { createCatalog, defaultChoices, sanitizeChoices, MAX_SKIPPED_SONGS } from '../repertoire/model.mjs?v=20260930-limit20';

// Legacy keys are retained only to remove drafts made by earlier versions.
export const PRIVACY_KEY = 'station-mir:privacy:v1';
export const REPERTOIRE_KEY = 'station-mir:repertoire:v2';
export const SESSION_REPERTOIRE_KEY = 'station-mir:repertoire:session:v2';
export const LEGACY_REPERTOIRE_KEY = 'station-mir:repertoire:v1';
export const LEGACY_KEYS = Object.freeze([PRIVACY_KEY, REPERTOIRE_KEY, SESSION_REPERTOIRE_KEY, LEGACY_REPERTOIRE_KEY, 'station-mir:storage-check']);
const catalog = createCatalog(source);
const defaults = () => defaultChoices(catalog);

// Choices belong only to this live page. Storage is used solely for legacy cleanup.
export function createPreferenceStore({ local = null, session = null, emit = () => {} } = {}) {
  let memory = defaults();
  let privacyDecided = false;
  function purgeLegacy() {
    for (const storage of [local, session]) for (const key of LEGACY_KEYS) {
      try { storage?.removeItem(key); } catch { /* Storage may be blocked by the browser. */ }
    }
  }
  purgeLegacy();
  const status = () => ({ transferAvailable: false, remembered: false });
  const readDraft = () => ({ ...memory });
  function saveDraft(value) {
    const next = sanitizeChoices(catalog, value);
    if (Object.values(next).filter(choice => choice === 'skip').length > MAX_SKIPPED_SONGS) throw new RangeError(`Можно отметить «Не надо» не больше ${MAX_SKIPPED_SONGS} песен`);
    memory = next;
    emit('station:repertoire-change', { choices: readDraft(), ...status() });
    return status();
  }
  function clearDraft() {
    memory = defaults();
    purgeLegacy();
    emit('station:repertoire-change', { choices: readDraft(), ...status() });
    return readDraft();
  }
  // Compatibility while the independent cookie UI is being replaced. Song retention
  // cannot be enabled, even by an old caller passing rememberSongs: true.
  const privacy = () => ({ decided: privacyDecided, rememberSongs: false });
  function setPrivacy() {
    privacyDecided = true;
    emit('station:privacy-change', privacy());
    return privacy();
  }
  return { readRepertoireDraft: readDraft, saveRepertoireDraft: saveDraft, getPrivacyPreferences: privacy, setPrivacyPreferences: setPrivacy, clearRepertoireDraft: clearDraft, getRepertoireStorageStatus: status };
}

function browserStorage(type) { try { return globalThis.window?.[type] ?? null; } catch { return null; } }
function notify(type, detail) {
  if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent(type, { detail }));
}
const store = createPreferenceStore({ local: browserStorage('localStorage'), session: browserStorage('sessionStorage'), emit: notify });
export const readRepertoireDraft = () => store.readRepertoireDraft();
export const saveRepertoireDraft = (choices) => store.saveRepertoireDraft(choices);
export const getPrivacyPreferences = () => store.getPrivacyPreferences();
export const setPrivacyPreferences = (preferences) => store.setPrivacyPreferences(preferences);
export const clearRepertoireDraft = () => store.clearRepertoireDraft();
export const getRepertoireStorageStatus = () => store.getRepertoireStorageStatus();
