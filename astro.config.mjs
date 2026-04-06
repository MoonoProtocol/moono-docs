// @ts-check
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';
import sitemap from '@astrojs/sitemap';

// https://astro.build/config
export default defineConfig({
	site: 'https://docs.moono.me',
	integrations: [
		starlight({
			title: 'Moono Protocol',
			description: 'Documentation for Moono Protocol — Solana-based DeFi protocol',
			defaultLocale: 'root',
			locales: {
				root: {
					label: 'English',
					lang: 'en',
				},
			},
			social: [
				{ icon: 'github', label: 'GitHub', href: 'https://github.com/MoonoProtocol' },
			],
			head: [
				{
					tag: 'meta',
					attrs: { name: 'robots', content: 'index, follow' },
				},
			],
			sidebar: [
				{
					label: 'Getting Started',
					items: [
						{ label: 'Introduction', slug: 'getting-started/introduction' },
						{ label: 'Quick Start', slug: 'getting-started/quick-start' },
					],
				},
				{
					label: 'Guides',
					autogenerate: { directory: 'guides' },
				},
				{
					label: 'API Reference',
					autogenerate: { directory: 'reference' },
				},
			],
			editLink: {
				baseUrl: 'https://github.com/MoonoProtocol/moono-docs/edit/main/',
			},
		}),
		sitemap(),
	],
});
