const fs = require('node:fs');
const path = require('node:path');

const projectRoot = process.cwd();
const isStrict = process.argv.includes('--strict');
const htmlFiles = fs
  .readdirSync(projectRoot)
  .filter((name) => name.endsWith('.html'));
const jsFiles = fs
  .readdirSync(path.join(projectRoot, 'js'))
  .filter((name) => name.endsWith('.js'))
  .map((name) => path.join(projectRoot, 'js', name));
const serviceWorkerPath = path.join(projectRoot, 'service-worker.js');

const noCanonicalRequired = new Set(['offline.html']);
const socialRequiredFiles = new Set(['index.html', 'menu.html', 'ordina.html', 'contatti.html']);
const serviceWorkerScriptKeys = ['main.js', 'core.js', 'site-ui.js'];

const serviceWorkerRaw = fs.readFileSync(serviceWorkerPath, 'utf8');
const swCacheVersionMatch = serviceWorkerRaw.match(/CACHE_VERSION\s*=\s*["']([^"']+)["']/i);
const swCacheVersion = swCacheVersionMatch ? swCacheVersionMatch[1] : null;

const swScriptVersions = Object.fromEntries(
  [...serviceWorkerRaw.matchAll(/["']\.\/js\/([^"']+\.js)\?v=([^"']+)["']/g)]
    .map(([, filename, version]) => [`./js/${filename}`, version])
);

const hasServiceWorkerRegister = jsFiles.some((file) => {
  const content = fs.readFileSync(file, 'utf8');
  return /navigator\.serviceWorker\.register/.test(content);
});

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
  serviceWorker: [],
  social: []
};

const referencedScriptVersions = new Map();

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
    issues.canonical.push({ file, snippet: `multiple canonical tags (${canonicalTags.length})` });
  }

  const scriptTags = [...content.matchAll(/<script[^>]*\bsrc\s*=\s*["']([^"']+)["'][^>]*>/gi)];
  for (const match of scriptTags) {
    const src = match[1];
    const fileMatch = src.match(/(?:\.\/)?(main|core|site-ui)\.js(?:\?v=([^"&']+))?/i);
    if (!fileMatch) continue;

    const scriptName = `${fileMatch[1].toLowerCase()}.js`;
    const scriptFile = `./js/${scriptName}`;
    const expectedVersion = swScriptVersions[scriptFile];
    const version = fileMatch[2] || null;
    if (!expectedVersion) continue;
    if (!version || version !== expectedVersion) {
      issues.scriptVersion.push({ file, snippet: match[0] });
    }
    referencedScriptVersions.set(scriptFile, true);
  }

  if (socialRequiredFiles.has(file)) {
    const hasOgTitle = /property\s*=\s*["']og:title["']/i.test(content);
    const hasOgDescription = /property\s*=\s*["']og:description["']/i.test(content);
    const hasOgUrl = /property\s*=\s*["']og:url["']/i.test(content);
    const hasTwitterCard = /name\s*=\s*["']twitter:card["']/i.test(content);
    const hasOgImage = /property\s*=\s*["']og:image["']/i.test(content);
    const hasOgLocale = /property\s*=\s*["']og:locale["']/i.test(content);
    const hasThemeColor = /name\s*=\s*["']theme-color["']/i.test(content);

    const missingMeta = {
      title: hasOgTitle,
      description: hasOgDescription,
      url: hasOgUrl,
      twitterCard: hasTwitterCard
    };

    if (isStrict) {
      missingMeta.ogImage = hasOgImage;
      missingMeta.locale = hasOgLocale;
      missingMeta.themeColor = hasThemeColor;
    }

    const isMissing = Object.entries(missingMeta).some(([, value]) => !value);
    if (isMissing) {
      issues.social.push({
        file,
        snippet: [
          ...(!missingMeta.title ? ['og:title'] : []),
          ...(!missingMeta.description ? ['og:description'] : []),
          ...(!missingMeta.url ? ['og:url'] : []),
          ...(!missingMeta.twitterCard ? ['twitter:card'] : []),
          ...(isStrict && !missingMeta.ogImage ? ['og:image'] : []),
          ...(isStrict && !missingMeta.locale ? ['og:locale'] : []),
          ...(isStrict && !missingMeta.themeColor ? ['theme-color'] : [])
        ].join(', ')
      });
    }
  }
}

for (const scriptName of serviceWorkerScriptKeys) {
  const scriptFile = `./js/${scriptName}`;
  const expectedVersion = swScriptVersions[scriptFile];
  if (expectedVersion && !referencedScriptVersions.get(scriptFile)) {
    issues.scriptVersion.push({
      file: 'pages',
      snippet: `${scriptFile}?v=${expectedVersion} is not referenced by any HTML page`
    });
  }
}

if (!swCacheVersion) {
  issues.serviceWorker.push({ file: 'service-worker.js', snippet: 'Missing CACHE_VERSION const' });
}

if (!hasServiceWorkerRegister) {
  issues.serviceWorker.push({ file: 'js/*.js', snippet: 'No navigator.serviceWorker.register call found' });
}

if (issues.links.length > 0) {
  console.log('[FAIL] Anchor target="_blank" without rel="noopener noreferrer":');
  issues.links.forEach((issue) => console.log(`- ${issue.file}: ${issue.snippet}`));
}

if (issues.images.length > 0) {
  console.log('[FAIL] Images missing alt attribute:');
  issues.images.forEach((issue) => console.log(`- ${issue.file}: ${issue.snippet}`));
}

if (issues.canonical.length > 0) {
  console.log('[FAIL] Canonical metadata checks:');
  issues.canonical.forEach((issue) => console.log(`- ${issue.file}: ${issue.snippet}`));
}

if (issues.scriptVersion.length > 0) {
  const expectedInfo = swCacheVersion ? ` (cache ${swCacheVersion})` : '';
  console.log(`[FAIL] Script version mismatch with service-worker APP_SHELL${expectedInfo}:`);
  issues.scriptVersion.forEach((issue) => console.log(`- ${issue.file}: ${issue.snippet}`));
}

if (issues.serviceWorker.length > 0) {
  console.log('[FAIL] Service Worker checks:');
  issues.serviceWorker.forEach((issue) => console.log(`- ${issue.file}: ${issue.snippet}`));
}

if (issues.social.length > 0) {
  const strictLabel = isStrict ? ' (strict)' : '';
  console.log(`[FAIL] Social metadata checks${strictLabel}:`);
  issues.social.forEach((issue) => console.log(`- ${issue.file}: ${issue.snippet}`));
}

if (Object.values(issues).every((list) => list.length === 0)) {
  const cacheVersionLabel = swCacheVersion ? `cache ${swCacheVersion}` : 'cache version';
  const strictLabel = isStrict ? ' + strict social checks' : '';
  console.log(`[OK] qa:local passed (links + images + canonical + serviceWorker + script version + social checks${strictLabel}, ${cacheVersionLabel}).`);
  process.exit(0);
}

process.exit(1);
