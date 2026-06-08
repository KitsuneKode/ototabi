#!/usr/bin/env node
import { spawnSync } from "node:child_process";

const MIN_SCORE = 85;
const result = spawnSync("react-doctor", ["--score"], {
  cwd: new URL("..", import.meta.url).pathname,
  encoding: "utf8",
  shell: false,
});

const output = `${result.stdout ?? ""}${result.stderr ?? ""}`.trim();
const scoreLine = output.split("\n").find((line) => /^\d+$/.test(line.trim()));
const score = scoreLine ? Number.parseInt(scoreLine.trim(), 10) : NaN;

if (!Number.isFinite(score)) {
  console.error("react-doctor failed to return a score:\n", output);
  process.exit(result.status ?? 1);
}

console.log(`React Doctor score: ${score}/100 (minimum ${MIN_SCORE})`);

if (score < MIN_SCORE) {
  console.error(`Score ${score} is below minimum ${MIN_SCORE}. Run: bun run doctor`);
  process.exit(1);
}
