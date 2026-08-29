---
name: react-presenters
description: Build, refactor, and review React code using @nbottarini/react-presenter to absorb UI logic into pure TypeScript presenters (Humble Object pattern). Use when Coding Agent should move validation, loading/error states, data loading and transformation, navigation decisions, and use-case orchestration out of React components and into presenters wired with usePresenter and lifecycle methods (init/start/update/stop/pause/resume). Keep only thin rendering and trivial visual interactions in components; do not force presenters for hyper-simple or purely visual ephemeral behavior (for example opening/closing a modal or popover with no relevant business logic to test).
---

# React Presenters

Implement presenter-first UI logic with `usePresenter`.

## Scope

Move logic to presenters by default.

Move:

- Form state, validation, and submit flows.
- Loading/error state transitions.
- Data formatting and UI-ready view-model mapping.
- Navigation/business decisions after use-case results.
- Calls to application services/use-cases and orchestration between them.

Keep in component when truly trivial:

- Purely visual, short-lived UI toggles with negligible value in unit tests.
- Interaction details tied only to a specific UI widget (for example local modal/popover open state).

If the logic can break business behavior, grows over time, or benefits from isolated tests, keep it in presenter.

## Follow This Contract

Use this hook shape:

```ts
usePresenter(presenterFactory, props, deps)
```

- `presenterFactory(onChange)`: create and return the presenter instance.
- `props`: values consumed by `init(props)` and later by `update(prev, next)`.
- `deps`: recreate presenter when any dependency changes (`Object.is` comparison).

Dependency rules:

- Do not include application services in `deps`; services are app-scoped and do not change during the presenter lifetime.
- Use `deps` only for values that should force a full presenter restart (`stop`, new instance, `init`, `start`).
- If a value changes because the route/screen/session is replaced and the view will unmount anyway, do not add it to `deps`.
- Prefer a restart through `deps` for major input changes that require reloading or rebuilding presenter state.

Implement presenters with either:

- `Presenter<TModel, TProps>` interface, or
- `PresenterBase<TModel, TProps>` when you need helpers.

## Lifecycle Semantics

Respect actual runtime order and triggers:

1. Create presenter from `presenterFactory`.
2. Call `init(props)` immediately after creation (if implemented).
3. Call `start()` after mount (effect).
4. Call `update(prev, next)` only when `props` change by shallow comparison.
5. Call `stop()` on unmount and before replacing presenter due to `deps` change.
6. If `@react-navigation/native` exists, call:
`resume()` on focus, `pause()` on blur.

Important behavior:
- Do not expect `update` on first render.
- Do not expect `init` on prop-only change.
- Expect new `init` + `start` when `deps` change (new presenter instance).

## Complete Example (View + Presenter)

Use this level of completeness as the default target.

```tsx
// ContactDetailPanel.tsx
import { FC } from 'react'
import { usePresenter } from '@nbottarini/react-presenter'

const useContactDetailPresenter = (contactId: string, organization: Organization) => {
  const { core, stores, navigation } = useAppContext()
  return usePresenter(
    (onChange) => new ContactDetailPresenter(onChange, core, stores, navigation),
    { contactId, organization },
    [contactId],
  )
}

export const ContactDetailPanel: FC<{ contactId: string, organization: Organization }> = ({ contactId, organization }) => {
  const presenter = useContactDetailPresenter(contactId, organization)

  if (presenter.model.isLoading) return <Loader />

  return (
    <section>
      {presenter.model.errors.general && <Alert color="danger">{presenter.model.errors.general}</Alert>}
      <Title>{presenter.model.organizationName}</Title>  
      <EditableTextField
        label="Nombre"
        value={presenter.model.name}
        error={presenter.model.errors.name}
        onValueChange={(value) => presenter.setName(value)}
      />

      <EditableTextField
        label="Email"
        value={presenter.model.email}
        error={presenter.model.errors.email}
        onValueChange={(value) => presenter.setEmail(value)}
      />

      <EditableTextField
        label="Descripción"
        value={presenter.model.description}
        onValueChange={(value) => presenter.setDescription(value)}
        isMultiline
      />

      <TagSelector
        selectedTagIds={presenter.model.tagIds}
        onAddTag={(tagId) => presenter.addTag(tagId)}
        onRemoveTag={(tagId) => presenter.removeTag(tagId)}
      />

      <Button isLoading={presenter.model.isLoading} onPress={() => presenter.save()}>
        Guardar
      </Button>
    </section>
  )
}
```

```ts
// ContactDetailPresenter.ts
import { ChangeFunc, PresenterBase } from '@nbottarini/react-presenter'
import { ErrorMap, Validator } from '@nbottarini/validator'

export class ContactDetailPresenter extends PresenterBase<ContactDetailVM, Props> {
  private contact: Contact | null = null

  constructor(
    onChange: ChangeFunc,
    private core: Core,
    private stores: StoreProvider,
    private navigation: Navigation,
  ) {
    super(onChange)
  }

  protected initModel(props: Props): ContactDetailVM {
    const vm = new ContactDetailVM()
    vm.organizationName = props.organization.name
    return vm
  }

  async start() {
    await this.loadContact()
  }

  setName(name: string) {
    this.updateModel({ name })
  }

  setEmail(email: string) {
    this.updateModel({ email })
  }

  setDescription(description: string) {
    this.updateModel({ description })
  }

  async addTag(tagId: string) {
    if (this.model.tagIds.includes(tagId)) return

    const tagNamesById = new Map(this.stores.tags.contactTags.value.map((t) => [t.id, t.name]))
    const updatedTagIds = [...this.model.tagIds, tagId].sort((a, b) =>
      (tagNamesById.get(a) ?? '').localeCompare(tagNamesById.get(b) ?? ''),
    )

    this.updateModel({ tagIds: updatedTagIds })
    await this.core.execute(new UpdateContactTags(this.contact!.id, updatedTagIds))
  }

  async removeTag(tagId: string) {
    const updatedTagIds = this.model.tagIds.filter((id) => id !== tagId)
    this.updateModel({ tagIds: updatedTagIds })
    await this.core.execute(new UpdateContactTags(this.contact!.id, updatedTagIds))
  }

  async save() {
    this.resetErrors()
    await this.withLoader(async () => {
      if (!this.validateModel()) return

      await this.core.execute(
        new UpdateContactData(this.contact!.id, {
          name: this.model.name,
          email: this.model.email,
          description: this.model.description,
        }),
      )
      this.navigation.navigate('/inbox')
    })
  }

  protected validations(validator: Validator) {
    validator.check('name', this.model.name).notNullOrBlank('Debe ingresar un nombre')
    validator.check('email', this.model.email).isEmail('Debe ingresar un email válido')
  }

  private async loadContact() {
    await this.withLoader(async () => {
      this.contact = await this.core.execute(new GetContactById(this.props.contactId))
      this.updateModel({
        id: this.contact.id,
        name: this.contact.name ?? '',
        email: this.contact.email ?? '',
        description: this.contact.description ?? '',
        tagIds: this.contact.tags.map((t) => t.id),
      })
    })
  }
}

export class ContactDetailVM {
  isLoading = true
  id = ''
  name = ''
  email = ''
  description = ''
  tagIds: string[] = []
  organizationName = ''
  errors: ErrorMap = {}
}

interface Props { 
  contactId: string
  organization: Organization
}
```

Rules:

- Keep presenter framework-agnostic (no React hooks in presenter).
- Keep `model` as a view model ready to render.
- View models should expose digested state: primitives, formatted strings, arrays, and nested view models.
- Use shared formatters for common formatting rules such as dates, file sizes, money, or other repeated display formats.
- Call `updateModel(...)` for every state change that must re-render.
- Avoid mutating `this.model` directly without `updateModel`.
- Read current props through `this.props` inside presenter methods.
- Keep component focused on UI composition and event wiring.
- Delegate business/view logic to presenter methods.
- Presenter methods should represent view actions such as `save()`, `setName(...)`, `selectItem(...)`, or `removeTag(...)`.
- Do not expose visual UX actions from presenters, such as `showModal(...)`, `showTooltip(...)`, `openPopover(...)`, or `hideDrawer(...)`.
- Presenters can expose state that makes a visual choice possible; React components decide how to render that state.
- Never pass the presenter instance as a prop to sub-components; pass explicit view model data and callbacks instead.
- Recreate presenter only when dependencies truly require it.
- If a presenter becomes too large or mixes several responsibilities, extract collaborators and compose them into the presenter.

## Loader Rules

- Use `withLoader(...)` from `PresenterBase` for the main loading state.
- Prefer the single model-level `isLoading` flow for normal screens and forms.
- Add extra loader states only when the UI is substantially composed or dynamic and has independent loading regions.

## Validation Rules

- Put form validation primarily in presenters.
- Use `PresenterBase` validation helpers when the presenter model includes `errors: ErrorMap`:
  - call `resetErrors()` before a submit attempt
  - call `validateModel()` before executing commands
  - implement `validations(validator: Validator)` for field checks
  - use `showError(...)` or `showGeneralError(...)` for mapped backend/domain failures
- Presenter validations commonly cover:
  - required fields
  - non-blank fields
  - string length
  - boolean and number type expectations
  - valid email format
  - currency or amount values greater than zero
- Do not perform ad hoc form validation outside the presenter validation system when the validation belongs to a form field.
- Do not validate database-dependent rules in presenters, such as uniqueness, existence, or tenant ownership.
- Do not call `trim()` in presenters.
- Send user-entered values to frontend use cases; backend use cases decide whether and how to normalize.
- When a concept has stronger reusable semantics, prefer a value object that is valid when constructed.

## Handle Prop Changes

Use prop changes sparingly. Most presenters should load initial data from props and then evolve through view models and presenter action methods.

Props are mainly for:

- values needed by `init(props)` for the first render
- values needed by `start()` for initial loading
- rare small changes that the presenter must react to without a full restart

Choose one of these approaches only when prop-change behavior is really needed:

- Implement `update(prev, next)` directly, or
- Use `PresenterBase` helpers:
`propChanged('key', handler)` and optional `onPropsChanged(prev)`.

Use these when behavior depends on specific prop transitions and the state change is minor. If the prop change means the presenter should reload or rebuild most of its state, put that prop in `deps` so the presenter restarts instead.

## Testing Strategy

Test presenters with unit tests (no DOM required):

- Validate `initModel` output.
- Validate view-model transformations (formatting, mapping, flags).
- Validate action methods and async flows.
- Validate lifecycle behavior (`start/update/stop`) where relevant.
