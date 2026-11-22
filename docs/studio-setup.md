# Photo collections & Studio setup

Photos are stored in an S3-compatible bucket (Cloudflare R2) and served from
`cdn.cxiang.site`. Collection metadata and layout live in Postgres. The Studio at
`/studio` is where photos are uploaded and arranged.

## 1. Create the bucket

In the Cloudflare dashboard, create an R2 bucket (for example `cxiang-photos`)
and connect it to the `cdn.cxiang.site` custom domain.

## 2. Allow browser uploads (required)

The Studio uploads files straight from the browser with a presigned `PUT`, so the
bucket needs a CORS rule that allows `PUT` from your site. Without this the
browser blocks the upload even though the presigned URL is valid.

Replace `https://cxiang.site` with your production origin (and add
`http://localhost:3000` if you want to upload during local development):

```json
[
    {
        "AllowedOrigins": ["https://cxiang.site", "http://localhost:3000"],
        "AllowedMethods": ["PUT", "GET"],
        "AllowedHeaders": ["content-type"],
        "ExposeHeaders": ["ETag"],
        "MaxAgeSeconds": 3600
    }
]
```

## 3. Create an R2 API token

R2 → API → Manage API tokens → Create token with **Object Read & Write** for this
bucket. This yields an Access Key ID and Secret Access Key. The S3 endpoint is
`https://<ACCOUNT_ID>.r2.cloudflarestorage.com`.

## 4. Environment variables

Add these to `.env.local` and to the Vercel project:

| Variable                   | Purpose                           | Example                                      |
| -------------------------- | --------------------------------- | -------------------------------------------- |
| `CDN_S3_ENDPOINT`          | R2 S3 endpoint                    | `https://<account>.r2.cloudflarestorage.com` |
| `CDN_S3_ACCESS_KEY_ID`     | R2 token access key               |                                              |
| `CDN_S3_SECRET_ACCESS_KEY` | R2 token secret                   |                                              |
| `CDN_S3_BUCKET`            | Bucket name                       | `cxiang-photos`                              |
| `CDN_PUBLIC_BASE_URL`      | Public base URL for objects       | `https://cdn.cxiang.site`                    |
| `CDN_PHOTO_PREFIX`         | Optional key prefix               | `photos` (default)                           |
| `STUDIO_PASSWORD`          | Studio password                   | long random string                           |
| `STUDIO_SESSION_SECRET`    | Optional signing key for sessions | another long random string                   |

Also make sure `cdn.cxiang.site` stays listed in `next.config.ts`
`images.remotePatterns`, so `next/image` is allowed to optimize the photos.

## 5. Apply the database migration

```bash
bun run db:migrate
```

This creates the `photosets` and `photos` tables.

## 6. Use the Studio

```bash
bun run dev
```

Open <http://localhost:3000/studio>, sign in with `STUDIO_PASSWORD`, then:

1. **New collection** — set a title (the slug fills in automatically), description,
   and shoot dates. Leave **Published** unchecked to keep it a draft.
2. **Add photos** — each file is converted to WebP in the browser and uploaded.
3. **Arrange** — drag a cell to move it, drag its corner to resize, and use
   **Add blank space** for an explicit gap. See
   [How the layout works](#how-the-layout-works).
4. **Cover** — click the star on the photo that should represent the collection on
   `/photos`. With no explicit cover, the first photo is used.
5. **Save** — publishes immediately to `/photos` when **Published** is ticked.

### Shoot dates

**Shot from / to** accepts a single day (leave _to_ empty) or a range. The label on
`/photos` and the collection page adapts to the span:

| Range            | Rendered label        |
| ---------------- | --------------------- |
| one day          | `Mar 2025`            |
| inside one month | `14–18 Mar 2025`      |
| inside one year  | `Mar–May 2025`        |
| across years     | `Nov 2024 – Feb 2025` |

A range ending before it starts is rejected, as is an end date with no start. The
formatting lives in [`src/lib/shot-range.ts`](../src/lib/shot-range.ts), and the
collection's month (used for the sitemap `lastmod`) is taken from the start date.

### Uploads are converted to WebP

Photos go from the browser straight to the bucket, so the server never sees the
bytes and cannot compress them. The Studio therefore encodes in the browser
before uploading:

- The image is re-encoded to WebP at the quality set by the **WebP quality**
  slider next to _Add photos_ (default 82, range 60–95).
- **Dimensions are never changed**, so the full-resolution shot is what ends up in
  the bucket.
- EXIF orientation is applied when the browser decodes the source, so the stored
  WebP is upright and does not depend on the viewer honouring EXIF.
- A file that is already WebP is uploaded untouched, to avoid losing another
  generation of quality, and animated formats (GIF/APNG) are passed through as-is
  because a canvas would keep only their first frame.
- If the browser cannot produce WebP, or the result would be larger than the
  original, the file is uploaded unchanged and a warning is shown.

Measured on real inputs: a 5712×4284 iPhone JPEG went from 3.0 MB to 782 KB (57%
smaller) at quality 82, and a 1600×1100 JPEG went from 934 KB to 496 KB.

Because the bucket copy is the compressed one, raise the slider or store the
originals elsewhere if you need the untouched files.

## How the layout works

Placement is free-form on a **12-column grid** with uniform row heights. Each cell
stores an explicit rect — `x`/`y` origin and `w`/`h` size, in grid units — so
nothing is auto-packed.

- **Move**: drag the cell body.
- **Resize**: drag the bottom-right corner handle.
- **Precision**: the cell list has arrow buttons that nudge by one grid unit, which
  also keeps placement usable from the keyboard.
- **Zoom** scales the canvas when a tall layout no longer fits; **Grid** toggles the
  column guides.

### Blank space, two ways

1. **Just leave a cell empty.** Because nothing is auto-packed, any cell no one
   occupies stays blank. Drag a photo to the right and the gap it left behind
   remains.
2. **Add blank space** inserts an explicit spacer cell you can drag and resize like
   a photo. Use it when you want a hole that survives later rearrangement.

Spacers are stored as rows with `kind = 'spacer'`; they carry no image and are
never clickable in the viewer.

### Mobile

The grid is desktop-only. Below the `sm` breakpoint a collection renders as a
single column in stored order, each photo sized by its own aspect ratio, and a
spacer becomes a short gap. A 12-column arrangement cannot survive on a phone
without making every photo too small to read.

### Legacy collections

Collections authored before free-form placement store a `size` preset
(`small | medium | large | wide | tall`) instead of coordinates. Those rows are
resolved into a stacked layout on read, so they keep working; opening one in the
Studio and saving converts it to explicit coordinates.

The grid geometry, fallback and drag maths live in
[`src/lib/gallery-grid.ts`](../src/lib/gallery-grid.ts).

## Security notes

- With `STUDIO_PASSWORD` unset, the Studio and its API are **disabled on any
  deployed environment** (they 404) and enabled only during local development.
  This is deliberate: the Studio can write to the bucket.
- The session cookie carries an HMAC derived from the password (or from
  `STUDIO_SESSION_SECRET` when set), never the password itself, so a copied or
  logged cookie does not disclose the credential. Rotating the signing key logs
  out existing sessions; setting `STUDIO_SESSION_SECRET` lets you rotate
  `STUDIO_PASSWORD` without ending them.
- Deleting a photo or collection also deletes its bucket objects. Object cleanup
  is best-effort; a failure there leaves an orphaned file rather than blocking the
  database change.
