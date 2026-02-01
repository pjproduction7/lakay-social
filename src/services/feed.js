

// Stubbed feed service functions for static deployment
export async function fetchPosts() {
	return [];
}

export async function createPost() {
	throw new Error('Post creation is disabled in static mode.');
}

export async function toggleLike() {
	throw new Error('Like feature is disabled in static mode.');
}

export async function reactToPost() {
	throw new Error('Reactions are disabled in static mode.');
}

export async function addComment() {
	throw new Error('Comments are disabled in static mode.');
}
