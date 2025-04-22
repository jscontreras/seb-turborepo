import { webkit } from "playwright";

const browser = await webkit.launch({
  headless: false,
});

const page = await browser.newPage();
for (let trials = 0; trials < 10; trials++) {
  for (let index = 6; index <= 36; index++) {
    await page.goto(`https://www.tc-vercel.dev/dynamic/${index}`);
    await page.waitForTimeout(1000);
    // await page.goto(`https://www.tc-vercel.dev/isr-preview/${index}?_draft=true`);
    // const switchElement = await page.getByRole("switch", { name: "Draft mode" });
    // const isChecked = await switchElement.isChecked();

    // if (!isChecked) {
    //   await switchElement.click();
    // }
    // await page.waitForTimeout(1000);
  }
}
browser.close();
