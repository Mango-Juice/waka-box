const assert = require("node:assert/strict");
const scenario = process.env.TEST_SCENARIO;
const token = "waka_tok_mock_only";

// No real requests: both the source and packaged action use this fetch stub.
global.fetch = async (url, options = {}) => {
  const method = options.method || "GET";
  console.log(JSON.stringify({ method, url, body: options.body }));
  if (url === "https://wakatime.com/api/v1/users/current/stats/last_7_days") {
    assert.equal(
      new Headers(options.headers).get("Authorization"),
      `Bearer ${token}`
    );
    assert.equal(options.redirect, "error");
    if (scenario === "network") {
      throw new Error(`Network error with Authorization: Bearer ${token}`);
    }
    if (scenario === "unauthorized") {
      return Response.json({ error: token }, { status: 401 });
    }
    if (scenario === "invalid") {
      return Response.json({ error: token });
    }
    return Response.json({
      data: {
        languages:
          scenario === "empty"
            ? []
            : [
                { name: "JavaScript", percent: 50, text: "2 hrs" },
                { name: "TypeScriptLong", percent: 25, text: "1 hr" },
                { name: "Python", percent: 10, text: "24 mins" },
                { name: "Go", percent: 10, text: "24 mins" },
                { name: "Rust", percent: 5, text: "12 mins" },
                { name: "Ignored", percent: 0, text: "0 secs" }
              ]
      }
    });
  }
  if (url === "https://api.github.com/gists/mock-gist") {
    if (
      (scenario === "gist-read" && method === "GET") ||
      (scenario === "gist-update" && method === "PATCH")
    ) {
      return Response.json(
        { message: `credential-bearing response ${token}` },
        { status: 401 }
      );
    }
    if (method === "GET")
      return Response.json({ files: { "original.txt": {} } });
    if (method === "PATCH") return Response.json({});
  }
  throw new Error("Unexpected request in mock test");
};
