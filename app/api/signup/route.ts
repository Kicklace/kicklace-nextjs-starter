// The sign-up handler: what happens when somebody fills in the form on the
// home page.
//
// Two calls, in this order:
//
//   identify   who they are, and the browser the tag has been watching, so the
//              visitor who read the pricing page last week and the person
//              signing up now are one record rather than two.
//   subscribe  the list, and the words they agreed to, stored verbatim as the
//              proof. Without them Kicklace refuses the call (missing_consent),
//              because a list's own wording is not what this person read.
//
// Neither call throws. A refusal comes back as `{ ok: false, error, message }`
// with Kicklace's own sentence in it, which is what this route hands on.
import { CONSENT, LIST } from "../../consent";
import { NO_KEY, kicklace } from "../../kicklace";

export async function POST(request: Request) {
  let body: { email?: unknown; name?: unknown; anonId?: unknown } = {};
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return Response.json(
      { ok: false, message: "Send JSON: { email, name?, anonId? }." },
      { status: 400 },
    );
  }

  const email = typeof body.email === "string" ? body.email.trim() : "";
  const name = typeof body.name === "string" ? body.name.trim() : undefined;
  const anonId = typeof body.anonId === "string" ? body.anonId : undefined;
  if (!email || !email.includes("@"))
    return Response.json(
      { ok: false, message: "That does not look like an email address." },
      { status: 400 },
    );

  const kl = kicklace();
  if (!kl) return Response.json({ ok: false, message: NO_KEY }, { status: 500 });

  await kl.identify({ email, name, anonId });

  const joined = await kl.subscribe({
    email,
    list: LIST,
    consent: CONSENT,
    anonId,
    sourceLabel: "the sign-up form",
  });
  if (!joined.ok)
    return Response.json(
      { ok: false, message: joined.message },
      { status: joined.httpStatus === 0 ? 502 : joined.httpStatus },
    );

  // `subscribed` and `already_subscribed` both mean the same thing to whoever
  // filled the form in, and Kicklace answers the two the same way on purpose.
  return Response.json({ ok: true });
}
