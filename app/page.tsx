import { LIST } from "./consent";
import { SignupForm } from "./signup-form";

export default function Home() {
  return (
    <main>
      <h1>Kicklace starter</h1>
      <p>
        A Next.js app with Kicklace wired in. Fill this form in and the person
        appears in your workspace, on the list <code>{LIST}</code>, with the
        sentence they agreed to stored word for word.
      </p>

      <SignupForm />

      <h2>What is wired</h2>
      <ul>
        <li>
          <code>app/layout.tsx</code> — <code>&lt;KicklaceTag /&gt;</code>, which
          is page reads, where people came from, and the sign-up forms it can
          hear.
        </li>
        <li>
          <code>app/api/signup/route.ts</code> — <code>identify</code> then{" "}
          <code>subscribe</code>, with the consent this page shows.
        </li>
        <li>
          <code>app/api/webhooks/stripe/route.ts</code> — a paid invoice becomes
          a purchase on the person who paid. Kicklace can also take Stripe&apos;s
          webhook itself, with no code; that file says when to prefer which.
        </li>
      </ul>

      <p>
        Replace this page with your own. The three files above are the whole of
        it, and the README has the rest.
      </p>
    </main>
  );
}
