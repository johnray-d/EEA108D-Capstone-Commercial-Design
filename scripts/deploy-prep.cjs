const fs = require('fs');
const path = require('path');

function copyRecursive(src, dst) {
  if (!fs.existsSync(dst)) fs.mkdirSync(dst, { recursive: true });
  for (const item of fs.readdirSync(src)) {
    const s = path.join(src, item);
    const d = path.join(dst, item);
    if (fs.statSync(s).isDirectory()) {
      copyRecursive(s, d);
    } else {
      fs.copyFileSync(s, d);
    }
  }
}

const distDir = path.resolve(__dirname, '../dist');
const rootDir = path.resolve(__dirname, '..');

// 1. In dist: ensure index.html, 404.html, and .nojekyll exist
if (fs.existsSync(path.join(distDir, 'index.src.html'))) {
  fs.copyFileSync(path.join(distDir, 'index.src.html'), path.join(distDir, 'index.html'));
  fs.copyFileSync(path.join(distDir, 'index.src.html'), path.join(distDir, '404.html'));
  fs.writeFileSync(path.join(distDir, '.nojekyll'), '');
}

// 2. Prepare root level production assets for direct branch deployments
if (fs.existsSync(path.join(distDir, 'index.html'))) {
  fs.copyFileSync(path.join(distDir, 'index.html'), path.join(rootDir, 'index.html'));
  fs.copyFileSync(path.join(distDir, '404.html'), path.join(rootDir, '404.html'));
  fs.writeFileSync(path.join(rootDir, '.nojekyll'), '');
  copyRecursive(path.join(distDir, 'assets'), path.join(rootDir, 'assets'));
  copyRecursive(distDir, path.join(rootDir, 'docs'));
}

console.log('[deploy-prep] Prepared dist, root, and docs for GitHub Pages deployment');
