import { mkdir, writeFile } from "node:fs/promises";
import { build } from "esbuild";

const result = await build({
  entryPoints: ["main.ts"],
  bundle: true,
  format: "iife",
  platform: "browser",
  target: "es2020",
  write: false,
});

const html = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Learning by Ear</title>
  </head>
  <body>
    <script>
${result.outputFiles[0].text}
    </script>
  </body>
</html>
`;

await mkdir("dist", { recursive: true });
await writeFile("dist/index.html", html);
