// @ts-check
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';

// Fully static: no adapter. `astro build` writes dist/<slug>/index.html and the
// Worker in wrangler.jsonc serves it as assets (html_handling: auto-trailing-slash).
// `trailingSlash: 'always'` makes Starlight's links match that redirect rule.
export default defineConfig({
	site: 'https://docs.afixo.io',
	trailingSlash: 'always',
	integrations: [
		starlight({
			title: 'Afixo Docs',
			description: 'Context-specific personas, purpose-aware disclosure at the API boundary.',
			social: [{ icon: 'github', label: 'GitHub', href: 'https://github.com/afixo' }],
			// No `editLink`: the repository is private, so "Edit page" links are off.
			customCss: ['./src/styles/custom.css'],
			sidebar: [
				{
					label: 'Start here',
					items: [{ label: 'Overview', link: '/' }, { slug: 'getting-started' }],
				},
				{
					label: 'Concepts',
					items: [
						'concepts/subjects-and-handles',
						'concepts/personas-and-fields',
						'concepts/requesters',
						'concepts/purposes',
						'concepts/disclosure-rules',
						'concepts/decision-algorithm',
						'concepts/audit-log',
					],
				},
				{
					label: 'API reference',
					items: ['api/overview', 'api/machine', 'api/console'],
				},
				{
					label: 'Dashboard',
					items: [
						'dashboard/personas',
						'dashboard/api-clients',
						'dashboard/policies',
						'dashboard/explorer',
						'dashboard/audit',
					],
				},
				{
					label: 'Architecture & security',
					items: [
						'architecture/overview',
						'architecture/hostnames',
						'architecture/session-boundary',
						'architecture/trust-boundaries',
						'architecture/not-done',
						'architecture/environments',
					],
				},
				{
					label: 'Reference',
					items: ['reference/glossary', 'reference/changelog', 'reference/report'],
				},
			],
		}),
	],
});
