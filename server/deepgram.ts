import { serve } from "bun";
import { createClient, LiveTranscriptionEvents } from "@deepgram/sdk";
import { processTextToSpeech } from "./speech";
import Agent from "./ChatSession";

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
			const agent = new Agent();

			(ws as any).agent = agent;

			const transcriber = deepgram.listen.live({
				model: "nova-3",
				language: "en-US",
				smart_format: true,
				// encoding: "opus",
				// sample_rate: 16000,
				channels: 1,
			});

			(ws as any).transcriber = transcriber;

			// Set up Deepgram event handlers
			transcriber.on(LiveTranscriptionEvents.Open, () => {
				console.log("Deepgram connection opened");
			});

			transcriber.on(LiveTranscriptionEvents.Transcript, (data) => {
				// Send transcription back to the client
				console.log(data.channel.alternatives[0].transcript);

				const transcript = data.channel.alternatives[0].transcript;

				if (typeof transcript === "string" && transcript.length > 0) {
					//
				}

				ws.send(
					JSON.stringify({
						type: "transcript",
						text: data.channel.alternatives[0].transcript,
					})
				);
			});

			transcriber.on(LiveTranscriptionEvents.Error, (error) => {
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
		message(ws, audio) {
			// Check if the message is binary (audio data)

			if (audio instanceof Uint8Array) {
				const transcriber = (ws as any).transcriber;

				if (transcriber) {
					transcriber.send(audio);
				}
			} else {
				console.log("Received non-binary message:", audio);
			}
		},
		// Handle client disconnection
		close(ws, code, message) {
			console.log("Client disconnected");
			// Close the Deepgram connection
			const transcriber = (ws as any).transcriber;
			if (transcriber) {
				transcriber.finish();
			}
		},
	},
});

console.log(`WebSocket server started on port ${server.port}`);
