import { createWorkbench, type WorkbenchTheme } from 'minwebide';
import { demoCustomEditors } from './customEditors';
import { demoRunners } from './runners';
import { openProjectFileSystem, touchProject, type ProjectInfo } from './projects';

/** Opens the IDE for a project. Returns a disposable view. */
export async function openIde(container: HTMLElement, project: ProjectInfo, theme: WorkbenchTheme): Promise<{ dispose(): void }> {
	touchProject(project.id);
	document.title = `${project.name} — minwebide demo`;

	const fs = await openProjectFileSystem(project.id);

	const workbench = createWorkbench(container, {
		fileSystem: fs,
		theme,
		workspaceName: project.name,
		customEditors: demoCustomEditors,
	});
	for (const runner of demoRunners) {
		workbench.registerRunner(runner);
	}

	// the project indicator: click to go back to the project list
	workbench.statusBar.setItem('project', 'left', project.name, {
		icon: 'folder-opened',
		title: 'Back to projects',
		onClick: () => { location.hash = '#/'; },
	});
	// replace the default branding item with the project indicator
	workbench.statusBar.removeItem('branding');

	const readme = fs.root.with({ path: '/README.md' });
	if (await fs.fileService.exists(readme)) {
		await workbench.openFile(readme);
	}

	return {
		dispose() {
			workbench.dispose();
			fs.dispose();
		},
	};
}
