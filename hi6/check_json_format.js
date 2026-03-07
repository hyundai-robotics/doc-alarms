import fs from 'fs';


///@param[in]   pathname
///@return      pathname이 적법한 json format인지 여부
///@brief		    
function checkJsonFormat(pathname)
{
  let text;

  try {
    text = fs.readFileSync(pathname, 'utf8');
    text = text.replace('\ufeff', '');			// strip BOM
  } catch (err) {
    console.error(colorStrRed('  [FILE ERROR] ') + `cannot read file: ${pathname}`);
    console.error(err.message);
    return false;
  }

  try {
    JSON.parse(text);
  } catch (err) {
    console.log(colorStrRed('  [JSON ERROR] ') + err.message);
    return false;
  }
  console.log(colorStrGreen('  [JSON OK] ') + 'Valid .json format.');

  return true;
}


///@brief		    사용법 출력
function printHowToUse()
{
    console.log(`  # HOW TO USE:`);
    console.log(`    node check_bookinfos_format.js {pathname}.`);
}


///@brief		    Greeting 출력
function printGreeting()
{
  console.log(`----------------------------------------`);
  console.log(`check_json_format`);
  console.log(`   programmed by choi, won-hyuk`);
  console.log(`   v1.0b  2026-01-09`);
  console.log(`----------------------------------------`);
}


// --------------------------------------------------------
export function colorStrGreen(str) {

	return `\x1b[32m${str}\x1b[0m`;
}


// --------------------------------------------------------
export function colorStrRed(str) {

	return `\x1b[31m${str}\x1b[0m`;
}


///@brief		    main 함수
function main()
{
  printGreeting();

  // 실행
  if(process.argv.length < 3) {
    printHowToUse();
    return;
  }

  const inputPath = process.argv[2];

  checkJsonFormat(inputPath);
}

///////////////////////////////////////
main();
