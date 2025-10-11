const esbuild = require("esbuild");

esbuild.build({
  entryPoints: ["node_modules/@depay/web3-wallets/dist/esm/index.js"],
  outfile: "app/assets/builds/web3-wallets.js",
  bundle: true,
  minify: false,
  platform: "browser",
  external: ["react", "react-dom"], // Mark react and react-dom as external
}).catch(() => process.exit(1));
