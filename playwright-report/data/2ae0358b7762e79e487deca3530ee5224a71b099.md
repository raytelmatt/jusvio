# Page snapshot

```yaml
- generic [ref=e4]:
  - generic [ref=e5]:
    - generic [ref=e6]: "[plugin:vite:import-analysis]"
    - generic [ref=e7]: Failed to resolve import "firebase/auth" from "src/react-app/lib/backend/firebase-adapter.ts". Does the file exist?
  - generic [ref=e9] [cursor=pointer]: /Users/iahmatt/jusivo windsurf/jusvio/src/react-app/lib/backend/firebase-adapter.ts:21:7
  - generic [ref=e10]: "7 | signOut, 8 | onAuthStateChanged 9 | } from \"firebase/auth\"; | ^ 10 | import { 11 | getFirestore,"
  - generic [ref=e11]:
    - text: "at TransformPluginContext._formatLog (file:"
    - generic [ref=e12] [cursor=pointer]: ///Users/iahmatt/jusivo%20windsurf/jusvio/node_modules/vite/dist/node/chunks/dep-DBxKXgDP.js:42499:41
    - text: ") at TransformPluginContext.error (file:"
    - generic [ref=e13] [cursor=pointer]: ///Users/iahmatt/jusivo%20windsurf/jusvio/node_modules/vite/dist/node/chunks/dep-DBxKXgDP.js:42496:16
    - text: ") at normalizeUrl (file:"
    - generic [ref=e14] [cursor=pointer]: ///Users/iahmatt/jusivo%20windsurf/jusvio/node_modules/vite/dist/node/chunks/dep-DBxKXgDP.js:40475:23
    - text: ) at process.processTicksAndRejections (node:internal
    - generic [ref=e15] [cursor=pointer]: /process/task_queues:105:5
    - text: ") at async file:"
    - generic [ref=e16] [cursor=pointer]: ///Users/iahmatt/jusivo%20windsurf/jusvio/node_modules/vite/dist/node/chunks/dep-DBxKXgDP.js:40594:37
    - text: "at async Promise.all (index 1) at async TransformPluginContext.transform (file:"
    - generic [ref=e17] [cursor=pointer]: ///Users/iahmatt/jusivo%20windsurf/jusvio/node_modules/vite/dist/node/chunks/dep-DBxKXgDP.js:40521:7
    - text: ") at async EnvironmentPluginContainer.transform (file:"
    - generic [ref=e18] [cursor=pointer]: ///Users/iahmatt/jusivo%20windsurf/jusvio/node_modules/vite/dist/node/chunks/dep-DBxKXgDP.js:42294:18
    - text: ") at async loadAndTransform (file:"
    - generic [ref=e19] [cursor=pointer]: ///Users/iahmatt/jusivo%20windsurf/jusvio/node_modules/vite/dist/node/chunks/dep-DBxKXgDP.js:35735:27
    - text: ") at async viteTransformMiddleware (file:"
    - generic [ref=e20] [cursor=pointer]: ///Users/iahmatt/jusivo%20windsurf/jusvio/node_modules/vite/dist/node/chunks/dep-DBxKXgDP.js:37250:24
  - generic [ref=e21]:
    - text: Click outside, press
    - generic [ref=e22]: Esc
    - text: key, or fix the code to dismiss.
    - text: You can also disable this overlay by setting
    - code [ref=e23]: server.hmr.overlay
    - text: to
    - code [ref=e24]: "false"
    - text: in
    - code [ref=e25]: vite.config.ts
    - text: .
```