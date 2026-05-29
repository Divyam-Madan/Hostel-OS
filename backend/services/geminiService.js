import { GoogleGenerativeAI } from '@google/generative-ai';
import { env } from '../config/env.js';

// Simple in-process cooldown map to prevent repeated identical immediate calls
const lastCallAt = new Map();
const COOLDOWN_MS = 800; // short debounce to avoid duplicate calls on rapid retries

function getModel() {
  if (!env.GEMINI_API_KEY) {
    const e = new Error('AI not configured');
    e.statusCode = 503;
    throw e;
  }
  const gen = new GoogleGenerativeAI(env.GEMINI_API_KEY);
  const modelId = process.env.GEMINI_MODEL || 'gemini-2.0-flash';
  return gen.getGenerativeModel({ model: modelId });
}

async function callModel(prompt) {
  const now = Date.now();
  const key = String(prompt).slice(0, 200);
  const last = lastCallAt.get(key) || 0;
  if (now - last < COOLDOWN_MS) {
    const e = new Error('Request suppressed to avoid duplicate AI calls');
    e.statusCode = 429;
    throw e;
  }
  lastCallAt.set(key, now);

  const model = getModel();
  try {
    const result = await model.generateContent(prompt);
    const text = result.response?.text?.();
    return (typeof text === 'function' ? text() : text) || '';
  } catch (err) {
    // Map common provider errors to friendly messages
    const msg = String(err.message || err || 'AI request failed');
    const out = new Error(
      msg.includes('quota') || msg.toLowerCase().includes('quota')
        ? 'AI quota exhausted — try again later'
        : msg.includes('429') || msg.toLowerCase().includes('rate')
        ? 'AI rate limit reached — please wait a moment'
        : 'AI service currently unavailable'
    );
    // forward status when possible
    if (msg.includes('429')) out.statusCode = 429;
    if (msg.toLowerCase().includes('quota')) out.statusCode = 403;
    throw out;
  }
}

export async function summarizeComplaints(complaintsText) {
  const prompt = `You are a hostel operations assistant. Summarize the following complaints (JSON lines) in 5-8 concise bullet points for an admin. Note trends, urgent items, and categories.\n\n${complaintsText}`;
  const raw = await callModel(prompt);
  return raw.trim();
}

export async function analyzeFoodReviews(reviewsText) {
  const prompt = `From these food reviews (each line: food item, rating 1-5, optional comment), identify:\n1) Most liked food item (highest average rating, min 2 reviews)\n2) Most disliked food item (lowest average rating, min 2 reviews)\nReply in short JSON: {"mostLiked":{"item":"","avg":0,"count":0},"mostDisliked":{"item":"","avg":0,"count":0},"summary":""}\nIf not enough data, explain in summary and use null for items.\n\nData:\n${reviewsText}`;
  const raw = (await callModel(prompt)).trim();
  try {
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (jsonMatch) return JSON.parse(jsonMatch[0]);
  } catch {
    /* fall through */
  }
  return { raw };
}

export async function analyzeMessFeedbackInsights(messHall, feedbackLines) {
  const blob = feedbackLines.join('\n');
  const prompt = `Analyze the following student mess feedback lines (format: foodItem TAB rating TAB comment). Mess hall: "${messHall}".\n\n1) Summarize key issues, positives, and overall reception in 2-3 concise bullet points.\n2) Classify overall sentiment as exactly one word: positive, neutral, or negative (based on ratings and comments).\n\nReply in JSON only:\n{"summary":"...","sentiment":"positive|neutral|negative"}\n\nData:\n${blob}`;

  const raw = (await callModel(prompt)).trim();
  try {
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (jsonMatch) return JSON.parse(jsonMatch[0]);
  } catch {
    /* fall through */
  }
  return { summary: raw, sentiment: 'neutral' };
}
 
