// sync_help_idx_en.js
// help_err_en.json의 help_idx 값을 help_err_ko.json과 동일하게 맞춤.
// 행 단위로 처리하여 JSON 포맷(indent, 줄바꿈 등)을 보존.
//
// 사용법: node sync_help_idx_en.js

const fs = require('fs');
const path = require('path');

const dir = path.dirname(__filename);
const koPath = path.join(dir, 'help_err_ko.json');
const enPath = path.join(dir, 'help_err_en.json');

// ko.json 파싱 → errCode: help_idx 맵 생성
const koRaw = fs.readFileSync(koPath, 'utf-8').replace(/^\uFEFF/, '');
const koData = JSON.parse(koRaw);
const koMap = {};
for (const [code, entry] of Object.entries(koData)) {
    if (entry.help_idx !== undefined) {
        koMap[code] = entry.help_idx;
    }
}

// en.json 읽기 (BOM, 줄바꿈 보존)
const enRawBuf = fs.readFileSync(enPath);
const hasBOM = enRawBuf[0] === 0xEF && enRawBuf[1] === 0xBB && enRawBuf[2] === 0xBF;
const enText = enRawBuf.toString('utf-8').replace(/^\uFEFF/, '');
const crlf = enText.includes('\r\n');
const eol = crlf ? '\r\n' : '\n';
const lines = enText.split(eol);

let currentCode = null;  // 현재 처리 중인 에러 코드
const result = [];
let changedCount = 0;

for (let i = 0; i < lines.length; i++) {
    let line = lines[i];

    // 1) 현재 에러 코드 추적
    const codeMatch = line.match(/^\s*"(E[^"]+)"\s*:\s*\{/);
    if (codeMatch) {
        currentCode = codeMatch[1];
    }

    // 2) "help_idx" 없으면 skip
    if (!line.includes('"help_idx"')) {
        result.push(line);
        continue;
    }

    // 3) "help_idx" 있음 → ko와 비교
    const idxMatch = line.match(/^(\s*"help_idx"\s*:\s*)"([^"]*)"(.*)/);
    if (idxMatch && currentCode) {
        const enVal = idxMatch[2];
        const koVal = koMap[currentCode];

        if (koVal === undefined) {
            // ko에 해당 에러 코드 없음 → 보고만
            console.log(`[ko 없음] ${currentCode}: en="${enVal}"`);
        } else if (enVal !== koVal) {
            // 불일치 → ko 값으로 교체
            line = idxMatch[1] + '"' + koVal + '"' + idxMatch[3];
            console.log(`[수정] ${currentCode}: "${enVal}" → "${koVal}"`);
            changedCount++;
        }
        // 동일하면 그냥 push
    }

    result.push(line);
}

const newText = result.join(eol);
const outBuf = Buffer.from((hasBOM ? '\uFEFF' : '') + newText, 'utf-8');
fs.writeFileSync(enPath, outBuf);

console.log(`\n완료: ${changedCount}행 수정`);
