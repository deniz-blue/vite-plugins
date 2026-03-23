import type { Plugin, ResolvedConfig } from "vite";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { VirtualModule } from "./VirtualModule.js";

const LOOPBACK_HOST = "127.0.0.1";
export const AtprotoOAuth = (): Plugin[] => {
	let _config: ResolvedConfig | null = null;
	let _command: "build" | "serve" | null = null;

	let _metadata: Record<string, any> | null = null;
	let _scope: string = "atproto";
	let _clientId: string | null = null;
	let _redirectUri: string | null = null;

	const readMetadata = () => {
		const path = join(_config!.root, _config!.publicDir, "oauth-client-metadata.json");
		try {
			const content = readFileSync(path, "utf-8");
			_metadata = JSON.parse(content);
		} catch (err) {
			console.warn(`[AtprotoOAuth] Failed to read oauth-client-metadata.json at ${path}. Please ensure the file exists and is valid JSON.`);
			_metadata = {};
		}
	};

	const parseMetadata = () => {
		if (!_metadata) return;

		if (!(_metadata.client_id && _metadata.redirect_uris && _metadata.scope)) {
			console.warn(`[AtprotoOAuth] Missing required fields in oauth-client-metadata.json. Please ensure it contains "client_id", "redirect_uris", and "scope".`);
			return;
		}

		_scope = _metadata.scope;
		if (_command === "build") {
			_clientId = _metadata.client_id;
			_redirectUri = _metadata.redirect_uris[0];
		} else {
			const host = _config!.server?.host || LOOPBACK_HOST;
			const port = _config!.server?.port || 5173;
			_redirectUri = `http://${host}:${port}${new URL(_metadata.redirect_uris[0]!).pathname}`;
			_clientId =
				`http://localhost?${new URLSearchParams([
					["redirect_uri", _redirectUri],
					["scope", _scope],
				]).toString()}`;
		}
	};

	const setupEnv = () => {
		process.env.VITE_OAUTH_SCOPE = _scope;
		process.env.VITE_OAUTH_CLIENT_ID = _clientId || "";
		process.env.VITE_OAUTH_REDIRECT_URI = _redirectUri || "";
		process.env.VITE_OAUTH_METADATA = JSON.stringify(_metadata);
	};

	return [
		{
			name: "atproto-oauth",
			config: async (config, { command }) => {
				_command = command;
				if (!config.server) config.server = {};
				if (config.server.host !== LOOPBACK_HOST)
					config.server.host = LOOPBACK_HOST;
			},
			configResolved: (config) => {
				_config = config;
				readMetadata();
				parseMetadata();
				setupEnv();
			},
		},

		VirtualModule(
			"oauth-client-metadata",
			() => {
				return [
					`export default ${JSON.stringify(_metadata)}; `,
					`export const SCOPE = ${JSON.stringify(_scope)};`,
					`export const CLIENT_ID = ${JSON.stringify(_clientId)};`,
					`export const REDIRECT_URI = ${JSON.stringify(_redirectUri)};`,
				].join("\n");
			},
		),
	]
};
