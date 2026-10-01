# Home Budget

## Firebase Hosting

Once, enable Hosting for the `jonkerbudget` Firebase project and install dependencies:

```powershell
pnpm install
```

Then deploy from the repository root:

```powershell
pnpm run deploy:hosting
```

The script builds into `dist` with SMS Expense and SMS Config disabled, refreshes Firebase login in the browser, then deploys only Hosting. Your account must have permission to deploy to `jonkerbudget`. Direct visits to either SMS URL redirect to Home. For a build without signing in or deploying, run `powershell -ExecutionPolicy Bypass -File ./deploy-firebase.ps1 -BuildOnly`. Normal Android builds keep SMS enabled; the script does not change the source setting.

## SMS Identifiers

SMS Config saves bank-message identifiers in the `smsIdentifier` Firestore collection. Each document has an `identifier` and a `shareToken` equal to the signed-in user's UID. New accounts have no identifiers or matching SMS messages until identifiers are added; there are no built-in identifiers. The deployed Firestore security rules must allow users to read and write only their own identifier documents; `deploy:hosting` does not deploy Firestore rules.

## Android Version

Both APK builds read `version` from `src/environments/environment.ts`. Android uses that value as `versionName` and derives `versionCode` as major x 10000 + minor x 100 + patch (for example, 2.0.0 becomes 20000). Minor and patch must each be below 100. Increase the version before building an update; the APK filename uses the same value.