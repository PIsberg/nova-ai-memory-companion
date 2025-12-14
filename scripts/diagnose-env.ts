import fs from 'fs';
import path from 'path';

const envPath = path.join(process.cwd(), '.env.local');

console.log('--- DIAGNOSTIC START ---');
console.log('Checking file:', envPath);

if (!fs.existsSync(envPath)) {
    console.log('ERROR: .env.local file NOT found!');
    process.exit(1);
}

try {
    const content = fs.readFileSync(envPath, 'utf-8');
    console.log('File found. Content length:', content.length);

    const lines = content.split('\n');
    let keyFound = false;

    lines.forEach((line, idx) => {
        const trimmed = line.trim();
        if (!trimmed) return;

        // Check for "GEMINI_API_KEY="
        if (trimmed.startsWith('GEMINI_API_KEY')) {
            console.log(`Line ${idx + 1}: Found variable definition.`);

            const parts = trimmed.split('=');
            if (parts.length < 2) {
                console.log('ERROR: Missing "=" sign.');
                return;
            }

            const key = parts.slice(1).join('=').trim();

            if (parts[0].trim() !== 'GEMINI_API_KEY') {
                console.log('WARNING: Spaces detected around variable name like "GEMINI_API_KEY ". Remove them.');
            }

            if (key.length === 0) {
                console.log('ERROR: Key value is empty.');
            } else if (key.length < 30) {
                console.log('WARNING: Key seems too short ("' + key + '"). Valid keys are usually ~39 chars.');
            } else if (key.startsWith('AIza')) {
                console.log('SUCCESS: Key looks valid (starts with AIza).');
                keyFound = true;
            } else {
                console.log('WARNING: Key does not start with "AIza". Might be invalid.');
            }

            // Check for quotes
            if (key.startsWith('"') || key.startsWith("'")) {
                console.log('NOTE: Key is quoted. This is usually fine but ensure quotes are balanced.');
            }
        }
    });

    if (!keyFound) {
        console.log('ERROR: GEMINI_API_KEY not found in file or format is incorrect.');
    }

} catch (err) {
    console.error('Error reading file:', err);
}
console.log('--- DIAGNOSTIC END ---');
