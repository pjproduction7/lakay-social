// All backend API calls removed for static deployment.
// Profile photo features are disabled.

export async function uploadProfilePhotos() {
  throw new Error('Profile photo upload is disabled in static mode.');
}

export async function setPrimaryProfilePhoto() {
  throw new Error('Setting primary profile photo is disabled in static mode.');
}

export async function deleteProfilePhoto() {
  throw new Error('Deleting profile photos is disabled in static mode.');
}

export async function fetchPhotoFilterMetadata() {
  return [];
}
