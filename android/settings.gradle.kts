// Edusarthi Android app: a Trusted Web Activity that opens the student web app
// full screen. There is no app code of its own — every screen is the website.

pluginManagement {
    repositories {
        google()
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

rootProject.name = "Edusarthi"
include(":app")
