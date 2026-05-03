// @ts-check
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';
import sitemap from '@astrojs/sitemap';

// https://astro.build/config
export default defineConfig({
	site: 'https://docs.moono.me',
	vite: {
		server: {
			allowedHosts: ['moono-docs.ngrok.io'],
		},
	},
	integrations: [
		starlight({
			title: 'Moono Protocol',
			description: 'Moono Protocol — SOL lending protocol for token launches on pump.fun',
			defaultLocale: 'root',
			locales: {
				root: {
					label: 'English',
					lang: 'en',
				},
				ru: {
					label: 'Русский',
					lang: 'ru',
				},
			},
			social: [
				{ icon: 'github', label: 'GitHub', href: 'https://github.com/MoonoProtocol', attrs: { target: '_blank', rel: 'noopener noreferrer' } },
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
					translations: { ru: 'Начало работы' },
					items: [
						{ label: 'Introduction', slug: 'getting-started/introduction', translations: { ru: 'Введение' } },
						{ label: 'Economics', slug: 'getting-started/economics', translations: { ru: 'Экономика' } },
					],
				},
				{
					label: 'Guides',
					translations: { ru: 'Руководства' },
					items: [
						{ label: 'Liquidity Provider', slug: 'guides/liquidity-provider', translations: { ru: 'Поставщик ликвидности' } },
						{ label: 'Borrower', slug: 'guides/borrower', translations: { ru: 'Заёмщик' } },
						{ label: 'Launch Presets', slug: 'guides/launch-presets', translations: { ru: 'Пресеты запуска' } },
						{ label: 'Bundle Wallets', slug: 'guides/bundle-wallets', translations: { ru: 'Bundle-кошельки' } },
						{ label: 'Earning Strategies', slug: 'guides/earning-strategies', translations: { ru: 'Стратегии заработка' } },
						{ label: 'Working with WSOL', slug: 'guides/wsol', translations: { ru: 'Работа с WSOL' } },
					],
				},
				{
					label: 'Reference',
					translations: { ru: 'Справочник' },
					items: [
						{ label: 'Protocol Addresses', slug: 'reference/addresses', translations: { ru: 'Адреса протокола' } },
					],
				},
			],
			editLink: {
				baseUrl: 'https://github.com/MoonoProtocol/moono-docs/edit/main/',
			},
		}),
		sitemap(),
	],
});
