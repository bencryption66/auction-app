const esbuild = require("esbuild");

esbuild.build({
  entryPoints: ["app/javascript/app.js"], // Your main JavaScript entry point
  bundle: true,
  outfile: "app/assets/builds/application.js", // Output file
  platform: "browser",
  minify: true,
  sourcemap: true,
  loader: { ".js": "jsx" }, // Handle JSX if needed
  external: ["react", "react-dom"], // Exclude React if not used
}).catch(() => process.exit(1));
