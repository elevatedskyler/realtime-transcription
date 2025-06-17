// AI Middleware System - Type-friendly chain for AI processing

// Core types for our AI middleware system
type Input = {
	text: string;
	audio: string;
	metadata?: Record<string, any>;
};

type Context = {
	// Mutable state that can be modified by middleware
	state: Record<string, any>;
	// Immutable request data
	readonly input: Input;
	// Results from previous middleware
	results: any[];
};

type Next = () => Promise<void>;

// The middleware function signature
type Middleware<TState = any> = (
	input: Input,
	ctx: Context & { state: TState },
	next: Next
) => Promise<void>;

// Compose function for chaining middleware
class AIChain {
	private middlewares: Middleware[] = [];

	use<TState = any>(middleware: Middleware<TState>): this {
		this.middlewares.push(middleware);
		return this;
	}

	async execute(
		input: Input,
		initialState: Record<string, any> = {}
	): Promise<Context> {
		const ctx: Context = {
			state: { ...initialState },
			input,
			results: [],
		};

		let index = 0;

		const dispatch = async (): Promise<void> => {
			if (index >= this.middlewares.length) return;

			const middleware = this.middlewares[index++];
			await middleware(input, ctx, dispatch);
		};

		await dispatch();
		return ctx;
	}
}

// Example middleware functions
const preprocessText: Middleware = async (input, ctx, next) => {
	console.log(`Processing input: "${input.text}"`);
	ctx.state.originalLength = input.text.length;
	ctx.state.processedText = input.text.trim().toLowerCase();
	await next();
};

const validateInput: Middleware = async (input, ctx, next) => {
	if (!input.text || input.text.trim().length === 0) {
		throw new Error("Input text cannot be empty");
	}
	ctx.state.isValid = true;
	await next();
};

const enhanceWithAI: Middleware = async (input, ctx, next) => {
	// Simulate AI processing
	const enhanced = `AI Enhanced: ${ctx.state.processedText}`;
	ctx.results.push({
		type: "ai_enhancement",
		result: enhanced,
		timestamp: new Date().toISOString(),
	});
	await next();
};

// Usage example
const aiChain = new AIChain()
	.use(validateInput)
	.use(preprocessText)
	.use(enhanceWithAI);

// Export for use
export { AIChain, type Middleware, type Input, type Context };
export default aiChain;
