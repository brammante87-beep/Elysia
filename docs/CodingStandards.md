# Coding Standards

- Use vanilla JavaScript ES modules and object-oriented architecture.
- Give each module and class one clear responsibility; keep methods focused.
- Use one class per class file and meaningful names.
- Do not introduce unexplained magic numbers; gameplay constants belong in `Config`.
- Use stable internal IDs rather than UI text as identifiers.
- Avoid duplicated logic and global mutable variables.
- Avoid giant classes; delegate focused work to entities and systems.
- Comments explain **why**, not what the code already says.
- Preserve the public boundaries of `Game`, `Engine`, `World`, `Renderer`, `Input`,
  `UI`, and `Miracles` unless a milestone explicitly changes them.
