#!/usr/bin/env ts-node

import readline from 'readline';

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

async function main() {
  let userQuery = process.argv.slice(2).join(' ');
  if (!userQuery) {
    userQuery = await promptUser('What database feature would you like to implement? ');
  }
  logStep(`Received user query: "${userQuery}"`);
  // TODO: Implement agent logic here
  logStep('Analyzing project structure...');
  // ...
  logStep('Done. (Placeholder)');
}

main(); 