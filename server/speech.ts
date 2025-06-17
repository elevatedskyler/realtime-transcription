import { ElevenLabsClient, play } from "@elevenlabs/elevenlabs-js";

const elevenlabs = new ElevenLabsClient({
	apiKey: process.env.ELEVENLABS_API_KEY || "",
});

interface MenuItem {
	action: string;
	// Add other properties as needed
}

let menu: MenuItem[] | null = null;

export async function processTextToSpeech(text: string) {
	const audio = await elevenlabs.textToSpeech.convert(
		"JBFqnCBsd6RMkjVDRZzb",
		{
			text,
			modelId: "eleven_multilingual_v2",
			outputFormat: "mp3_44100_128",
		}
	);
	await play(audio);
}

export async function processUserInput(text: string) {
	console.log("Processing user input:", text);

	if (menu && text.trim()) {
		try {
			const response = await elevenlabs.textToSpeech.convert(
				"JBFqnCBsd6RMkjVDRZzb",
				{
					text,
					modelId: "eleven_multilingual_v2",
					outputFormat: "mp3_44100_128",
				}
			);

			// You can process the audio response here
			console.log("Text-to-speech conversion completed");
		} catch (error) {
			console.error("Error processing text-to-speech:", error);
		}
	}
}

const audio = await elevenlabs.textToSpeech.convert("JBFqnCBsd6RMkjVDRZzb", {
	text: "Hello, how are you?",
	modelId: "eleven_multilingual_v2",
	outputFormat: "mp3_44100_128",
});

// await play(audio);
import { writeFile } from "fs/promises";

// Write audio to file
const chunks: Buffer[] = [];
for await (const chunk of audio) {
	chunks.push(chunk);
}
const audioBuffer = Buffer.concat(chunks);
await writeFile("output.mp3", audioBuffer);
