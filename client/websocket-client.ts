// Example client code for connecting to the WebSocket server
const ws = new WebSocket("ws://localhost:3000");

ws.onopen = () => {
	console.log("Connected to WebSocket server");

	// Example: Send a test message
	ws.send("Hello server!");

	// Example: Send binary audio data
	// This is just an example - in a real application, you would get this from an audio source
	const audioData = new Uint8Array([1, 2, 3, 4, 5]);
	ws.send(audioData);
};

ws.onmessage = (event) => {
	console.log("Received message from server:", event.data);
};

ws.onclose = () => {
	console.log("Disconnected from WebSocket server");
};

// Example of how to capture audio from the microphone and send it
async function captureAndSendAudio() {
	try {
		const stream = await navigator.mediaDevices.getUserMedia({
			audio: true,
		});
		const audioContext = new AudioContext();
		const source = audioContext.createMediaStreamSource(stream);
		const processor = audioContext.createScriptProcessor(1024, 1, 1);

		source.connect(processor);
		processor.connect(audioContext.destination);

		processor.onaudioprocess = (e) => {
			const inputData = e.inputBuffer.getChannelData(0);
			// Convert Float32Array to Uint8Array for sending
			const audioData = new Uint8Array(inputData.buffer);
			ws.send(audioData);
		};
	} catch (error) {
		console.error("Error accessing microphone:", error);
	}
}

// Uncomment to start capturing and sending audio
// captureAndSendAudio();
