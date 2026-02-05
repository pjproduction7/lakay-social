import { apiRequest } from "./api";

export async function uploadProfilePhotos(files) {
  const formData = new FormData();
  for (const file of files) {
    formData.append("photos", file);
  }
  return apiRequest("/profiles/photos", {
    method: "POST",
    body: formData,
    isForm: true,
  });
}

export async function setPrimaryProfilePhoto({ photoId }) {
  return apiRequest(`/profiles/photos/${photoId}/primary`, {
    method: "POST",
  });
}

export async function deleteProfilePhoto({ photoId }) {
  return apiRequest(`/profiles/photos/${photoId}`, {
    method: "DELETE",
  });
}

