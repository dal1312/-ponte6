const fs = require('node:fs');
const path = require('node:path');

const projectRoot = process.cwd();
const htmlFiles = fs
  .readdirSync(projectRoot)
  .filter((name) => name.endsWith('.html'));
const jsRoot = path.join(projectRoot, 'js');
const jsFiles = fs
  .readdirSync(jsRoot)
  .filter((name) => name.endsWith('.js'))
  .map((name) => path.join(jsRoot, name));
const serviceWorkerPath = path.join(projectRoot, 'service-worker.js');
const noCanonicalRequired = new Set(['offline.html']);

const serviceWorkerRaw = fs.readFileSync(serviceWorkerPath, 'utf8');
const swCacheVersionMatch = serviceWorkerRaw.match(/CACHE_VERSION\s*=\s*["']([^"']+)["']/i);
const swCacheVersion = swCacheVersionMatch ? swCacheVersionMatch[1] : null;
const swMainScriptMatch = serviceWorkerRaw.match(/["']\.\/js\/main\.js\?v=([^"']+)["']/i);
const swMainScriptVersion = swMainScriptMatch ? swMainScriptMatch[1] : null;

const hasServiceWorkerRegister = jsFiles.some((file) =>
  /navigator\.serviceWorker\.register/.test(fs.readFileSync(file, 'utf8'))
);

function getAttr(tag, name) {
  const regex = new RegExp(`\\b${name}\\s*=\\s*(["'])(.*?)\\1`, 'i');
  const match = tag.match(regex);
  return match ? match[2] : null;
}

const issues = {
  links: [],
  images: [],
  canonical: [],
  scriptVersion: [],
  serviceWorker: []
};

for (const file of htmlFiles) {
  const filePath = path.join(projectRoot, file);
  const content = fs.readFileSync(filePath, 'utf8');

  const anchors = [...content.matchAll(/<a\b[^>]*>/gi)];
  anchors.forEach((match) => {
    const tag = match[0];
    const target = getAttr(tag, 'target');
    if (!target || target.toLowerCase() !== '_blank') return;

    const rel = getAttr(tag, 'rel') || '';
    const relTokens = rel.toLowerCase().split(/\s+/);
    const hasNoopener = relTokens.includes('noopener');
    const hasNoreferrer = relTokens.includes('noreferrer');

    if (!hasNoopener || !hasNoreferrer) {
      issues.links.push({ file, snippet: tag });
    }
  });

  const images = [...content.matchAll(/<img\b[^>]*>/gi)];
  images.forEach((match) => {
    const tag = match[0];
    const hasAlt = /\balt\s*=/i.test(tag);
    if (!hasAlt) {
      issues.images.push({ file, snippet: tag });
    }
  });

  const canonicalTags = [...content.matchAll(/<link[^>]*rel\s*=\s*["']canonical["'][^>]*>/gi)];
  if (!noCanonicalRequired.has(file) && canonicalTags.length === 0) {
    issues.canonical.push({ file, snippet: 'missing canonical link' });
  }
  if (canonicalTags.length > 1) {
    issues.canonical.push({
      file,
      snippet: `multiple canonical tags (${canonicalTags.length})`
    });
  }

  const scriptTags = [...content.matchAll(/<script[^>]*\bsrc\s*=\s*["']([^"']+)["'][^>]*>/gi)];
  scriptTags.forEach((match) => {
    const src = match[1];
    if (!src.includes('main.js')) return;

    const versionMatch = src.match(/main\.js\?v=([^&"']+)/i);
    if (!versionMatch) {
      issues.scriptVersion.push({ file, snippet: match[0] });
      return;
    }

    if (swMainScriptVersion && versionMatch[1] !== swMainScriptVersion) {
      issues.scriptVersion.push({ file, snippet: match[0] });
    }
  });
}

if (!swCacheVersion) {
  issues.serviceWorker.push({ file: 'service-worker.js', snippet: 'Missing CACHE_VERSION const' });
}

if (!swMainScriptVersion) {
  issues.serviceWorker.push({ file: 'service-worker.js', snippet: 'Missing ./js/main.js?v= in APP_SHELL' });
}

if (!hasServiceWorkerRegister) {
  issues.serviceWorker.push({ file: 'js/*.js', snippet: 'No navigator.serviceWorker.register call found' });
}

if (issues.links.length > 0) {
  console.log('[FAIL] Anchor target="_blank" without rel="noopener noreferrer":');
  for (const issue of issues.links) {
    console.log(`- ${issue.file}: ${issue.snippet}`);
  }
}

if (issues.images.length > 0) {
  console.log('[FAIL] Images missing alt attribute:');
  for (const issue of issues.images) {
    console.log(`- ${issue.file}: ${issue.snippet}`);
  }
}

if (issues.canonical.length > 0) {
  console.log('[FAIL] Canonical metadata checks:');
  for (const issue of issues.canonical) {
    console.log(`- ${issue.file}: ${issue.snippet}`);
  }
}

if (issues.scriptVersion.length > 0) {
  const expected = swMainScriptVersion ? ` (expected ?v=${swMainScriptVersion})` : '';
  console.log(`[FAIL] script version mismatch with service-worker APP_SHELL${expected}:`);
  for (const issue of issues.scriptVersion) {
    console.log(`- ${issue.file}: ${issue.snippet}`);
  }
}

if (issues.serviceWorker.length > 0) {
  console.log('[FAIL] Service Worker checks:');
  for (const issue of issues.serviceWorker) {
    console.log(`- ${issue.file}: ${issue.snippet}`);
  }
}

if (Object.values(issues).every((issuesList) => issuesList.length === 0)) {
  const cacheVersionLabel = swCacheVersion ? `cache ${swCacheVersion}` : 'cache version';
  console.log(`[OK] qa:local passed (links + images + canonical + serviceWorker + script version checks, ${cacheVersionLabel}).`);
  process.exit(0);
}

process.exit(1);
