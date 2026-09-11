// Payments, as events on the person who made them.
//
// ---------------------------------------------------------------------------
// You may not need this file at all.
//
// Kicklace takes Stripe's webhook itself: Connections → Payments
// from Stripe gives you an address to paste into your Stripe dashboard, and
// from then on a paid invoice is a purchase with its amount on the person's
// timeline and the lifecycle moves them to Paying — with no code, no
// deployment, and no signing secret in your project. Prefer that.
//
// Keep this route when the payment is not the whole story: when you want to
// look something up in your own database first, post an event of your own
// beside the purchase, or send Kicklace only some of what Stripe tells you.
// It does exactly what Kicklace's own receiver does, so the two are
// interchangeable — run one of them, never both, or the purchase lands twice.
// ---------------------------------------------------------------------------
//
// Signature (docs.stripe.com/webhooks, "Verify manually"): the
// `Stripe-Signature` header is `t=<unix seconds>,v1=<hex>`, with more than one
// `v1` while a secret is being rolled; the signed payload is `${t}.${body}`;
// the key is the whole `whsec_…` secret; five minutes of tolerance. There is no
// Stripe SDK here, because a webhook signature is an HMAC and `node:crypto`
// has one. Schemes that are not `v1` are ignored, `v0` included: it is sent for
// test events, and taking it would be a downgrade.
import { createHmac, timingSafeEqual } from "node:crypto";
import { NO_KEY, kicklace } from "../../../kicklace";

// node:crypto and the raw body both want the Node.js runtime, which is the
// default; it is written down here so a later edit cannot move it by accident.
export const runtime = "nodejs";

const TOLERANCE_S = 5 * 60;

function verify(
  secret: string,
  header: string | null,
  body: string,
  now: number,
): boolean {
  if (!header) return false;
  let timestamp: number | undefined;
  const given: string[] = [];
  for (const part of header.split(",")) {
    const at = part.indexOf("=");
    if (at === -1) continue;
    const name = part.slice(0, at).trim();
    const value = part.slice(at + 1).trim();
    if (name === "t") timestamp = Number(value);
    else if (name === "v1") given.push(value);
  }
  if (timestamp === undefined || !Number.isFinite(timestamp)) return false;
  if (given.length === 0) return false;
  if (Math.abs(now / 1000 - timestamp) > TOLERANCE_S) return false;

  const expected = Buffer.from(
    createHmac("sha256", secret).update(`${timestamp}.${body}`).digest("hex"),
    "utf8",
  );
  return given.some((one) => {
    const candidate = Buffer.from(one, "utf8");
    return (
      candidate.length === expected.length &&
      timingSafeEqual(candidate, expected)
    );
  });
}

// Stripe counts money in the currency's smallest unit, except in these, where
// the amount is already whole (docs.stripe.com/currencies#zero-decimal).
const ZERO_DECIMAL = new Set([
  "bif", "clp", "djf", "gnf", "jpy", "kmf", "krw", "mga", "pyg", "rwf",
  "ugx", "vnd", "vuv", "xaf", "xof", "xpf",
]);

function wholeUnits(amount: number, currency: string | undefined): number {
  return ZERO_DECIMAL.has((currency ?? "").toLowerCase()) ? amount : amount / 100;
}

/** Only what this route reads. Stripe sends a great deal more. */
type StripeEvent = {
  id?: string;
  type?: string;
  data?: {
    object?: {
      id?: string;
      amount?: number;
      amount_total?: number;
      amount_paid?: number;
      amount_received?: number;
      currency?: string;
      customer_email?: string;
      receipt_email?: string;
      invoice?: string;
      payment_intent?: string;
      customer_details?: { email?: string };
      billing_details?: { email?: string };
    };
  };
};

/** The first address Stripe put on the object, whichever field it used. */
function emailOf(object: NonNullable<StripeEvent["data"]>["object"]): string {
  return (
    object?.customer_details?.email ??
    object?.customer_email ??
    object?.receipt_email ??
    object?.billing_details?.email ??
    ""
  );
}

export async function POST(request: Request) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret)
    return Response.json(
      {
        ok: false,
        message:
          "STRIPE_WEBHOOK_SECRET is not set, so nothing was verified and nothing was sent. It is in Stripe → Developers → Webhooks, on the endpoint you pointed here.",
      },
      { status: 500 },
    );

  const body = await request.text();
  if (!verify(secret, request.headers.get("stripe-signature"), body, Date.now()))
    return Response.json(
      { ok: false, message: "That signature does not match." },
      { status: 400 },
    );

  let event: StripeEvent;
  try {
    event = JSON.parse(body) as StripeEvent;
  } catch {
    return Response.json({ ok: false, message: "Not JSON." }, { status: 400 });
  }

  const object = event.data?.object;
  const paid =
    event.type === "checkout.session.completed" ||
    event.type === "invoice.paid" ||
    event.type === "payment_intent.succeeded";

  // Anything else is answered 200 and ignored. A refusal only makes Stripe try
  // again for three days, and there is nothing here to fix.
  if (!paid || !object) return Response.json({ ok: true, status: "ignored" });

  const email = emailOf(object);
  if (!email) return Response.json({ ok: true, status: "no_email" });

  const kl = kicklace();
  if (!kl) return Response.json({ ok: false, message: NO_KEY }, { status: 500 });

  const amount =
    object.amount_total ?? object.amount_paid ?? object.amount_received ?? object.amount;

  const sent = await kl.track("purchase", {
    email,
    value: amount === undefined ? undefined : wholeUnits(amount, object.currency),
    // The invoice if there is one, else the payment intent, else the event:
    // this is what stops one payment landing three times when Stripe retries
    // or sends two events for the same charge.
    idempotencyKey:
      (typeof object.invoice === "string" ? object.invoice : undefined) ??
      (typeof object.payment_intent === "string"
        ? object.payment_intent
        : undefined) ??
      event.id,
    properties: { stripeEvent: event.type },
  });

  // A refusal is an answer, not a throw — but Stripe should try again when
  // Kicklace could not be reached, so a failure is a 500 here on purpose.
  if (!sent.ok)
    return Response.json({ ok: false, message: sent.message }, { status: 500 });
  return Response.json({ ok: true, status: sent.status });
}
