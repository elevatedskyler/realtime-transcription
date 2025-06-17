import OpenAI from "openai";
import { zodTextFormat } from "openai/helpers/zod";
import { z } from "zod";

export const openai = new OpenAI({
	apiKey: process.env.OPENAI_API_KEY,
	baseURL: "https://api.openai.com/v1",
});

export type Option = {
	name: string;
	onSelect: () => void;
};

export async function selectClassification(input: string, options: Option[]) {
	//generate zod enum for choices
	const outputSchema = z.object({
		option: z.enum(
			options.map((option) => option.name) as [string, ...string[]]
		),
	});

	const response = await openai.responses.parse({
		model: "gpt-4o-mini",
		input: [
			{
				role: "system",
				content: `The user has provided the following input: ${input}. Please select the most appropriate option for the system to handle from the following choices: ${options
					.map((option) => option.name)
					.join(", ")}.`,
			},
			{
				role: "user",
				content: input,
			},
		],
		text: {
			format: zodTextFormat(outputSchema, "option"),
		},
	});

	if (!response.output_parsed) {
		throw new Error("Output not parsed");
	}

	const optionResponse = response.output_parsed.option;
	const option = options.find((option) => option.name === optionResponse);

	if (!option) return undefined;

	return option;
}
