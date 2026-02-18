import { build, context } from "esbuild";
import fs from "node:fs";
import path from "node:path";

const isWatch = process.argv.includes("--watch");

const root = process.cwd();
const distDir = path.join(root, "dist");
const publicDir = path.join(root, "public");

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function copyFile(src, dest) {
  ensureDir(path.dirname(dest));
  fs.copyFileSync(src, dest);
}

function cleanDist() {
  fs.rmSync(distDir, { recursive: true, force: true });
  ensureDir(distDir);
}

function copyStatic() {
  // index.html
  copyFile(path.join(publicDir, "index.html"), path.join(distDir, "index.html"));

  // data.js（運用想定：プロジェクト直下の data.js を dist にコピー）
  const dataSrc = path.join(root, "data.js");
  if (fs.existsSync(dataSrc)) {
    copyFile(dataSrc, path.join(distDir, "data.js"));
  } else {
    // 空を生成しておく（必要なら消してOK）
    fs.writeFileSync(path.join(distDir, "data.js"), "window.SHIFT_DATA = window.SHIFT_DATA ?? null;\n", "utf8");
  }
}

const esbuildOptions = {
  entryPoints: [path.join(root, "src/main.tsx")],
  outfile: path.join(distDir, "bundle.js"),
  bundle: true,
  sourcemap: true,
  target: "es2020",
  platform: "browser",
  format: "iife",
  jsx: "automatic",
  logLevel: "info"
};

async function runOnce() {
  cleanDist();
  copyStatic();
  await build(esbuildOptions);
}

async function runWatch() {
  cleanDist();
  copyStatic();

  const ctx = await context(esbuildOptions);
  await ctx.watch();

  // public/index.html と data.js の変更も監視してコピー
  fs.watch(publicDir, { recursive: true }, () => {
    try {
      copyFile(path.join(publicDir, "index.html"), path.join(distDir, "index.html"));
    } catch {}
  });
  fs.watch(root, (eventType, filename) => {
    if (filename === "data.js") {
      try {
        copyFile(path.join(root, "data.js"), path.join(distDir, "data.js"));
      } catch {}
    }
  });

  console.log("watching... (esbuild + static copy)");
}

if (isWatch) {
  runWatch();
} else {
  runOnce();
}
