# Frontend Theme Rules

Use the semantic `--ui-*` tokens for new page and content components.

## Default Page Tokens

- `--ui-bg`: page background
- `--ui-bg-alt`: subtle alternate background
- `--ui-surface`: content surface
- `--ui-text`: primary readable text
- `--ui-muted`: secondary readable text
- `--ui-dim`: metadata and low-emphasis text
- `--ui-border`: normal border
- `--ui-border-soft`: subtle divider
- `--ui-link`: text links and editorial accents
- `--ui-link-hover`: hover color
- `--ui-warm-soft`: warm active state background
- `--ui-olive`: tag text
- `--ui-olive-soft`: tag background
- `--ui-image-bg`: media placeholder background

## Rule

For page content, do not use `--shell-*` tokens. Those are reserved for dark chrome areas such as the header, footer, mobile navigation, modals, and overlays.

This prevents light-mode contrast bugs where cream shell text appears on a cream page background.

Use fixed `rem` values with media query overrides for spacing, sizing, and typography. Do not use `clamp()` for new UI work in this project.
