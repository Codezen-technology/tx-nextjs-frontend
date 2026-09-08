# WP-side spec: purge the headless frontend's cache on save

**For `wp-lms-backend-rest-api`. Not implemented in the frontend repo.**

The Next.js frontend caches every WordPress read by tag, for 5–60 minutes. Until
that TTL expires, a saved edit is invisible to visitors — which is how a
floating-bar notice switched on in WP Admin stayed missing from
`trainingexcellence.org.uk` for an hour while `GET /settings` was serving it
correctly the whole time.

The frontend now exposes `POST /api/revalidate` (full contract in the frontend's
`API_REFERENCE.md` → _Cache Revalidation_). This is the WordPress half: fire that
call when an option the frontend caches actually changes.

## The call

```php
wp_remote_post(
    trailingslashit( $frontend_url ) . 'api/revalidate',
    [
        'blocking' => false,
        'timeout'  => 2,
        'headers'  => [
            'Content-Type'            => 'application/json',
            'x-wp-revalidate-secret'  => $secret,
        ],
        'body'     => wp_json_encode( [ 'tags' => [ 'settings' ] ] ),
    ]
);
```

`$frontend_url` and `$secret` are plugin configuration (constants in
`wp-config.php` or a filter — not hardcoded, and the secret must never be
exposed through any REST response or admin screen). `$secret` must equal
`WP_REVALIDATE_SECRET` on the Vercel deployment.

## Requirements

1. **Hook `updated_option`, not `update_option`.** `updated_option` fires only
   when the stored value actually changed, so re-saving an unchanged settings
   screen sends nothing.
2. **Non-blocking.** `'blocking' => false` (or send on `shutdown`). The editor's
   save must never wait on the frontend, and must never fail because of it —
   swallow every transport error, log at most.
3. **Map option → tags.** Start with the options behind `GET /settings`:

   | Option saved                            | Tags       |
   | --------------------------------------- | ---------- |
   | Floating bar, and any `/settings` field | `settings` |
   | Footer content                          | `footer`   |
   | Home page content                       | `home`     |

   Send only tags from the frontend's published list. **One unrecognised tag
   fails the whole request with `400` and purges nothing** — that is deliberate,
   so a mapping typo surfaces on the first save rather than silently leaving
   content stale.

4. **Skip the call when unconfigured.** No frontend URL or no secret → send
   nothing. The frontend rejects unauthenticated calls anyway, and content still
   refreshes on its TTL.
5. **Batch within one save.** If a single save touches several mapped options,
   send one request with all their tags (cap: 20 per request) rather than one
   request per option.

## Verifying

```bash
curl -i -X POST https://trainingexcellence.org.uk/api/revalidate \
  -H 'x-wp-revalidate-secret: <secret>' \
  -H 'content-type: application/json' \
  -d '{"tags":["settings"]}'
```

- `200 {"revalidated":true,...}` — working.
- `401` — secret mismatch, or `WP_REVALIDATE_SECRET` is unset on the deployment.
- `400 Unknown cache tag: …` — the tag name is wrong on the WP side.

End-to-end: toggle the floating bar in WP Admin, reload the homepage, and the
notice should be there on the first load — no wait, no redeploy.
