# React SDK growth plan

The UI foundation keeps editor semantics in `core-editor`, React UI in
`react-sdk`, and persistence/page composition in the host.

## Foundation in place

- `core-editor` publishes discriminated commands and command-aware runtime state.
- The Custom Element is the only browser boundary and emits `change` and
  `statechange` without exposing ProseMirror.
- Outline entries carry structural paths, and navigation is a core command.
- `react-sdk` keeps one concrete Custom Element service private and exposes the
  string-first `<PromptEditor value onChange />` component.
- One presenter is the reactive owner of editor-facing UI state. It reconciles
  `value` / `onChange`, reads core command/state contracts, builds
  `CommandItemVM` and outline items, and exposes actions to prop-driven widgets.
- The root `PromptEditor` component owns only transient composition state such
  as whether the outline is visible. The Custom Element surface is inline
  because it has no independent behavior.
- Header, toolbar and outline widgets are pure UI. They receive view models and
  callbacks and know nothing about the service, core commands or ProseMirror.
- `playground` behaves like a host and does not create editor UI.

## Next vertical slices

1. Add implemented insert-block commands to the core union and registry, then
   map them to view models in the presenter and controls in SDK widgets.
2. Expose history as commands so toolbar state follows undo/redo availability.
3. Add browser utilities such as copy in the SDK; keep them outside the core
   command catalogue when they do not depend on editor-engine state.
4. Accept an injected token counter because tokenization depends on the target
   model and encoding, then render its result in SDK UI.
5. Promote internal SDK primitives or slots to public API only when a concrete
   host customization requires them.

Each slice should preserve the plain `<PromptEditor value onChange />` host
contract and add command/state tests before extending the visible controls.
