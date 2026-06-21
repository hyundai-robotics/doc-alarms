const fs = require('fs');
const nodepath = require('path');

const pathname_ts_summary = "R:/git_repo/doc/doc-hi7-troubleshoot/SUMMARY.md";
const pathname_help = "./hi6-hi7/help_err_zh.json";

let help_title_header = '[TroubleShoot]';
if (pathname_help.includes('_ko.')) help_title_header = '[조치방법]';
else if (pathname_help.includes('_zh.')) help_title_header = '[处理方法]';


// --------------------------------------------------------
// SUMMARY.md에서 모든 .md들의 title과 경로를 helps 맵으로 반환
// key: 코드키 (예: "E2", "E2500") / value: {path, title}
function loadHelpsByCode(summaryPath) {
    const helps = new Map();
    for (const line of fs.readFileSync(summaryPath, 'utf8').split('\n')) {
        loadHelpsByCodeLine(helps, line);
    }
    return helps;
}

function loadHelpsByCodeLine(helps, line) {
    // [2.1. E02500 AMP의 회생방전 저항 과열](2-servo-amp-board-part/E02500.md)
    const match = line.match(/\[([^\]]+)\]\(([^)]+\.md)\)/);
    if (!match) return;
    const mdTitleWithNum = match[1];
    const mdPath = match[2];

    const mdTitle = mdTitleWithNum.replace(/^(\d+\.)+\s+[EWN][0-9]+\s*/, "");
    const filename = nodepath.basename(mdPath, '.md');
    const codeMatch = filename.match(/^([A-Za-z]+)(\d+)$/);     // [2]: 02500
    if (!codeMatch) return;

    const key = codeMatch[1].toUpperCase() + parseInt(codeMatch[2], 10);
    helps.set(key, {
        title: mdTitle,              // 'AMP의 회생방전 저항 과열'
        path: mdPath.slice(0, -3)    // '2-servo-amp-board-part/E02500'
    });
}


// --------------------------------------------------------
// entry key에서 코드 키 추출
// 예: "E2" -> "E2", "E50101" -> "E50101"
function extractCode(key) {
    const m = key.match(/^([A-Za-z]+)(\d+)$/);
    if (!m) return null;
    return m[1].toUpperCase() + parseInt(m[2], 10);
}


// --------------------------------------------------------
// help*.json을 JSON parsing하여 처리 후 반환
function processHelpFile(helpPath, helps) {
    let raw = fs.readFileSync(helpPath, 'utf8');
    if (raw.charCodeAt(0) === 0xFEFF) raw = raw.slice(1);  // UTF-8 BOM skip
    const helpData = JSON.parse(raw);
    let updatedCount = 0;
    let deletedCount = 0;

    for (const [key, entry] of Object.entries(helpData)) {
        const code = extractCode(key);
        const helpInfo = code ? (helps.get(code) ?? null) : null;

        if (helpInfo) {
            entry.help_idx = helpInfo.path;
            entry.help_title = `${help_title_header} ${helpInfo.title}`;
            updatedCount++;
        } else {
            if ('help_idx' in entry || 'help_title' in entry) {
                delete entry.help_idx;
                delete entry.help_title;
                deletedCount++;
            }
        }
    }

    return { content: JSON.stringify(helpData, null, 4), updatedCount, deletedCount };
}


// --------------------------------------------------------
function main() {
    const helps = loadHelpsByCode(pathname_ts_summary);
    console.log(`SUMMARY.md에서 ${helps.size}개 에러/경고 항목 로드`);

    const helpPath = nodepath.resolve(pathname_help);
    const { content, updatedCount, deletedCount } = processHelpFile(helpPath, helps);

    fs.writeFileSync(helpPath, content, 'utf8');
    console.log(`완료: ${updatedCount}개 갱신, ${deletedCount}개 삭제`);
}

main();
