import { useEffect } from "react";

const SUPPORTED_LANGUAGES = new Set(["en", "ht", "fr", "es"]);
const SCRIPT_ID = "google-translate-script";
const CONTAINER_ID = "google_translate_container";

function ensureTranslateContainer() {
  if (typeof document === "undefined") {
    return;
  }

  if (!document.getElementById(CONTAINER_ID)) {
    const container = document.createElement("div");
    container.id = CONTAINER_ID;
    container.style.display = "none";
    container.setAttribute("aria-hidden", "true");
    document.body.appendChild(container);
  }
}

function setTranslateCookie(lang) {
  if (typeof document === "undefined") {
    return;
  }

  const normalized = SUPPORTED_LANGUAGES.has(lang) ? lang : "en";
  const value = `/auto/${normalized}`;
  document.cookie = `googtrans=${value};path=/;`;
  if (typeof window !== "undefined" && window.location?.hostname) {
    document.cookie = `googtrans=${value};path=/;domain=${window.location.hostname}`;
  }
}

function triggerSelectChange(lang) {
  const select = document.querySelector("select.goog-te-combo");
  if (!select) {
    return false;
  }

  const targetValue = SUPPORTED_LANGUAGES.has(lang) ? lang : "en";
  if (select.value !== targetValue) {
    select.value = targetValue;
  }
  select.dispatchEvent(new Event("change"));
  return true;
}

export default function useGoogleTranslate(language) {
  useEffect(() => {
    if (typeof window === "undefined" || typeof document === "undefined") {
      return;
    }

    ensureTranslateContainer();

    if (!window.googleTranslateElementInit) {
      window.googleTranslateElementInit = () => {
        if (window.google?.translate && !window.__lakayGoogleTranslateInit) {
          window.__lakayGoogleTranslateInit = true;
          new window.google.translate.TranslateElement(
            {
              pageLanguage: "en",
              includedLanguages: Array.from(SUPPORTED_LANGUAGES).join(","),
              autoDisplay: false,
            },
            CONTAINER_ID
          );
        }
      };
    }

    const existingScript = document.getElementById(SCRIPT_ID);
    if (!existingScript) {
      const script = document.createElement("script");
      script.id = SCRIPT_ID;
      script.src = "//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit";
      script.async = true;
      document.body.appendChild(script);
    } else if (window.google?.translate && !window.__lakayGoogleTranslateInit) {
      window.googleTranslateElementInit();
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined" || typeof document === "undefined") {
      return;
    }

    const normalized = SUPPORTED_LANGUAGES.has(language) ? language : "en";
    document.documentElement.setAttribute("lang", normalized);
    setTranslateCookie(normalized);

    const attemptTranslation = () => triggerSelectChange(normalized);

    if (attemptTranslation()) {
      return;
    }

    const interval = setInterval(() => {
      if (attemptTranslation()) {
        clearInterval(interval);
      }
    }, 500);

    return () => clearInterval(interval);
  }, [language]);
}
