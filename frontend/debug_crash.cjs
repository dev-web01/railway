const puppeteer = require("puppeteer");

(async () => {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  
  page.on("pageerror", (err) => {
    console.error("PAGE ERROR:", err.toString());
  });

  page.on("console", (msg) => {
    if (msg.type() === "error") {
      console.error("CONSOLE ERROR:", msg.text());
    }
  });

  await page.goto("http://localhost:8080/login");
  
  // Login as Admin
  await page.type("input[type='email']", "admin@railways.gov.in");
  await page.type("input[type='password']", "Admin@123");
  await page.click("button[type='submit']");
  
  await page.waitForNavigation();
  await page.goto("http://localhost:8080/assets", { waitUntil: "networkidle0" });

  console.log("Navigated to Assets. Clicking first dropdown...");
  
  // Wait for the asset table to load
  await page.waitForSelector("table tbody tr button");
  
  // Click the first dropdown trigger
  const buttons = await page.$$("table tbody tr button");
  await buttons[0].click();
  
  // Wait for the dropdown content
  await page.waitForSelector("[role='menuitem']");
  
  // Click "Edit Asset" (should be the second menu item or contain text "Edit Asset")
  const items = await page.$$("[role='menuitem']");
  for (const item of items) {
    const text = await page.evaluate(el => el.textContent, item);
    if (text.includes("Edit Asset")) {
      console.log("Clicking Edit Asset...");
      await item.click();
      break;
    }
  }

  // Wait a moment for any crash to happen
  await new Promise(r => setTimeout(r, 2000));
  
  // check if error boundary showed up
  const hasError = await page.evaluate(() => document.body.innerText.includes("This page didn't load"));
  console.log("Has error boundary:", hasError);

  await browser.close();
})();
