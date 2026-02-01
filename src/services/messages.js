

// All backend API calls removed for static deployment.
// Private messaging features are disabled.

export async function fetchAllPrivateMessages() {
	return [];
}

export async function sendPrivateMessage() {
	throw new Error('Private messaging is disabled in static mode.');
}
