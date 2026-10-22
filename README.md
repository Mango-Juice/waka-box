<p align="center">
  <img width="400" src="https://user-images.githubusercontent.com/4658208/60469862-2e40bf00-9c2c-11e9-87f7-afe164648de4.png">
  <h3 align="center">waka-box</h3>
  <p align="center">Update a pinned gist to contain your weekly WakaTime stats</p>
</p>

---

> 📌✨ For more pinned-gist projects like this one, check out: https://github.com/matchai/awesome-pinned-gists

## Setup

### Prep work

1. Create a new public GitHub Gist (https://gist.github.com/)
1. Create a token with the `gist` scope and copy it. (https://github.com/settings/tokens/new)
1. Create a WakaTime account (https://wakatime.com/signup)
1. In your WakaTime profile settings (https://wakatime.com/settings/profile) ensure `Display coding activity publicly` and `Display languages, editors, operating systems publicly` are checked.
1. Use a personal WakaTime OAuth access token (https://wakatime.com/oauth) with access to your stats (`read_stats`).

### Project setup

1. Fork this repo
1. Go to the repo **Settings > Secrets**
1. Add the following environment variables:
   - **GIST_ID:** The ID portion from your gist url: `https://gist.github.com/matchai/`**`6d5f84419863089a167387da62dd7081`**.
   - **GH_TOKEN:** The GitHub token generated above.
   - **WAKATIME_API_KEY:** Your WakaTime OAuth access token. The secret name is retained for compatibility; its value is sent as `Authorization: Bearer <token>` ([WakaTime authentication](https://wakatime.com/developers#authentication)). A legacy API key is not supported by this OAuth workflow.

## Development

Use Node.js 24. The scheduled workflow runs this repository's local action (`uses: ./`), whose entry point is the committed `dist/index.js`. After changing the source, rebuild and commit the bundle:

```sh
npm ci
npm run lint
npm run build
npm test
```

Tests exercise both the source and bundle with mock WakaTime and GitHub responses; they do not read repository secrets or update a live Gist. CI also checks that rebuilding leaves `dist` unchanged. The daily schedule and Gist formatting are preserved. The action uses Node.js 24 and workflows pin `ubuntu-24.04` to avoid changes during the `ubuntu-latest` migration.

A 401 can also mean an expired, revoked, or otherwise invalid token; changing the authentication header alone does not verify a live token. Request failures report safe messages without credential-bearing request objects.
