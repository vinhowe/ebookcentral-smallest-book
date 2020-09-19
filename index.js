const { webkit } = require('playwright');
const fs = require('fs');

const sessionFileName = process.argv[2] || 'session.json';

const sessionFileData = fs.readFileSync(sessionFileName);
const sessionData = JSON.parse(sessionFileData);

const ids = sessionData.ids;
const ebookcentralUrl = sessionData.url;
const selector = sessionData.selector;
const innerTextRegex = sessionData.regex;

(async () => {
  const browser = await webkit.launch();
  const context = await browser.newContext();
  const page = await context.newPage();

  let lowestId;
  let lowestPageCount = Infinity;

  for (id of ids) {
      await page.goto(ebookcentralUrl.replace('{ID}', id));
      let pageCount = parseInt((await (await page.$(selector)).innerText()).match(RegExp(innerTextRegex))[0]);
      console.log(`ID: ${id}, pages: ${pageCount}`);
      if (pageCount < lowestPageCount) {
          lowestId = id;
          lowestPageCount = pageCount;
      }
  }

  await browser.close();

  console.log(`Page with lowest page count is ${lowestId} with ${lowestPageCount} pages`);
})();
