#!/usr/bin/env node

/**
 * ==============================================================================
 * MOCK-GHOST: Automated Mock API Generator from Schema Definitions
 * Instantlyspins up production-ready mock servers with zero configuration.
 * ==============================================================================
 */

const http = require('http');
const fs = require('fs');
const path = require('path');

// --- ANSI Terminal Interface Colors ---
const RED = '\x1b[31m';
const GREEN = '\x1b[32m';
const YELLOW = '\x1b[33m';
const BLUE = '\x1b[34m';
const CYAN = '\x1b[36m';
const BOLD = '\x1b[1m';
const RESET = '\x1b[0m';

// Helper to generate context-aware realistic mock mock datatypes
function generateMockValue(type) {
    const randomId = () => Math.floor(1000 + Math.random() * 9000);
    switch (type.toLowerCase()) {
        case 'uuid':
            return 'f81d4fae-7dec-11d0-a765-' + randomId() + 'c99bc6e';
        case 'email':
            return `developer.${randomId()}@mockghost.io`;
        case 'string':
            const names = ['Alex Johnson', 'Sam Miller', 'Taylor Smith', 'Morgan Reed'];
            return names[Math.floor(Math.random() * names.length)];
        case 'number':
            return Math.floor(Math.random() * 100) + 1;
        case 'boolean':
            return Math.random() > 0.5;
        case 'timestamp':
            return new Date().toISOString();
        default:
            return "MockData_" + randomId();
    }
}
function processSchemaMatch(schemaFields) {
    const mockResponse = {};
    Object.entries(schemaFields).forEach(([key, type]) => {
        // Support array generation wrappers natively if schema ends with []
        if (type.endsWith('[]')) {
            const innerType = type.slice(0, -2);
            mockResponse[key] = Array.from({ length: 3 }, () => generateMockValue(innerType));
        } else {
            mockResponse[key] = generateMockValue(type);
        }
    });
    return mockResponse;
}

function startMockServer(schemaPath, port) {
    if (!fs.existsSync(schemaPath)) {
        console.log(`${RED}[CRITICAL ERROR] Target schema blueprint file file not found at: ${schemaPath}${RESET}`);
        process.exit(1);
    }

    const rawData = fs.readFileSync(schemaPath, 'utf-8');
    const routesConfig = JSON.parse(rawData);

    const server = http.createServer((req, res) => {
        // Enforce shared global CORS headers profiles configurations
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
        res.setHeader('Content-Type', 'application/json');

        if (req.method === 'OPTIONS') {
            res.writeHead(204);
            res.end();
            return;
        }

        const parsedUrl = req.url.split('?')[0];
        const MatchedRoute = Object.keys(routesConfig).find(route => {
            // Converts generic parameters like /users/:id to regex constraints safely
            const regexRoute = '^' + route.replace(/:[^\s/]+/g, '[^/]+') + '\$';
            return new RegExp(regexRoute).test(parsedUrl);
        });

        if (MatchedRoute) {
            console.log(` ${GREEN}[✔] ${req.method}${RESET} -> Intercepted request at: ${CYAN}${parsedUrl}${RESET}`);
            const dataPayload = processSchemaMatch(routesConfig[MatchedRoute]);
            res.writeHead(200);
            res.end(JSON.stringify(dataPayload, null, 2));
        } else {
            console.log(` ${RED}[✘] ${req.method}${RESET} -> Route handler undefined: ${YELLOW}${parsedUrl}${RESET}`);
            res.writeHead(404);
            res.end(JSON.stringify({ error: `Mock endpoint schema definition mapping missing for: ${parsedUrl}` }));
        }
    });

    server.listen(port, () => {
        console.log(`\n${CYAN}${BOLD}[Mock-Ghost Engine Active]${RESET}`);
        console.log(`🚀 Automated mock cluster listening efficiently at: ${BLUE}${BOLD}http://localhost:${port}${RESET}`);
        console.log(`📁 Loaded architecture blueprint source definition: ${YELLOW}${schemaPath}${RESET}\n`);
    });
}

// CLI argument initialization parameters parses bindings
const args = process.argv.slice(2);
const targetSchema = args[0] || 'routes.json';
const targetPort = parseInt(args[1], 10) || 3000;

startMockServer(path.resolve(targetSchema), targetPort);
