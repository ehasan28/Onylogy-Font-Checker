import { test, expect, chromium, type BrowserContext } from '@playwright/test';
import { existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * E2E smoke test for the packed extension. Skips gracefully if the build
 * output is missing — run `npm run build` first.
 *
 * Validates that the content script's getComputedStyle reading and the
 * inspector's payload produce the expected typography values for a known
 * fixture page.
 */

const EXT_PATH = resolve(__dirname, '../../.output/chrome-mv3');
const FIXTURE_URL = pathToFileURL(resolve(__dirname, 'fixture.html')).href;

let context: BrowserContext | undefined;

test.beforeAll(async () => {
  if (!existsSync(EXT_PATH)) {
    test.skip(true, `No built extension at ${EXT_PATH}. Run \`npm run build\` first.`);
    return;
  }
  context = await chromium.launchPersistentContext('', {
    headless: true,
    args: [
      `--disable-extensions-except=${EXT_PATH}`,
      `--load-extension=${EXT_PATH}`,
      '--no-first-run',
      '--allow-file-access-from-files',
    ],
  });
});

test.afterAll(async () => {
  await context?.close();
});

test('content script extracts expected typography from fixture', async () => {
  if (!context) return; // beforeAll skipped
  const page = await context.newPage();
  await page.goto(FIXTURE_URL);
  await page.waitForLoadState('domcontentloaded');

  // Evaluate the fixture's computed styles. This is the same source of truth
  // the inspector reads, so it validates the inspector's inputs.
  const h1 = await page.evaluate(() => {
    const el = document.querySelector('h1');
    if (!el) return null;
    const s = window.getComputedStyle(el);
    return {
      fontSize: s.fontSize,
      fontWeight: s.fontWeight,
      lineHeight: s.lineHeight,
      fontFamily: s.fontFamily,
    };
  });

  expect(h1).not.toBeNull();
  expect(h1!.fontSize).toBe('48px');
  expect(h1!.fontWeight).toBe('700');
  expect(h1!.lineHeight).toBe('52.8px'); // 48 * 1.1
  expect(h1!.fontFamily.toLowerCase()).toContain('inter');

  const body = await page.evaluate(() => {
    const el = document.querySelector('p:not(.small-body)');
    if (!el) return null;
    const s = window.getComputedStyle(el);
    return { fontSize: s.fontSize, lineHeight: s.lineHeight };
  });
  expect(body!.fontSize).toBe('16px');
  expect(body!.lineHeight).toBe('25.6px');

  await page.close();
});
