import java.security.MessageDigest
import java.io.File

plugins { id("com.android.application"); id("org.jetbrains.kotlin.android") }
android {
 namespace = "org.okayu.showdown"
 compileSdk = 35
 defaultConfig { applicationId = "org.okayu.showdown"; minSdk = 29; targetSdk = 35; versionCode = 4; versionName = "0.1.0-beta.1" }
 compileOptions { sourceCompatibility = JavaVersion.VERSION_17; targetCompatibility = JavaVersion.VERSION_17 }
 kotlinOptions { jvmTarget = "17" }
}
dependencies { implementation("androidx.webkit:webkit:1.14.0") }

val verifyClient by tasks.registering {
 doLast {
  val client = file("src/main/assets/client")
  check(client.resolve("index.html").isFile && client.resolve("provenance.json").isFile) {
   "Pinned Android client bundle missing. See android/README.md; remote website fallback is intentionally disabled."
  }
  val manifest = groovy.json.JsonSlurper().parse(client.resolve("provenance.json")) as Map<*, *>
  val hashes = manifest["files"] as Map<*, *>
  hashes.forEach { (name, expected) ->
   val path = client.resolve(name as String)
   check(path.canonicalPath.startsWith(client.canonicalPath + File.separator)) { "Invalid asset path" }
   val hash = MessageDigest.getInstance("SHA-256").digest(path.readBytes()).joinToString("") { "%02x".format(it) }
   check(hash == expected) { "Asset hash mismatch: $name" }
  }
 }
}
tasks.matching { it.name == "preBuild" }.configureEach { dependsOn(verifyClient) }
