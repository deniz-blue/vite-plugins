import type { Plugin, ResolvedConfig, UserConfig } from "vite";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { VirtualModule } from "./VirtualModule.js";

const LOOPBACK_HOST = "127.0.0.1";
export const AtprotoOAuth = (): Plugin[] => {
	let userConfig: UserConfig | null = null;
	let viteCommand: "build" | "serve" | null = null;

	let oauthClientMetadata: Record<string, any> | null = null;
	let oauthScope: string = "atproto";
	let oauthClientId: string | null = null;
	let oauthRedirectUri: string | null = null;

	const readMetadata = () => {
		const path = join(userConfig?.publicDir || "public", "oauth-client-metadata.json");
		try {
			const content = readFileSync(path, "utf-8");
			oauthClientMetadata = JSON.parse(content);
		} catch (err) {
			console.warn(`[AtprotoOAuth] Failed to read oauth-client-metadata.json at ${path}. Please ensure the file exists and is valid JSON.`);
			oauthClientMetadata = {};
		}
	};

	const parseMetadata = () => {
		if (!oauthClientMetadata) return;

		if (!(oauthClientMetadata.client_id && oauthClientMetadata.redirect_uris && oauthClientMetadata.scope)) {
			console.warn(`[AtprotoOAuth] Missing required fields in oauth-client-metadata.json. Please ensure it contains "client_id", "redirect_uris", and "scope".`);
			return;
		}

		oauthScope = oauthClientMetadata.scope;
		if (viteCommand === "build") {
			oauthClientId = oauthClientMetadata.client_id;
			oauthRedirectUri = oauthClientMetadata.redirect_uris[0];
		} else {
			const host = userConfig?.server?.host || LOOPBACK_HOST;
			const port = userConfig?.server?.port || 5173;
			oauthRedirectUri = `http://${host}:${port}${new URL(oauthClientMetadata.redirect_uris[0]!).pathname}`;
			oauthClientId =
				`http://localhost?${new URLSearchParams([
					["redirect_uri", oauthRedirectUri],
					["scope", oauthScope],
				]).toString()}`;
		}
	};

	const setupEnv = () => {
		process.env.VITE_OAUTH_SCOPE = oauthScope;
		process.env.VITE_OAUTH_CLIENT_ID = oauthClientId || "";
		process.env.VITE_OAUTH_REDIRECT_URI = oauthRedirectUri || "";
		process.env.VITE_OAUTH_METADATA = JSON.stringify(oauthClientMetadata);
		if (!userConfig) return;
		userConfig.define ??= {};
		userConfig.define["VITE_OAUTH_SCOPE"] = (oauthScope);
		userConfig.define["VITE_OAUTH_CLIENT_ID"] = (oauthClientId);
		userConfig.define["VITE_OAUTH_REDIRECT_URI"] = (oauthRedirectUri);
		userConfig.define["VITE_OAUTH_METADATA"] = JSON.stringify(oauthClientMetadata);
	};

	return [
		{
			name: "atproto-oauth",
			config: async (config, { command }) => {
				userConfig = config;
				viteCommand = command;
				if (!config.server) config.server = {};
				if (config.server.host !== LOOPBACK_HOST)
					config.server.host = LOOPBACK_HOST;
				readMetadata();
				parseMetadata();
				setupEnv();
			},
		},

		VirtualModule(
			"oauth-client-metadata",
			() => {
				return [
					`export default ${JSON.stringify(oauthClientMetadata)}; `,
					`export const SCOPE = ${JSON.stringify(oauthScope)};`,
					`export const CLIENT_ID = ${JSON.stringify(oauthClientId)};`,
					`export const REDIRECT_URI = ${JSON.stringify(oauthRedirectUri)};`,
				].join("\n");
			},
		),
	]
};
