import { z } from "zod";

const envSchema = z.object({
	DEEPGRAM_API_KEY: z.string().min(1),
	ELEVENLABS_API_KEY: z.string().min(1),
});

const env = envSchema.parse(process.env);

export default env;
