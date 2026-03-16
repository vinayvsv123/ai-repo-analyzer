import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";

dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export const analyzeCodeWithAI = async (repoCode) => {
    try {
        const model = genAI.getGenerativeModel({
            model: "gemini-1.5-flash-latest"
        });

        const prompt = `
You are an expert software engineer. Analyze this repository code and provide a structured JSON output. Make sure you only return valid JSON without any markdown blocks.

The JSON should have the following structure exactly:
{
    "summary": "Overall project summary including the purpose of this repository.",
    "techStack": ["Array", "of", "technologies", "used"],
    "folderExplanation": "Explanation of the folder structure and architecture.",
    "complexityLevel": "One of: Beginner, Intermediate, Advanced",
    "improvements": ["List", "of", "suggested", "improvements"],
    "resumeDescription": "A professional 3-sentence description suitable for a resume."
}

Code:
${repoCode}
`;

        const result = await model.generateContent(prompt);
        const responseText = await result.response.text();

        // Extract JSON from potential Markdown formatting
        const cleanJson = responseText.replace(/```json/g, '').replace(/```/g, '').trim();

        try {
            return JSON.parse(cleanJson);
        } catch (e) {
            console.error("Failed to parse JSON response:", cleanJson);
            throw new Error("AI returned malformed JSON");
        }

    } catch (error) {
        console.error("GEMINI ERROR:", error);
        throw error;
    }
};