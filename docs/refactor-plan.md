# Refactor plan — the React layer

Why this exists: `react-sdk` grew a file per React mechanism instead of a file
per concept, and became the part of the repo nobody can hold in their head. This
plan replaces it with an MVP layering (view / presenter / port) and records the
decisions behind it, so they stop living in a chat log.

Read [architecture.md](architecture.md) for what `core-editor` already is. This
document only covers the layers above it.

## What each workspace is

`react-sdk` is a **library**, not an application. It does not own a page, does
not boot, and has no composition root — the host has one. Concretely: no
`WebApp` class, no `createRoot`, no context that must exist for the package to
work. It exports components; the host composes.

The application shape (composition root, injected services, use cases with
collaborators) is the right one for `promptier-app`, the future iframe product
that talks to a server — a separate workspace when it exists. Its use cases are
real and obvious there (`LoadPrompt`, `SavePrompt`, `ListPrompts`,
`LoadResources`), and all of them speak strings, so none of them needs an editor
interface. `react-sdk` has no use cases of its own today: the domain logic lives
in `core-editor` and the SDK binds UI to it. An empty `core/app/usecases/` would
be scaffolding for an application this package is not.

## The shape

```
react-sdk/src/
├─ core/
│  ├─ app/PromptEditor.ts                        the port
│  └─ infrastructure/CustomElementPromptEditor.ts the adapter over <prompt-editor>
├─ ui/
│  ├─ PromptEditorPresenter.ts
│  ├─ PromptEditorView.tsx                        exported as PromptEditor
│  ├─ toolbar/
│  └─ outline/
└─ index.ts
```

**The port is `PromptEditor`** — `getPrompt` / `setPrompt` / `getContent` /
`run` / `selectionState` / `onPromptChanged` / `onSelectionChanged`. Not a
mirror of `core-editor`'s port of the same name (which speaks `PromptContent`
and is never exported): this one speaks **string**, because the string is the
SDK's contract. Same name in two packages is fine — they never meet in one file.

It earns its place because it will have a second implementation. When the editor
moves into an iframe, `PostMessagePromptEditor` implements the same port and the
presenter, the toolbar and the outline do not change a line.

**The adapter owns every piece of DOM plumbing**: `registerPromptEditor()`,
waiting for the custom element upgrade, `addEventListener` and the `CustomEvent`
casts, and buffering anything asked of it before the node exists (cheap, because
`PromptEditorElement` already replays `value` on upgrade). It carries one method
that is deliberately **not** on the port — `mountOn(node)`, for the view's ref
callback — because mounting is this implementation's business, and the port must
stay free of view semantics.

**The presenter speaks editor, never DOM.** No `attach`, no `bind`, no `ready`.
`ready` is gone entirely: the upgrade race lives in the adapter, and "no editor
yet" is reported as a `null` selection state rather than a flag or a synthesised
neutral value. The UI reaches a command through an optional chain either way —
it needs one anyway for a command that doesn't apply to the current selection —
so nothing branches on readiness.

**The view is named `PromptEditorView`** to pair with the presenter, and
`index.ts` publishes it as `PromptEditor`. Hosts should not have to know MVP to
mount an editor.

## The host contract

```tsx
<PromptEditor value={text} onChange={setText} />
```

`value` is a **seed with reconciliation**, not a controlled binding. The
presenter records the last string it reported (`lastReportedPrompt`) and skips
re-seeding when the incoming value is that same string. Without it the obvious
host — `useState` plus `onChange={setText}` — would feed every keystroke back
in, re-parsing the document, discarding undo history and jumping the caret. The
editor is only re-seeded when the host sets a genuinely different string:
loading another prompt, a reset, a push from a server.

`onChange` carries the **string**, reversing the earlier accessor-based design.
The reason that design existed applies to *writing* (parse + setContent per
keystroke is expensive and fights the caret), not to reading — `serialize` is a
pure fold. Structure stays available for hosts that want it, but the default is
the contract the SDK exists to provide.

Typing must not re-render React. The document lives in ProseMirror, the text
leaves through a callback, and the ViewModel holds only what the UI paints
(selection and command state). Corollary: **the editor's ViewModel holds nothing
that changes per keystroke.** The outline does change per keystroke, so it
belongs to the outline panel's own presenter, where the re-render stays.

## Phases

**Phase 1 — complete the element's contract** (`core-editor`) — *done*
- `getSelectionState()` on the element, neutral before mount.
- `availableCommands(): CommandId[]`; `commandRegistry` now collects from block
  descriptors as well as marks.
- `outline(content)` in `app/outline/`, exported from `index.ts` as a pure
  function beside `serialize`/`parse`. The element does not know about it.

**Phase 2 — the presenter** (`react-sdk`) — *done*
- Port, adapter, presenter, view as laid out above. `usePromptEditor` returns
  the **editor**, not the presenter: the editor's presenter is private, and
  surrounding UI composes over the port with a presenter of its own.
- `usePresenter` from `@nbottarini/react-presenter`. Its lifecycle, confirmed
  against the published build: `init`/`initModel` run during render, so the
  editor is unmounted there and the selection state is `null`. `start`/`stop`
  run in an effect, after refs are attached, so the adapter already holds the
  node.
- Deleted: `element/*` (five hooks), `headless/usePromptEditor`,
  `field/PromptEditorField`, `field/PromptEditorSurface`. Registration moved
  into the adapter, where receiving a DOM node already implies a browser.
- Found on the way: the element emits `change` only for user edits, so a
  host-driven write left sibling panels stale. The adapter now notifies its own
  subscribers on write, and `reportPrompt` is guarded by the same field as
  `setPrompt` so the round trip cannot echo.

**Phase 3 — UI on top of the presenter**
- Toolbar and command menu rendered from `availableCommands()` and the
  selection state, with no hardcoded button list.
- Outline panel with its own presenter, folding `outline(editor.getContent())`.

**Phase 4 — playground and docs**
- The playground becomes a plain consumer plus an explicitly separated
  `DevTools` panel — the only place allowed to import `core-editor`.
- `AGENTS.md` and `architecture.md` updated for the presenter layer; the stale
  SSR gap removed once `PromptEditorSurface` is gone.

## Open

- **Should `PromptEditorElement` emit `change` when a host writes `value` or
  `content`?** Today it does not, and `react-sdk` compensates in its adapter. If
  the answer is yes, the element's event means "the document changed" rather
  than "the user typed", every wrapper stops compensating, and the SDK's
  reconciliation guard is what keeps it from echoing. Not decided.
- `promptier-app` is a direction, not a commitment. Nothing in phases 1–4
  depends on it existing.
