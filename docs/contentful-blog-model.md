# Contentful Blog Model

Create a content type with API identifier `blogPost`.

## Fields

| Field name | Field ID | Type | Required | Notes |
| --- | --- | --- | --- | --- |
| Title | `title` | Short text | Yes | Article headline. Localize this field. |
| Slug | `slug` | Short text | Yes | URL slug, for example `how-to-sleep-better`. Keep unique per locale. |
| Excerpt | `excerpt` | Long text | Yes | Short teaser shown on the Blogs page. Localize this field. |
| Body | `body` | Long text | Yes | Full article text. Separate paragraphs with a blank line. Localize this field. |
| Tags | `tags` | Short text list | Yes | Use only English keys: `nutrition`, `health`, `training`. |
| Author | `author` | Short text | No | Defaults to `Bewegesund` if empty. |
| Read time minutes | `readTimeMinutes` | Integer | No | Defaults to 4 if empty. |
| Published at | `publishedAt` | Date and time | Yes | Used for sorting newest first. |
| Featured image | `featuredImage` | Media | No | Image shown in the index and article page. Defaults to a local image if empty. |

## Tags

Use these exact values in the `tags` list:

- `nutrition`
- `health`
- `training`

The UI filters posts from these tag values. Labels can be translated later, but the stored Contentful values should stay in English.

## Example Entry

Title:
`Wie du besser schläfst`

Slug:
`wie-du-besser-schlaefst`

Excerpt:
`Ein sportwissenschaftlicher Leitfaden für bessere Erholung, stabilere Energie und gesündere Trainingsanpassung.`

Tags:
`health`, `training`

Author:
`Bewegesund`

Read time minutes:
`6`

Published at:
`2026-06-02`

Body:

```text
Guter Schlaf ist keine Nebensache, sondern ein aktiver Teil von Gesundheit, Regeneration und Leistungsfähigkeit.

Für Training bedeutet Schlaf vor allem Reparatur, hormonelle Balance, Konzentration und die Fähigkeit, Belastung sinnvoll zu verarbeiten.

Praktisch helfen feste Schlafzeiten, reduziertes Licht am Abend, ein ruhiger Schlafraum, ein klares Abendritual und weniger intensive Reize kurz vor dem Schlafengehen.
```

## Environment

The app reads the content type from `CONTENTFUL_BLOG_CONTENT_TYPE`. If that variable is missing, it uses `blogPost`.
