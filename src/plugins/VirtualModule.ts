import type { Plugin } from "vite";

export const VirtualModule = (
	name: string,
	code: string | (() => string | Promise<string>),
): Plugin => {
	const moduleId = `virtual:${name}`;
	const resolvedModuleId = `\0${moduleId}`;

	return {
		name: `loader/${moduleId}`,
		resolveId: {
			filter: { id: new RegExp(`^${moduleId}$`) },
			handler: () => resolvedModuleId,
			order: "pre",
		},
		load: {
			filter: { id: new RegExp(`^${resolvedModuleId}$`) },
			handler: async () => typeof code === "function" ? await code() : code,
		},
	};
};

