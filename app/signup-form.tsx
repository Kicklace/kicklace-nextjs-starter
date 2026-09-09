"use client";

// The form. It posts to /api/signup, which is where the secret key is.
//
// Two things worth copying into your own form:
//
//   1. The consent sentence on screen is the same constant the handler stores,
//      so what a person read and what Kicklace keeps as the proof cannot be two
//      different sentences.
//   2. The browser id the tag keeps in localStorage goes with the post, so the
//      anonymous visitor Kicklace has been watching and the person signing up
//      are one record.
//
// If you would rather not write a handler at all: mark any form
// `data-kl-list="product-updates"` and the tag hears it by itself — no
// preventDefault, no markup of ours, and your own form keeps working exactly
// as it did.
import { useState } from "react";
import { ANON_ID_KEY, CONSENT } from "./consent";

type State = { kind: "idle" | "sending" } | { kind: "done" } | { kind: "problem"; message: string };

function anonId(): string | undefined {
  try {
    return window.localStorage.getItem(ANON_ID_KEY) ?? undefined;
  } catch {
    // A browser with storage switched off. The signup still lands; it just
    // starts a new record instead of joining the visits already on one.
    return undefined;
  }
}

export function SignupForm() {
  const [state, setState] = useState<State>({ kind: "idle" });

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setState({ kind: "sending" });
    try {
      const answer = await fetch("/api/signup", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          email: form.get("email"),
          name: form.get("name"),
          anonId: anonId(),
        }),
      });
      const said = (await answer.json()) as { ok?: boolean; message?: string };
      if (said.ok) setState({ kind: "done" });
      else
        setState({
          kind: "problem",
          message: said.message ?? "That did not work. Try again in a moment.",
        });
    } catch {
      setState({
        kind: "problem",
        message: "That did not work. Try again in a moment.",
      });
    }
  }

  if (state.kind === "done")
    return (
      <p className="said">
        You are on the list. Check your email — and unsubscribe with one click
        whenever you like.
      </p>
    );

  return (
    <form onSubmit={onSubmit}>
      <label>
        Email
        <input type="email" name="email" required autoComplete="email" />
      </label>
      <label>
        Name (optional)
        <input type="text" name="name" autoComplete="name" />
      </label>
      <p className="consent">
        <input type="checkbox" name="consent" required id="consent" />
        <label htmlFor="consent">{CONSENT}</label>
      </p>
      <button type="submit" disabled={state.kind === "sending"}>
        {state.kind === "sending" ? "Joining…" : "Join"}
      </button>
      {state.kind === "problem" && <p className="said">{state.message}</p>}
    </form>
  );
}
