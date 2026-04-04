import { GoogleGenerativeAI } from '@google/generative-ai';
import { env } from '../config/env.js';

function getModel() {
  if (!env.GEMINI_API_KEY) {
    const e = new Error('GEMINI_API_KEY is not configured');
    e.statusCode = 503;
    throw e;
  }
  const gen = new GoogleGenerativeAI(env.GEMINI_API_KEY);
  // Prefer flash models; override via env if your key requires a different id
  const modelId = process.env.GEMINI_MODEL || 'gemini-2.0-flash';
  return gen.getGenerativeModel({ model: modelId });
}

/**
 * Summarize complaints JSON for the given date range.
 */
export async function summarizeComplaints(complaintsText) {
  const model = getModel();
  const prompt = `You are a hostel operations assistant. Summarize the following complaints (JSON lines) in 5-8 concise bullet points for an admin. Note trends, urgent items, and categories.\n\n${complaintsText}`;
  const result = await model.generateContent(prompt);
  const text = result.response.text();
  return text.trim();
}

/**
 * Analyze weekly food reviews: most liked / disliked items.
 */
export async function analyzeFoodReviews(reviewsText) {
  const model = getModel();
  const prompt = `From these food reviews (each line: food item, rating 1-5, optional comment), identify:
1) Most liked food item (highest average rating, min 2 reviews)
2) Most disliked food item (lowest average rating, min 2 reviews)
Reply in short JSON: {"mostLiked":{"item":"","avg":0,"count":0},"mostDisliked":{"item":"","avg":0,"count":0},"summary":""}
If not enough data, explain in summary and use null for items.

Data:
${reviewsText}`;
  const result = await model.generateContent(prompt);
  const raw = result.response.text().trim();
  try {
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (jsonMatch) return JSON.parse(jsonMatch[0]);
  } catch {
    /* fall through */
  }
  return { raw };
}

/**
 * Per-mess-hall feedback: summary + sentiment label for admin dashboard.
 */
export async function analyzeMessFeedbackInsights(messHall, feedbackLines) {
  const model = getModel();
  const blob = feedbackLines.join('\n');
  const prompt = `Analyze the following student mess feedback lines (format: foodItem TAB rating TAB comment). Mess hall: "${messHall}".

1) Summarize key issues, positives, and overall reception in 2-3 concise bullet points.
2) Classify overall sentiment as exactly one word: positive, neutral, or negative (based on ratings and comments).

Reply in JSON only:
{"summary":"...","sentiment":"positive|neutral|negative"}`;

  const result = await model.generateContent(`${prompt}\n\nData:\n${blob}`);
  const raw = result.response.text().trim();
  try {
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (jsonMatch) return JSON.parse(jsonMatch[0]);
  } catch {
    /* fall through */
  }
  return { summary: raw, sentiment: 'neutral' };
}
