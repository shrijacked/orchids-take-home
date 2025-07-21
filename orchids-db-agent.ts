#!/usr/bin/env ts-node

import 'dotenv/config';
import readline from 'readline';
import fetch from 'node-fetch';
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import recast from 'recast';

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

function readFileOrEmpty(filePath: string): string {
  try {
    if (fs.existsSync(filePath)) {
      return fs.readFileSync(filePath, 'utf8');
    }
    return '';
  } catch {
    return '';
  }
}

function gatherProjectContext(): string {
  logStep('Analyzing project structure...');
  let context = '';
  
  const filesToCheck = [
    { name: 'schema', paths: ['src/db/schema.ts', 'db/schema.ts', 'lib/db/schema.ts'] },
    { name: 'connection', paths: ['src/db/connection.ts', 'db/connection.ts', 'lib/db/connection.ts'] },
    { name: 'seed', paths: ['src/db/seed.ts', 'db/seed.ts', 'lib/db/seed.ts'] },
    { name: 'sync', paths: ['src/db/sync.ts', 'db/sync.ts', 'lib/db/sync.ts'] },
  ];
  
  for (const file of filesToCheck) {
    let content = '';
    let foundPath = '';
    
    for (const filePath of file.paths) {
      content = readFileOrEmpty(filePath);
      if (content) {
        foundPath = filePath;
        break;
      }
    }
    
    context += `\n---\n[${file.name}: ${foundPath || 'NOT FOUND'}]\n${content}`;
  }
  
  // Add package.json info if available
  const packageJson = readFileOrEmpty('package.json');
  if (packageJson) {
    context += '\n---\n[package.json]\n' + packageJson;
  }
  
  logStep('Project context gathered.');
  return context;
}

// Improved API route name generation
function generateAPIRouteName(userQuery: string, code?: string): string {
  // If code contains specific table/model references, use those first
  if (code) {
    const tableMatches = code.match(/from\s+([a-zA-Z][a-zA-Z0-9_]*)/g);
    if (tableMatches) {
      const tableName = tableMatches[0].replace('from ', '').trim();
      return convertToKebabCase(tableName);
    }
    
    // Also check for import statements
    const importMatches = code.match(/import\s+{[^}]*([a-zA-Z][a-zA-Z0-9_]*)[^}]*}\s+from/g);
    if (importMatches) {
      const match = importMatches[0].match(/{[^}]*([a-zA-Z][a-zA-Z0-9_]*)[^}]*}/);
      if (match) {
        return convertToKebabCase(match[1]);
      }
    }
  }
  
  // Extract meaningful keywords from user query
  const query = userQuery.toLowerCase();
  
  // Handle specific quoted terms more intelligently
  const quotedTerms = query.match(/'([^']+)'/g) || query.match(/"([^"]+)"/g);
  if (quotedTerms && quotedTerms.length === 1) {
    // Single quoted term - use it directly
    const term = quotedTerms[0].replace(/['"]/g, '');
    return convertToKebabCase(term);
  } else if (quotedTerms && quotedTerms.length > 1) {
    // Multiple quoted terms - use a generic collection name instead of combining
    return 'collections';
  }
  
  // Common patterns to extract feature names
  const patterns = [
    /(?:store|save|track|manage)\s+(?:the\s+)?([a-zA-Z\s'"-]+?)(?:\s+(?:in\s+a\s+)?table|data|information)?$/i,
    /(?:create|add|implement|build)\s+(?:a\s+)?(?:table\s+for\s+)?([a-zA-Z\s'"-]+?)(?:\s+(?:table|api|endpoint|feature|functionality))?$/i,
    /(?:want|need)\s+(?:to\s+)?(?:track|store|manage)\s+([a-zA-Z\s'"-]+)/i,
    /(?:database\s+for\s+|table\s+for\s+)([a-zA-Z\s'"-]+)/i,
    /([a-zA-Z\s'"-]+)\s+(?:management|tracking|storage|system)/i
  ];
  
  for (const pattern of patterns) {
    const match = query.match(pattern);
    if (match && match[1]) {
      let featureName = match[1].trim();
      // Clean up the extracted name
      featureName = featureName.replace(/['"]/g, ''); // Remove quotes
      featureName = featureName.replace(/\s+and\s+/g, '-'); // Replace 'and' with dash
      // Limit length to avoid overly long route names
      const words = featureName.split(/\s+/).slice(0, 3); // Max 3 words
      return convertToKebabCase(words.join(' '));
    }
  }
  
  // Fallback: extract all meaningful words (excluding common words)
  const stopWords = ['a', 'an', 'the', 'for', 'to', 'of', 'in', 'on', 'at', 'by', 'with', 'from', 'and', 'or', 'but', 'create', 'add', 'implement', 'build', 'table', 'database', 'api', 'endpoint', 'can', 'you', 'store', 'save'];
  const words = query
    .replace(/['"]/g, '') // Remove quotes
    .split(/\s+/)
    .filter(word => word.length > 2 && !stopWords.includes(word))
    .slice(0, 2); // Take first 2 meaningful words max for shorter names
  
  if (words.length > 0) {
    return convertToKebabCase(words.join(' '));
  }
  
  // Ultimate fallback
  return 'items';
}

function convertToKebabCase(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '') // Remove special characters
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/^-+|-+$/g, '') // Remove leading/trailing hyphens
    .replace(/-+/g, '-'); // Replace multiple hyphens with single
}

function extractFileCodePairs(text: string, userQuery: string): Array<{file: string, code: string}> {
  const results: Array<{file: string, code: string}> = [];
  const seenFiles = new Set<string>();
  
  // Multiple patterns to match file declarations
  const patterns = [
    /\/\/\s*([^\n]+\.(?:ts|js|tsx|jsx))\s*\n```(?:typescript|ts|js|tsx|jsx|javascript)?\n([\s\S]*?)```/g,
    /#\s*([^\n]+\.(?:ts|js|tsx|jsx))\s*\n```(?:typescript|ts|js|tsx|jsx|javascript)?\n([\s\S]*?)```/g,
    /\*\*([^\n]+\.(?:ts|js|tsx|jsx))\*\*\s*\n```(?:typescript|ts|js|tsx|jsx|javascript)?\n([\s\S]*?)```/g,
    /File:\s*([^\n]+\.(?:ts|js|tsx|jsx))\s*\n```(?:typescript|ts|js|tsx|jsx|javascript)?\n([\s\S]*?)```/g
  ];
  
  for (const pattern of patterns) {
    let match;
    while ((match = pattern.exec(text)) !== null) {
      const file = match[1].trim();
      const code = match[2].trim();
      if (file && code) {
        const normalizedFile = normalizeFilePath(file);
        if (!seenFiles.has(normalizedFile)) {
          results.push({ file, code });
          seenFiles.add(normalizedFile);
        }
      }
    }
  }
  
  if (results.length === 0) {
    const codeBlocks = extractAnyCodeBlocks(text);
    for (const code of codeBlocks) {
      const inferredFile = inferFileFromCode(code, userQuery);
      if (inferredFile) {
        const normalizedFile = normalizeFilePath(inferredFile);
        if (!seenFiles.has(normalizedFile)) {
          results.push({ file: inferredFile, code });
          seenFiles.add(normalizedFile);
        }
      }
    }
  }
  
  // If we still don't have API routes but the user requested multiple features,
  // generate them based on the query
  const requestedRoutes = extractRequestedRoutesFromQuery(userQuery);
  const existingAPIRoutes = results.filter(r => r.file.includes('/api/') && r.file.includes('/route.ts'));
  
  if (requestedRoutes.length > 0 && existingAPIRoutes.length === 0) {
    for (const routeName of requestedRoutes) {
      const tableName = convertToCamelCase(routeName);
      const apiRouteCode = `import { NextResponse } from 'next/server';
import { db } from '@/db/connection';
import { ${tableName} } from '@/db/schema';

export async function GET() {
  try {
    const items = await db.select().from(${tableName});
    return NextResponse.json(items);
  } catch (error: any) {
    console.error('Error fetching ${routeName.replace(/-/g, ' ')}:', error);
    return NextResponse.json(
      { message: 'Error fetching ${routeName.replace(/-/g, ' ')}', error: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const result = await db.insert(${tableName}).values(body).returning();
    return NextResponse.json(result[0]);
  } catch (error: any) {
    console.error('Error creating ${routeName.replace(/-/g, ' ')} item:', error);
    return NextResponse.json(
      { message: 'Error creating ${routeName.replace(/-/g, ' ')} item', error: error.message },
      { status: 500 }
    );
  }
}`;
      
      const normalizedFile = normalizeFilePath(`src/app/api/${routeName}/route.ts`);
      if (!seenFiles.has(normalizedFile)) {
        results.push({ 
          file: `src/app/api/${routeName}/route.ts`, 
          code: apiRouteCode 
        });
        seenFiles.add(normalizedFile);
      }
    }
  }
  
  return results;
}

function extractAnyCodeBlocks(text: string): string[] {
  const regex = /```(?:typescript|ts|js|tsx|jsx|javascript)?\n([\s\S]*?)```/g;
  const matches = [];
  let match;
  while ((match = regex.exec(text)) !== null) {
    const code = match[1].trim();
    if (code) {
      matches.push(code);
    }
  }
  return matches;
}

function inferFileFromCode(code: string, userQuery: string): string {
  if (code.includes('sqliteTable') || code.includes('pgTable') || (code.includes('drizzle-orm') && code.includes('export'))) {
    return 'src/db/schema.ts';
  }
  
  if ((code.includes('drizzle') && code.includes('better-sqlite3')) || code.includes('Database') || code.includes('connect')) {
    return 'src/db/connection.ts';
  }
  
  if (code.includes('CREATE TABLE') || (code.includes('better-sqlite3') && !code.includes('drizzle'))) {
    return 'src/db/sync.ts';
  }
  
  if (code.includes('db.insert') || code.includes('seed') || code.includes('await db.delete')) {
    return 'src/db/seed.ts';
  }
  
  if (code.includes('NextResponse') || (code.includes('export') && (code.includes('GET') || code.includes('POST')))) {
    const routeName = generateAPIRouteName(userQuery, code);
    return `src/app/api/${routeName}/route.ts`;
  }
  
  return '';
}

async function callGemini(userQuery: string, projectContext: string): Promise<string> {
  if (!GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY not found in environment variables. Please set it in your .env file.');
  }
  
  logStep('Preparing prompt for Gemini...');
  
  const systemPrompt = `You are a database agent that creates ONLY the specific database functionality requested by the user.

CRITICAL REQUIREMENTS:
1. ONLY create files for the specific features requested in the user query
2. DO NOT create tables, API routes, or functionality that wasn't explicitly requested
3. Use SQLite with better-sqlite3 (NOT LibSQL, Turso, or other databases)
4. Use Drizzle ORM for type-safe database operations
5. Follow Next.js App Router conventions for API routes
6. ALWAYS generate all required files: schema, connection, sync, seed, and API routes

MULTIPLE FEATURES HANDLING:
- If the user requests multiple features (e.g., "recently played songs and popular albums"), create separate API routes for each feature
- Create separate tables in schema.ts for each requested feature
- Create separate seed data for each table
- Create separate API routes for each feature

REQUIRED FILES TO CREATE (for each requested feature):
1. Database schema (src/db/schema.ts) - with tables for each requested feature
2. Database connection (src/db/connection.ts) - if missing or needs updates
3. Database sync script (src/db/sync.ts) - to create all table structures
4. Seed data script (src/db/seed.ts) - with sample data for each new table
5. API routes - one for each requested feature

IMPORTANT FILE GENERATION RULES:
- For seed.ts: ALWAYS include sample data insertion for each new table
- For sync.ts: For each table, run a select query (e.g., await db.select().from(table).all();) to ensure Drizzle ORM creates the table in SQLite
- For schema.ts: Define the exact table structure for each requested feature
- For API routes: Create GET and POST endpoints for each feature

FRONTEND INTEGRATION REQUIREMENTS:
- For each new API route, update or create a React component to fetch and display the data in the correct UI section.
- If the section exists, update it to use the new API.
- If not, create a new section/component using the project’s design system.
- Insert the component into the main UI (e.g., spotify-main-content.tsx).
- Do not require manual intervention for frontend integration.
- Use the project’s design system/components for rendering.
- Ensure the site actually fetches and displays the new data on the frontend.
- You MUST generate a React component (e.g., src/components/top-tracks.tsx) that fetches from the new API and displays the data. You MUST also show the code for patching src/components/spotify-main-content.tsx to import and render this component. Do not skip frontend files. If you do not generate the frontend files, the task is considered incomplete.

OUTPUT FORMAT:
For each file, use this exact format:

// src/path/to/file.ts
\`\`\`typescript
// Complete file contents here
\`\`\`

Generate ALL required files for ALL requested features. Do not skip any files.`;

  const prompt = `${systemPrompt}

PROJECT CONTEXT:
${projectContext}

USER QUERY: ${userQuery}

Generate ALL required files for the specific request:`;

  const body = {
    contents: [
      {
        parts: [
          { text: prompt }
        ]
      }
    ],
    generationConfig: {
      temperature: 0.1,
      maxOutputTokens: 8192
    }
  };
  
  try {
    const res = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    
    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(`Gemini API error: ${res.status} ${res.statusText}. Response: ${errorText}`);
    }
    
    const data = await res.json();
    const response = data.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (!response) {
      throw new Error('No response text received from Gemini API');
    }
    
    return response;
  } catch (error: any) {
    logStep(`Error calling Gemini API: ${error.message}`);
    throw error;
  }
}

// Helper function to normalize file paths for comparison
function normalizeFilePath(filePath: string): string {
  return filePath
    .replace(/\\/g, '/')
    .replace(/^src\//, '')
    .toLowerCase();
}

// Helper to extract all table exports from schema code
function extractTableExports(schemaCode: string): string[] {
  // Match lines like: export const playlists = sqliteTable(...)
  const tableExportRegex = /export const (\w+) = sqliteTable/g;
  const tables: string[] = [];
  let match;
  while ((match = tableExportRegex.exec(schemaCode)) !== null) {
    tables.push(match[1]);
  }
  return tables;
}

// Enhanced function to generate missing core files
function generateMissingCoreFiles(userQuery: string, existingFiles: string[], projectContext: string): Array<{file: string, code: string}> {
  const missingFiles: Array<{file: string, code: string}> = [];
  const existingPaths = existingFiles.map(f => normalizeFilePath(f));

  // Find schema code in projectContext
  let schemaCode = '';
  const schemaMatch = projectContext.match(/\[schema: [^\]]*\]\n([\s\S]*?)(?=\n---|$)/);
  if (schemaMatch) {
    schemaCode = schemaMatch[1];
  }
  const tableNames = schemaCode ? extractTableExports(schemaCode) : [extractTableNameFromQuery(userQuery) || 'items'];

  // Check for missing connection file
  if (!existingPaths.some(p => p.includes('connection.ts')) && !projectContext.includes('connection: src/db/connection.ts')) {
    missingFiles.push({
      file: 'src/db/connection.ts',
      code: `import path from 'path';\nimport { drizzle } from 'drizzle-orm/better-sqlite3';\nimport Database from 'better-sqlite3';\n\nconst sqlite = new Database(path.join(process.cwd(), 'sqlite.db'));
export const db = drizzle(sqlite);`
    });
  }

  // Check for missing sync file
  if (!existingPaths.some(p => p.includes('sync.ts')) && !projectContext.includes('sync: src/db/sync.ts')) {
    // Generate import lines for all tables
    const importTables = tableNames.map(t => t).join(', ');
    const selectLines = tableNames.map(t => `    await db.select().from(${t}).all();`).join('\n');
    missingFiles.push({
      file: 'src/db/sync.ts',
      code: `import { db } from './connection.ts';\nimport { ${importTables} } from './schema.ts';\n\nasync function syncDb() {\n  try {\n${selectLines ? selectLines + '\n' : ''}    console.log('Database synced successfully!');\n  } catch (error) {\n    console.error('Failed to sync database:', error);\n  }\n}\n\nsyncDb();`
    });
  }

  // Check for missing seed file  
  if (!existingPaths.some(p => p.includes('seed.ts')) && !projectContext.includes('seed: src/db/seed.ts')) {
    const tableName = extractTableNameFromQuery(userQuery) || 'items';
    missingFiles.push({
      file: 'src/db/seed.ts',
      code: `import { db } from './connection.ts';\nimport { ${tableName} } from './schema.ts';\n\nasync function seed() {\n  console.log('Seeding database...');\n  \n  // Clear existing data\n  await db.delete(${tableName});\n  \n  // Insert sample data\n  const sampleData = [\n    {\n      name: 'Sample Item 1',\n      description: 'This is a sample item for testing',\n      createdAt: new Date(),\n    },\n    {\n      name: 'Sample Item 2', \n      description: 'This is another sample item',\n      createdAt: new Date(),\n    },\n  ];\n\n  await db.insert(${tableName}).values(sampleData);\n  \n  console.log('Database seeded successfully!');\n}\n\nseed().catch(console.error);`
    });
  }

  // Generate missing API routes based on user query
  const requestedRoutes = extractRequestedRoutesFromQuery(userQuery);
  const existingAPIRoutes = existingPaths.filter(p => p.includes('/api/') && p.includes('/route.ts'));

  for (const routeName of requestedRoutes) {
    const routePath = `api/${routeName}/route.ts`;
    const normalizedRoutePath = normalizeFilePath(routePath);
    
    // Check if this specific route doesn't exist
    if (!existingAPIRoutes.some(p => p.includes(routeName))) {
      const tableName = convertToCamelCase(routeName);
      
      missingFiles.push({
        file: `src/app/api/${routeName}/route.ts`,
        code: `import { db } from '@/db/connection.ts';\nimport { ${tableName} } from '@/db/schema.ts';\nimport { NextResponse } from 'next/server';\n\nexport async function GET() {\n  try {\n    const items = await db.select().from(${tableName});\n    return NextResponse.json(items);\n  } catch (error: any) {\n    console.error('Error fetching ${routeName.replace(/-/g, ' ')}:', error);\n    return NextResponse.json(\n      { message: 'Error fetching ${routeName.replace(/-/g, ' ')}', error: error.message },\n      { status: 500 }\n    );\n  }\n}\n\nexport async function POST(request: Request) {\n  try {\n    const body = await request.json();\n    const result = await db.insert(${tableName}).values(body).returning();\n    return NextResponse.json(result[0]);\n  } catch (error: any) {\n    console.error('Error creating ${routeName.replace(/-/g, ' ')} item:', error);\n    return NextResponse.json(\n      { message: 'Error creating ${routeName.replace(/-/g, ' ')} item', error: error.message },\n      { status: 500 }\n    );\n  }\n}`
      });
    }
  }
  
  return missingFiles;
}

function extractTableNameFromQuery(userQuery: string): string | null {
  const query = userQuery.toLowerCase();
  
  // First check if there are quoted table names or specific references
  const quotedTerms = query.match(/'([^']+)'/g) || query.match(/"([^"]+)"/g);
  if (quotedTerms) {
    if (quotedTerms.length === 1) {
      // Single item like 'Made for you' -> madeForYou
      const term = quotedTerms[0].replace(/['"]/g, '');
      return convertToCamelCase(term);
    } else if (quotedTerms.length > 1) {
      // Multiple distinct items, use a generic collection name
      return 'collections';
    }
  }
  
  // Try to extract table name patterns
  const patterns = [
    /(?:create|add|implement|build)\s+(?:a\s+)?(?:table\s+for\s+|table\s+called\s+|table\s+named\s+)?([a-zA-Z][a-zA-Z0-9_]*)/i,
    /([a-zA-Z][a-zA-Z0-9_]*)\s+table/i,
    /table\s+([a-zA-Z][a-zA-Z0-9_]*)/i,
    /(?:store|save)\s+(?:the\s+)?([a-zA-Z][a-zA-Z0-9_\s]+?)(?:\s+(?:in\s+a\s+)?table)/i
  ];
  
  for (const pattern of patterns) {
    const match = query.match(pattern);
    if (match && match[1]) {
      let tableName = match[1].trim();
      // Clean up extracted name
      tableName = tableName.replace(/['"]/g, '');
      return convertToCamelCase(tableName);
    }
  }
  
  return null;
}

function convertToCamelCase(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '') // Remove special characters
    .replace(/\s+(.)/g, (_, char) => char.toUpperCase()) // Convert to camelCase
    .replace(/^(.)/, (char) => char.toLowerCase()); // Ensure first letter is lowercase
}

function resolveFilePath(file: string): string {
  file = file.replace(/\\/g, '/');
  
  // Remove any absolute path prefixes and keep only the relative part
  if (file.includes('/src/')) {
    const srcIndex = file.lastIndexOf('/src/');
    file = file.substring(srcIndex + 1);
  }
  
  if (file.startsWith('src/')) {
    return file;
  }
  
  if (file.startsWith('db/') || file.startsWith('app/') || file.startsWith('components/') || file.startsWith('lib/')) {
    return 'src/' + file;
  }
  
  return file;
}

// Patch imports in generated code to use .ts extensions and correct DB path
function patchGeneratedCode(file: string, code: string): string {
  // Patch all local imports to include .ts extension
  code = code.replace(
    /from\s+['"](\.\/[a-zA-Z0-9_-]+)(?!\.ts)(['"])/g,
    "from '$1.ts$2"
  );
  // Patch all local imports for @/db/ to .ts as well (for API routes)
  code = code.replace(
    /from\s+['"]@\/db\/([a-zA-Z0-9_-]+)(?!\.ts)(['"])/g,
    "from '@/db/$1.ts$2"
  );
  // Ensure DB path is always in project root for connection.ts
  if (file.endsWith('connection.ts')) {
    // Remove any broken/duplicated Database instantiations and always insert the correct line
    code = code.replace(
      /^const sqlite = new Database.*$/gm,
      "const sqlite = new Database(path.join(process.cwd(), 'sqlite.db'));"
    );
    // If the correct line is missing, add it after the imports
    if (!code.includes("const sqlite = new Database(path.join(process.cwd(), 'sqlite.db'));")) {
      // Find the last import statement
      const importEnd = code.lastIndexOf('import');
      const afterImport = code.indexOf('\n', importEnd) + 1;
      code = code.slice(0, afterImport) + "const sqlite = new Database(path.join(process.cwd(), 'sqlite.db'));\n" + code.slice(afterImport);
    }
    // Guarantee import path is the first line
    if (!code.startsWith("import path from 'path';")) {
      code = "import path from 'path';\n" + code.replace(/^(?!import path from 'path';)/, '');
    }
  } 
  return code;
}

// Helper to patch the main content file for new frontend integration
async function patchSpotifyMainContentFile({
  mainContentPath,
  newComponentName,
  newComponentImportPath,
  sectionTitle,
  sectionJSX
}: {
  mainContentPath: string,
  newComponentName: string,
  newComponentImportPath: string,
  sectionTitle: string,
  sectionJSX: string
}) {
  if (!fs.existsSync(mainContentPath)) return;
  const code = fs.readFileSync(mainContentPath, 'utf8');
  const tsParser = (await import('recast/parsers/typescript.js')).default;
  const ast = recast.parse(code, { parser: tsParser });
  const b = recast.types.builders;
  let importFound = false;

  recast.types.visit(ast, {
    visitImportDeclaration(path) {
      if (path.node.source.value === newComponentImportPath) {
        importFound = true;
      }
      this.traverse(path);
    }
  });

  // Add import if missing
  if (!importFound) {
    const importDecl = b.importDeclaration(
      [b.importSpecifier(b.identifier(newComponentName))],
      b.literal(newComponentImportPath)
    );
    ast.program.body.unshift(importDecl);
  }

  // Remove old section (by sectionTitle)
  recast.types.visit(ast, {
    visitJSXElement(path) {
      const opening = path.node.openingElement;
      if (
        opening.name.type === 'JSXIdentifier' &&
        opening.name.name === 'h2' &&
        Array.isArray(path.node.children) &&
        path.node.children.some(
          c => c.type === 'JSXText' && c.value.trim() === sectionTitle
        )
      ) {
        // Remove the parent section (assume parent is the section div)
        if (path.parentPath && path.parentPath.node.type === 'JSXElement') {
          path.parentPath.replace();
        }
      }
      this.traverse(path);
    }
  });

  // Insert new section at the end of the main return div
  recast.types.visit(ast, {
    visitReturnStatement(path) {
      const jsxRoot = path.node.argument;
      if (jsxRoot && jsxRoot.type === 'JSXElement' && Array.isArray(jsxRoot.children)) {
        jsxRoot.children.push(
          b.jsxElement(
            b.jsxOpeningElement(b.jsxIdentifier(newComponentName), [], true),
            null,
            []
          )
        );
      }
      return false;
    }
  });

  const output = recast.print(ast).code;
  fs.writeFileSync(mainContentPath, output, 'utf8');
}

// Patch writeFiles to use patchSpotifyMainContentFile for main content integration
async function writeFiles(fileCodePairs: Array<{file: string, code: string}>, autoYes: boolean) {
  logStep(`Processing ${fileCodePairs.length} files...`);
  for (const { file, code } of fileCodePairs) {
    if (!file || !code) {
      logStep('Skipping invalid file/code pair.');
      continue;
    }
    const resolvedFile = resolveFilePath(file);
    const dir = path.dirname(resolvedFile);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
      logStep(`Created directory: ${dir}`);
    }
    let patchedCode = patchGeneratedCode(resolvedFile, code);
    // Special logic for schema.ts: append new tables/types instead of overwriting
    if (resolvedFile.endsWith('src/db/schema.ts') && fs.existsSync(resolvedFile)) {
      const existing = fs.readFileSync(resolvedFile, 'utf8');
      // Extract new export blocks from patchedCode
      const exportBlocks = patchedCode.split(/(?=export (const|type) )/g).filter(Boolean);
      let toAppend = '';
      for (const block of exportBlocks) {
        // crude check: if export const/type name is already in existing, skip
        const match = block.match(/export (const|type) (\w+)/);
        if (match && !existing.includes(`export ${match[1]} ${match[2]}`)) {
          toAppend += '\n' + block.trim() + '\n';
        }
      }
      patchedCode = existing.trim() + toAppend;
    }
    // Patch main content file if writing a new frontend component
    if (
      resolvedFile.startsWith('src/components/') &&
      resolvedFile.endsWith('.tsx') &&
      !resolvedFile.includes('spotify-main-content')
    ) {
      const mainContentPath = 'src/components/spotify-main-content.tsx';
      const newComponentName =
        path.basename(resolvedFile, '.tsx').replace(/(^\w|[-_]\w)/g, m => m.replace(/[-_]/, '').toUpperCase());
      const newComponentImportPath = `@/components/${path.basename(resolvedFile, '.tsx')}`;
      const sectionTitle = newComponentName.replace(/([A-Z])/g, ' $1').trim();
      await patchSpotifyMainContentFile({
        mainContentPath,
        newComponentName,
        newComponentImportPath,
        sectionTitle,
        sectionJSX: `<${newComponentName} />`
      });
    }
    // Never write to src/app/spotify-main-content.tsx
    if (resolvedFile === 'src/app/spotify-main-content.tsx') {
      if (fs.existsSync(resolvedFile)) fs.unlinkSync(resolvedFile);
      continue;
    }
    console.log(`\n${'='.repeat(60)}`);
    console.log(`FILE: ${resolvedFile}`);
    console.log(`${'='.repeat(60)}`);
    console.log(patchedCode);
    console.log(`${'='.repeat(60)}\n`);
    let confirm = 'y';
    if (!autoYes) {
      while (!['y', 'n', 'yes', 'no'].includes(confirm.toLowerCase())) {
        confirm = await promptUser(`Write this code to ${resolvedFile}? (y/n): `);
        confirm = confirm.trim().toLowerCase();
      }
    } else {
      logStep(`Auto-writing ${resolvedFile}...`);
    }
    if (confirm === 'y' || confirm === 'yes' || autoYes) {
      try {
        fs.writeFileSync(resolvedFile, patchedCode, 'utf8');
        logStep(`✅ Successfully wrote ${resolvedFile}`);
      } catch (error: any) {
        logStep(`❌ Error writing ${resolvedFile}: ${error.message}`);
      }
    } else {
      logStep(`⏭️  Skipped ${resolvedFile}`);
    }
  }
}

// New function to extract multiple requested routes from user query
function extractRequestedRoutesFromQuery(userQuery: string): string[] {
  const query = userQuery.toLowerCase();
  const routes: string[] = [];
  
  // Check for quoted terms (multiple features)
  const quotedTerms = query.match(/'([^']+)'/g) || query.match(/"([^"]+)"/g);
  if (quotedTerms && quotedTerms.length > 1) {
    // Multiple quoted terms - create separate routes for each
    for (const term of quotedTerms) {
      const cleanTerm = term.replace(/['"]/g, '');
      routes.push(convertToKebabCase(cleanTerm));
    }
    return routes;
  }
  
  // Check for common multi-feature patterns
  const multiFeaturePatterns = [
    /(?:create|add|implement|build)\s+(?:tables?|apis?|endpoints?)\s+(?:for\s+)?([a-zA-Z\s,]+?)(?:\s+(?:and\s+([a-zA-Z\s]+))?)?/i,
    /(?:want|need)\s+(?:to\s+)?(?:track|store|manage)\s+([a-zA-Z\s,]+?)(?:\s+(?:and\s+([a-zA-Z\s]+))?)?/i,
    /(?:database\s+for\s+|tables?\s+for\s+)([a-zA-Z\s,]+?)(?:\s+(?:and\s+([a-zA-Z\s]+))?)?/i
  ];
  
  for (const pattern of multiFeaturePatterns) {
    const match = query.match(pattern);
    if (match) {
      // Extract features from comma-separated list
      const features = match[1].split(',').map(f => f.trim()).filter(f => f.length > 0);
      for (const feature of features) {
        routes.push(convertToKebabCase(feature));
      }
      
      // Check for additional features after "and"
      if (match[2]) {
        routes.push(convertToKebabCase(match[2]));
      }
      
      if (routes.length > 0) {
        return routes;
      }
    }
  }
  
  // If no multi-feature patterns found, fall back to single feature
  const singleRoute = generateAPIRouteName(userQuery);
  if (singleRoute && singleRoute !== 'items') {
    routes.push(singleRoute);
  }
  
  return routes;
}

function isDrizzleKitInstalled() {
  try {
    execSync('npx drizzle-kit --version', { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

function runDrizzleMigrations() {
  try {
    logStep('Generating Drizzle migration...');
    execSync('npx drizzle-kit generate', { stdio: 'inherit' });
    logStep('Pushing Drizzle migration...');
    execSync('npx drizzle-kit push', { stdio: 'inherit' });
    logStep('Drizzle migrations applied successfully!');
  } catch (error: any) {
    logStep(`❌ Error running Drizzle migrations: ${error.message}`);
  }
}

async function main() {
  console.log('🤖 Database Agent Starting...\n');
  
  let userQuery = process.argv.slice(2).filter(arg => !arg.startsWith('--')).join(' ');
  const autoYes = process.argv.includes('--yes') || process.argv.includes('-y');
  
  if (!userQuery) {
    userQuery = await promptUser('What database feature would you like to implement? ');
  }
  
  if (!userQuery.trim()) {
    logStep('No query provided. Exiting.');
    return;
  }
  
  logStep(`Processing query: "${userQuery}"`);
  
  try {
    const projectContext = gatherProjectContext();
    
    logStep('Generating database implementation with AI...');
    const geminiResponse = await callGemini(userQuery, projectContext);
    
    logStep('Parsing AI response...');
    
    let fileCodePairs = extractFileCodePairs(geminiResponse, userQuery);
    
    // Generate any missing core files
    const existingFiles = fileCodePairs.map(pair => pair.file);
    const missingCoreFiles = generateMissingCoreFiles(userQuery, existingFiles, projectContext);
    
    if (missingCoreFiles.length > 0) {
      logStep(`Generating ${missingCoreFiles.length} missing core file(s)...`);
      fileCodePairs = [...fileCodePairs, ...missingCoreFiles];
    }
    
    if (fileCodePairs.length === 0) {
      logStep('❌ No valid files found in AI response. Please try rephrasing your query.');
      console.log('\nAI Response:');
      console.log(geminiResponse);
      return;
    }
    
    await writeFiles(fileCodePairs, autoYes);

    // Automatically run Drizzle migrations if drizzle-kit is installed
    if (!isDrizzleKitInstalled()) {
      logStep('❌ drizzle-kit is not installed.');
      console.log('\n💡 To fix this:');
      console.log('1. Install drizzle-kit as a dev dependency:');
      console.log('   npm install -D drizzle-kit');
      console.log('2. Re-run the agent.');
      return;
    }

    runDrizzleMigrations();

    // Automatically run sync and seed scripts if they exist
    function runScript(scriptPath: string, description: string) {
      try {
        logStep(`Running ${description} (${scriptPath})...`);
        execSync(`npx ts-node ${scriptPath}`, { stdio: 'inherit' });
        logStep(`${description} completed successfully!`);
      } catch (error: any) {
        logStep(`❌ Error running ${description}: ${error.message}`);
      }
    }

    if (fs.existsSync('src/db/sync.ts')) {
      runScript('src/db/sync.ts', 'database sync');
    }
    if (fs.existsSync('src/db/seed.ts')) {
      runScript('src/db/seed.ts', 'database seed');
    }
    
    logStep('✅ Database agent completed successfully!');
    
    console.log('\n📋 Next Steps:');
    console.log('1. Install dependencies: npm install drizzle-orm better-sqlite3');
    console.log('2. Install dev dependencies: npm install -D @types/better-sqlite3');
    console.log('3. Run database sync: npx ts-node src/db/sync.ts');
    console.log('4. Run seed script: npx ts-node src/db/seed.ts');
    console.log('5. Start your Next.js app: npm run dev');
    console.log('6. Test API endpoints:');
    
    for (const { file } of fileCodePairs) {
      if (file.includes('/api/') && file.includes('/route.ts')) {
        const route = file.match(/\/api\/([^\/]+)\/route\.ts/)?.[1];
        if (route) {
          console.log(`   - http://localhost:3000/api/${route}`);
        }
      }
    }
    
  } catch (error: any) {
    logStep(`❌ Error: ${error.message}`);
    if (error.message.includes('GEMINI_API_KEY')) {
      console.log('\n💡 To fix this:');
      console.log('1. Create a .env file in your project root');
      console.log('2. Add: GEMINI_API_KEY=your_api_key_here');
      console.log('3. Get your API key from: https://makersuite.google.com/app/apikey');
    }
  }
}

main().catch(console.error);