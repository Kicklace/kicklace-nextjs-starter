# Kicklace Next.js starter

A Next.js app with [Kicklace](https://www.kicklace.com) already wired in: the
tag on the site, and the `kicklace` package in a sign-up handler and a Stripe
webhook. Deploy it, paste two keys, and every visit, sign-up and payment lands
on one record per person.

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Ffallguy04%2Fkicklace-nextjs-starter&project-name=kicklace-starter&repository-name=kicklace-starter&env=KICKLACE_SECRET_KEY,NEXT_PUBLIC_KICKLACE_KEY,KICKLACE_URL,NEXT_PUBLIC_KICKLACE_URL&envDefaults=%7B%22KICKLACE_URL%22%3A%22https%3A%2F%2Fwww.kicklace.com%22%2C%22NEXT_PUBLIC_KICKLACE_URL%22%3A%22https%3A%2F%2Fwww.kicklace.com%22%7D&envDescription=Your%20Kicklace%20keys%2C%20from%20Settings%20%E2%86%92%20Your%20website%20%E2%86%92%20For%20your%20developers%3A%20the%20public%20key%20for%20the%20tag%2C%20and%20a%20secret%20key%20for%20your%20server.&envLink=https%3A%2F%2Fgithub.com%2Ffallguy04%2Fkicklace-nextjs-starter%23environment-variables)

The button clones this repository into your own GitHub account, makes a Vercel
project from it, and asks for the four environment variables below.

## Environment variables

| Name | What it is |
| --- | --- |
| `KICKLACE_SECRET_KEY` | your secret key, `sk_live_…`. Server only: it must never be in a page. |
| `NEXT_PUBLIC_KICKLACE_KEY` | your public key, `wk_…`, which the tag carries. It can only add people. |
| `KICKLACE_URL` | where Kicklace is, for your server. `https://www.kicklace.com` unless you run your own. |
| `NEXT_PUBLIC_KICKLACE_URL` | where Kicklace is, for the tag. The same address. |

Both keys are in Kicklace under **Settings → Your website → For your
developers**. The secret key is shown once.

`STRIPE_WEBHOOK_SECRET` is optional and is not asked for at deploy time; add it
in Vercel later if you use the Stripe route below.

## Running it yourself

```bash
git clone https://github.com/fallguy04/kicklace-nextjs-starter
cd kicklace-nextjs-starter
npm install
cp .env.example .env.local     # then fill in the two keys
npm run dev
```

Then open http://localhost:3000, fill the form in, and look at your workspace:
the person is there, on the list, with the sentence they agreed to stored word
for word.

While you are developing, add `http://localhost:3000` under **Settings → Your
website → Where is your site?** so the tag's posts are not refused.

## What is wired, and where

### `app/layout.tsx` — the tag

```tsx
import { KicklaceTag } from "kicklace/next";

<body>
  {children}
  <KicklaceTag />
</body>
```

Page reads, where somebody came from, and the sign-up forms it can hear. It
keeps one random id in the browser's own storage — no cookies — and reads
`NEXT_PUBLIC_KICKLACE_KEY` and `NEXT_PUBLIC_KICKLACE_URL` by itself. Given a
secret key it renders nothing and says why in the console.

### `app/api/signup/route.ts` — who they are, and what they agreed to

```ts
await kl.identify({ email, name, anonId });
await kl.subscribe({ email, list: "product-updates", consent: CONSENT });
```

`identify` carries the browser id the tag keeps, so the anonymous visitor who
read your pricing page last week and the person signing up now are one record.
`subscribe` needs the words the person read: Kicklace stores that sentence
verbatim as the proof, with the day, and refuses a subscribe without one. The
sentence lives in `app/consent.ts` and is read by both the form and the
handler, so what is shown and what is stored cannot differ.

`app/consent.ts` also holds the list's address. Change it to a list of your own
from **Settings → Lists**.

**You may not need this route.** Mark any form on your site
`data-kl-list="product-updates"` and the tag hears it by itself — it never
touches the form, so your own handler and success state are exactly what they
were. Write a handler when you want to do something else first.

### `app/api/webhooks/stripe/route.ts` — a payment on the person who made it

Verifies Stripe's `Stripe-Signature` header with `node:crypto` (no Stripe SDK)
and posts `kl.track("purchase", { email, value, idempotencyKey })`. The
idempotency key is the invoice, else the payment intent, else the event id,
which is what stops one payment landing three times when Stripe retries.

**Kicklace can take Stripe's webhook itself**, with no code and no deployment:
**Settings → Integrations → Payments from Stripe** gives you an address to
paste into your Stripe dashboard, and a paid invoice becomes the same purchase
with the same lifecycle move. Prefer that. Keep this route when the payment is
not the whole story — when you want to look something up in your own database
first, or post an event of your own beside it. **Run one of the two, never
both**, or the purchase lands twice.

## Adding it to a project you already have

```bash
npx kicklace init
```

It adds `<KicklaceTag />` to your root layout, `kicklace` to `package.json`, and
the four names above to `.env.example`, and prints where the keys come from. It
installs nothing and changes nothing it does not name; `npx kicklace init
--dry-run` prints every change and makes none.

## What else the package does

```ts
await kl.track("signup", { email });
await kl.track("purchase", { email, value: 49, idempotencyKey: invoice.id });
await kl.track({ type: "credit_added", accountId, properties: { credits: 10 } });
await kl.messages.send({ to: email, template: "Welcome" });
```

Every method resolves — none of them throws, even when Kicklace refuses
something — and the refusal carries Kicklace's own code and sentence. The
package's README has all of it:
[npmjs.com/package/kicklace](https://www.npmjs.com/package/kicklace).

## Licence

MIT.
