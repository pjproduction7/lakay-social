// Compatibility wrapper — actual implementation lives in `server/src/realtime.js`.
// Some tools or editors may look for `server/realtime.js`; re-export the real module
// so both paths work the same.

export * from './src/realtime.js';
