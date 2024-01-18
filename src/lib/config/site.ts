import { FolderClock, Home, User, Settings } from 'lucide-svelte';
export const siteConfig = {
    name: "powertrackr",
    url: "https://powertrackr.vercel.app",
    ogImage: "https://powertrackr.vercel.app/og.png",
    description: "Combining \"power\" with \"track,\" indicating the ability to monitor and track electricity consumption.",
    keywords: `e-bill, electricity, power, track, consumption, monitor, bill`,
    navLinks: [
        { text: 'HOME', href: '/', icon: Home },
        { text: 'HISTORY', href: '/history', icon: FolderClock },
    ] as NavItem[],
    profileLinks: [
        {text: 'Profile', href: '/user', icon: User},
        {text: 'Settings', href: '/user/settings', icon: Settings}
    ]
};
export type SiteConfig = typeof siteConfig;