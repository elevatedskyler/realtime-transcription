import { serve } from "bun";
import { createClient, LiveTranscriptionEvents } from "@deepgram/sdk";

// Create Deepgram client
const deepgram = createClient(process.env.DEEPGRAM_API_KEY || "");

const server = serve({
	port: 3001, // Match the port in your React app
	fetch(req, server) {
		// Upgrade the request to a WebSocket connection
		if (server.upgrade(req)) {
			return; // Return if the upgrade was successful
		}
		return new Response("Upgrade failed", { status: 400 });
	},
	websocket: {
		// Handle WebSocket connections
		open(ws) {
			console.log("Client connected");

			// Create a new Deepgram live transcription connection for this client
			const connection = deepgram.listen.live({
				model: "nova-3",
				language: "en-US",
				smart_format: true,
				// encoding: "opus",
				// sample_rate: 16000,
				channels: 1,
			});

			// Store the Deepgram connection with the WebSocket
			(ws as any).deepgramConnection = connection;

			// Set up Deepgram event handlers
			connection.on(LiveTranscriptionEvents.Open, () => {
				console.log("Deepgram connection opened");
			});

			connection.on(LiveTranscriptionEvents.Transcript, (data) => {
				// Send transcription back to the client
				console.log(data);
				ws.send(
					JSON.stringify({
						type: "transcript",
						text: data.channel.alternatives[0].transcript,
					})
				);
			});

			connection.on(LiveTranscriptionEvents.Error, (error) => {
				console.error("Deepgram error:", error);
				ws.send(
					JSON.stringify({
						type: "error",
						message: "Transcription error occurred",
					})
				);
			});
		},
		// Handle incoming messages
		message(ws, message) {
			// Check if the message is binary (audio data)
			if (message instanceof Uint8Array) {
				const connection = (ws as any).deepgramConnection;

				if (connection) {
					// Send audio data to Deepgram
					// console.log("Sending to Deepgram:", {
					// 	size: message.length,
					// 	firstBytes: Array.from(message.slice(0, 10)), // Log first 10 bytes
					// });
					console.log(message);
					connection.send(message);
				}
			} else {
				console.log("Received non-binary message:", message);
			}
		},
		// Handle client disconnection
		close(ws, code, message) {
			console.log("Client disconnected");
			// Close the Deepgram connection
			const connection = (ws as any).deepgramConnection;
			if (connection) {
				connection.finish();
			}
		},
	},
});

console.log(`WebSocket server started on port ${server.port}`);
