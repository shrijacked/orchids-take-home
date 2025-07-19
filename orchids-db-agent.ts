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

// Improved: Parse for // File: <filename>, // <filename>, or # <filename> and any code block type
function extractFileCodePairs(text: string): Array<{file: string, code: string}> {
  // Match file path comments (// File: ..., // ..., # ...), followed by any code block
  const regex = /(?:\/\/\s*File:\s*|\/\/\s*|#\s*)([\w\/-_.]+)[\r\n]+```(?:typescript|ts|js|tsx|jsx|)?\n([\s\S]*?)```/g;
  const results: Array<{file: string, code: string}> = [];
  let match;
  while ((match = regex.exec(text)) !== null) {
    results.push({ file: match[1].trim(), code: match[2].trim() });
  }
  return results;
}

// Fallback: if no file markers, just get the first code block and prompt for file
function extractAnyCodeBlocks(text: string): string[] {
  const regex = /```[\w]*\n([\s\S]*?)```/g;
  const matches = [];
  let match;
  while ((match = regex.exec(text)) !== null) {
    matches.push(match[1].trim());
  }
  return matches;
}

async function callGemini(userQuery: string, projectContext: string): Promise<string> {
  if (!GEMINI_API_KEY) throw new Error('GEMINI_API_KEY not set');
  const outputInstructions = `\n\nINSTRUCTIONS:\nPlease output your response in the following format for each file you modify or create:\n\n// path/to/file.ts\n\`\`\`typescript\n// ...full contents of the file...\n\`\`\`\n\nDo not use diff or patch format. Output the full, updated contents of each file. Only use one file per code block. Do not include explanations or extra text.`;
  const prompt = `PROJECT CONTEXT:\n${projectContext}\n\nUSER QUERY:\n${userQuery}${outputInstructions}`;
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

// Helper to resolve file paths to match project structure
function resolveFilePath(file: string): string {
  if (
    file.startsWith('db/') ||
    file.startsWith('api/') ||
    file.startsWith('components/')
  ) {
    return 'src/' + file;
  }
  return file;
}

async function main() {
  let userQuery = process.argv.slice(2).filter(arg => !arg.startsWith('--')).join(' ');
  const autoYes = process.argv.includes('--yes');
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
    // Parse for file/code pairs
    let fileCodePairs = extractFileCodePairs(geminiResponse);
    if (fileCodePairs.length === 0) {
      // fallback: just code block, prompt for file
      const codeBlocks = extractAnyCodeBlocks(geminiResponse);
      if (codeBlocks.length === 0) {
        logStep('No code blocks found in Gemini response.');
        return;
      }
      const code = codeBlocks[0];
      let file = '';
      while (!file) {
        file = autoYes
          ? 'output.ts' // fallback file for automation, or could throw error
          : await promptUser('No file specified. Enter the file path to write this code to: ');
        file = file.trim();
        if (!file && !autoYes) {
          logStep('File path cannot be empty. Please enter a valid file path.');
        }
      }
      fileCodePairs = [{ file, code }];
    }
    for (const { file, code } of fileCodePairs) {
      if (!file) {
        logStep('No file path detected for this code block. Skipping.');
        continue;
      }
      const resolvedFile = resolveFilePath(file);
      console.log(`\n--- Preview of code to be written to ${resolvedFile} ---\n`);
      console.log(code);
      let confirm = 'y';
      if (!autoYes) {
        confirm = '';
        while (!['y', 'n'].includes(confirm)) {
          confirm = (await promptUser(`\nProceed to overwrite ${resolvedFile} with this code? (y/n): `)).trim().toLowerCase();
        }
      } else {
        logStep(`--yes flag detected: Overwriting ${resolvedFile} automatically.`);
      }
      if (confirm === 'y') {
        fs.writeFileSync(resolvedFile, code, 'utf8');
        logStep(`${resolvedFile} has been updated.`);
      } else {
        logStep(`Aborted. ${resolvedFile} was not changed.`);
      }
    }
  } catch (err) {
    logStep('Error calling Gemini: ' + err);
  }
}

main(); 