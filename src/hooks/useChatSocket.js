import { useEffect, useRef } from "react";

// All socket.io and WebSocket code removed for static deployment.
// Real-time chat features are disabled.

export default function useChatSocket() {
	// Stub: returns no socket functionality in static mode
	return {
		sendMessage: () => {},
		connect: () => {},
		disconnect: () => {},
		isConnected: false,
		socket: null,
	};
}
