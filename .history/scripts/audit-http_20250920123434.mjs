#!/usr/bin/env node
/**
 * Simple HTTP audit for local dev
 * - Checks key endpoints
 * - Follows redirects and records chains
 * - Outputs JSON report to logs/audit
 */
import fs from 'fs';
import path from 'path';
import http from 'http';
import https from 'https';
import { URL } from 'url';

const BASES = [
  process.env.AUDIT_BASE || 'http://localhost:3000',
  process.env.AUDIT_BASE_ADMIN || 'http://localhost:5173',
];

const PATHS = [
  '/',
  '/api/health',
  '/api/monitoring/health',
  '/api/public',
  '/admin',
  '/admin/',
  '/non-exist-123',
];

function fetchHeadOrGet(urlStr, maxRedirects = 10) {
  return new Promise((resolve) => {
    const url = new URL(urlStr);
    const lib = url.protocol === 'https:' ? https : http;
    const options = {
      method: 'GET',
      headers: { 'User-Agent': 'audit-http/1.0' },
    };

    const redirects = [];

    function requestOnce(currentUrl, redirectsLeft) {
      const u = new URL(currentUrl);
      const req = lib.request(u, options, (res) => {
        const { statusCode, headers } = res;

        if (statusCode >= 300 && statusCode < 400 && headers.location && redirectsLeft > 0) {
          const nextUrl = new URL(headers.location, u).toString();
          redirects.push({ status: statusCode, location: headers.location });
          // drain and follow
          res.resume();
          requestOnce(nextUrl, redirectsLeft - 1);
          return;
        }

        // collect a small sample of body for 4xx/5xx
        let body = '';
        res.on('data', (chunk) => {
          if (body.length < 2048) body += chunk.toString();
        });
        res.on('end', () => {
          resolve({
            url: currentUrl,
            status: statusCode,
            headers,
            redirects,
            sample: body.slice(0, 1024),
          });
        });
      });

      req.on('error', (err) => {
        resolve({ url: currentUrl, error: err.message, redirects });
      });

      req.end();
    }

    requestOnce(urlStr, maxRedirects);
  });
}

async function run() {
  const results = [];
  for (const base of BASES) {
    for (const p of PATHS) {
      const target = new URL(p, base).toString();
      // eslint-disable-next-line no-await-in-loop
      const res = await fetchHeadOrGet(target);
      results.push(res);
    }
  }

  const summary = {
    timestamp: new Date().toISOString(),
    totals: {
      count: results.length,
      errors: results.filter(r => r.error).length,
      s404: results.filter(r => r.status === 404).length,
      s5xx: results.filter(r => r.status && r.status >= 500 && r.status < 600).length,
      redirects: results.filter(r => r.redirects && r.redirects.length).length,
    },
    results,
  };

  const outDir = path.join(process.cwd(), 'logs', 'audit');
  fs.mkdirSync(outDir, { recursive: true });
  const outFile = path.join(outDir, `audit-${Date.now()}.json`);
  fs.writeFileSync(outFile, JSON.stringify(summary, null, 2));
  console.log(`Audit written to ${outFile}`);
  console.log(summary.totals);
}

run().catch((e) => {
  console.error('Audit failed:', e);
  process.exit(1);
});
