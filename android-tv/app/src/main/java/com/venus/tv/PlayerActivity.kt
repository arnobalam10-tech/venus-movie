package com.venus.tv

import android.annotation.SuppressLint
import android.graphics.Bitmap
import android.os.Bundle
import android.os.Handler
import android.os.Looper
import android.view.KeyEvent
import android.view.View
import android.webkit.CookieManager
import android.webkit.WebChromeClient
import android.webkit.WebResourceError
import android.webkit.WebResourceRequest
import android.webkit.WebView
import android.webkit.WebViewClient
import android.widget.TextView
import androidx.appcompat.app.AppCompatActivity
import kotlin.concurrent.thread

class PlayerActivity : AppCompatActivity() {

    private lateinit var webView: WebView
    private lateinit var statusOverlay: TextView
    private val handler = Handler(Looper.getMainLooper())
    private var polling = false
    private var currentIssuedAt: String? = null

    private val pollRunnable = object : Runnable {
        override fun run() {
            pollOnce()
            if (polling) handler.postDelayed(this, POLL_INTERVAL_MS)
        }
    }

    @SuppressLint("SetJavaScriptEnabled")
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_player)
        webView = findViewById(R.id.webView)
        statusOverlay = findViewById(R.id.statusOverlay)

        val settings = webView.settings
        settings.javaScriptEnabled = true
        settings.domStorageEnabled = true
        settings.mediaPlaybackRequiresUserGesture = false
        // Many free, ad-supported video embeds (VidSrc included) special-case
        // WebView user agents (the "; wv)" marker) and serve a degraded or
        // broken experience. Presenting as a regular Chrome browser avoids
        // that class of problem entirely.
        settings.userAgentString =
            "Mozilla/5.0 (Linux; Android 10; Android TV) AppleWebKit/537.36 " +
                "(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"

        // Our /tv-embed page is first-party, but the VidSrc player inside it
        // is a cross-origin iframe that needs cookies to function — Android
        // WebView blocks third-party cookies by default.
        val cookieManager = CookieManager.getInstance()
        cookieManager.setAcceptCookie(true)
        cookieManager.setAcceptThirdPartyCookies(webView, true)

        webView.webChromeClient = WebChromeClient()
        webView.webViewClient = object : WebViewClient() {
            override fun onPageStarted(view: WebView?, url: String?, favicon: Bitmap?) {
                showStatus("Loading…")
            }

            override fun onPageFinished(view: WebView?, url: String?) {
                hideStatus()
            }

            override fun onReceivedError(
                view: WebView?,
                request: WebResourceRequest?,
                error: WebResourceError?,
            ) {
                if (request?.isForMainFrame == true) {
                    showStatus("Couldn't load: ${error?.description}")
                }
            }
        }

        currentIssuedAt = intent.getStringExtra(EXTRA_ISSUED_AT)
        loadFromIntent()

        // See MainActivity for why this runs for the Activity's full
        // lifetime rather than being tied to onResume/onPause.
        polling = true
        handler.postDelayed(pollRunnable, POLL_INTERVAL_MS)
    }

    override fun onDestroy() {
        super.onDestroy()
        polling = false
        handler.removeCallbacks(pollRunnable)
    }

    override fun onKeyDown(keyCode: Int, event: KeyEvent?): Boolean {
        if (keyCode == KeyEvent.KEYCODE_BACK) {
            finish()
            return true
        }
        return super.onKeyDown(keyCode, event)
    }

    private fun showStatus(text: String) {
        statusOverlay.text = text
        statusOverlay.visibility = View.VISIBLE
    }

    private fun hideStatus() {
        statusOverlay.visibility = View.GONE
    }

    private fun loadFromIntent() {
        val mediaType = intent.getStringExtra(EXTRA_MEDIA_TYPE)
        val tmdbId = intent.getIntExtra(EXTRA_TMDB_ID, -1)
        val viewToken = intent.getStringExtra(EXTRA_VIEW_TOKEN)
        if (mediaType == null || viewToken == null || tmdbId < 0) {
            showStatus("Nothing to play — go back and cast something.")
            return
        }

        val season = if (intent.hasExtra(EXTRA_SEASON)) intent.getIntExtra(EXTRA_SEASON, 1) else null
        val episode = if (intent.hasExtra(EXTRA_EPISODE)) intent.getIntExtra(EXTRA_EPISODE, 1) else null
        val issuedAt = intent.getStringExtra(EXTRA_ISSUED_AT).orEmpty()

        val cast = CastInfo(mediaType, tmdbId, season, episode, viewToken, issuedAt)
        webView.loadUrl(cast.embedUrl)
    }

    private fun pollOnce() {
        val deviceToken = DeviceStore.getDeviceToken(this) ?: return
        thread {
            val result = ApiClient.get("/api/tv/poll?device_token=$deviceToken")
            runOnUiThread {
                if (!polling || isFinishing) return@runOnUiThread
                val json = result.body ?: return@runOnUiThread
                val castJson = json.optJSONObject("cast") ?: return@runOnUiThread
                val cast = CastInfo.fromJson(castJson) ?: return@runOnUiThread
                if (cast.issuedAt != currentIssuedAt) {
                    currentIssuedAt = cast.issuedAt
                    webView.loadUrl(cast.embedUrl)
                }
            }
        }
    }

    companion object {
        const val EXTRA_MEDIA_TYPE = "mediaType"
        const val EXTRA_TMDB_ID = "tmdbId"
        const val EXTRA_SEASON = "season"
        const val EXTRA_EPISODE = "episode"
        const val EXTRA_VIEW_TOKEN = "viewToken"
        const val EXTRA_ISSUED_AT = "issuedAt"
        private const val POLL_INTERVAL_MS = 3000L
    }
}
