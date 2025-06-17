/*
 * chatflow-engine.ts
 * Lightweight conversational flow engine with stack-based context, interrupt support,
 * and pluggable LLM or logic steps.
 */

// Core types
export interface ChatContext {
	userId: string;
	stack: string[];
	vars: Record<string, any>;
}

export interface ChatStep {
	id: string;
	prompt?: string | ((ctx: ChatContext) => string);
	onInput?: (input: string, ctx: ChatContext) => string | null; // returns next step id or null
	interruptible?: boolean;
}

export interface ChatFlow {
	[stepId: string]: ChatStep;
}

export interface InterruptHandler {
	match: (input: string) => boolean;
	handler: (ctx: ChatContext) => string;
}

// Example flow
const exampleFlow: ChatFlow = {
	start: {
		id: "start",
		prompt: "Hey there! What's your name?",
		onInput: (input, ctx) => {
			ctx.vars.name = input;
			return "confirm";
		},
	},
	confirm: {
		id: "confirm",
		prompt: (ctx) => `So your name is ${ctx.vars.name}, right? (yes/no)`,
		onInput: (input, ctx) => {
			if (input.toLowerCase() === "yes") return "end";
			if (input.toLowerCase() === "no") return "start";
			return null;
		},
	},
	end: {
		id: "end",
		prompt: "Awesome. You're in. Bye!",
		onInput: () => null,
	},
};

// Example global interrupts
const interruptHandlers: InterruptHandler[] = [
	{
		match: (input) => input.toLowerCase() === "nevermind",
		handler: (ctx) => {
			ctx.stack.pop();
			return ctx.stack[ctx.stack.length - 1] || "start";
		},
	},
	{
		match: (input) => input.toLowerCase() === "start over",
		handler: (ctx) => {
			ctx.stack = [];
			return "start";
		},
	},
];

// Engine
export function runChatStep(
	flow: ChatFlow,
	ctx: ChatContext,
	input?: string
): { output: string; nextId: string | null } {
	let currentId = ctx.stack[ctx.stack.length - 1] || "start";
	const currentStep = flow[currentId];

	// Handle global interrupt
	if (input) {
		for (const intr of interruptHandlers) {
			if (intr.match(input)) {
				const newId = intr.handler(ctx);
				ctx.stack.push(newId);
				return {
					output: resolvePrompt(flow[newId], ctx),
					nextId: newId,
				};
			}
		}
	}

	if (input && currentStep.onInput) {
		const nextId = currentStep.onInput(input, ctx);
		if (nextId) {
			ctx.stack.push(nextId);
			return {
				output: resolvePrompt(flow[nextId], ctx),
				nextId,
			};
		}
	}

	return {
		output: resolvePrompt(currentStep, ctx),
		nextId: currentStep.id,
	};
}

function resolvePrompt(step: ChatStep, ctx: ChatContext): string {
	if (!step.prompt) return "";
	return typeof step.prompt === "function" ? step.prompt(ctx) : step.prompt;
}

// Bootstrapping a context
export function initContext(userId: string): ChatContext {
	return {
		userId,
		stack: ["start"],
		vars: {},
	};
}

// Example usage
// let ctx = initContext("user123")
// let res = runChatStep(exampleFlow, ctx) => show prompt
// res = runChatStep(exampleFlow, ctx, "Skyler") => continues
// runChatStep(exampleFlow, ctx, "nevermind") => steps back
