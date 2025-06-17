export class ChatStream {
	private chunks: string[] = [];
	private messageId: string;
	private controller: ReadableStreamDefaultController | null = null;
	private currentMenu: string = "main";

	constructor() {
		this.messageId = crypto.randomUUID();
	}

	async start() {
		const stream = new ReadableStream({
			start: (controller) => {
				this.controller = controller;
				controller.enqueue(
					new TextEncoder().encode(
						`f:{"messageId":"${this.messageId}"}\n`
					)
				);
			},
		});

		return new Response(stream, {
			headers: {
				"Content-Type": "text/plain; charset=utf-8",
				"X-Vercel-AI-Data-Stream": "v1",
			},
		});
	}

	addMessage(message: string) {
		if (this.controller) {
			this.chunks.push(message);
			this.controller.enqueue(
				new TextEncoder().encode(`0:"${message}"\n`)
			);
		}
	}

	finish() {
		if (this.controller) {
			this.controller.enqueue(
				new TextEncoder().encode(
					`e:{"finishReason":"stop","usage":{"promptTokens":36,"completionTokens":${this.chunks.length}},"isContinued":false}\n`
				)
			);

			this.controller.enqueue(
				new TextEncoder().encode(
					`d:{"finishReason":"stop","usage":{"promptTokens":36,"completionTokens":${this.chunks.length}}}\n`
				)
			);

			this.controller.close();
			this.controller = null;
		}
	}

	getChunks() {
		return this.chunks;
	}

	getMessageId() {
		return this.messageId;
	}

	setCurrentMenu(menu: string) {
		this.currentMenu = menu;
	}

	getCurrentMenu() {
		return this.currentMenu;
	}
}
