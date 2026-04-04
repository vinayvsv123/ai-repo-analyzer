import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

// Initialize Gemini client
const genAI = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

export const analyzeCodeWithAI = async (repoCode) => {
  console.log("Analyzing code with Gemini...");

  try {
    const prompt = `
You are a senior software architect and university project evaluator.

Your task is to perform an EXTREMELY DEEP analysis of the entire repository code and generate a VERY LARGE, DETAILED, STRUCTURED JSON report.

This is NOT a summary. This is a full technical evaluation report.

The response MUST be long, section-wise, and highly descriptive.

Return JSON in EXACTLY this structure:

{
  "projectOverview": "Write a 25-40 line detailed explanation covering purpose, architecture, user flow, and design decisions.",
  "complexityLevel": "Beginner | Intermediate | Advanced",
  "complexityScore": "Give a score like 7.8/10",
  "techStack": ["List ALL technologies, libraries, frameworks detected"],
  "architecture": "Write 30+ lines explaining frontend, backend, database schema, authentication flow, API flow, socket flow, and overall system design.",
  "architectureGraph": {
    "nodes": [
      {"id": "frontend", "label": "React Frontend", "group": "frontend"},
      {"id": "backend", "label": "Express API", "group": "backend"},
      {"id": "db", "label": "MongoDB", "group": "database"}
    ],
    "edges": [
      {"source": "frontend", "target": "backend", "label": "REST API"},
      {"source": "backend", "target": "db", "label": "Mongoose"}
    ]
  },
  "keyFeatures": ["Write each feature with 3-5 lines of explanation"],
  "codeQualityReview": "Write 25+ lines reviewing folder structure, modularity, separation of concerns, naming, patterns, and best practices.",
  "securityAnalysis": "Write 20+ lines explaining password handling, JWT, OAuth, protected routes, validation, and security practices.",
  "improvements": ["List real, practical improvements based on the codebase"],
  "resumeDescription": "Write a strong 4-5 line resume-ready description."
}

STRICT RULES:
- DO NOT summarize.
- DO NOT shorten explanations.
- Be extremely verbose and technical.
- Make sure "architectureGraph" accurately outlines Backend modules, Frontend, DB models, Auth, and Sockets based on code. Group can be 'frontend', 'backend', 'database', 'auth', or 'socket'.

Now analyze this repository code deeply:

${repoCode}
`;

    const response = await genAI.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      generationConfig: {
      temperature: 0.2,
      maxOutputTokens: 8192,   
    },
    });

    const rawText = response.candidates?.[0]?.content?.parts
      ?.map((p) => p.text || "")
      .join("")
      .trim();

    if (!rawText) {
      throw new Error("Empty response from Gemini");
    }

    const cleanJson = rawText
      .replace(/\`\`\`json/g, "")
      .replace(/\`\`\`/g, "")
      .trim();

    try {
      return JSON.parse(cleanJson);
    } catch (parseError) {
      console.error("JSON PARSE ERROR:\\n", cleanJson);
      throw new Error("Gemini returned invalid JSON format");
    }

  } catch (error) {
    console.error("GEMINI ERROR:", error);
    throw new Error("Failed to analyze code with Gemini");
  }
};

export const chatWithRepo = async (repoCode, history, question) => {
  try {
    const prompt = `
You are a senior developer answering questions about a codebase.
You are given the full repository code.
Use it to accurately answer the user's question.

REPOSITORY CODE:
${repoCode}

Conversation History:
${history.map(h => h.role + ': ' + h.text).join('\\n')}

User Question: ${question}
Answer in detail:
`;

    const response = await genAI.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      generationConfig: {
        temperature: 0.3,
        maxOutputTokens: 2048,
      },
    });

    return response.candidates?.[0]?.content?.parts
      ?.map((p) => p.text || "")
      .join("")
      .trim();
  } catch (error) {
    console.error("CHAT ERROR:", error);
    throw new Error("Failed to chat with AI");
  }
};

export const explainFileWithAI = async (filePath, fileContent) => {
  try {
    const prompt = `
You are a senior developer explaining code to a team.

Analyze this file in detail. Cover:
1. **Purpose**: What this file does and its role in the project
2. **Key Functions/Components**: List and explain each function, class, or component
3. **Dependencies**: What it imports and why
4. **Data Flow**: How data moves through this file
5. **Patterns**: Design patterns or architectural decisions used
6. **Potential Issues**: Any bugs, anti-patterns, or improvements

File: ${filePath}

\`\`\`
${fileContent}
\`\`\`

Provide a thorough, well-structured explanation.
`;

    const response = await genAI.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      generationConfig: {
        temperature: 0.3,
        maxOutputTokens: 4096,
      },
    });

    return response.candidates?.[0]?.content?.parts
      ?.map((p) => p.text || "")
      .join("")
      .trim();
  } catch (error) {
    console.error("EXPLAIN FILE ERROR:", error);
    throw new Error("Failed to explain file with AI");
  }
};