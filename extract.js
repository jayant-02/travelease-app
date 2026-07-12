const fs = require('fs');
const readline = require('readline');
const path = require('path');

const logPath = 'C:\\Users\\jayan\\.gemini\\antigravity\\brain\\23ddc7c2-248d-45b4-8be0-6ca341a1525c\\.system_generated\\logs\\transcript_full.jsonl';

const filesToRecover = [
    'd:\\\\Sip project\\\\css\\\\style.css',
    'd:\\\\Sip project\\\\js\\\\main.js',
    'd:\\\\Sip project\\\\js\\\\results.js',
    'd:\\\\Sip project\\\\js\\\\seat-selection.js',
    'd:\\\\Sip project\\\\js\\\\bookings.js',
    'd:\\\\Sip project\\\\js\\\\datepicker.js'
];

const recoveredContent = {};

async function processLineByLine() {
    const fileStream = fs.createReadStream(logPath);
    const rl = readline.createInterface({
        input: fileStream,
        crlfDelay: Infinity
    });

    for await (const line of rl) {
        try {
            const entry = JSON.parse(line);
            if (entry.tool_calls) {
                for (const call of entry.tool_calls) {
                    if (call.name === 'write_to_file' || call.name === 'replace_file_content' || call.name === 'multi_replace_file_content') {
                        let target = call.args.TargetFile;
                        if (target) {
                            // normalize target path for matching
                            target = target.replace(/\\/g, '\\\\');
                            
                            // Check if it's one of our target files
                            let matchedFile = filesToRecover.find(f => target.toLowerCase().includes(f.toLowerCase().split('\\\\').pop()));
                            
                            if (matchedFile) {
                                if (call.name === 'write_to_file') {
                                    recoveredContent[matchedFile] = call.args.CodeContent;
                                }
                                // We'll just grab the latest write_to_file. 
                                // Handling multi_replace_file_content is tricky programmatically on a string, 
                                // but we might get lucky if the last write_to_file is close enough.
                            }
                        }
                    }
                }
            }
        } catch(e) {
            // ignore JSON parse errors
        }
    }

    // Now write them out
    if (!fs.existsSync('d:/Sip project/css')) fs.mkdirSync('d:/Sip project/css');
    if (!fs.existsSync('d:/Sip project/js')) fs.mkdirSync('d:/Sip project/js');

    for (const [file, content] of Object.entries(recoveredContent)) {
        // Strip escaped quotes if necessary, but JSON.parse should have handled it.
        // The file string is like d:\\Sip project\\css\\style.css
        const realPath = file.replace(/\\\\/g, '\\');
        fs.writeFileSync(realPath, content, 'utf8');
        console.log(`Recovered ${realPath}`);
    }
}

processLineByLine();
