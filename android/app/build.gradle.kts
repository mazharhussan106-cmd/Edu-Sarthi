// The EduSarthi app module. It packages androidbrowserhelper's LauncherActivity,
// which opens the website in a Trusted Web Activity (Chrome, full screen, no
// URL bar once Digital Asset Links verify).
//
// Deliberately no Kotlin or Java source: anything the app needs to do is done
// by the website, so a fix ships to every phone without a Play Store update.

import java.util.Properties

plugins {
    id("com.android.application")
}

val twaHost: String = (project.findProperty("twaHost") as String?) ?: "edusarthi.com"

// Release signing comes from android/keystore.properties, which is gitignored.
// Without it, release builds are unsigned and debug builds use the debug key.
val keystoreProps = Properties().apply {
    val f = rootProject.file("keystore.properties")
    if (f.exists()) f.inputStream().use { load(it) }
}

android {
    namespace = "com.edusarthi.app"
    compileSdk = 36

    defaultConfig {
        applicationId = "com.edusarthi.app"
        minSdk = 23
        targetSdk = 36
        versionCode = 1
        versionName = "0.1.0"

        manifestPlaceholders["hostName"] = twaHost
        manifestPlaceholders["launchUrl"] = "https://$twaHost/dashboard?source=twa"

        // Tells Android which website this app vouches for. The website's
        // /.well-known/assetlinks.json must vouch back for this app.
        resValue(
            "string",
            "asset_statements",
            "[{ \\\"relation\\\": [\\\"delegate_permission/common.handle_all_urls\\\"], " +
                "\\\"target\\\": { \\\"namespace\\\": \\\"web\\\", \\\"site\\\": \\\"https://$twaHost\\\" } }]",
        )
    }

    signingConfigs {
        if (keystoreProps.getProperty("storeFile") != null) {
            create("release") {
                storeFile = rootProject.file(keystoreProps.getProperty("storeFile"))
                storePassword = keystoreProps.getProperty("storePassword")
                keyAlias = keystoreProps.getProperty("keyAlias")
                keyPassword = keystoreProps.getProperty("keyPassword")
            }
        }
    }

    buildTypes {
        release {
            isMinifyEnabled = false
            signingConfig = signingConfigs.findByName("release")
        }
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }

    buildFeatures {
        resValues = true
    }
}

dependencies {
    implementation("com.google.androidbrowserhelper:androidbrowserhelper:2.5.0")
}
