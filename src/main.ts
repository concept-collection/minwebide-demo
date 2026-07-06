import { loadBuiltinTheme, registerBuiltinLanguages } from 'minwebide';
import { openIde } from './ide';
import { renderLanding } from './landing';
import { getProject } from './projects';

// Routes:
//   #/                     project picker (landing page)
//   #/project/<id>         the IDE, opened on that project's file system

async function start(): Promise<void> {
	const app = document.getElementById('app')!;

	// one-time global setup: theme + languages are shared by all views
	const theme = await loadBuiltinTheme('dark_modern');
	await registerBuiltinLanguages(theme);

	let current: { dispose(): void } | undefined;
	let navigating = false;

	const route = async () => {
		if (navigating) {
			return;
		}
		navigating = true;
		try {
			current?.dispose();
			current = undefined;
			app.textContent = '';

			const match = location.hash.match(/^#\/project\/([a-z0-9]+)/i);
			if (match) {
				const project = getProject(match[1]);
				if (project) {
					current = await openIde(app, project, theme);
					return;
				}
				// unknown project id: fall through to the landing page
				history.replaceState(null, '', '#/');
			}
			current = renderLanding(app, theme);
		} finally {
			navigating = false;
		}
	};

	window.addEventListener('hashchange', route);
	await route();
}

start();
