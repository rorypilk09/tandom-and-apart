# Tandem & Apart

An independent research landing page. Four questions collect current family needs before the concept is revealed; four more collect use intent, frequency, priorities, and price. Optional email capture follows. No product is offered for sale.

## Run locally

No installation or frontend build is needed. Run `node scripts/serve.mjs` from this folder, then open http://127.0.0.1:5173. `npm run dev` also works if npm is installed. The website files are at the project root: `index.html`, `styles.css`, `app.js`, `config.js`, and `assets/`. Upload the contents of this folder to the repository root. For GitHub Pages, select your branch and `/ (root)` as the publishing source. GitHub source upload by itself does not host a site.

The default is visibly labelled preview mode. It sends and saves nothing and never claims a response was collected. Refreshing discards incomplete answers. All eight answers are saved together on final submission, not as partial leads.

## Connect Supabase before collecting real responses

1. Create/select your Supabase project. Apply `supabase/migrations/202610020001_research.sql` in the SQL editor, or run `supabase db push` after linking the CLI to the project.
2. Enable pg_cron and execute the commented retention schedule in the migration. The privacy notice promises 12-month retention; enforce this before launch.
3. Create a Cloudflare Turnstile widget for your production hostname (and localhost for testing). Add its **public site key** to `config.js`.
4. Set Edge Function secrets `TURNSTILE_SECRET_KEY` and `ALLOWED_ORIGINS` (comma-separated exact origins, e.g. `https://your-domain.com,http://127.0.0.1:5173`). Supabase supplies `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` to functions. Never put service-role or secret keys in browser files or GitHub.
5. Deploy: `supabase functions deploy submit-research --no-verify-jwt`. This public function validates Turnstile, origin, all answers, consent, and the payload before saving. `supabase/config.toml` also records that JWT verification is disabled; this supports publishable keys.
6. Set your project URL and public publishable key in `config.js`. Preview mode switches off only when all three public values exist.
7. Add a monitored contact email to the privacy notice in `index.html` so participants can request deletion even if they skipped email opt-in. Keep the consent wording/version in sync between the page and function when changing it.
8. Test a real submission on your allowed hostname, confirm its row in Supabase, test a failure and retry, and verify signed-out visitors cannot read the table. A live database write has not been tested in this delivered local version.

The database exposes no public read or write privileges. Responses are only written through the Edge Function using its private service-role key. UUIDs prevent duplicate rows on retries. Turnstile is verified server-side; do not remove it for production. The function does not send email—export opted-in contacts to your email provider when ready. View aggregate answers in the Supabase dashboard, not in a public admin page.

## Research interpretation

The first screen intentionally avoids showing the stroller or explaining its split mechanism. Q4 measures an actual recent situation, not enthusiasm. Concept imagery becomes visible only after Q4. Negative use and purchase options are explicit. Prices are USD and are research ranges, not a quote. Email is optional to avoid losing negative feedback.

This survey measures stated interest, not willingness to pay. Do not treat email signups or “very likely” answers as proof of demand. Compare Q4's actual split need to Q6's claimed future frequency, segment by children who need strollers, and interview respondents before committing to tooling. The imagery does not validate engineering, safety, or docking feasibility.

## Visual direction and sources

Reference: [Bugaboo’s official website](https://www.bugaboo.com/us-en/). The broad inspiration is clean typography, generous spacing and product-focused composition. This implementation uses original typography and branding, not Bugaboo logos, photos, slogans, or font files. Manrope gives headlines a geometric character; DM Sans gives form labels and copy a clear reading rhythm. The palette is charcoal `#252523`, paper `#faf9f6`, lavender `#e8e4f5`, purple `#706386`, and yellow `#eeef62`. These are our chosen colors, not claimed Bugaboo brand tokens. Fonts are loaded from Google Fonts with system fallbacks.

Generated asset: `assets/stroller-concept.png`, produced with built-in ImageGen. Prompt: “Premium industrial design studio product mockup showing one original modular inline tandem stroller on left, two matching independent single strollers on right, matte charcoal chassis, olive textiles, pale lavender seamless background, full products and wheels visible, photorealistic lighting, no text/logos/people, speculative research concept rather than engineered product.”

Storage design follows [Supabase’s API security guidance](https://supabase.com/docs/guides/api/securing-your-api) and [row-level security documentation](https://supabase.com/docs/guides/database/postgres/row-level-security).
