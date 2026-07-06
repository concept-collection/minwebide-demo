// End-to-end smoke test for the project-picker demo:
// landing → new project → IDE → edit+save → back → rename/duplicate →
// reopen (persistence + URL routing) → delete → sample project.
import { chromium } from 'playwright';
import { spawn } from 'node:child_process';

const root = new URL('..', import.meta.url).pathname;
const out = process.argv[2] ?? '.';
const previewProc = spawn('npx', ['vite', 'preview', '--port', '4179', '--strictPort'], { stdio: 'ignore', cwd: root });
await new Promise((r) => setTimeout(r, 1500));

const browser = await chromium.launch({ channel: 'chrome', headless: true });
const page = await browser.newPage({ viewport: { width: 1400, height: 900 } });
const errors = [];
page.on('pageerror', (e) => errors.push(e.message));
page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
const check = (name, ok) => console.log(`${ok ? 'OK  ' : 'FAIL'} ${name}`);

try {
	await page.goto('http://localhost:4179/', { waitUntil: 'networkidle' });
	await page.waitForTimeout(1200);
	check('landing renders', await page.locator('.landing-empty').count() === 1);
	await page.screenshot({ path: out + '/p-landing.png' });

	// create an empty project → should land in the IDE at #/project/<id>
	await page.getByRole('button', { name: 'New project', exact: true }).click();
	await page.waitForTimeout(1500);
	const url1 = page.url();
	check('URL has project route', /#\/project\/[a-z0-9]+/i.test(url1));
	check('IDE opened with README', await page.locator('.mw-tab-label', { hasText: 'README.md' }).count() === 1);
	check('status bar shows project', await page.locator('.mw-statusbar', { hasText: 'untitled' }).count() === 1);

	// make an edit and save
	await page.locator('.mw-editor-host').click();
	await page.keyboard.press('Control+End');
	await page.keyboard.type('\nPROJECT-MARKER-7\n');
	await page.keyboard.press('Control+s');
	await page.waitForTimeout(600);

	// back to landing via the status bar project item
	await page.getByTitle('Back to projects').click();
	await page.waitForTimeout(800);
	check('back on landing', await page.locator('.landing-project').count() === 1);

	// rename
	page.once('dialog', (d) => d.accept('renamed-project'));
	await page.locator('.landing-project').hover();
	await page.getByRole('button', { name: 'Rename' }).click();
	await page.waitForTimeout(300);
	check('rename applied', await page.locator('.landing-project-name', { hasText: 'renamed-project' }).count() === 1);

	// duplicate
	await page.locator('.landing-project').first().hover();
	await page.getByRole('button', { name: 'Duplicate' }).first().click();
	await page.waitForTimeout(1200);
	check('duplicate created', await page.locator('.landing-project').count() === 2);

	// reopen the duplicate: the saved marker must have been copied
	await page.locator('.landing-project-name', { hasText: 'renamed-project-copy' }).click();
	await page.waitForTimeout(1500);
	const text = (await page.locator('.mw-editor-host').innerText()).replace(/ /g, ' ');
	check('duplicate carries saved edit', text.includes('PROJECT-MARKER-7'));
	await page.screenshot({ path: out + '/p-duplicate.png' });

	// deep-link directly to the original by URL
	const originalHref = await page.evaluate(() => {
		const items = JSON.parse(localStorage.getItem('minwebide-demo.projects'));
		return items.find((p) => p.name === 'renamed-project').id;
	});
	await page.goto(`http://localhost:4179/#/project/${originalHref}`, { waitUntil: 'networkidle' });
	await page.waitForTimeout(1500);
	check('deep link opens project', await page.locator('.mw-statusbar', { hasText: 'renamed-project' }).count() === 1);

	// delete both from the landing page
	await page.goto('http://localhost:4179/#/', { waitUntil: 'networkidle' });
	await page.waitForTimeout(800);
	for (let i = 0; i < 2; i++) {
		page.once('dialog', (d) => d.accept());
		await page.locator('.landing-project').first().hover();
		await page.getByRole('button', { name: 'Delete' }).first().click();
		await page.waitForTimeout(500);
	}
	check('projects deleted', await page.locator('.landing-empty').count() === 1);

	// sample project has the showcase content
	await page.getByRole('button', { name: 'New sample project' }).click();
	await page.waitForTimeout(1800);
	check('sample project opens', await page.locator('.mw-tab-label', { hasText: 'README.md' }).count() === 1);
	await page.getByText('scripts', { exact: true }).click();
	await page.waitForTimeout(400);
	check('sample has runnable script', await page.getByText('sine-wave.js', { exact: true }).count() === 1);
	await page.screenshot({ path: out + '/p-sample.png' });

	// unknown project id falls back to landing
	await page.goto('http://localhost:4179/#/project/nope1234', { waitUntil: 'networkidle' });
	await page.waitForTimeout(800);
	check('unknown id falls back to landing', await page.locator('.landing-header').count() === 1);

	if (errors.length) {
		console.log('page errors:');
		for (const e of errors.slice(0, 10)) console.log('  ' + e);
	} else {
		console.log('no page errors');
	}
} finally {
	await browser.close();
	previewProc.kill();
}
