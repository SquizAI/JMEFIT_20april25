import fs from 'fs';
import path from 'path';
import { format } from 'date-fns';

const BASE_URL = 'https://jmefit.com';

const routes = [
  { path: '/', changefreq: 'weekly', priority: 1.0 },
  { path: '/programs', changefreq: 'weekly', priority: 0.9 },
  { path: '/monthly-app', changefreq: 'weekly', priority: 0.8 },
  { path: '/standalone-programs', changefreq: 'weekly', priority: 0.8 },
  { path: '/community', changefreq: 'weekly', priority: 0.7 },
  { path: '/blog', changefreq: 'daily', priority: 0.8 }
];

const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  ${routes.map(route => `
  <url>
    <loc>${BASE_URL}${route.path}</loc>
    <lastmod>${format(new Date(), 'yyyy-MM-dd')}</lastmod>
    <changefreq>${route.changefreq}</changefreq>
    <priority>${route.priority}</priority>
  </url>`).join('')}
</urlset>`;

fs.writeFileSync(path.join(process.cwd(), 'public', 'sitemap.xml'), sitemap);