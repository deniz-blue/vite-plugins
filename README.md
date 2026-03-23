# @denizblue/vite-plugins

A couple plugins I use for my projects

List of plugins:
- [@denizblue/vite-plugins](#denizbluevite-plugins)
	- [`SimpleSSG`](#simplessg)
	- [`VirtualModule`](#virtualmodule)
	- [`AtprotoOAuth`](#atprotooauth)

## `SimpleSSG`

Basically allows you to do pre-rendering. Example below uses React, but it should work with any framework as long as you export a `render` function that returns a string of HTML.

1. Create a `src/entry.server.tsx` that exports a function called `render` that returns a string of HTML. You can use ReactDOMServer to render your app to a string.

```tsx
import { renderToString } from "react-dom/server";
import { Root } from "./root";

export const render = () => renderToString(<Root />);
```

2. Add the "slot" in your `index.html` where the rendered HTML should go:

```html
<body>
	<div id="root">
		<!-- @ -->
	</div>
</body>
```

3. Add the plugin to your `vite.config.ts`:

```ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { SimpleSSG } from "@denizblue/vite-plugins";

export default defineConfig({
	plugins: [
		react(),
		SimpleSSG(),
	],
});
```

4. (React-only) Add a `src/entry.client.tsx` that hydrates your app:

```tsx
import { hydrateRoot } from "react-dom/client";
import { Root } from "./root";

const rootElement = document.getElementById("root")!;
hydrateRoot(rootElement, <Root />);
```

## `VirtualModule`

Allows you to create virtual modules that can be imported in your code. Useful for SSG. Example:

```ts
import { defineConfig } from "vite";
import { VirtualModule } from "@denizblue/vite-plugins";

export default defineConfig({
	plugins: [
		VirtualModule({
			name: "hello",
			code: `export const message = "Hello, world!";`,
		}),

		VirtualModule({
			name: "remote-data",
			code: async () => {
				const response = await fetch("https://jsonplaceholder.typicode.com/todos/1");
				const data = await response.json();
				return `export const data = ${JSON.stringify(data)};`;
			},
		}),
	],
});
```

Then you can import these modules in your code:

```ts
import { message } from "virtual:hello";
import { data } from "virtual:remote-data";
```

## `AtprotoOAuth`

Automatically resolves your `public/oauth-client-metadata.json` for you. Uses localhost oauth client for development and the actual client for production. Example:

```ts
import { defineConfig } from "vite";
import { AtprotoOAuth } from "@denizblue/vite-plugins";

export default defineConfig({
	plugins: [
		AtprotoOAuth(),
	],
});
```

Then you can import your oauth client metadata in your code:

```ts
import { createAuthorizationUrl, configureOAuth } from "@atcute/oauth-browser-client";

configureOAuth({
	metadata: {
		client_id: import.meta.env.VITE_OAUTH_CLIENT_ID,
		redirect_uri: import.meta.env.VITE_OAUTH_REDIRECT_URI,
	},
});

let url = createAuthorizationUrl({
	target,
	scope: import.meta.env.VITE_OAUTH_SCOPE,
});

// == or if you want to import the whole metadata

import metadata, { CLIENT_ID, REDIRECT_URI, SCOPE } from "virtual:oauth-client-metadata";
// metadata is the same as the original JSON file
// CLIENT_ID and REDIRECT_URI may be localhost values in development, and the actual client values in production
```
