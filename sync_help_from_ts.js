const fs = require('fs');
const nodepath = require('path');

const pathname_ts_summary = "R:/git_repo/doc/doc-hi7-troubleshoot/SUMMARY.md";
const pathname_help = "./hi6-hi7/help_err_ko.json";

let help_title_header = (pathname_help.includes('_ko.')) ? '[조치방법]' : '[TroubleShoot]';

// --------------------------------------------------------
// SUMMARY.md에서 .md 경로들을 읽어 {코드키 -> 경로(.md 제외)} 맵 반환
// 코드키 예: "E2", "E2500" / 경로 예: "3-safety-board-part/E00002"
function loadHelpsByCode(summaryPath) {
    const helps = new Map();
    for (const line of fs.readFileSync(summaryPath, 'utf8').split('\n')) {
        loadHelpsByCodeLine(helps, line);       
    }
    return helps;
}


function loadHelpsByCodeLine(helps, line)
{
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
    const value = {
        title: mdTitle,              // 'AMP의 회생방전 저항 과열'
        path: mdPath.slice(0, -3)    // '2-servo-amp-board-part/E02500'
    };
    helps.set(key, value);      // key='E2500', value
}


// --------------------------------------------------------
// help_err_ko.json을 행 단위로 처리하여 갱신된 내용 반환
function processHelpFile(helpPath, helps) {
    const lines = fs.readFileSync(helpPath, 'utf8').split('\n');
    let updatedCount = 0;
    let deletedCount = 0;
    const outputLines = [];

    let help_title = null;
    for (const line of lines) {
        
        const { helpTitleLine, isHelpTitle } = processHelpTitleLine(line, help_title);
        
        if (help_title) {
            outputLines.push(helpTitleLine);
            if (!isHelpTitle) outputLines.push(line);
            help_title = null;
            continue;
        }
        else if(isHelpTitle) {
            continue;       // help_title행 삭제
        }

        const { helpIdxLine, isHelpIdx, updated, title } = processHelpIdxLine(line, helps);
        if (isHelpIdx) {
            if (helpIdxLine !== null) {
                outputLines.push(helpIdxLine);
                if (updated) updatedCount++;
                help_title = title;
                continue;
            }
            else {      // help_idx이지만 helps에 없음.
                deletedCount++;
            }
        } else {
            outputLines.push(line);
        }
        help_title = null;
    }

    return { content: outputLines.join('\n'), updatedCount, deletedCount };
}


// help_idx 행 하나를 처리: 경로 갱신된 행 반환, 삭제 대상이면 null 반환
function processHelpIdxLine(line, helps) {
    // "help_idx": "E0010",
    const m = line.match(/^(\s*"help_idx"\s*:\s*)"([^"]*)"(\s*,?\s*)$/);
    if (!m) return { helpIdxLine: null, isHelpIdx: false };  // not help_idx
    const code = extractCode(m[2]);     // "E10"
    if (code && helps.has(code)) {    // key='E2502', value='2-servo-amp-board-part/E02502'
        const { title, path } = helps.get(code);
        return {
            helpIdxLine: `${m[1]}"${path}"${m[3]}`,
            isHelpIdx: true,
            updated: path !== m[2],
            title
        };
    }
    return { helpIdxLine: null, isHelpIdx: true, updated: false };   // not-found
}


// help_idx 값에서 코드 키 추출
// 예: "E0002" -> "E2", "3-safety-board-part/E00002" -> "E2"
function extractCode(value) {
    const m = value.match(/([A-Za-z]+)(\d+)(?:\.md)?$/);
    if (!m) return null;
    return m[1].toUpperCase() + parseInt(m[2], 10);
}


// --------------------------------------------------------
// help_title 행 하나를 처리
function processHelpTitleLine(line, help_title) {
    // "help_title": "AMP의 회생방전 저항 과열"
    const m = line.match(/^(\s*"help_title"\s*:\s*)"([^"]*)"(\s*,?\s*)$/);
    let isHelpTitle = !!m;

    let helpTitleLine = null;
    if (help_title) {
        if (!m) helpTitleLine = `        "help_title": "${help_title_header} ${help_title}"`;
        else helpTitleLine = `${m[1]}"${help_title_header} ${help_title}"${m[3]}`;
        return { helpTitleLine, isHelpTitle };
    }
    else {      // help_title가 없어야 할 때,
        return { helpTitleLine: null, isHelpTitle };
    }
}


// --------------------------------------------------------
// }, 행 직전 행의 불필요한 trailing comma 제거
// 예: "remedy": "...",  \n    },  →  "remedy": "..."  \n    },
function removeTrailingCommaBeforeClose(content) {
    const lines = content.split('\n');
    for (let i = 1; i < lines.length; i++) {
        if (lines[i].match(/^\s+\},?\s*$/) && lines[i - 1].match(/,(\s*)$/)) {
            lines[i - 1] = lines[i - 1].replace(/,(\s*)$/, '$1');
        }
    }
    return lines.join('\n');
}


// --------------------------------------------------------
function main() {
    const helps = loadHelpsByCode(pathname_ts_summary);
    console.log(`SUMMARY.md에서 ${helps.size}개 에러 경로 로드`);

    const helpPath = nodepath.resolve(pathname_help);
    const { content, updatedCount, deletedCount } = processHelpFile(helpPath, helps);

    const finalContent = removeTrailingCommaBeforeClose(content);
    fs.writeFileSync(helpPath, finalContent, 'utf8');
    
    console.log(`완료: ${updatedCount}개 갱신, ${deletedCount}개 삭제`);
}

main();
