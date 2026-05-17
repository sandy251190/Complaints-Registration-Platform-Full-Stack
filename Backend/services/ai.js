const { GoogleGenAI } = require('@google/genai');
require('dotenv').config();

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const generateFollowUpQuestion = async (complaintText) => {
    const prompt = `You are a customer support AI. A user submitted the following complaint:
"${complaintText}"

Please generate exactly one short, relevant follow-up question to ask the user to get more details or clarify the situation. Return ONLY the question text.`;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-lite',
            contents: prompt,
        });

        return response.text.trim();
    } catch (error) {
        console.error('Error calling Gemini API:', error);
        throw error;
    }
};

module.exports = { generateFollowUpQuestion };
