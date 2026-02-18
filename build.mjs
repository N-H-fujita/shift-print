import { context } from "esbuild";
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

const isWatch = process.argv.includes("--watch");

const root = process.cwd();
const distDir = path.join(root, isWatch ? "dist-dev" : "dist");
const publicDir = path.join(root, "public");

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function cleanDist() {
  fs.rmSync(distDir, { recursive: true, force: true });
  ensureDir(distDir);
}

function copyFile(src, dest) {
  ensureDir(path.dirname(dest));
  fs.copyFileSync(src, dest);
}

function getTailwindBin() {
  const bin = process.platform === "win32" ? "tailwindcss.cmd" : "tailwindcss";
  return path.join(root, "node_modules", ".bin", bin);
}

function buildTailwindCss() {
  const twBin = getTailwindBin();
  const input = path.join(root, "src", "styles.css");

  if (!fs.existsSync(input)) return "";

  const res = spawnSync(
    twBin,
    ["-i", input, "-o", "-", "--minify"],
    {
      cwd: root,
      shell: true,      // Windowsで .cmd を確実に実行
      encoding: "utf8",
      stdio: "pipe",
    }
  );

  if (res.status !== 0) {
    console.error("Tailwind CLI failed");
    console.error("bin:", twBin);
    console.error("status:", res.status);
    if (res.error) console.error("spawn error:", res.error);
    if (res.stdout) console.error("stdout:\n", res.stdout);
    if (res.stderr) console.error("stderr:\n", res.stderr);
    throw new Error("Tailwind build failed");
  }

  // CSSはstdoutに出る
  return res.stdout ?? "";
}



function buildIndexHtmlWithCss() {
  const htmlSrc = path.join(publicDir, "index.html");
  const htmlDest = path.join(distDir, "index.html");

  let html = fs.readFileSync(htmlSrc, "utf8");

  const css = buildTailwindCss();
  const inject = css
    ? `<style id="tw">\n${css}\n</style>`
    : "";

  html = html.replace("<!-- TAILWIND_CSS_INJECT -->", inject);
  fs.writeFileSync(htmlDest, html, "utf8");
}

function copyDataJs() {
  const dataSrc = path.join(root, "data.js");
  const dataDest = path.join(distDir, "data.js");

  if (fs.existsSync(dataSrc)) {
    copyFile(dataSrc, dataDest);
  } else {
    fs.writeFileSync(
      dataDest,
      "window.SHIFT_DATA = window.SHIFT_DATA ?? null;\n",
      "utf8"
    );
  }
}

function writeStatic() {
  buildIndexHtmlWithCss();
  copyDataJs();
}

const esbuildOptions = {
  entryPoints: [path.join(root, "src/main.tsx")],
  outfile: path.join(distDir, "bundle.js"),
  bundle: true,
  sourcemap: isWatch,
  target: "es2020",
  platform: "browser",
  format: "iife",
  jsx: "automatic",
  logLevel: "info",
  plugins: [
    {
      name: "static-writer",
      setup(build) {
        build.onEnd(() => {
          try {
            writeStatic();
          } catch (e) {
            console.error(e);
          }
        });
      },
    },
  ],
};

async function runWatch() {
  cleanDist();
  writeStatic();

  const ctx = await context(esbuildOptions);
  await ctx.watch();

  // Tailwind/HTML/data の変更も拾いたいので軽く監視（雑でOK）
  fs.watch(path.join(root, "src"), { recursive: true }, () => {
    try { writeStatic(); } catch {}
  });
  fs.watch(publicDir, { recursive: true }, () => {
    try { writeStatic(); } catch {}
  });
  fs.watch(root, (eventType, filename) => {
    if (filename === "data.js" || filename === "tailwind.config.js") {
      try { writeStatic(); } catch {}
    }
  });

  console.log("watching... (esbuild + static + tailwind inline)");
}

async function runOnce() {
  cleanDist();
  writeStatic();

  const ctx = await context(esbuildOptions);
  await ctx.rebuild();
  await ctx.dispose();

  cleanupDevArtifacts();
}

function removeIfExists(p) {
  try { fs.rmSync(p, { force: true }); } catch {}
}

function cleanupDevArtifacts() {
  // devで出がちな残骸を確実に消す（最終配布物に不要）
  removeIfExists(path.join(distDir, "bundle.js.map"));
  removeIfExists(path.join(distDir, "__tw.css"));
}


if (isWatch) {
  runWatch();
} else {
  runOnce();
}

