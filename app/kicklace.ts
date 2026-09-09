// One Kicklace client for the server side of this app.
//
// It is built per request rather than at import time because the constructor
// throws when there is no key — the only thing the package ever throws for —
// and a project deployed before its keys are set should still build and still
// serve pages. Nothing here reaches a browser: this module holds the secret
// key, so it is imported only by route handlers.
import { Kicklace } from "kicklace";

export function kicklace(): Kicklace | null {
  const key = process.env.KICKLACE_SECRET_KEY;
  if (!key) return null;
  return new Kicklace({ key, url: process.env.KICKLACE_URL });
}

export const NO_KEY =
  "KICKLACE_SECRET_KEY is not set, so nothing was sent to Kicklace. It is under Settings → Your website → For your developers.";
