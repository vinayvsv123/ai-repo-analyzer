import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

// ✅ Only API key here. NOTHING else.
const genAI = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

export const analyzeCodeWithAI = async (repoCode) => {
  console.log("Analyzing code with Gemini...");

  try {
    const prompt = `
You are an expert software engineer helping a NEW DEVELOPER understand a project.

Analyze the repository and generate a structured JSON.

Return ONLY valid JSON (no markdown, no explanation).

{
  "projectOverview": "Explain what this project does in simple terms.",
  "appFlow": "Step by step flow of how the app works (user → frontend → backend → database → response).",
  "techStack": ["List of technologies used"],
  "folderStructure": "Explain important folders and what they do.",
  "databaseExplanation": "Explain database structure, collections/tables and relationships if any.",
  "keyFeatures": ["Main features of the project"],
  "whereToStart": "Guide a new developer where to start reading the code.",
  "complexityLevel": "Beginner | Intermediate | Advanced",
  "improvements": ["Suggestions to improve the project"],
  "resumeDescription": "3 line professional description"
}

Repository Code:
${repoCode}
`;

    // ✅ Model is specified ONLY here
    const response = await genAI.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
    });

    const text = response.text.trim();

    // Clean markdown if Gemini adds it
    const cleanJson = text
      .replace(/```json/g, "")
      .replace(/```/g, "")
      .trim();

    return JSON.parse(cleanJson);

  } catch (error) {
    console.error("GEMINI ERROR:", error);
    throw new Error("Failed to analyze code with Gemini");
  }
};