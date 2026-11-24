package org.okayu.showdown

import android.app.Activity
import android.content.Intent
import android.net.Uri
import android.os.Bundle
import android.webkit.*
import android.widget.TextView
import androidx.webkit.*
import org.json.JSONObject

/** One client, one persistent WebView. No extension or Node execution privileges. */
class MainActivity : Activity() {
 private lateinit var web: WebView
 private val redirects by lazy { runCatching { JSONObject(assets.open("client/plus/redirects.json").bufferedReader().use { it.readText() }) }.getOrElse { JSONObject() } }
 private fun spriteResource(uri: Uri): WebResourceResponse? {
  if (uri.scheme != "https" || uri.host !in setOf("play.pokemonshowdown.com", "pokemonshowdown.com")) return null
  val path = uri.path ?: return null
  val target = redirects.optString(path)
  if (!target.startsWith("https://raw.githubusercontent.com/JxstMichie/PokemonHD_Gen")) return null
  return runCatching {
   val connection = java.net.URL(target).openConnection() as java.net.HttpURLConnection
   connection.instanceFollowRedirects = false; connection.connectTimeout = 15000; connection.readTimeout = 15000
   check(connection.responseCode == 200)
   val stream = object : java.io.FilterInputStream(connection.inputStream) { override fun close() { super.close(); connection.disconnect() } }
   WebResourceResponse("image/png", null, stream)
  }.getOrNull()
 }
 private var fileCallback: ValueCallback<Array<Uri>>? = null
 private var exportText: String? = null
 private val origin = "https://appassets.androidplatform.net"
 override fun onCreate(savedInstanceState: Bundle?) {
  super.onCreate(savedInstanceState)
  if (applicationInfo.flags and android.content.pm.ApplicationInfo.FLAG_DEBUGGABLE != 0) WebView.setWebContentsDebuggingEnabled(true)
  if (!WebViewFeature.isFeatureSupported(WebViewFeature.WEB_MESSAGE_LISTENER)) {
   setContentView(TextView(this).apply { text = "Actualiza Android System WebView para iniciar Okayu." }); return
  }
  val loader = WebViewAssetLoader.Builder().addPathHandler("/", WebViewAssetLoader.PathHandler { path ->
   try { WebResourceResponse(android.webkit.MimeTypeMap.getSingleton().getMimeTypeFromExtension(path.substringAfterLast('.')) ?: "application/octet-stream", "UTF-8", assets.open("client/" + path)) } catch (_: Exception) { WebResourceResponse("text/plain", "UTF-8", 404, "Not Found", emptyMap(), java.io.ByteArrayInputStream(byteArrayOf())) }
  }).build()
  web = WebView(this)
  web.settings.apply {
   javaScriptEnabled = true; domStorageEnabled = true
   allowFileAccess = false; allowContentAccess = false
   mixedContentMode = WebSettings.MIXED_CONTENT_NEVER_ALLOW
   setSupportMultipleWindows(false)
  }
  web.webChromeClient = object : WebChromeClient() {
   override fun onShowFileChooser(view: WebView, callback: ValueCallback<Array<Uri>>, params: FileChooserParams): Boolean {
    fileCallback?.onReceiveValue(null); fileCallback = callback
    startActivityForResult(Intent(Intent.ACTION_OPEN_DOCUMENT).addCategory(Intent.CATEGORY_OPENABLE).setType("text/*"), 201)
    return true
   }
  }
  web.webViewClient = object : WebViewClient() {
   override fun shouldInterceptRequest(view: WebView, request: WebResourceRequest): WebResourceResponse? = loader.shouldInterceptRequest(request.url) ?: spriteResource(request.url)
   override fun shouldOverrideUrlLoading(view: WebView, request: WebResourceRequest): Boolean {
    if (!request.isForMainFrame) return false
    if (request.url.scheme == "https" && request.url.host == "appassets.androidplatform.net" && request.url.path == "/index.html") return false
    if (request.url.scheme == "https") runCatching { startActivity(Intent(Intent.ACTION_VIEW, request.url)) }
    return true
   }
  }
  WebViewCompat.addWebMessageListener(web, "okayuNative", setOf(origin)) { _, message, source, main, reply ->
   if (!main || source.toString().trimEnd('/') != origin) return@addWebMessageListener
   val input = runCatching { JSONObject(message.data ?: "") }.getOrNull() ?: return@addWebMessageListener
   val result = JSONObject().put("id", input.optString("id"))
   val prefs = getSharedPreferences("okayu", MODE_PRIVATE)
   when (input.optString("method")) {
    "preferences.get" -> result.put("value", prefs.getString("settings", "{}"))
    "preferences.set" -> {
     val value = input.optString("value")
     if (value.length > 65536 || runCatching { JSONObject(value) }.isFailure) result.put("error", "Invalid settings")
     else { prefs.edit().putString("settings", value).apply(); result.put("value", true) }
    }
    "login.query" -> {
     val data = input.optJSONObject("value")
     if (data == null || data.toString().length > 32768) { reply.postMessage(result.put("error", "Invalid login request").toString()); return@addWebMessageListener }
     Thread {
      try {
       val url = java.net.URL("https://play.pokemonshowdown.com/~~showdown/action.php")
       val connection = url.openConnection() as java.net.HttpURLConnection
       connection.instanceFollowRedirects = false; connection.requestMethod = "POST"; connection.doOutput = true; connection.connectTimeout = 15000; connection.readTimeout = 15000
       connection.setRequestProperty("Content-Type", "application/x-www-form-urlencoded")
       CookieManager.getInstance().getCookie("https://play.pokemonshowdown.com")?.let { connection.setRequestProperty("Cookie", it) }
       val body = data.keys().asSequence().joinToString("&") { key -> java.net.URLEncoder.encode(key, "UTF-8") + "=" + java.net.URLEncoder.encode(data.optString(key), "UTF-8") }
       connection.outputStream.use { it.write(body.toByteArray(Charsets.UTF_8)) }
       check(connection.responseCode == 200) { "Login server unavailable" }
       val response = connection.inputStream.use { val output = java.io.ByteArrayOutputStream(); val buffer = ByteArray(8192); var n = it.read(buffer); while (n != -1) { output.write(buffer, 0, n); check(output.size() <= 2097152); n = it.read(buffer) }; output.toByteArray() }; check(response.size <= 2097152)
       val cookies = connection.headerFields.filterKeys { it?.equals("Set-Cookie", true) == true }.values.flatten()
       runOnUiThread { cookies.forEach { CookieManager.getInstance().setCookie("https://play.pokemonshowdown.com", it) }; CookieManager.getInstance().flush(); reply.postMessage(result.put("value", String(response, Charsets.UTF_8)).toString()) }
       connection.disconnect()
      } catch (_: Exception) { runOnUiThread { reply.postMessage(result.put("error", "Login server unavailable").toString()) } }
     }.start()
     return@addWebMessageListener
    }
    "documents.export" -> {
     val value = input.optJSONObject("value")
     val text = value?.optString("text") ?: ""
     if (text.length > 1048576 || exportText != null) { result.put("error", "Invalid or concurrent export") }
     else { exportText = text; startActivityForResult(Intent(Intent.ACTION_CREATE_DOCUMENT).addCategory(Intent.CATEGORY_OPENABLE).setType("text/plain").putExtra(Intent.EXTRA_TITLE, value?.optString("name", "showdown-team.txt")?.substringAfterLast('/')?.take(100)), 202); result.put("value", true) }
    }
    "external.open" -> {
     val uri = Uri.parse(input.optString("value"))
     if (uri.scheme != "https" || uri.host.isNullOrBlank() || uri.userInfo != null) result.put("error", "Only HTTPS links are allowed")
     else { runCatching { startActivity(Intent(Intent.ACTION_VIEW, uri)) }; result.put("value", true) }
    }
    "share" -> {
     val text = input.optString("value").take(32768)
     startActivity(Intent.createChooser(Intent(Intent.ACTION_SEND).setType("text/plain").putExtra(Intent.EXTRA_TEXT, text), "Compartir"))
     result.put("value", true)
    }
    else -> result.put("error", "Unsupported method")
   }
   reply.postMessage(result.toString())
  }
  val container = android.widget.FrameLayout(this)
  container.addView(web, android.widget.FrameLayout.LayoutParams(-1, -1))
  container.setOnApplyWindowInsetsListener { view, insets ->
   if (android.os.Build.VERSION.SDK_INT >= 30) {
    val safe = insets.getInsets(android.view.WindowInsets.Type.systemBars() or android.view.WindowInsets.Type.displayCutout() or android.view.WindowInsets.Type.ime())
    view.setPadding(safe.left, safe.top, safe.right, safe.bottom)
   } else { @Suppress("DEPRECATION") view.setPadding(insets.systemWindowInsetLeft, insets.systemWindowInsetTop, insets.systemWindowInsetRight, insets.systemWindowInsetBottom) }
   insets
  }
  setContentView(container)
  if (android.os.Build.VERSION.SDK_INT >= 30) {
   window.insetsController?.let { controller -> controller.systemBarsBehavior = android.view.WindowInsetsController.BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE; controller.hide(android.view.WindowInsets.Type.systemBars()) }
  } else {
   @Suppress("DEPRECATION") window.decorView.systemUiVisibility = android.view.View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY or android.view.View.SYSTEM_UI_FLAG_FULLSCREEN or android.view.View.SYSTEM_UI_FLAG_HIDE_NAVIGATION
  }
  if (savedInstanceState == null || web.restoreState(savedInstanceState) == null) web.loadUrl("$origin/index.html")
 }
 @Deprecated("Activity result compatibility")
 override fun onActivityResult(requestCode: Int, resultCode: Int, data: Intent?) {
  super.onActivityResult(requestCode, resultCode, data)
  if (requestCode == 201) { fileCallback?.onReceiveValue(if (resultCode == RESULT_OK && data?.data != null) arrayOf(data.data!!) else null); fileCallback = null }
  if (requestCode == 202) { val text = exportText; exportText = null; if (resultCode == RESULT_OK && data?.data != null && text != null) runCatching { contentResolver.openOutputStream(data.data!!)?.use { it.write(text.toByteArray(Charsets.UTF_8)) } } }
 }
 override fun onSaveInstanceState(outState: Bundle) { if (::web.isInitialized) web.saveState(outState); super.onSaveInstanceState(outState) }
 override fun onPause() { if (::web.isInitialized) { web.evaluateJavascript("window.dispatchEvent(new Event('okayu:pause'))", null); web.onPause() }; super.onPause() }
 override fun onResume() { super.onResume(); if (::web.isInitialized) { web.onResume(); web.evaluateJavascript("window.dispatchEvent(new Event('okayu:resume'))", null) } }
 @Deprecated("Activity compatibility")
 override fun onBackPressed() {
  if (!::web.isInitialized) { super.onBackPressed(); return }
  web.evaluateJavascript("Boolean(window.okayuAndroid?.back?.())") { handled -> if (handled != "true") { if (web.canGoBack()) web.goBack() else super.onBackPressed() } }
 }
 override fun onDestroy() { if (::web.isInitialized) web.destroy(); super.onDestroy() }
}
