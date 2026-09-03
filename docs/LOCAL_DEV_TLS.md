# Local dev over HTTPS — Node and the Herd/Valet self-signed CA

## Symptom

Server-rendered data silently comes back empty while the same request works fine
in the browser and in `curl`.

Concretely: the header mega menu renders its static promo card and "Explore Our
All Accredited Courses" banner, but the category grid is blank. Same class of
failure applies to any Server Component read — course lists, blog posts,
site settings, Rank Math SEO.

## Root cause

`NEXT_PUBLIC_WP_API_URL` points at a Herd/Valet site (`https://*.test`). That
certificate is signed by Valet's own local certificate authority, not a public
one.

- **Browser and `curl` work.** Herd installs the Valet CA into the macOS
  keychain, and both trust the keychain.
- **Node does not.** Node ships its own hardcoded CA bundle and ignores the
  macOS keychain entirely. It sees an unknown signer and rejects the connection
  with `UNABLE_TO_VERIFY_LEAF_SIGNATURE`.

The error is invisible because the fetch sites catch and degrade. For example
`src/components/layout/site-shell.tsx`:

```ts
const getNavCategories = cache(async (): Promise<CourseCategory[]> => {
  try {
    return await coursesService.categories();
  } catch {
    return []; // TLS failure looks identical to "no categories exist"
  }
});
```

## Fix

Point Node at the Valet CA via `NODE_EXTRA_CA_CERTS`. Already applied on this
machine — copy the cert to a stable path and export the variable from
`~/.zshrc`:

```bash
cp ~/.config/valet/CA/LaravelValetCASelfSigned.pem ~/.herd-ca.pem
echo 'export NODE_EXTRA_CA_CERTS="$HOME/.herd-ca.pem"' >> ~/.zshrc
```

Open a new shell (or `source ~/.zshrc`), then restart `pnpm dev`.

The `.pem` holds only a public certificate — no private key, nothing secret.

### Why it cannot live in `.env.local`

`NODE_EXTRA_CA_CERTS` is read by Node **at process startup**, before Next.js
loads any `.env` file. Putting it there has no effect on TLS. It has to be in
the environment before `next dev` is invoked — shell profile, or inlined:

```bash
NODE_EXTRA_CA_CERTS=$HOME/.herd-ca.pem pnpm dev
```

### Dev only

Production WordPress serves a publicly trusted certificate, so the variable is
not needed there. Do not bake the path into `package.json` — it is
machine-specific, and a missing file makes Node print
`Warning: Ignoring extra certs ... load failed` on every start.

## Diagnosing this class of bug

When server-rendered data is empty but the endpoint looks healthy, isolate the
layers in this order.

**1. Is the backend actually returning data?**

```bash
curl -s "https://tx-local-site.test/wp-json/lms-backend/v1/course-categories" | head -c 300
```

A `200` with a sane body clears the WordPress plugin. No PHP change is needed —
stop looking at `wp-content/plugins/wp-lms-backend-rest-api`.

**2. Does Node see the same thing the shell does?**

This is the step that catches TLS. `curl` and Node have different trust stores,
so a passing `curl` proves nothing about Node.

```bash
node -e "fetch('https://tx-local-site.test/wp-json/lms-backend/v1/course-categories')
  .then(r => console.log('ok', r.status))
  .catch(e => console.log('ERR', e.cause?.code || e.message))"
```

Expected failure mode: `ERR UNABLE_TO_VERIFY_LEAF_SIGNATURE`. Re-run with the CA
to confirm the diagnosis before changing anything:

```bash
NODE_EXTRA_CA_CERTS=$HOME/.herd-ca.pem node -e "..."   # → ok 200
```

**3. Which layer swallowed the error?**

Server-side fetches in this repo tend to degrade rather than throw, so nothing
reaches the browser console. Grep the render path for `catch` blocks returning
an empty value, and confirm the component is a Server Component (an error in a
Client Component would surface in the browser console instead).

### Related error codes

Same cause, different Node/OpenSSL versions:

| Code                              | Meaning                                    |
| --------------------------------- | ------------------------------------------ |
| `UNABLE_TO_VERIFY_LEAF_SIGNATURE` | Signing CA not in Node's trust store       |
| `SELF_SIGNED_CERT_IN_CHAIN`       | Same — chain terminates in an untrusted CA |
| `DEPTH_ZERO_SELF_SIGNED_CERT`     | Leaf cert is itself self-signed            |

`NODE_TLS_REJECT_UNAUTHORIZED=0` also makes the symptom go away — do not use it.
It disables verification for every connection the process makes, including ones
to real services.
