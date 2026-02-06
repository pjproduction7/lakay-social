import { apiRequest } from "./api";

export async function uploadProfilePhotos(arg) {
  // Accept either an array of files or an object { files: [], filter }
  const files = Array.isArray(arg) ? arg : (arg?.files || []);
  const filter = arg?.filter;

  const formData = new FormData();
  for (const file of files) {
    formData.append("photos", file);
  }
  if (filter) formData.append('filter', filter);

  return apiRequest("/profiles/photos", {
    method: "POST",
    body: formData,
    isForm: true,
    auth: true,
  });
}

export async function setPrimaryProfilePhoto(arg) {
  const photoId = (arg && typeof arg === 'object') ? arg.photoId : arg;
  if (!photoId) throw new Error('photoId is required');
  return apiRequest(`/profiles/photos/${photoId}/primary`, {
    method: "POST",
    auth: true,
  });
}

export async function deleteProfilePhoto(arg) {
  // Accept either an object { photoId } or a direct photoId
  const photoId = (arg && typeof arg === 'object') ? arg.photoId : arg;
  if (!photoId) throw new Error('photoId is required');
  return apiRequest(`/profiles/photos/${photoId}`, {
    method: "DELETE",
    auth: true,
  });
}
