// fix_help_idx.js
// 각 행을 순회하며 "help_idx" 값에 '/'가 없으면 해당 행 삭제,
// 다음 행이 "help_title"이면 함께 삭제, 직전 행의 trailing comma도 제거.
//
// 사용법: node fix_help_idx.js <파일경로>
//   예시: node fix_help_idx.js help_err_ko.json

const fs = require('fs');
const path = require('path');

const filePath = process.argv[2];
if (!filePath) {
    console.error('Usage: node fix_help_idx.js <file>');
    process.exit(1);
}

const absPath = path.resolve(filePath);
const raw = fs.readFileSync(absPath);

// BOM 감지
const hasBOM = raw[0] === 0xEF && raw[1] === 0xBB && raw[2] === 0xBF;
const text = raw.toString('utf-8').replace(/^\uFEFF/, '');

// 줄바꿈 감지
const crlf = text.includes('\r\n');
const eol = crlf ? '\r\n' : '\n';

const lines = text.split(eol);
const result = [];
let deleted = 0;
let i = 0;

while (i < lines.length) {
    const line = lines[i];

    // "help_idx" 포함 여부 확인
    const m = line.match(/^(\s*)"help_idx"\s*:\s*"([^"]*)"/);
    if (m) {
        const value = m[2];
        if (!value.includes('/')) {
            // help_idx 행 삭제 → 직전 행의 trailing comma 제거
            if (result.length > 0) {
                result[result.length - 1] = result[result.length - 1].replace(/,(\s*)$/, '$1');
            }
            deleted++;
            i++;

            // 다음 행이 "help_title"이면 함께 삭제
            if (i < lines.length && lines[i].includes('"help_title"')) {
                deleted++;
                i++;
            }
            continue;
        }
    }

    result.push(line);
    i++;
}

const newText = result.join(eol);
const outBuf = Buffer.from((hasBOM ? '\uFEFF' : '') + newText, 'utf-8');
fs.writeFileSync(absPath, outBuf);

console.log(`완료: ${deleted}행 삭제 (${absPath})`);
