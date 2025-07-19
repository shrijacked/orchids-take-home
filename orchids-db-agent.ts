#!/usr/bin/env ts-node

import 'dotenv/config';
import readline from 'readline';
import fetch from 'node-fetch';
import fs from 'fs';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_MODEL = 'gemini-2.0-flash';
const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

function logStep(step: string) {
  console.log(`[Agent] ${step}`);
}

async function promptUser(query: string): Promise<string> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  return new Promise((resolve) => {
    rl.question(query, (answer) => {
      rl.close();
      resolve(answer);
    });
  });
}

function readFileOrEmpty(path: string): string {
  try {
    return fs.readFileSync(path, 'utf8');
  } catch {
    return '';
  }
}

function gatherProjectContext(): string {
  let context = '';
  context += '\n---\n[db/schema.ts]\n' + readFileOrEmpty('src/db/schema.ts');
  context += '\n---\n[db/connection.ts]\n' + readFileOrEmpty('src/db/connection.ts');
  context += '\n---\n[db/seed.ts]\n' + readFileOrEmpty('src/db/seed.ts');
  context += '\n---\n[api/recently-played/route.ts]\n' + readFileOrEmpty('src/app/api/recently-played/route.ts');
  context += '\n---\n[api/made-for-you/route.ts]\n' + readFileOrEmpty('src/app/api/made-for-you/route.ts');
  context += '\n---\n[api/popular-albums/route.ts]\n' + readFileOrEmpty('src/app/api/popular-albums/route.ts');
  context += '\n---\n[components/spotify-main-content.tsx]\n' + readFileOrEmpty('src/components/spotify-main-content.tsx');
  return context;
}

async function callGemini(userQuery: string, projectContext: string): Promise<string> {
  if (!GEMINI_API_KEY) throw new Error('GEMINI_API_KEY not set');
  const prompt = `PROJECT CONTEXT:\n${projectContext}\n\nUSER QUERY:\n${userQuery}`;
  const body = {
    contents: [
      {
        parts: [
          { text: prompt }
        ]
      }
    ]
  };
  const res = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    throw new Error(`Gemini API error: ${res.status} ${res.statusText}`);
  }
  const data = await res.json();
  // Gemini returns candidates[0].content.parts[0].text
  return data.candidates?.[0]?.content?.parts?.[0]?.text || JSON.stringify(data);
}

async function main() {
  let userQuery = process.argv.slice(2).join(' ');
  if (!userQuery) {
    userQuery = await promptUser('What database feature would you like to implement? ');
  }
  logStep(`Received user query: "${userQuery}"`);
  logStep('Gathering project context...');
  const projectContext = gatherProjectContext();
  logStep('Calling Gemini...');
  try {
    const geminiResponse = await callGemini(userQuery, projectContext);
    logStep('Gemini response:');
    console.log(geminiResponse);
  } catch (err) {
    logStep('Error calling Gemini: ' + err);
  }
}

main(); 