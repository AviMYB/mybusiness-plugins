import { cp, mkdir, readdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { randomUUID } from 'node:crypto';
const here = path.dirname(fileURLToPath(import.meta.url));
const skill = path.dirname(here);
const args = process.argv.slice(2);
const at = args.indexOf('--template');
const page = at < 0 ? 'gallery' : args[at + 1];
const allowed = ['gallery', 'records', 'dashboard', 'settings', 'kanban', 'calendar', 'wizard', 'document', 'inbox', 'reports', 'import', 'activity', 'knowledge'];
try {
  if (!args[0] || args[0].startsWith('--') || !allowed.includes(page)) throw new Error('Use: node scaffold.mjs OUTPUT_DIR [--template records]');
  const target = path.resolve(args[0]);
  let entries;
  try { entries = await readdir(target); } catch (error) { if (error.code !== 'ENOENT') throw error; entries = []; }
  if (entries.length) throw new Error('Output directory is not empty; choose a new directory');
  await mkdir(target, { recursive: true });
  await cp(path.join(skill, 'assets/prototype'), target, { recursive: true });
  await cp(path.join(here, 'serve.mjs'), path.join(target, 'serve.mjs'));
  for (const module of ['mybusiness', 'mybooks', 'mychat', 'mycampaigns', 'mycollege', 'timesheet']) {
    await cp(path.join(skill, 'assets', module), path.join(target, 'reference-pages', module), { recursive: true });
  }
  await writeFile(path.join(target, 'config.js'), `export const config = ${JSON.stringify({ title: 'סביבת הדגמה', initialPage: page, storageKey: 'myb-prototype-' + randomUUID() }, null, 2)};\n`);
  await writeFile(path.join(target, 'package.json'), JSON.stringify({ name: 'mybusiness-local-prototype', private: true, type: 'module', scripts: { start: 'node serve.mjs .' } }, null, 2) + '\n');
  await writeFile(path.join(target, 'README.md'), '# Local MyBusiness prototype\n\nRun `node serve.mjs . --port 4173` from this folder, then open the printed URL. Stop with Ctrl+C. Node.js 18+; no install/build required.\n\nEdit config.js, data.js, pages/ and app.css. All records are invented; actions remain in browser storage. Use the reset button to restore the seed. Do not enter secrets or customer data. Original reference-pages are static visual references; their fonts/icons use optional CDNs. Interactive pages have no external dependencies.\n\nBefore handoff: test the primary journey, validation, cancel, refresh persistence, reset, empty/error states, keyboard use, desktop and mobile. Distinguish prototype behavior from native CRM capabilities.\n');
  console.log(`OUTPUT_DIR=${target}`);
  console.log('STATUS=CREATED');
} catch (error) { console.error(`ERROR=${error.message}`); console.error('STATUS=FAILED'); process.exitCode = 1; }
