
import { GoogleGenAI, Type } from "@google/genai";
import { Student } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const analyzeEvasionRisk = async (students: Student[]) => {
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Analise a seguinte lista de alunos de jiu-jitsu e forneça insights sobre retenção e sugestões de mensagens de contato. Alunos com mais de 7 dias sem presença estão em risco.
    
    Alunos: ${JSON.stringify(students.map(s => ({ name: s.name, lastAttendance: s.last_attendance, belt: s.belt })))}`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          riskSummary: { type: Type.STRING },
          priorityActions: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                studentName: { type: Type.STRING },
                reason: { type: Type.STRING },
                suggestedMessage: { type: Type.STRING }
              }
            }
          }
        },
        required: ["riskSummary", "priorityActions"]
      }
    }
  });

  return JSON.parse(response.text);
};
