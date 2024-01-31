import type { NavItem } from '$lib/types';
import { FolderClock, Home, User, Palette } from 'lucide-svelte';
export const siteConfig = {
	name: 'powertrackr',
	url: 'https://powertrackr.vercel.app',
	ogImage: 'https://powertrackr.vercel.app/og.png',
	description: 'Monitor and track electricity consumption.',
	keywords: `e-bill, electricity, power, track, consumption, monitor, bill`,
	navLinks: [
		{ text: 'HOME', href: '/', icon: Home, selected: true },
		{ text: 'HISTORY', href: '/history', icon: FolderClock, selected: false }
	] as unknown as NavItem[],
	profileLinks: [
		{ text: 'Profile', href: '/user', icon: User },
		{ text: 'Preferences', href: '/user/preferences', icon: Palette }
	] as unknown as NavItem[]
};
export type SiteConfig = typeof siteConfig;
