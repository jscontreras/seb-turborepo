import { webkit } from "playwright";

const browser = await webkit.launch({
  headless: false,
});
const context = await browser.newContext();
const page = await context.newPage();
for (let index = 6; index <= 36; index++) {
  await page.goto(`https://www.tc-vercel.dev/isr/${index}`);
  await page.waitForTimeout(1000);
}
browser.close();
