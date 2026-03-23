import { defineConfig } from "vite";
import { SimpleSSG } from "../../src/index.js";

export default defineConfig({
	plugins: [
		SimpleSSG(),
	],
});
