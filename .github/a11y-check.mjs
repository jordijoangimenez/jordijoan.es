// Runs axe-core on every page of the site (WCAG 2.2 A/AA + best practices), in the dark and light themes,
// with reduced motion so no content is mid-animation. Exits with an error if anything is found.
import puppeteer from 'puppeteer';
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';

const require = createRequire(import.meta.url);
const axeSource = readFileSync(require.resolve('axe-core/axe.min.js'), 'utf8');
const base = process.env.BASE_URL || 'http://localhost:8080/';
const langs = ['', 'ca/', 'es/', 'de/', 'fr/', 'zh/'];
const pages = ['index.html', 'publications.html', 'projects.html', 'accessibility.html'];
const paths = [...langs.flatMap((l) => pages.map((p) => l + p)), '404.html'];
const tags = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa', 'best-practice'];

const browser = await puppeteer.launch({ args: ['--no-sandbox'] });
let problems = 0;

for (const path of paths) {
  for (const theme of ['dark', 'light']) {
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 900 });
    await page.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'reduce' }]);
    await page.evaluateOnNewDocument((t) => { try { localStorage.setItem('theme', t); } catch (e) {} }, theme);
    const response = await page.goto(base + path, { waitUntil: 'networkidle0' });
    if (!response || !response.ok()) {
      problems++;
      console.log(`✗ ${path} [${theme}] could not be loaded (${response ? response.status() : 'no response'})`);
      await page.close();
      continue;
    }
    await page.evaluate(() => document.querySelectorAll('details').forEach((d) => { d.open = true; }));
    await page.addScriptTag({ content: axeSource });
    const { violations } = await page.evaluate((t) => window.axe.run(document, { runOnly: { type: 'tag', values: t } }), tags);
    console.log(`${violations.length ? '✗' : '✓'} ${path} [${theme}] ${violations.length} violation(s)`);
    for (const v of violations) {
      problems++;
      console.log(`    ${v.id} (${v.impact}): ${v.help}`);
      for (const n of v.nodes.slice(0, 3)) console.log(`      ${n.target.join(' ')}`);
    }
    await page.close();
  }
}

await browser.close();
if (problems) {
  console.error(`\n${problems} accessibility problem(s) found.`);
  process.exit(1);
}
console.log(`\nNo accessibility violations on ${paths.length} pages in either theme.`);
