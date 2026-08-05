# Elysia Development Rules

## Architecture

- Use object-oriented programming only.
- Every major system must be a class.
- One class per file.
- Never replace classes with factory functions.
- Never replace classes with closures.
- Never redesign the architecture.
- Never introduce functional architecture.
- Never change public APIs unless explicitly requested.

## Core Classes

The following classes must always exist:

- Game
- Engine
- World
- Renderer
- Input
- UI
- Miracles

## Responsibilities

Game coordinates the project.

Engine only executes the game loop.

World owns all gameplay logic.

Renderer only draws.

Input only handles mouse, keyboard and touch.

UI only manages interface.

Miracles only creates miracles.

## Coding Style

Keep files small.

Keep methods focused.

Never duplicate code.

Always explain every modification.

Never modify unrelated files.

Always preserve existing architecture.
