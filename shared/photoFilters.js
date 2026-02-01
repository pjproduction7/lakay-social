export const MAX_PROFILE_PHOTOS = 6;

export const PHOTO_FILTERS = [
  {
    id: "original",
    label: "Original",
    prompt: null,
    description: "Upload without AI adjustments",
    guidanceScale: 0,
    imageGuidanceScale: 0,
  },
  {
    id: "vibrant-film",
    label: "Vibrant Film",
    prompt: "High-contrast cinematic photo shot on Fujifilm 400H, natural skin tones, vibrant but realistic colors, gentle bloom",
    description: "Punchy colors with a film look",
    guidanceScale: 7.5,
    imageGuidanceScale: 1.2,
  },
  {
    id: "noir-drama",
    label: "Noir Drama",
    prompt: "Moody high-contrast black and white portrait, dramatic studio lighting, film grain, deep shadows",
    description: "Classic black and white styling",
    guidanceScale: 6.5,
    imageGuidanceScale: 1.0,
  },
  {
    id: "sunlit-glow",
    label: "Sunlit Glow",
    prompt: "Soft golden-hour portrait, warm highlights, gentle haze, dreamy bokeh, Portra 400 tones",
    description: "Warm golden-hour glow",
    guidanceScale: 7.0,
    imageGuidanceScale: 1.1,
  },
  {
    id: "teal-orange",
    label: "Teal & Orange",
    prompt: "Cinematic teal and orange color grading, crisp contrast, subtle highlight bloom, modern blockbuster look",
    description: "Modern cinematic grade",
    guidanceScale: 8.0,
    imageGuidanceScale: 1.3,
  },
];

export function getFilterPreset(styleId) {
  return PHOTO_FILTERS.find((filter) => filter.id === styleId) || PHOTO_FILTERS[0];
}
