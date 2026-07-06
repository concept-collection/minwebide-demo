import { defineConfig, mergeConfig } from 'vite';
import { minwebide } from 'minwebide/vite';

// DEPLOY_BASE is set by CI when building for GitHub Pages
// (the site is served from /minwebide-demo/, not the domain root).
export default defineConfig(mergeConfig(minwebide(), {
	base: process.env.DEPLOY_BASE ?? '/',
}));
