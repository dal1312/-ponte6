const fs = require('node:fs');
const path = require('node:path');

const projectRoot = process.cwd();
const htmlFiles = fs
  .readdirSync(projectRoot)
  .filter((name) => name.endsWith('.html'));

function getAttr(tag, name) {
  const regex = new RegExp(`\\b${name}\\s*=\\s*(["'])(.*?)\\1`, 'i');
  const match = tag.match(regex);
  return match ? match[2] : null;
}

const issues = {
  links: [],
  images: []
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

if (issues.links.length === 0 && issues.images.length === 0) {
  console.log('[OK] qa:local passed (links + images checks).');
  process.exit(0);
}

process.exit(1);
