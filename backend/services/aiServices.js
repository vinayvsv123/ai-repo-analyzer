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
You are a senior software architect evaluating a full codebase.

Return ONLY valid JSON in the exact format below. No markdown, no explanation.

{
  "projectOverview": "8–12 lines summary of purpose, architecture, and flow",
  "complexityLevel": "Beginner | Intermediate | Advanced",
  "complexityScore": "e.g. 7.8/10",
  "techStack": ["detected technologies"],
  "architecture": "10–15 lines explaining system design (frontend, backend, DB, auth, APIs, sockets)",
  "architectureGraph": {
    "nodes": [
      {"id": "frontend", "label": "Frontend", "group": "frontend"},
      {"id": "backend", "label": "Backend", "group": "backend"},
      {"id": "db", "label": "Database", "group": "database"}
    ],
    "edges": [
      {"source": "frontend", "target": "backend", "label": "API"},
      {"source": "backend", "target": "db", "label": "DB Access"}
    ]
  },
  "keyFeatures": ["short feature statements"],
  "codeQualityReview": "8–12 lines review of structure and best practices",
  "securityAnalysis": "8–12 lines security evaluation",
  "improvements": ["practical improvements"],
  "resumeDescription": "2–3 line strong resume summary"
}

Rules:
- Keep responses concise and factual.
- Detect architecture from code (do not assume).
- Group in graph: frontend, backend, database, auth, socket only.
- If unsure, infer conservatively.

Repository:
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