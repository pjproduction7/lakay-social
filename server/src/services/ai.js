import { Blob } from "buffer";
import { HfInference } from "@huggingface/inference";

const {
  HF_API_KEY,
  HF_PHOTO_FILTER_MODEL = "timbrooks/instruct-pix2pix",
} = process.env;

const hasCredentials = Boolean(HF_API_KEY);
const hf = hasCredentials ? new HfInference(HF_API_KEY) : null;

export function isAiFilterEnabled() {
  return hasCredentials;
}

export async function applyPhotoFilter({ imageBuffer, prompt, guidanceScale = 7, imageGuidanceScale = 1 }) {
  if (!hf || !prompt) {
    return { buffer: imageBuffer, applied: false, reason: "AI filter disabled" };
  }

  try {
    const blob = new Blob([imageBuffer]);
    const response = await hf.imageToImage({
      model: HF_PHOTO_FILTER_MODEL,
      inputs: blob,
      parameters: {
        prompt,
        guidance_scale: guidanceScale,
        image_guidance_scale: imageGuidanceScale,
        num_inference_steps: 30,
      },
    });

    const arrayBuffer = await response.arrayBuffer();
    return { buffer: Buffer.from(arrayBuffer), applied: true };
  } catch (error) {
    console.error("AI photo filter failed", error);
    return { buffer: imageBuffer, applied: false, reason: error.message };
  }
}
