import { serve } from "bun";
import { ChatStream } from "./ChatStream";
import {
	selectClassification,
	mainMenuOptions,
	settingsMenuOptions,
} from "./Select";
import Agent from "./ChatSession";
import fs from "fs";
import type { Request } from "./types/Request";

const chats = new Map<string, Agent>();

const getOrCreateAgent = (id: string) => {
	let agent = chats.get(id);
	if (!agent) {
		agent = new Agent(id);
		chats.set(id, agent);
	}
	return agent;
};

const server = serve({
	port: 3001,
	async fetch(req) {
		const url = new URL(req.url);

		if (url.pathname === "/api/chat" && req.method === "POST") {
			try {
				const request: Request = await req.json();

				const { id, messages } = request;

				//get agent from id

				const agent = getOrCreateAgent(id);

				const lastMessage = messages[messages.length - 1];
				agent.addMessage({
					role: lastMessage.role,
					content: lastMessage.content,
					type: "text",
				});

				//write to file
				const chatStream = new ChatStream();
				const response = await chatStream.start();

				agent.respond({
					onPart: (part) => {
						chatStream.addMessage(part);
					},
					onFinish: () => {
						chatStream.finish();
					},
				});
				// Get or create chat a
				return response;
			} catch (error: any) {
				return new Response(JSON.stringify({ error: error.message }), {
					status: 500,
					headers: {
						"Content-Type": "application/json",
					},
				});
			}
		}

		return new Response("Not Found", { status: 404 });
	},
});

console.log(`Server running at http://localhost:${server.port}`);
