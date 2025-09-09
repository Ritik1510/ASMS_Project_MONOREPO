# PROBLEM: [#4_Deployment](https://github.com/Ritik1510/ASMS_Project_MONOREPO/pull/4)
Vercel deployment fails due to type sharing issues from both frontend and backedn side  
---
solution:
So your **deploy target is only `apps/ce-client`**, but inside it you’re importing `@ce/db` (a local workspace package). That’s why Vercel is choking: it only sees `apps/ce-client` as the app, but `@ce/db` isn’t prebuilt into a form it can consume.

### 🔑 The Core Issue

* Vercel doesn’t magically build other workspaces.
* If `apps/ce-client` depends on `@ce/db`, then **you need to ship `@ce/db` as compiled JS** into `node_modules` before the client builds.

### ✅ Options to Fix

#### **Option 1: Prebuild `@ce/db` before `ce-client`**

In your root `package.json` (monorepo root, not `apps/ce-client`), set build order:

```json
{
  "scripts": {
    "build": "pnpm -r --filter @ce/db build && pnpm --filter ce-client build"
  }
}
```

Then in Vercel settings, set **Build Command** to:

```
pnpm build
```

instead of `pnpm --filter ce-client build`.
👉 This ensures Vercel builds the shared package first, then your frontend.

#### **Option 2: Use `prepare` inside @ce/db**

In `packages/db/package.json`:

```json
{
  "name": "@ce/db",
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "scripts": {
    "build": "tsc -p tsconfig.json",
    "prepare": "pnpm build"
  }
}
```

This way, when Vercel installs dependencies, it automatically builds `@ce/db`.

#### **Option 3: Inline source with Vite alias (hacky)**

If you really don’t want to prebuild, you can tell Vite to directly resolve the TS source:

`apps/ce-client/vite.config.ts`:

```ts
import path from "path";
import { defineConfig } from "vite";

export default defineConfig({
  resolve: {
    alias: {
      "@ce/db": path.resolve(__dirname, "../../packages/db/src") // adjust path
    }
  }
});
```

👉 This bypasses the `dist` build, but Vercel still needs to transpile those files. Works for small setups, but can cause trouble in prod.

#### **Option 4: Vercel Project Root + Monorepo Support**

Vercel can handle pnpm workspaces if you:

* Keep root `pnpm-workspace.yaml`.
* Point Vercel’s **Root Directory** to `apps/ce-client`.
* In `apps/ce-client/package.json`, just use:

  ```json
  "dependencies": {
    "@ce/db": "*"
  }
  ```
* Then make sure `@ce/db` has a build step that generates real JS.

### 🚀 My Recommended Approach

Since your **deploy is only `apps/ce-client`**:

1. Add a `build` script in `@ce/db` → compiles TS → `dist/`.
2. Update root `package.json` to build `@ce/db` before `ce-client`.
3. Point Vercel build command to `pnpm build`.

That way, your shared lib is always compiled before frontend runs.

👉 Do you want me to give you a **ready-to-use Vercel config (monorepo + pnpm + apps/ce-client)** so you don’t need to mess with aliases and hacks?
