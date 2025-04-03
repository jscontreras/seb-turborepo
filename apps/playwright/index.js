import { webkit } from "playwright";

const browser = await webkit.launch({
  headless: false,
});
const page = await browser.newPage();

await page.goto("https://www.tc-vercel.dev/isr-preview/1?_draft=true");
const switchElement = await page.getByRole("switch", { name: "Draft mode" });
const isChecked = await switchElement.isChecked();

if (!isChecked) {
  await switchElement.click();
}

for (let index = 1; index <= 10; index++) {
  await page.goto(`https://www.tc-vercel.dev/isr-preview/${index}?_draft=true`);
  const switchElement = await page.getByRole("switch", { name: "Draft mode" });
  const isChecked = await switchElement.isChecked();

  if (!isChecked) {
    await switchElement.click();
  }
}
browser.close();
