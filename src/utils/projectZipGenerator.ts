import JSZip from 'jszip';
import { ANDROID_CODE_FILES } from '../data/androidCodeSamples';

export async function generateAndroidStudioProjectZip(): Promise<Blob> {
  const zip = new JSZip();

  // Root files
  zip.file(
    'settings.gradle.kts',
    `pluginManagement {
    repositories {
        google {
            content {
                includeGroupByRegex("com\\\\.android.*")
                includeGroupByRegex("com\\\\.google.*")
                includeGroupByRegex("androidx.*")
            }
        }
        mavenCentral()
        gradlePluginPortal()
    }
}
dependencyResolutionManagement {
    repositoriesMode.set(RepositoriesMode.FAIL_ON_PROJECT_REPOS)
    repositories {
        google()
        mavenCentral()
    }
}

rootProject.name = "DocScan"
include(":app")
`
  );

  zip.file(
    'build.gradle.kts',
    `// Top-level build file where you can add configuration options common to all sub-projects/modules.
plugins {
    id("com.android.application") version "8.7.2" apply false
    id("org.jetbrains.kotlin.android") version "2.0.21" apply false
    id("org.jetbrains.kotlin.plugin.compose") version "2.0.21" apply false
}
`
  );

  // Gradle Wrapper properties
  zip.file(
    'gradle/wrapper/gradle-wrapper.properties',
    `distributionBase=GRADLE_USER_HOME
distributionPath=wrapper/dists
distributionUrl=https\\://services.gradle.org/distributions/gradle-8.9-bin.zip
zipStoreBase=GRADLE_USER_HOME
zipStorePath=wrapper/dists
`
  );

  // GitHub Actions Workflow to build APK in the cloud
  zip.file(
    '.github/workflows/build-apk.yml',
    `name: Build Android APK

on:
  push:
    branches: [ "**" ]
  workflow_dispatch:

jobs:
  build:
    runs-on: ubuntu-latest

    steps:
      - name: Checkout Repository
        uses: actions/checkout@v4

      - name: Set up JDK 17
        uses: actions/setup-java@v4
        with:
          java-version: '17'
          distribution: 'temurin'

      - name: Setup Gradle
        uses: gradle/actions/setup-gradle@v3

      - name: Make Gradlew Executable
        run: |
          if [ ! -f gradlew ]; then
            gradle wrapper
          fi
          chmod +x gradlew

      - name: Build Debug APK with Gradle
        run: ./gradlew assembleDebug --no-daemon

      - name: Upload APK as Downloadable Artifact
        uses: actions/upload-artifact@v4
        with:
          name: DocScan-Release-APK
          path: app/build/outputs/apk/debug/app-debug.apk
          if-no-files-found: error
`
  );

  // App module build.gradle.kts
  zip.file(
    'app/build.gradle.kts',
    `plugins {
    id("com.android.application")
    id("org.jetbrains.kotlin.android")
    id("org.jetbrains.kotlin.plugin.compose")
}

android {
    namespace = "com.example.docscan"
    compileSdk = 35

    defaultConfig {
        applicationId = "com.example.docscan"
        minSdk = 21 // ML Kit Document Scanner supports Android 5.0+ (API 21+)
        targetSdk = 35
        versionCode = 1
        versionName = "1.0"
        testInstrumentationRunner = "androidx.test.runner.AndroidJUnitRunner"
    }

    buildTypes {
        release {
            isMinifyEnabled = false
            proguardFiles(
                getDefaultProguardFile("proguard-android-optimize.txt"),
                "proguard-rules.pro"
            )
        }
    }
    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }
    kotlinOptions {
        jvmTarget = "17"
    }
    buildFeatures {
        compose = true
    }
}

dependencies {
    // 1. Google Play Services ML Kit Document Scanner API
    implementation("com.google.android.gms:play-services-mlkit-document-scanner:16.0.0-beta1")

    // 2. Jetpack Compose & Material 3
    val composeBom = platform("androidx.compose:compose-bom:2024.10.00")
    implementation(composeBom)
    implementation("androidx.compose.ui:ui")
    implementation("androidx.compose.material3:material3")
    implementation("androidx.compose.material:material-icons-extended")
    implementation("androidx.activity:activity-compose:1.9.3")
    implementation("androidx.lifecycle:lifecycle-viewmodel-compose:2.8.7")

    // 3. Coil for async image loading
    implementation("io.coil-kt:coil-compose:2.7.0")

    // Core AndroidX
    implementation("androidx.core:core-ktx:1.15.0")
    implementation("androidx.lifecycle:lifecycle-runtime-ktx:2.8.7")
}
`
  );

  // Manifest
  zip.file(
    'app/src/main/AndroidManifest.xml',
    `<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android">

    <!-- NOTE: You DO NOT need android.permission.CAMERA in your app!
         The ML Kit Document Scanner runs via Google Play Services in an isolated,
         secure activity with its own camera permissions, returning only the
         resulting JPEG/PDF URIs back to your app. -->

    <application
        android:allowBackup="true"
        android:icon="@mipmap/ic_launcher"
        android:label="DocScan"
        android:roundIcon="@mipmap/ic_launcher_round"
        android:supportsRtl="true"
        android:theme="@style/Theme.DocScan">

        <activity
            android:name=".MainActivity"
            android:exported="true"
            android:theme="@style/Theme.DocScan">
            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>
        </activity>

    </application>

</manifest>
`
  );

  // Source files from ANDROID_CODE_FILES
  const mainAct = ANDROID_CODE_FILES.find((f) => f.id === 'main-activity');
  if (mainAct) zip.file('app/src/main/java/com/example/docscan/MainActivity.kt', mainAct.code);

  const viewMod = ANDROID_CODE_FILES.find((f) => f.id === 'view-model');
  if (viewMod) zip.file('app/src/main/java/com/example/docscan/DocumentScannerViewModel.kt', viewMod.code);

  const screen = ANDROID_CODE_FILES.find((f) => f.id === 'scanner-screen');
  if (screen) zip.file('app/src/main/java/com/example/docscan/ui/DocumentScannerScreen.kt', screen.code);

  // Jetpack Compose Theme files
  zip.file(
    'app/src/main/java/com/example/docscan/ui/theme/Color.kt',
    `package com.example.docscan.ui.theme

import androidx.compose.ui.graphics.Color

val Purple80 = Color(0xFFD0BCFF)
val PurpleGrey80 = Color(0xFFCCC2DC)
val Pink80 = Color(0xFFEFB8C8)

val Purple40 = Color(0xFF6650a4)
val PurpleGrey40 = Color(0xFF625b71)
val Pink40 = Color(0xFF7D5260)
val SkyPrimary = Color(0xFF0284C7)
`
  );

  zip.file(
    'app/src/main/java/com/example/docscan/ui/theme/Theme.kt',
    `package com.example.docscan.ui.theme

import android.app.Activity
import android.os.Build
import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.platform.LocalContext

private val DarkColorScheme = darkColorScheme(
    primary = SkyPrimary,
    secondary = PurpleGrey80,
    tertiary = Pink80
)

private val LightColorScheme = lightColorScheme(
    primary = SkyPrimary,
    secondary = PurpleGrey40,
    tertiary = Pink40
)

@Composable
fun DocScanTheme(
    darkTheme: Boolean = isSystemInDarkTheme(),
    dynamicColor: Boolean = true,
    content: @Composable () -> Unit
) {
    val colorScheme = when {
        dynamicColor && Build.VERSION.SDK_INT >= Build.VERSION_CODES.S -> {
            val context = LocalContext.current
            if (darkTheme) dynamicDarkColorScheme(context) else dynamicLightColorScheme(context)
        }
        darkTheme -> DarkColorScheme
        else -> LightColorScheme
    }

    MaterialTheme(
        colorScheme = colorScheme,
        content = content
    )
}
`
  );

  // XML Resources
  zip.file(
    'app/src/main/res/values/strings.xml',
    `<resources>
    <string name="app_name">DocScan</string>
</resources>
`
  );

  zip.file(
    'app/src/main/res/values/themes.xml',
    `<resources>
    <style name="Theme.DocScan" parent="android:Theme.Material.Light.NoActionBar" />
</resources>
`
  );

  // Instructions file
  zip.file(
    'HOW_TO_RUN_ON_PHONE.md',
    `# How to Run DocScan on Your Android Phone in 3 Minutes

## Requirements
- An Android phone running Android 5.0 (Lollipop) or newer with Google Play Services.
- A computer with Android Studio installed (Download free at https://developer.android.com/studio).

---

## Step 1: Open the Project in Android Studio
1. Unzip this downloaded folder.
2. Open Android Studio.
3. Select **File > Open...** and select the unzipped \`DocScan\` directory.
4. Wait 1-2 minutes for Gradle to sync dependencies automatically.

---

## Step 2: Connect Your Android Phone
You can connect using either USB or Wi-Fi:

### Option A: Via USB Cable (Easiest)
1. On your phone, go to **Settings > About Phone** and tap **Build Number** 7 times to enable **Developer Options**.
2. Go to **Settings > System > Developer Options** (or search "Developer options" in Settings) and enable **USB Debugging**.
3. Plug your phone into your computer using a USB cable.
4. A popup will appear on your phone asking *"Allow USB debugging?"* -> Check *"Always allow"* and tap **Allow**.

### Option B: Wireless Debugging (No Cable Needed)
1. Ensure your phone and computer are on the same Wi-Fi network.
2. In Android Studio, click the device dropdown at the top and select **Pair Devices Using Wi-Fi**.
3. On your phone, go to **Settings > Developer Options > Wireless Debugging** and tap **Pair device with QR code**.
4. Scan the QR code shown in Android Studio.

---

## Step 3: Run the App
1. In Android Studio, select your phone from the device dropdown at the top toolbar.
2. Click the green **Run (▶)** button (or press \`Shift + F10\`).
3. The app will install and open automatically on your phone!

---

## Alternative: Build a Shareable APK (Install Without USB)
If you just want an \`.apk\` installer file:
1. In Android Studio, click **Build > Build Bundle(s) / APK(s) > Build APK(s)**.
2. When finished, click the **locate** link in the bottom-right notification.
3. Transfer \`app-debug.apk\` to your phone via Google Drive, WhatsApp, or Gmail.
4. On your phone, tap the \`.apk\` file and select **Install**.
`
  );

  return await zip.generateAsync({ type: 'blob' });
}
