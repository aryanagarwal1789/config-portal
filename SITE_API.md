# Site API — Dashboard Integration Guide

Public-site data (hero content, landing sections, SEO, pages, blogs, products) is
owned by a single MongoDB document managed through the config portal. The dashboard
reads this data via the endpoints below. All write endpoints (`POST`/`PUT`/`DELETE`)
are also exposed so that the dashboard — or any other service — can update the same
data the portal edits.

- **Base URL (local):** `http://localhost:1337`
- **Namespace:** all paths live under `/site/*`
- **Content type:** `application/json` for every body except asset upload (multipart)
- **Authoritative source for seeded shapes:** [../salescode-marketplace/src/scripts/seedSite.ts](../salescode-marketplace/src/scripts/seedSite.ts)

---

## Conventions

### Write semantics
- **All `PUT`s replace the target in full.** There is no partial-patch. Fetch
  with `GET`, mutate the field you want, then `PUT` the complete object/array
  back.
- **List endpoints (sections, sidebar, client images) are also full-replace.**
  To add/remove one item, send the entire updated array.

### Body wrappers
Most write endpoints wrap the payload under a single key so the backend can
accept additional metadata in future without breaking the contract. The wrapper
for each endpoint is listed in its section below. Pattern summary:

| Endpoint family                  | Wrapper key |
|----------------------------------|-------------|
| `/site/content`                  | `content`   |
| `/site/sections`                 | `sections`  |
| `/site/seo/:pageKey`             | `seo`       |
| `/site/pages/:pageKey`           | `page`      |
| `/site/blogs/bg-image`           | `bgImage`   |
| `/site/blogs/reorder`            | `order`     |
| `/site/blogs`, `/site/blogs/:id` | *raw* (no wrapper) |
| `/site/products/:id`             | *raw* (no wrapper) |
| `/site/products/:id/sidebar`     | `sidebar`   |
| `/site/products/reorder`         | `order`     |

### Response shape
All endpoints return the updated resource so the client can re-render without a
follow-up `GET`. Errors use the standard HTTP status + `{ "message": "..." }` shape.

### ID semantics
- Resources with stable natural keys (`productId`, `pageKey`, `blogId`) are
  referenced by that key in the URL.
- Items inside lists (section items, sidebar entries, client images) carry a
  client-generated `id` and an `order` field. Preserve `id`s across edits;
  `order` is reassigned on every save to match array position.

---

## 1. Landing Content (hero block)

Single document containing the hero title, description, and image shown at the
top of the landing page. Controller:
[../salescode-marketplace/src/controller/siteContentController.ts](../salescode-marketplace/src/controller/siteContentController.ts).

### `GET /site/content`

```bash
curl -X GET http://localhost:1337/site/content
```

**Response**
```json
{
  "content": {
    "title": "AI for Sales, eB2B and NextGen SFA for CPG Sales",
    "description": "Sales Uplift Guaranteed with the Code of Future Ready Sales Teams and Trade — designed by sales experts, specifically for consumer-packaged-goods distribution and retail execution.",
    "image": "https://d3k6auglia2ji4.cloudfront.net/thumbnails/1776943889142_11zon_resized%20(26).png"
  }
}
```

### `PUT /site/content`

Body: `{ content: { title, description, image } }`

```bash
curl -X PUT http://localhost:1337/site/content \
  -H "Content-Type: application/json" \
  -d '{
    "content": {
      "title": "AI for Sales, eB2B and NextGen SFA for CPG Sales",
      "description": "Sales Uplift Guaranteed with the Code of Future Ready Sales Teams and Trade — designed by sales experts, specifically for consumer-packaged-goods distribution and retail execution.",
      "image": "https://d3k6auglia2ji4.cloudfront.net/thumbnails/1776943889142_11zon_resized%20(26).png"
    }
  }'
```

---

## 2. Landing Sections

A unified, ordered list of content blocks on the landing page. Every block
declares its own `kind` (`image | video | card | blog`) and `cardinality`
(`single | multiple`). Item shape varies by kind. Controller:
[../salescode-marketplace/src/controller/siteSectionsController.ts](../salescode-marketplace/src/controller/siteSectionsController.ts).

### Section shape

```ts
{
  id: string,                                      // stable, client-generated
  label: string,                                   // display label
  kind: 'image' | 'video' | 'card' | 'blog',
  cardinality: 'single' | 'multiple',
  order: number,                                   // zero-based index in array
  enabled: boolean,                                // when false, section is hidden from the public page (defaults to true)
  items: SectionItem[]                             // shape depends on `kind`
}
```

### Item shapes (all items carry `id` and `order`)

| Kind    | Fields                                                                                      |
|---------|---------------------------------------------------------------------------------------------|
| `image` | `url`, `alt`, `caption?`                                                                    |
| `video` | `url`, `title`, `description`, `thumbnail`                                                  |
| `card`  | `title`, `subtitle`, `description`, `image`, `points: [{ heading, description }]`           |
| `blog`  | `blogId` only — the blog catalog (`/site/blogs`) owns `title/description/image/link/video`  |

### `GET /site/sections`

```bash
curl -X GET http://localhost:1337/site/sections
```

### `GET /site/sections/available-blogs`

Returns enabled catalog blogs that are **not** already featured in any
blog-kind section — useful for the "pick a blog to feature" UI.

```bash
curl -X GET http://localhost:1337/site/sections/available-blogs
```

### `PUT /site/sections`

Body: `{ sections: Section[] }` — full replace. Example uses the complete
9-section seed.

```bash
curl -X PUT http://localhost:1337/site/sections \
  -H "Content-Type: application/json" \
  -d '{
    "sections": [
      {
        "id": "cpg-brands", "kind": "image", "label": "Top CPG Brands",
        "cardinality": "multiple", "order": 0,
        "items": [
          { "id": "cpg-1", "url": "https://d3k6auglia2ji4.cloudfront.net/thumbnails/1776943889142_11zon_resized%20(26).png", "alt": "Coca-Cola",  "caption": "", "order": 0 },
          { "id": "cpg-2", "url": "https://d3k6auglia2ji4.cloudfront.net/thumbnails/1776943889142_11zon_resized%20(26).png", "alt": "Nestlé",     "caption": "", "order": 1 },
          { "id": "cpg-3", "url": "https://d3k6auglia2ji4.cloudfront.net/thumbnails/1776943889142_11zon_resized%20(26).png", "alt": "PepsiCo",    "caption": "", "order": 2 },
          { "id": "cpg-4", "url": "https://d3k6auglia2ji4.cloudfront.net/thumbnails/1776943889142_11zon_resized%20(26).png", "alt": "Unilever",   "caption": "", "order": 3 }
        ]
      },
      {
        "id": "data-safe", "kind": "image", "label": "Your Data is Safe",
        "cardinality": "multiple", "order": 1,
        "items": [
          { "id": "ds-1", "url": "https://d3k6auglia2ji4.cloudfront.net/thumbnails/1776943889142_11zon_resized%20(26).png", "alt": "ISO 27001", "caption": "ISO 27001 certified", "order": 0 },
          { "id": "ds-2", "url": "https://d3k6auglia2ji4.cloudfront.net/thumbnails/1776943889142_11zon_resized%20(26).png", "alt": "SOC 2",     "caption": "SOC 2 Type II",       "order": 1 },
          { "id": "ds-3", "url": "https://d3k6auglia2ji4.cloudfront.net/thumbnails/1776943889142_11zon_resized%20(26).png", "alt": "GDPR",      "caption": "GDPR compliant",      "order": 2 }
        ]
      },
      {
        "id": "cpg-leaders", "kind": "video", "label": "CPG Leaders",
        "cardinality": "multiple", "order": 2,
        "items": [
          { "id": "leader-1", "url": "https://d3k6auglia2ji4.cloudfront.net/thumbnails/1776943854781_Screen%20Recording%202026-04-22%20at%2012.20.29%C3%A2%C2%80%C2%AFPM.mov", "title": "Interview with a CPG Leader", "description": "Insights from a leading CPG executive on AI-driven sales.", "thumbnail": "https://d3k6auglia2ji4.cloudfront.net/thumbnails/1776943889142_11zon_resized%20(26).png", "order": 0 },
          { "id": "leader-2", "url": "https://d3k6auglia2ji4.cloudfront.net/thumbnails/1776943854781_Screen%20Recording%202026-04-22%20at%2012.20.29%C3%A2%C2%80%C2%AFPM.mov", "title": "What CPG leaders look for", "description": "Building future-ready sales teams.",                       "thumbnail": "https://d3k6auglia2ji4.cloudfront.net/thumbnails/1776943889142_11zon_resized%20(26).png", "order": 1 }
        ]
      },
      {
        "id": "future-ready", "kind": "card", "label": "Future Ready Solutions",
        "cardinality": "multiple", "order": 3,
        "items": [
          {
            "id": "fr-1", "title": "AI-native execution", "subtitle": "Built for CPG sales",
            "description": "Every workflow is AI-first — from planning to in-store execution.",
            "image": "https://d3k6auglia2ji4.cloudfront.net/thumbnails/1776943889142_11zon_resized%20(26).png",
            "points": [
              { "heading": "Real-time signals",      "description": "Act on what is happening now, not last week." },
              { "heading": "Predictive assortments", "description": "Right SKU, right store, right time." }
            ],
            "order": 0
          },
          {
            "id": "fr-2", "title": "Scales with you", "subtitle": "From single brand to global",
            "description": "Designed for 100 stores or 100,000.",
            "image": "https://d3k6auglia2ji4.cloudfront.net/thumbnails/1776943889142_11zon_resized%20(26).png",
            "points": [],
            "order": 1
          }
        ]
      },
      {
        "id": "featured-blogs", "kind": "blog", "label": "Featured Blogs",
        "cardinality": "multiple", "order": 4,
        "items": [
          { "id": "blog-1", "blogId": "blog-1", "order": 0 },
          { "id": "blog-2", "blogId": "blog-2", "order": 1 },
          { "id": "blog-3", "blogId": "blog-3", "order": 2 }
        ]
      },
      {
        "id": "integrations", "kind": "image", "label": "Integrations",
        "cardinality": "single", "order": 5,
        "items": [
          { "id": "integrations-diagram", "url": "https://d3k6auglia2ji4.cloudfront.net/thumbnails/1776943889142_11zon_resized%20(26).png", "alt": "Integrations", "caption": "Integration ecosystem diagram", "order": 0 }
        ]
      },
      {
        "id": "plug-in", "kind": "video", "label": "Plug-In",
        "cardinality": "single", "order": 6,
        "items": [
          { "id": "plug-in-video", "url": "https://d3k6auglia2ji4.cloudfront.net/thumbnails/1776943854781_Screen%20Recording%202026-04-22%20at%2012.20.29%C3%A2%C2%80%C2%AFPM.mov", "title": "Plug-In overview", "description": "How SalesCode plugs into your existing stack.", "thumbnail": "https://d3k6auglia2ji4.cloudfront.net/thumbnails/1776943889142_11zon_resized%20(26).png", "order": 0 }
        ]
      },
      {
        "id": "cpg-leadership", "kind": "video", "label": "CPG Leadership",
        "cardinality": "single", "order": 7,
        "items": [
          { "id": "leadership-video", "url": "https://d3k6auglia2ji4.cloudfront.net/thumbnails/1776943854781_Screen%20Recording%202026-04-22%20at%2012.20.29%C3%A2%C2%80%C2%AFPM.mov", "title": "CPG Leadership", "description": "Leadership perspectives from top CPG brands.", "thumbnail": "https://d3k6auglia2ji4.cloudfront.net/thumbnails/1776943889142_11zon_resized%20(26).png", "order": 0 }
        ]
      },
      {
        "id": "salescode-experience", "kind": "video", "label": "SalesCode Experience Center",
        "cardinality": "single", "order": 8,
        "items": [
          { "id": "experience-video", "url": "https://d3k6auglia2ji4.cloudfront.net/thumbnails/1776943854781_Screen%20Recording%202026-04-22%20at%2012.20.29%C3%A2%C2%80%C2%AFPM.mov", "title": "SalesCode Experience Center", "description": "Tour of the SalesCode Experience Center.", "thumbnail": "https://d3k6auglia2ji4.cloudfront.net/thumbnails/1776943889142_11zon_resized%20(26).png", "order": 0 }
        ]
      }
    ]
  }'
```

---

## 3. SEO (per page)

One SEO record per page. Valid `:pageKey` values: `landing`, `blog`, `contact-us`,
`client`, `about-us`. Controller:
[../salescode-marketplace/src/controller/siteSeoController.ts](../salescode-marketplace/src/controller/siteSeoController.ts).

### SEO shape

```ts
{
  metaTitle: string,
  metaDescription: string,
  keywords: string[],
  ogTitle: string,
  ogDescription: string,
  ogImage: string,
  twitterTitle: string,
  twitterDescription: string,
  twitterImage: string,
  canonicalUrl: string,
  focusKeyphrase: string,
  robots: string                                   // e.g. "index, follow"
}
```

### `GET /site/seo`

Returns all SEO records keyed by `pageKey`.

```bash
curl -X GET http://localhost:1337/site/seo
```

### `GET /site/seo/:pageKey`

```bash
curl -X GET http://localhost:1337/site/seo/landing
```

### `PUT /site/seo/:pageKey`

Body: `{ seo: { ... } }`

```bash
curl -X PUT http://localhost:1337/site/seo/landing \
  -H "Content-Type: application/json" \
  -d '{
    "seo": {
      "metaTitle": "SalesCode – AI for Sales, eB2B and NextGen SFA for CPG Sales",
      "metaDescription": "Sales Uplift Guaranteed with the Code of Future Ready Sales Teams and Trade — built for CPG distribution.",
      "keywords": ["sales", "ai", "cpg", "sfa", "eb2b"],
      "ogTitle": "SalesCode – AI for CPG Sales",
      "ogDescription": "Next-gen SFA and eB2B for consumer goods teams.",
      "ogImage": "https://d3k6auglia2ji4.cloudfront.net/thumbnails/1776943889142_11zon_resized%20(26).png",
      "twitterTitle": "SalesCode – AI for CPG Sales",
      "twitterDescription": "Next-gen SFA and eB2B for consumer goods teams.",
      "twitterImage": "https://d3k6auglia2ji4.cloudfront.net/thumbnails/1776943889142_11zon_resized%20(26).png",
      "canonicalUrl": "https://salescode.ai/",
      "focusKeyphrase": "AI for CPG sales",
      "robots": "index, follow"
    }
  }'
```

---

## 4. Pages

Per-page content for `about-us`, `contact-us`, `client`. The `blog` page is
handled via the blogs endpoints below; `landing` is handled via content +
sections. Controller:
[../salescode-marketplace/src/controller/sitePagesController.ts](../salescode-marketplace/src/controller/sitePagesController.ts).

### Page shapes

**`contact-us`**
```ts
{ title: string, description: string, image: string }
```

**`client`**
```ts
{
  title: string,
  description: string,
  bannerImage: string,
  images: [{ id, url, alt, caption, order }]
}
```

**`about-us`**
```ts
{ title: string, description: string, bannerImage: string, video: string }
```

### `GET /site/pages`

```bash
curl -X GET http://localhost:1337/site/pages
```

### `GET /site/pages/:pageKey`

```bash
curl -X GET http://localhost:1337/site/pages/about-us
```

### `PUT /site/pages/:pageKey`

Body: `{ page: { ... } }` — shape varies per page key.

```bash
# contact-us
curl -X PUT http://localhost:1337/site/pages/contact-us \
  -H "Content-Type: application/json" \
  -d '{
    "page": {
      "title": "Get in touch",
      "description": "Book a demo or talk to our team. We typically respond within one business day.",
      "image": "https://d3k6auglia2ji4.cloudfront.net/thumbnails/1776943889142_11zon_resized%20(26).png"
    }
  }'
```

```bash
# client
curl -X PUT http://localhost:1337/site/pages/client \
  -H "Content-Type: application/json" \
  -d '{
    "page": {
      "title": "Trusted by CPG leaders",
      "description": "The brands and distributors that run their sales on SalesCode.",
      "bannerImage": "https://d3k6auglia2ji4.cloudfront.net/thumbnails/1776943889142_11zon_resized%20(26).png",
      "images": [
        { "id": "client-1", "url": "https://d3k6auglia2ji4.cloudfront.net/thumbnails/1776943889142_11zon_resized%20(26).png", "alt": "Client One",   "caption": "", "order": 0 },
        { "id": "client-2", "url": "https://d3k6auglia2ji4.cloudfront.net/thumbnails/1776943889142_11zon_resized%20(26).png", "alt": "Client Two",   "caption": "", "order": 1 },
        { "id": "client-3", "url": "https://d3k6auglia2ji4.cloudfront.net/thumbnails/1776943889142_11zon_resized%20(26).png", "alt": "Client Three", "caption": "", "order": 2 },
        { "id": "client-4", "url": "https://d3k6auglia2ji4.cloudfront.net/thumbnails/1776943889142_11zon_resized%20(26).png", "alt": "Client Four",  "caption": "", "order": 3 },
        { "id": "client-5", "url": "https://d3k6auglia2ji4.cloudfront.net/thumbnails/1776943889142_11zon_resized%20(26).png", "alt": "Client Five",  "caption": "", "order": 4 }
      ]
    }
  }'
```

```bash
# about-us
curl -X PUT http://localhost:1337/site/pages/about-us \
  -H "Content-Type: application/json" \
  -d '{
    "page": {
      "title": "About SalesCode",
      "description": "Built by sales experts, for sales teams. Our mission is to guarantee sales uplift for CPG through AI-powered execution.",
      "bannerImage": "https://d3k6auglia2ji4.cloudfront.net/thumbnails/1776943889142_11zon_resized%20(26).png",
      "video": "https://d3k6auglia2ji4.cloudfront.net/thumbnails/1776943854781_Screen%20Recording%202026-04-22%20at%2012.20.29%C3%A2%C2%80%C2%AFPM.mov"
    }
  }'
```

---

## 5. Blogs

Authoritative blog catalog + the background image shown above the public blog
page. Controller:
[../salescode-marketplace/src/controller/siteBlogsController.ts](../salescode-marketplace/src/controller/siteBlogsController.ts).

### Blog shape

```ts
{
  id: string,                    // server-assigned on POST
  image: string,
  video: string,
  link: string,                  // e.g. "/blog/ai-reshaping-cpg"
  title: string,
  description: string,
  type: BlogCategory | '',       // '' = uncategorized; drives the public filter tabs
  order: number,                 // index within the catalog
  enabled: boolean               // when false, item is hidden from sections picker
}

type BlogCategory =
  | 'ai-powered-eb2b'
  | 'ai-sales-agent'
  | 'experience-center'
  | 'expert-stories'
  | 'nextgen-sfa'
  | 'product-launch';
```

`type` is optional on create/update — omit it or send `''` to leave the blog
uncategorized. An invalid value returns `400`.

### 5a. Catalog CRUD

#### `GET /site/blogs`

```bash
curl -X GET http://localhost:1337/site/blogs
```

#### `GET /site/blogs/:blogId`

```bash
curl -X GET http://localhost:1337/site/blogs/blog-1
```

#### `POST /site/blogs`

Raw fields (no wrapper). Server assigns `id` and `order`.

```bash
curl -X POST http://localhost:1337/site/blogs \
  -H "Content-Type: application/json" \
  -d '{
    "image": "https://d3k6auglia2ji4.cloudfront.net/thumbnails/1776943889142_11zon_resized%20(26).png",
    "video": "https://d3k6auglia2ji4.cloudfront.net/thumbnails/1776943854781_Screen%20Recording%202026-04-22%20at%2012.20.29%C3%A2%C2%80%C2%AFPM.mov",
    "link": "/blog/field-ops-kpis",
    "title": "Field ops KPIs that actually drive uplift",
    "description": "Move beyond vanity metrics — the handful of KPIs that predict distribution success.",
    "type": "expert-stories",
    "enabled": true
  }'
```

#### `PUT /site/blogs/:blogId`

Raw partial fields.

```bash
curl -X PUT http://localhost:1337/site/blogs/blog-1 \
  -H "Content-Type: application/json" \
  -d '{
    "image": "https://d3k6auglia2ji4.cloudfront.net/thumbnails/1776943889142_11zon_resized%20(26).png",
    "video": "https://d3k6auglia2ji4.cloudfront.net/thumbnails/1776943854781_Screen%20Recording%202026-04-22%20at%2012.20.29%C3%A2%C2%80%C2%AFPM.mov",
    "link": "/blog/ai-reshaping-cpg",
    "title": "How AI is reshaping CPG sales",
    "description": "Five ways AI-driven sales execution is changing the game for consumer goods teams.",
    "enabled": true
  }'
```

#### `PUT /site/blogs/reorder`

Body: `{ order: blogId[] }` — full list in desired order.

```bash
curl -X PUT http://localhost:1337/site/blogs/reorder \
  -H "Content-Type: application/json" \
  -d '{ "order": ["blog-1", "blog-2", "blog-3", "blog-4"] }'
```

#### `DELETE /site/blogs/:blogId`

Blog will also be removed from any blog-kind sections that reference it.

```bash
curl -X DELETE http://localhost:1337/site/blogs/blog-4
```

### 5b. Blog page background image

#### `GET /site/blogs/bg-image`

```bash
curl -X GET http://localhost:1337/site/blogs/bg-image
```

#### `PUT /site/blogs/bg-image`

Body: `{ bgImage: string }`

```bash
curl -X PUT http://localhost:1337/site/blogs/bg-image \
  -H "Content-Type: application/json" \
  -d '{
    "bgImage": "https://d3k6auglia2ji4.cloudfront.net/thumbnails/1776943889142_11zon_resized%20(26).png"
  }'
```

---

## 6. Products

Product catalog + per-product sidebar. Seeded on first run — the UI can update
and reorder but does not expose create/delete. `category` is one of
`applications | ai-agents | plugins | integrations`. Controller:
[../salescode-marketplace/src/controller/siteProductsController.ts](../salescode-marketplace/src/controller/siteProductsController.ts).

### Product shape

```ts
{
  productId: string,             // stable natural key, used in URLs
  name: string,
  title: string,
  subtitle: string,
  description: string,
  image: string,
  highlight: string,             // e.g. "5-18% Sales Uplift" — optional ribbon text
  category: 'applications' | 'ai-agents' | 'plugins' | 'integrations',
  order: number,
  enabled: boolean,
  sidebar: SidebarItem[]         // see shape below — stored on product, edited via its own endpoint
}
```

### Sidebar item shape

```ts
{ id: string, label: string, route: string, icon: string, order: number, enabled: boolean }
```

### 6a. Catalog

#### `GET /site/products`

```bash
curl -X GET http://localhost:1337/site/products
```

#### `GET /site/products/:productId`

```bash
curl -X GET http://localhost:1337/site/products/sfa
```

#### `PUT /site/products/:productId`

Raw partial fields (no wrapper). `productId` itself cannot be changed via this
endpoint.

```bash
curl -X PUT http://localhost:1337/site/products/sfa \
  -H "Content-Type: application/json" \
  -d '{
    "name": "NextGen SFA",
    "title": "Sales Force Automation",
    "subtitle": "AI-powered field sales automation",
    "description": "AI-powered field sales automation",
    "image": "https://d3k6auglia2ji4.cloudfront.net/thumbnails/1776943889142_11zon_resized%20(26).png",
    "highlight": "5-18% Sales Uplift",
    "category": "applications",
    "enabled": true
  }'
```

#### `PUT /site/products/reorder`

Body: `{ order: productId[] }` — full list in desired order.

```bash
curl -X PUT http://localhost:1337/site/products/reorder \
  -H "Content-Type: application/json" \
  -d '{
    "order": [
      "sfa", "retail-execution", "analytics", "ebtb",
      "scai-sales-agent", "scai-coach", "ai-promo-copilot", "ai-vision-ir",
      "promo-engine", "new-outlets", "travel-expense", "sales-incentive", "ai-target-engine", "ai-task-engine",
      "upi-payments", "whatsapp", "digital-wallet", "marketing-automation"
    ]
  }'
```

### 6b. Per-product sidebar

#### `GET /site/products/:productId/sidebar`

```bash
curl -X GET http://localhost:1337/site/products/sfa/sidebar
```

#### `PUT /site/products/:productId/sidebar`

Body: `{ sidebar: SidebarItem[] }` — full replace.

```bash
curl -X PUT http://localhost:1337/site/products/sfa/sidebar \
  -H "Content-Type: application/json" \
  -d '{
    "sidebar": [
      { "id": "sfa-overview",     "label": "Overview",     "route": "/products/sfa/overview",     "icon": "", "order": 0, "enabled": true },
      { "id": "sfa-features",     "label": "Features",     "route": "/products/sfa/features",     "icon": "", "order": 1, "enabled": true },
      { "id": "sfa-integrations", "label": "Integrations", "route": "/products/sfa/integrations", "icon": "", "order": 2, "enabled": true },
      { "id": "sfa-pricing",      "label": "Pricing",      "route": "/products/sfa/pricing",      "icon": "", "order": 3, "enabled": true }
    ]
  }'
```

---

## 7. Asset Upload

Uploads an image or video and returns a CDN URL that can be dropped into any
of the payloads above (e.g. into `content.image`, a card's `image`, a blog's
`video`). Controller:
[../salescode-marketplace/src/controller/siteUploadController.ts](../salescode-marketplace/src/controller/siteUploadController.ts).

### `POST /site/upload`

Multipart form — field name must be `file`.

```bash
curl -X POST http://localhost:1337/site/upload \
  -F "file=@/absolute/path/to/local/image.png"
```

**Response**
```json
{ "url": "https://d3k6auglia2ji4.cloudfront.net/thumbnails/<generated>.png" }
```

---

## Endpoint Index

| Method   | Path                                     | Wrapper       | Purpose                              |
|----------|------------------------------------------|---------------|--------------------------------------|
| `GET`    | `/site/content`                          | —             | Hero content                         |
| `PUT`    | `/site/content`                          | `content`     | Replace hero content                 |
| `GET`    | `/site/sections`                         | —             | Landing sections                     |
| `GET`    | `/site/sections/available-blogs`         | —             | Blogs not yet featured               |
| `PUT`    | `/site/sections`                         | `sections`    | Replace all sections                 |
| `GET`    | `/site/seo`                              | —             | All SEO records                      |
| `GET`    | `/site/seo/:pageKey`                     | —             | One page's SEO                       |
| `PUT`    | `/site/seo/:pageKey`                     | `seo`         | Replace one page's SEO               |
| `GET`    | `/site/pages`                            | —             | All page contents                    |
| `GET`    | `/site/pages/:pageKey`                   | —             | One page's content                   |
| `PUT`    | `/site/pages/:pageKey`                   | `page`        | Replace one page's content           |
| `GET`    | `/site/blogs`                            | —             | Blog catalog                         |
| `GET`    | `/site/blogs/:blogId`                    | —             | One blog                             |
| `POST`   | `/site/blogs`                            | *raw*         | Create a blog                        |
| `PUT`    | `/site/blogs/:blogId`                    | *raw*         | Update a blog                        |
| `DELETE` | `/site/blogs/:blogId`                    | —             | Delete a blog                        |
| `PUT`    | `/site/blogs/reorder`                    | `order`       | Reorder blog catalog                 |
| `GET`    | `/site/blogs/bg-image`                   | —             | Blog page bg image                   |
| `PUT`    | `/site/blogs/bg-image`                   | `bgImage`     | Replace blog page bg image           |
| `GET`    | `/site/products`                         | —             | Product catalog                      |
| `GET`    | `/site/products/:productId`              | —             | One product                          |
| `PUT`    | `/site/products/:productId`              | *raw*         | Update one product                   |
| `PUT`    | `/site/products/reorder`                 | `order`       | Reorder product catalog              |
| `GET`    | `/site/products/:productId/sidebar`      | —             | Product sidebar                      |
| `PUT`    | `/site/products/:productId/sidebar`      | `sidebar`     | Replace product sidebar              |
| `POST`   | `/site/upload`                           | multipart     | Upload asset, returns CDN URL        |
