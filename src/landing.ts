import { applyThemeToElement, type WorkbenchTheme } from 'minwebide';
import { createProject, deleteProject, duplicateProject, listProjects, nextUntitledName, openProjectFileSystem, renameProject, type ProjectInfo } from './projects';
import { sampleWorkspace } from './sampleWorkspace';
import { generateSampleImage } from './sampleImage';
import './landing.css';

function el<K extends keyof HTMLElementTagNameMap>(tag: K, className?: string, text?: string): HTMLElementTagNameMap[K] {
	const node = document.createElement(tag);
	if (className) {
		node.className = className;
	}
	if (text !== undefined) {
		node.textContent = text;
	}
	return node;
}

function openProject(id: string): void {
	location.hash = `#/project/${id}`;
}

async function createSampleProject(): Promise<ProjectInfo> {
	const project = createProject(nextUntitledName('sample'));
	const fs = await openProjectFileSystem(project.id);
	try {
		await fs.seed({
			...sampleWorkspace,
			'/assets/banner.png': await generateSampleImage(),
		});
	} finally {
		fs.dispose();
	}
	return project;
}

async function createEmptyProject(): Promise<ProjectInfo> {
	const project = createProject(nextUntitledName());
	const fs = await openProjectFileSystem(project.id);
	try {
		await fs.seed({
			'/README.md': `# ${project.name}\n\nAn empty minwebide project. Files live in your browser's IndexedDB.\n`,
		});
	} finally {
		fs.dispose();
	}
	return project;
}

function formatWhen(timestamp: number): string {
	const delta = Date.now() - timestamp;
	if (delta < 60_000) {
		return 'just now';
	}
	if (delta < 3_600_000) {
		return `${Math.round(delta / 60_000)}m ago`;
	}
	if (delta < 86_400_000) {
		return `${Math.round(delta / 3_600_000)}h ago`;
	}
	return new Date(timestamp).toLocaleDateString();
}

/** Renders the project-picker landing page. Returns a disposable view. */
export function renderLanding(container: HTMLElement, theme: WorkbenchTheme): { dispose(): void } {
	const root = el('div', 'landing');
	applyThemeToElement(theme, root);
	container.appendChild(root);
	document.title = 'minwebide demo';

	const inner = el('div', 'landing-inner');
	root.appendChild(inner);

	const header = el('header', 'landing-header');
	header.appendChild(el('h1', undefined, 'minwebide'));
	header.appendChild(el('p', 'landing-subtitle', 'A minimalistic web IDE built from VS Code’s own source. Projects are stored in your browser.'));
	const ghLink = el('a', 'landing-link', 'github.com/magland/minwebide');
	ghLink.href = 'https://github.com/magland/minwebide';
	header.appendChild(ghLink);
	inner.appendChild(header);

	// start section
	const start = el('section', 'landing-section');
	start.appendChild(el('h2', undefined, 'Start'));
	const startButtons = el('div', 'landing-start');
	const newButton = el('button', 'landing-button primary', 'New project');
	newButton.addEventListener('click', async () => {
		newButton.disabled = true;
		openProject((await createEmptyProject()).id);
	});
	const sampleButton = el('button', 'landing-button', 'New sample project');
	sampleButton.title = 'Seeded with runnable scripts, a CSV table, markdown preview, and plots';
	sampleButton.addEventListener('click', async () => {
		sampleButton.disabled = true;
		openProject((await createSampleProject()).id);
	});
	startButtons.append(newButton, sampleButton);
	start.appendChild(startButtons);
	inner.appendChild(start);

	// projects section
	const section = el('section', 'landing-section');
	section.appendChild(el('h2', undefined, 'Projects'));
	const list = el('div', 'landing-projects');
	section.appendChild(list);
	inner.appendChild(section);

	const renderList = () => {
		list.textContent = '';
		const projects = listProjects();
		if (projects.length === 0) {
			list.appendChild(el('div', 'landing-empty', 'No projects yet.'));
			return;
		}
		for (const project of projects) {
			const row = el('div', 'landing-project');

			const name = el('a', 'landing-project-name', project.name);
			name.href = `#/project/${project.id}`;
			row.appendChild(name);

			row.appendChild(el('span', 'landing-project-meta', `opened ${formatWhen(project.lastOpenedAt)}`));

			const actions = el('span', 'landing-project-actions');
			const action = (label: string, handler: () => void | Promise<void>) => {
				const button = el('button', 'landing-action', label);
				button.addEventListener('click', () => handler());
				actions.appendChild(button);
			};
			action('Rename', () => {
				const name = prompt('Project name', project.name);
				if (name !== null) {
					renameProject(project.id, name);
					renderList();
				}
			});
			action('Duplicate', async () => {
				await duplicateProject(project.id);
				renderList();
			});
			action('Delete', async () => {
				if (confirm(`Delete project "${project.name}" and all of its files?`)) {
					await deleteProject(project.id);
					renderList();
				}
			});
			row.appendChild(actions);
			list.appendChild(row);
		}
	};
	renderList();

	return {
		dispose() {
			root.remove();
		},
	};
}
