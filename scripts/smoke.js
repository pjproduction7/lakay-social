/* global process */
import { chromium } from 'playwright';
import fs from 'fs';
(async () => {
  const out = [];
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  page.on('console', msg => {
    out.push(`[console:${msg.type()}] ${msg.text()}`);
  });
  page.on('pageerror', err => {
    out.push(`[pageerror] ${err.message}`);
  });
  page.on('requestfailed', req => {
    out.push(`[requestfailed] ${req.method()} ${req.url()} - ${req.failure().errorText}`);
  });
  page.on('response', async res => {
    try {
      const url = res.url();
      const status = res.status();
      out.push(`[response] ${status} ${url}`);
    } catch (e) {
      out.push(`[response-error] ${e.message}`);
    }
  });

  try {
    // Home
    await page.goto('http://localhost:5173', { waitUntil: 'networkidle' });
    await page.screenshot({ path: 'logs/smoke-step0.png', fullPage: true });

    // Click the "Browse Feed" or "View Memorials" button in the policy popup if present, falling back to "I Agree"
    try {
      const guestFeed = await page.getByRole('button', { name: /Browse Feed/i, exact: false });
      if (guestFeed) {
        await guestFeed.click().catch(() => {});
        out.push('[action] clicked Browse Feed button in policy popup');
        await page.waitForTimeout(500);
        await page.screenshot({ path: 'logs/smoke-step1.png', fullPage: true });
      } else {
        const memorial = await page.getByRole('button', { name: /View Memorials/i, exact: false });
        if (memorial) {
          await memorial.click().catch(() => {});
          out.push('[action] clicked View Memorials button in policy popup');
          await page.waitForTimeout(500);
          await page.screenshot({ path: 'logs/smoke-step1.png', fullPage: true });
        } else {
          const agree = await page.getByRole('button', { name: /I Agree & Continue|I Agree/i, exact: false });
          if (agree) {
            await agree.click().catch(() => {});
            out.push('[action] clicked agree button');
            await page.waitForTimeout(500);
            await page.screenshot({ path: 'logs/smoke-step1.png', fullPage: true });
          }
        }
      }
    } catch {
      out.push('[info] policy popup buttons not found or click failed');
    }

    // Try clicking Feed via dashboard
    await page.screenshot({ path: 'logs/smoke-before-feed.png', fullPage: true });

    // Check /posts API directly from the script (server-side check)
    const postsResp = await page.evaluate(async () => {
      const r = await fetch('http://localhost:4001/posts');
      if (!r.ok) return { ok: false, status: r.status };
      const json = await r.json();
      return { ok: true, status: r.status, length: Array.isArray(json) ? json.length : null };
    });
    out.push(`[api] /posts -> ok=${postsResp.ok} status=${postsResp.status} length=${postsResp.length}`);

    // Click the "Feed" button from the dashboard to open the feed screen
    try {
      const feedBtn = await page.getByRole('button', { name: /Feed/i, exact: false });
      if (feedBtn) {
        await feedBtn.click().catch(() => {});
        out.push('[action] clicked Feed button');
        await page.waitForTimeout(1000);
        await page.screenshot({ path: 'logs/smoke-after-feed.png', fullPage: true });
      }
    } catch {
      out.push('[info] Feed button not found or click failed');
    }

    // Also ensure we can see at least one post element on the page (check the posts container)
    const postCountOnPageInfo = await page.evaluate(() => {
      const container = document.querySelector('.space-y-6');
      if (!container) return { count: 0, html: null };
      return { count: container.children.length, html: container.innerHTML.slice(0, 2000) };
    });
    out.push(`[dom] feed post elements found: ${postCountOnPageInfo.count}`);
    if (postCountOnPageInfo.html) {
      out.push('[dom] feed container snippet:\n' + postCountOnPageInfo.html);
    } else {
      out.push('[dom] feed container not found');
      const body = await page.evaluate(() => document.body.innerHTML.slice(0,1500));
      out.push('[dom] body snippet:\n' + body);
    }

    // Memorials: click the Memorials button from the dashboard instead of direct hash navigation
    try {
      const memorialBtn = await page.getByRole('button', { name: /Memorials/i, exact: false });
      if (memorialBtn) {
        await memorialBtn.click().catch(() => {});
        out.push('[action] clicked Memorials button');
        await page.waitForTimeout(500); // brief wait for UI
      }
    } catch {
      out.push('[info] Memorials button not found or click failed');
    }

    const memorialCount = await page.evaluate(() => {
      return document.querySelectorAll('.bg-white.rounded-xl.p-6.mb-6').length;
    });
    out.push(`[dom] memorial items found (heuristic): ${memorialCount}`);

    console.log(out.join('\n'));
    fs.mkdirSync('logs', { recursive: true });
    fs.writeFileSync('logs/smoke.log', out.join('\n'));
    await browser.close();
    process.exit( postsResp.ok ? 0 : 2 );
  } catch (err) {
    out.push(`[fatal] ${err.message}`);
    fs.writeFileSync('logs/smoke.log', out.join('\n'));
    console.error(err);
    await browser.close();
    process.exit(1);
  }
})();