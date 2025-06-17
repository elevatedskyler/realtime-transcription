import React, { useState, useRef, useEffect } from "react";

function App() {
	const [isRecording, setIsRecording] = useState(false);
	const mediaRecorder = useRef<MediaRecorder | null>(null);
	const ws = useRef<WebSocket | null>(null);
	const [logs, setLogs] = useState<string[]>([]);
	const [transcript, setTranscript] = useState<string>("");

	const addLog = (message: string) => {
		setLogs((prev) => [...prev, `${new Date().toISOString()}: ${message}`]);
	};

	const connectWebSocket = () => {
		// Initialize WebSocket connection
		ws.current = new WebSocket("ws://localhost:3001");

		ws.current.onopen = () => {
			addLog("WebSocket connection established");
		};

		ws.current.onmessage = (event) => {
			try {
				const data = JSON.parse(event.data);
				if (data.type === "transcript") {
					setTranscript(data.text);
					addLog(`Transcription: ${data.text}`);
				} else if (data.type === "error") {
					addLog(`Error: ${data.message}`);
				}
			} catch {
				addLog(`Received message: ${event.data}`);
			}
		};

		ws.current.onerror = (error) => {
			addLog(`WebSocket error: ${error}`);
		};

		ws.current.onclose = () => {
			addLog("WebSocket connection closed");
		};
	};

	useEffect(() => {
		// Cleanup WebSocket on component unmount
		return () => {
			if (ws.current) {
				ws.current.close();
			}
		};
	}, []);

	const startRecording = async () => {
		try {
			addLog("Connecting to WebSocket...");
			connectWebSocket();

			addLog("Requesting microphone access...");
			const stream = await navigator.mediaDevices.getUserMedia({
				audio: {
					channelCount: 1,
					sampleRate: 16000,
				},
			});
			addLog("Microphone access granted");

			// Create MediaRecorder with specific settings for Deepgram
			mediaRecorder.current = new MediaRecorder(stream, {
				mimeType: "audio/webm;codecs=opus",
				audioBitsPerSecond: 16000, // Match Deepgram's expected sample rate
			});

			mediaRecorder.current.ondataavailable = async (event) => {
				if (event.data.size > 0) {
					addLog(`Received audio chunk: ${event.data.size} bytes`);
					if (ws.current?.readyState === WebSocket.OPEN) {
						try {
							const arrayBuffer = await event.data.arrayBuffer();
							addLog(
								`Sending audio chunk: ${arrayBuffer.byteLength} bytes`
							);
							ws.current.send(arrayBuffer);
						} catch (error) {
							addLog(`Error sending audio chunk: ${error}`);
						}
					} else {
						addLog("WebSocket not ready, skipping chunk");
					}
				}
			};

			mediaRecorder.current.onstart = () => {
				addLog("MediaRecorder started");
				setTranscript(""); // Clear previous transcript
			};

			mediaRecorder.current.onstop = () => {
				addLog("MediaRecorder stopped");
			};

			mediaRecorder.current.onerror = (event) => {
				addLog(`MediaRecorder error: ${event.error}`);
			};

			// Request data every 100ms for more real-time streaming
			mediaRecorder.current.start(1000);
			setIsRecording(true);
		} catch (error) {
			addLog(`Error accessing microphone: ${error}`);
		}
	};

	const stopRecording = () => {
		if (mediaRecorder.current) {
			mediaRecorder.current.stop();
			mediaRecorder.current.stream
				.getTracks()
				.forEach((track) => track.stop());
			setIsRecording(false);
		}

		// Close WebSocket connection when recording stops
		if (ws.current) {
			ws.current.close();
			ws.current = null;
		}
	};

	return (
		<div style={{ padding: "20px" }}>
			<div style={{ marginBottom: "20px" }}>
				{isRecording ? (
					<button onClick={stopRecording} disabled={!isRecording}>
						Stop Recording
					</button>
				) : (
					<button onClick={startRecording} disabled={isRecording}>
						Start Recording
					</button>
				)}
			</div>

			{/* Display current transcript */}
			<div
				style={{
					marginBottom: "20px",
					padding: "10px",
					border: "1px solid #ccc",
					borderRadius: "4px",
					minHeight: "100px",
				}}
			>
				<h3>Live Transcript:</h3>
				<p>{transcript || "No transcript yet..."}</p>
			</div>

			{/* Log display */}
			<div
				style={{
					height: "300px",
					overflowY: "auto",
					border: "1px solid #ccc",
					padding: "10px",
					fontFamily: "monospace",
					fontSize: "12px",
				}}
			>
				{logs.map((log, index) => (
					<div key={index}>{log}</div>
				))}
			</div>
		</div>
	);
}

export default App;
