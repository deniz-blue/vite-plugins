declare module "virtual:oauth-client-metadata" {
	const metadata: Record<string, any>;
	export default metadata;
	export const SCOPE: string;
	export const CLIENT_ID: string;
	export const REDIRECT_URI: string;
}

interface ImportMeta {
	readonly env: {
		readonly VITE_OAUTH_SCOPE: string;
		readonly VITE_OAUTH_CLIENT_ID: string;
		readonly VITE_OAUTH_REDIRECT_URI: string;
		readonly VITE_OAUTH_METADATA: string;
	};
}
