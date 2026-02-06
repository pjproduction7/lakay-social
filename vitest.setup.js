import '@testing-library/jest-dom';

// JSDOM in vitest does not implement scrollIntoView by default; add harmless polyfill
if (typeof window !== 'undefined') {
  // eslint-disable-next-line no-extend-native
  Element.prototype.scrollIntoView = function() { /* noop */ };
}
