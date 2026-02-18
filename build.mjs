import { context } from "esbuild";
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

/**
 * build.mjs の目的
 * - esbuild: src/main.tsx -> bundle.js を生成
 * - Tailwind CLI: CSSを生成して index.html に <style> として注入（配布3ファイル維持）
 * - data.js: ルート直下の data.js を dist にコピー（運用は丸ごと置換）
 * - dev/build で出力先を分離: devは dist-dev、buildは dist（汚染防止）
 */

const isWatch = process.argv.includes("--watch");

const root = process.cwd();
const distDir = path.join(root, isWatch ? "dist-dev" : "dist");
const publicDir = path.join(root, "public");

// ------------------------------
// ファイル操作ユーティリティ
// ------------------------------

/** ディレクトリを（存在していてもOKで）作成する */
function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

/** dist 出力先を毎回クリーンにする（watchでもbuildでも同じ） */
function cleanDist() {
  fs.rmSync(distDir, { recursive: true, force: true });
  ensureDir(distDir);
}

/** コピー先ディレクトリも含めて安全にコピーする */
function copyFile(src, dest) {
  ensureDir(path.dirname(dest));
  fs.copyFileSync(src, dest);
}

/** rm の失敗を握りつぶして「掃除用途」に使う */
function removeIfExists(p) {
  try {
    fs.rmSync(p, { force: true });
  } catch {
    // cleanup用途なので無視
  }
}

// ------------------------------
// Tailwind: CSSを生成して文字列として返す
// ------------------------------

/**
 * Tailwind CLI の場所を自前で特定する
 * - Windowsは .cmd になる
 * - node_modules/.bin のローカルCLIを確実に叩く（グローバル依存しない）
 */
function getTailwindBin() {
  const bin = process.platform === "win32" ? "tailwindcss.cmd" : "tailwindcss";
  return path.join(root, "node_modules", ".bin", bin);
}

/**
 * Tailwind CLI を実行して CSS を生成する（stdoutを返す）
 * - 入力: src/styles.css（v4なら `@import "tailwindcss";`）
 * - 出力: -o - で標準出力へ（__tw.css 等の一時ファイルを作らない）
 */
function buildTailwindCss() {
  const twBin = getTailwindBin();
  const input = path.join(root, "src", "styles.css");

  // styles.css が無いなら Tailwind 注入は行わない
  if (!fs.existsSync(input)) return "";

  const res = spawnSync(twBin, ["-i", input, "-o", "-", "--minify"], {
    cwd: root,
    shell: true, // Windowsで .cmd を確実に起動
    encoding: "utf8",
    stdio: "pipe", // stdout/stderr を捕捉
  });

  if (res.status !== 0) {
    console.error("Tailwind CLI failed");
    console.error("bin:", twBin);
    console.error("status:", res.status);
    if (res.error) console.error("spawn error:", res.error);
    if (res.stdout) console.error("stdout:\n", res.stdout);
    if (res.stderr) console.error("stderr:\n", res.stderr);
    throw new Error("Tailwind build failed");
  }

  return res.stdout ?? "";
}

// ------------------------------
// 静的ファイル: index.html（Tailwind注入） / data.js コピー
// ------------------------------

/**
 * public/index.html を読み込み、Tailwind CSS を <style> として注入して dist に出力する
 * - public/index.html 内の <!-- TAILWIND_CSS_INJECT --> を置換
 * - CSSファイルを別で配布しない → 成果物を3ファイルにできる
 */
function buildIndexHtmlWithCss() {
  const htmlSrc = path.join(publicDir, "index.html");
  const htmlDest = path.join(distDir, "index.html");

  let html = fs.readFileSync(htmlSrc, "utf8");

  const css = buildTailwindCss();
  const inject = css ? `<style id="tw">\n${css}\n</style>` : "";

  html = html.replace("<!-- TAILWIND_CSS_INJECT -->", inject);
  fs.writeFileSync(htmlDest, html, "utf8");
}

/**
 * data.js を dist にコピーする
 * - 運用: data.js を丸ごと置換
 * - 開発: 無ければダミーを生成して画面が動くようにする
 */
function copyDataJs() {
  const dataSrc = path.join(root, "data.js");
  const dataDest = path.join(distDir, "data.js");

  if (fs.existsSync(dataSrc)) {
    copyFile(dataSrc, dataDest);
  } else {
    fs.writeFileSync(dataDest, "window.SHIFT_DATA = window.SHIFT_DATA ?? null;\n", "utf8");
  }
}

/** dist の index.html / data.js を最新に揃える */
function writeStatic() {
  buildIndexHtmlWithCss();
  copyDataJs();
}

// ------------------------------
// esbuild 設定
// ------------------------------

const esbuildOptions = {
  entryPoints: [path.join(root, "src/main.tsx")],
  outfile: path.join(distDir, "bundle.js"),
  bundle: true,

  // devだけ map を出す（buildは配布想定でクリーンに）
  sourcemap: isWatch,

  target: "es2020",
  platform: "browser",

  // index.html から <script src="./bundle.js"> で動かすため iife
  format: "iife",
  jsx: "automatic",
  logLevel: "info",

  /**
   * esbuild のビルドが終わるたびに、index.html/data.js も同期させる
   * - Reactの変更 → bundle.js 更新
   * - その直後に index.html の Tailwind 注入も実行（念のため）
   */
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

// ------------------------------
// watch 時の多重発火を抑える（fs.watch は連打されがち）
// ------------------------------

function debounce(fn, ms) {
  let t = null;
  return () => {
    if (t) clearTimeout(t);
    t = setTimeout(() => fn(), ms);
  };
}

const writeStaticDebounced = debounce(() => {
  try {
    writeStatic();
  } catch {
    // watch中は多少雑でOK（必要ならログ出しに変更）
  }
}, 150);

// ------------------------------
// 実行モード: dev(--watch) / build
// ------------------------------

async function runWatch() {
  cleanDist();
  writeStatic();

  const ctx = await context(esbuildOptions);
  await ctx.watch();

  // Tailwind/HTML/data の変更も拾って index.html/data.js を更新
  fs.watch(path.join(root, "src"), { recursive: true }, writeStaticDebounced);
  fs.watch(publicDir, { recursive: true }, writeStaticDebounced);
  fs.watch(root, (eventType, filename) => {
    if (filename === "data.js" || filename === "tailwind.config.js") {
      writeStaticDebounced();
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

  // 念のため：dev生成物が混入した場合に掃除（dist-dev分離後は基本不要）
  cleanupDevArtifacts();
}

function cleanupDevArtifacts() {
  removeIfExists(path.join(distDir, "bundle.js.map"));
  removeIfExists(path.join(distDir, "__tw.css"));
}

// ------------------------------
// エントリーポイント
// ------------------------------

if (isWatch) {
  runWatch();
} else {
  runOnce();
}
