# Releasing

`@cachai/promptier-core-editor` and `@cachai/promptier-react-sdk` are published
to npm together, from the **Release** workflow
([release.yml](../.github/workflows/release.yml)), which runs on every push to the
`deployment` branch. Nobody publishes from a laptop.

## Versions

- Both packages always carry the same version number.
- While the version is `0.x`, a breaking change bumps the minor and anything else
  bumps the patch.
- A change to how `parse` or `serialize` read prompts that are already stored is
  breaking, however small the diff looks. See [format.md](format.md).

## One-time setup

The workflow authenticates to npm with a short-lived token from GitHub (npm
*trusted publishing*), so there is no npm token to store or renew.

1. On npmjs.com, for **each** package: *Settings → Trusted Publisher → GitHub
   Actions*, with owner `JuanPaLA`, repository `promptier`, workflow
   `release.yml` and environment `npm-release`. All four must match exactly;
   if the repository moves or the workflow file is renamed, update them.
2. On GitHub: *Settings → Environments → New environment* named `npm-release`,
   with a required reviewer. Every release waits for that approval. Under
   *Deployment branches*, restrict it to `deployment`.
3. On GitHub: create the `deployment` branch from `main`, and protect it
   (*Settings → Branches*): no force-pushes, no deletion, and only fast-forward
   updates from `main`.
4. Optional, after the first successful release: in each package's npm settings,
   set *Publishing access* to require two-factor authentication and disallow
   tokens.

## Cutting a release

1. Bump both packages to the same version. The lockfile does not change.

   ```bash
   npm pkg set version=X.Y.Z --workspace core-editor --workspace react-sdk
   ```

2. Open a pull request with that change, wait for **CI** to pass, and merge it.
3. Promote `main` to `deployment`.

   ```bash
   git checkout main && git pull
   git push origin main:deployment
   ```

4. In GitHub, open the **Release** run and approve the `npm-release` deployment.
5. Check the result. The workflow also tags the release `vX.Y.Z`.

   ```bash
   npm view @cachai/promptier-core-editor version
   npm view @cachai/promptier-react-sdk version
   ```

## What the workflow does

It fails fast unless the commit is on `main` and both `package.json` versions
match, then runs the tests, typechecks and builds. It packs each package with Yarn, because only Yarn
applies the `publishConfig` that points `exports` at `dist`, and publishes the
resulting tarballs with npm, because trusted publishing is an npm CLI feature.
A package whose version is already on npm is skipped, so pushing to `deployment`
without bumping the version publishes nothing. After publishing, it tags the
commit `vX.Y.Z` as a record of the release; the tag does not trigger anything.

## When something goes wrong

- **The run failed after publishing one package.** Re-run it. It skips what is
  already published and publishes the rest.
- **A bad version is out.** npm does not allow replacing a published version.
  Publish the fix as the next patch, and optionally mark the bad one with
  `npm deprecate`.
- **Do not run `npm publish` from the package folders.** There `exports` still
  points at `src`, which is not in the tarball, so the package would be broken.
