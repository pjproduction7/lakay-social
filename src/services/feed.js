
import { apiRequest } from "./api";

// Feed service functions
export async function fetchPosts() {
  return apiRequest("/posts", { method: "GET" });
}

export async function createPost({ content, image, textColor, fontFamily }) {
  return apiRequest("/posts", {
    method: "POST",
    body: { content, imageUrl: image, textColor, fontFamily },
    auth: true,
  });
}

export async function toggleLike({ postId }) {
  return apiRequest(`/posts/${postId}/like`, {
    method: "POST",
    auth: true,
  });
}

export async function reactToPost({ postId, type }) {
  return apiRequest(`/posts/${postId}/react`, {
    method: "POST",
    body: { type },
    auth: true,
  });
}

export async function addComment({ postId, content }) {
  return apiRequest(`/posts/${postId}/comments`, {
    method: "POST",
    body: { content },
    auth: true,
  });
}

export async function updatePost(postId, { content }) {
  return apiRequest(`/posts/${postId}`, {
    method: "PUT",
    body: { content },
    auth: true,
  });
}

export async function deletePost(postId) {
  return apiRequest(`/posts/${postId}`, {
    method: "DELETE",
    auth: true,
  });
}
