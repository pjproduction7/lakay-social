import en from '../locales/en.json';
import ht from '../locales/ht.json';
import fr from '../locales/fr.json';
import es from '../locales/es.json';

const translations = { en, ht, fr, es };

let currentLanguage = 'en';

export function setLanguage(lang) {
  if (translations[lang]) {
    currentLanguage = lang;
    localStorage.setItem('lakay_language', lang);
  }
}

export function getLanguage() {
  return currentLanguage;
}

export function t(key) {
  return translations[currentLanguage]?.[key] || key;
}

export function loadLanguage() {
  const saved = localStorage.getItem('lakay_language');
  if (saved && translations[saved]) {
    currentLanguage = saved;
  }
}

// Initialize
loadLanguage();

export default { setLanguage, getLanguage, t, loadLanguage };