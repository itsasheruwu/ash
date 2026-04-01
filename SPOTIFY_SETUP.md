# Spotify “now playing” pill

The hero pill loads **live playback** when possible, otherwise **last played** from Spotify. Spotify does not allow calling their API with a secret from a static browser app, so you need a tiny **serverless** endpoint that holds your **refresh token**.

**Interactive setup:** from the project root run `npm run setup:spotify` and enter each value when prompted (it can open the browser flow, write `.env.spotify.server`, and set `VITE_SPOTIFY_STATUS_URL` in `.env`).

If the browser shows **“127.0.0.1 refused to connect”** after you approve Spotify, that only means nothing was listening on port **8888**. In a **second** terminal run **`npm run spotify:callback`**, then do the authorize step again so the redirect loads and shows your **code**.

This repo includes `api/spotify.js` for **Vercel**. Other hosts work if you expose the same JSON shape.

## 1. Spotify Developer app

1. Open [Spotify Developer Dashboard](https://developer.spotify.com/dashboard) and log in.
2. **Create app**. Name it anything (e.g. “ash links”).
3. Note **Client ID** and **Client secret** (Settings → View client secret).
4. **Edit settings** → **Redirect URIs**:
   - Add `http://127.0.0.1:8888/callback` (or any local URL you will use once to capture the code).
   - Save.

## 2. Scopes

The API needs:

- `user-read-currently-playing`
- `user-read-recently-played`

## 3. Get a refresh token (one-time)

Authorize in the browser (replace `YOUR_CLIENT_ID` and match `redirect_uri` to what you saved):

```text
https://accounts.spotify.com/authorize?client_id=YOUR_CLIENT_ID&response_type=code&redirect_uri=http%3A%2F%2F127.0.0.1%3A8888%2Fcallback&scope=user-read-currently-playing%20user-read-recently-played
```

After you approve, you’ll land on `http://127.0.0.1:8888/callback?code=...` (start any local server on 8888, or copy the `code` from the address bar).

Exchange the **code** for tokens (replace placeholders):

```bash
curl -X POST https://accounts.spotify.com/api/token \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "grant_type=authorization_code" \
  -d "code=PASTE_CODE_HERE" \
  -d "redirect_uri=http://127.0.0.1:8888/callback" \
  -d "client_id=YOUR_CLIENT_ID" \
  -d "client_secret=YOUR_CLIENT_SECRET"
```

Save **`refresh_token`** from the JSON. Keeping it secret is mandatory.

## 4. Deploy the API (Vercel)

1. Push this repo (or connect the folder) to [Vercel](https://vercel.com).
2. In the project → **Settings → Environment variables**, add:
   - `SPOTIFY_CLIENT_ID`
   - `SPOTIFY_CLIENT_SECRET`
   - `SPOTIFY_REFRESH_TOKEN`
3. Deploy. The handler is served at **`/api/spotify`** on your deployment URL.

## 5. Point the site at the API

1. Copy your deployed URL, e.g. `https://your-app.vercel.app/api/spotify`.
2. In local dev, create `.env` in the project root:

   ```env
   VITE_SPOTIFY_STATUS_URL=https://your-app.vercel.app/api/spotify
   ```

3. Run `npm run dev` and confirm the pill updates.

For **GitHub Pages** (`npm run deploy`), set `VITE_SPOTIFY_STATUS_URL` when building (e.g. GitHub Actions secret + workflow env) so the static bundle embeds the public API URL.

## Response shape

The frontend expects JSON like:

```json
{
  "ok": true,
  "state": "playing",
  "track": {
    "name": "Track",
    "artist": "Artist",
    "url": "https://open.spotify.com/track/..."
  }
}
```

`state` can be `playing`, `paused`, `recent`, or `idle`. If `ok` is false, the pill shows an error state.
