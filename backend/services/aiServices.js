import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";

dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export const analyzeCodeWithAI = async (repoCode) => {
  try {

    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash"
    });

    const prompt = `
You are an expert software engineer.

Analyze this repository code and give:

1. Tech Stack
2. Project Summary
3. Important Features
4. Suggestions to improve

Code:
${repoCode}
`;

    const result = await model.generateContent(prompt);

    const response = await result.response;

    return response.text();

  } catch (error) 
  {
        console.log("GEMINI ERROR:", error);
        throw error;
  }
};