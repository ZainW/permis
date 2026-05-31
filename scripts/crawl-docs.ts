import { chromium } from "playwright";
import { writeFile, mkdir } from "node:fs/promises";
import { join } from "node:path";

interface DocPage {
  path: string;
  title: string;
  content: string;
}

const DOCS_PAGES = [
  "/",
  "/docs",
  "/docs/concepts/rbac",
  "/docs/concepts/abac",
  "/docs/concepts/conditions",
  "/docs/concepts/role-merging",
  "/docs/guides/quick-start",
  "/docs/guides/defining-permissions",
  "/docs/guides/engine-usage",
  "/docs/adapters/drizzle",
  "/docs/adapters/better-auth",
  "/docs/api/core",
  "/docs/api/drizzle",
  "/docs/api/better-auth",
];

async function crawlDocsPage(
  page: import("playwright").Page,
  path: string,
  screenshotDir: string,
): Promise<DocPage> {
  await page.goto(path, { waitUntil: "networkidle" });

  await page.waitForSelector("article, main", { timeout: 10000 }).catch(() => {});

  const h1 = page.locator("article h1, main h1").first();
  const title =
    (await h1.textContent({ timeout: 3000 }).catch(() => null))?.trim() || (await page.title());

  const body = page.locator("article, main").first();
  const content = (await body.innerText({ timeout: 5000 }).catch(() => "")) ?? "";

  const filename = path.replace(/\//g, "_");
  await page.screenshot({
    path: join(screenshotDir, `${filename}.png`),
    fullPage: true,
  });

  return { path, title, content };
}

async function crawlHomePage(
  page: import("playwright").Page,
  screenshotDir: string,
): Promise<DocPage> {
  await page.goto("/", { waitUntil: "networkidle" });

  const h1 = page.locator("h1").first();
  const title = (await h1.textContent({ timeout: 3000 }).catch(() => null))?.trim() || "Permis";

  const main = page.locator("main").first();
  const content =
    (await main.innerText({ timeout: 5000 }).catch(async () => {
      return (await page.locator("body").innerText()) ?? "";
    })) ?? "";

  await page.screenshot({
    path: join(screenshotDir, "index.png"),
    fullPage: true,
  });

  return { path: "/", title, content };
}

async function main() {
  const outputDir = join(import.meta.dirname, "..", ".cache", "docs");
  const screenshotDir = join(outputDir, "screenshots");
  await mkdir(screenshotDir, { recursive: true });

  const baseURL = "http://localhost:3000";
  const browser = await chromium.launch();
  const context = await browser.newContext({ baseURL });
  const page = await context.newPage();

  const results: DocPage[] = [];

  for (const path of DOCS_PAGES) {
    console.log(`Crawling: ${path}`);
    try {
      const doc =
        path === "/"
          ? await crawlHomePage(page, screenshotDir)
          : await crawlDocsPage(page, path, screenshotDir);
      results.push(doc);

      const filename = path === "/" ? "index" : path.replace(/\//g, "_");
      await writeFile(
        join(outputDir, `${filename}.txt`),
        `# ${doc.title}\n\n${doc.content}`,
        "utf-8",
      );
    } catch (err) {
      console.error(`  Failed: ${path}`, err);
    }
  }

  const index = results.map((r) => {
    const filename = r.path === "/" ? "index" : r.path.replace(/\//g, "_");
    return {
      path: r.path,
      title: r.title,
      text: `${filename}.txt`,
      screenshot: `screenshots/${filename}.png`,
    };
  });

  await writeFile(join(outputDir, "index.json"), JSON.stringify(index, null, 2), "utf-8");

  await browser.close();
  console.log(`\nDone. ${results.length} pages saved to ${outputDir}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
