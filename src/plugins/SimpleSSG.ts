import { type Plugin, type ResolvedConfig, type ViteDevServer } from "vite";
import { resolve } from "node:path";

export const SimpleSSG = ({
	serverEntry = "src/entry.server.tsx",
	slot = "<!-- @ -->",
}: {
	serverEntry?: string;
	slot?: string;
} = {}): Plugin[] => {
	let _config: ResolvedConfig | null = null;

	return [
		{
			name: "simple-ssg",
			configResolved(config) {
				_config = config;
			},
			async transformIndexHtml(html, { server: devServer }) {
				let buildServer: ViteDevServer | null = null;
				const server = devServer || (buildServer = await (await import("vite")).createServer({
					root: _config!.root,
					logLevel: "silent",
					server: { middlewareMode: true },
					appType: 'custom'
				}));

				try {
					const { render } = await server.ssrLoadModule(resolve(".", serverEntry));
					const appHtml = render();
					return html.replace(slot, appHtml);
				} catch (e) {
					console.error("\n[SimpleSSG] Failed to prerender HTML", e);
					if (buildServer) throw e;
					return html;
				} finally {
					if (buildServer) await buildServer.close();
				};
			},
		}
	];
};

