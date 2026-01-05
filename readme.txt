
https://ionicacademy.com/courses/ionic-react-firebase-basics/



ionic start reactFire blank --type react
npm install firebase
npm i react-hook-form



npm install -g firebase-tools

firebase login

firebase init


Firestore
Hosting


public directory must be "dist"
y
N




firebase deploy --only firestore:rules

npm run build
firebase deploy --only hosting


npm install typescript@latest --save-dev


# 1. Build your React project (creates the 'dist' or 'build' folder)
npm run build

# 2. Add the Android platform (only do this once)
npx cap add android

# 3. Sync your code to the Android folder
npx cap sync

npx cap run android


npm run build-dev




npm install @solimanware/capacitor-sms-reader --legacy-peer-deps

Manifest
<uses-permission android:name="android.permission.READ_SMS" />
<uses-permission android:name="android.permission.RECEIVE_SMS" />

npm install caniuse-lite baseline-browser-mapping --legacy-peer-deps
npm update caniuse-lite --legacy-peer-deps
npm install -D terser --legacy-peer-deps





npm install @capacitor/assets --save-dev

assets/├── icon-only.png├── icon-foreground.png├── icon-background.png├── splash.png└── splash-dark.png



Icon files should be at least 1024px x 1024px.
Splash screen files should be at least 2732px x 2732px.
The format can be jpg or png.

npx capacitor-assets generate




#### GIT PUSH ####

Go to github -> Settings -> Developer Settings -> Personal access token -> Fine-grained tokens
Create new token 
All Repositories
Add Permissions -> Content
Change context to "Read and write"
Generate token


Git Extensions -> Tools -> GitBash

Check if you on the correct remote branch
git remote -v

should be something like 
origin  https://github.com/KobusGitHub/JonkerBudgetSms.git (fetch)
origin  https://github.com/KobusGitHub/JonkerBudgetSms.git (push)


git push https://KobusGitHub:<YOUR_PERSONAL_TOKEN>@github.com/KobusGitHub/JonkerBudgetSms.git main
