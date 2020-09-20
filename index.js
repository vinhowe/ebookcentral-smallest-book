const { webkit } = require('playwright');
const fs = require('fs');

const args = require('minimist')(process.argv.slice(2));

const sessionFileName = args.s && typeof(args.s) === "string" ? args.s : 'session.json';
const outputFileName = typeof(args.o) === "string" ? args.o : 'books.json'

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
  
  const books = []

  process.stdout.write(`Loading data for ${ids.length} books`);

  for (id of ids) {
      process.stdout.write(".");
      await page.goto(ebookcentralUrl.replace('{ID}', id));
      let pageCount = parseInt((await (await page.$(selector)).innerText()).match(RegExp(innerTextRegex))[0]);

      if (pageCount < lowestPageCount) {
          lowestId = id;
          lowestPageCount = pageCount;
      }

      books.push({ id, pageCount })
  }

  process.stdout.write("done\n\n");
  await browser.close();
  books.sort((a, b) => a.pageCount - b.pageCount)

  console.log(`Book with lowest page count is ${lowestId} with ${lowestPageCount} pages\n`);

  for (book of books) {
    console.log(`ID: ${book.id}, pages: ${book.pageCount}`);
  }

  console.log();

  if (args.o) {
    console.log(`Outputting to ${outputFileName}`);
    fs.writeFileSync(outputFileName, JSON.stringify(books, null, 4))
  }
})();
