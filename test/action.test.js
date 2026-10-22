const assert = require("node:assert/strict");
const { spawnSync } = require("node:child_process");
const path = require("node:path");
const { test } = require("node:test");

const root = path.resolve(__dirname, "..");
function run(entry, scenario) {
  const result = spawnSync(
    process.execPath,
    ["--require", "./test/mock-api.js", entry],
    {
      cwd: root,
      encoding: "utf8",
      timeout: 10000,
      // Deliberately do not inherit any real credentials or Node preload flags.
      env: {
        TEST_SCENARIO: scenario,
        WAKATIME_API_KEY:
          scenario === "missing" ? "  " : "  waka_tok_mock_only  ",
        GH_TOKEN: "github_mock_only",
        GIST_ID: "mock-gist"
      }
    }
  );
  assert.ifError(result.error);
  assert.doesNotMatch(result.stderr, /waka_tok_mock_only|github_mock_only/);
  const requests = result.stdout
    .trim()
    .split("\n")
    .filter(Boolean)
    .map(line => JSON.parse(line));
  return { ...result, requests };
}

for (const entry of ["index.js", "dist/index.js"]) {
  test(`${entry}: OAuth request preserves weekly gist formatting`, () => {
    const result = run(entry, "success");
    assert.equal(result.status, 0, result.stderr);
    assert.deepEqual(
      result.requests.map(({ method }) => method),
      ["GET", "GET", "PATCH"]
    );
    const files = JSON.parse(result.requests[2].body).files;
    assert.deepEqual(Object.keys(files), ["original.txt"]);
    assert.equal(
      files["original.txt"].filename,
      "📊 Weekly development breakdown"
    );
    assert.equal(
      files["original.txt"].content,
      [
        "JavaScript 2 hrs          ██████████▌░░░░░░░░░░  50.0%",
        "TypeScr... 1 hr           █████▎░░░░░░░░░░░░░░░  25.0%",
        "Python     24 mins        ██░░░░░░░░░░░░░░░░░░░  10.0%",
        "Go         24 mins        ██░░░░░░░░░░░░░░░░░░░  10.0%",
        "Rust       12 mins        █░░░░░░░░░░░░░░░░░░░░   5.0%"
      ].join("\n")
    );
  });

  for (const [scenario, message, requestCount] of [
    ["unauthorized", "Unable to get WakaTime stats (HTTP 401)", 1],
    ["network", "Unable to request WakaTime stats.", 1],
    ["invalid", "WakaTime returned invalid stats.", 1],
    [
      "missing",
      "WAKATIME_API_KEY must contain a WakaTime OAuth access token.",
      0
    ],
    ["gist-read", "Unable to get gist.", 2],
    ["gist-update", "Unable to update gist.", 3]
  ]) {
    test(`${entry}: ${scenario} fails without leaking credentials`, () => {
      const result = run(entry, scenario);
      assert.equal(result.status, 1);
      assert.ok(result.stderr.includes(message), result.stderr);
      assert.equal(result.requests.length, requestCount);
    });
  }

  test(`${entry}: empty activity does not write a gist`, () => {
    const result = run(entry, "empty");
    assert.equal(result.status, 0, result.stderr);
    assert.equal(
      result.requests.filter(({ method }) => method === "PATCH").length,
      0
    );
  });
}
