package com.venus.tv

import android.content.Intent
import android.os.Bundle
import android.os.Handler
import android.os.Looper
import android.widget.TextView
import androidx.appcompat.app.AppCompatActivity
import kotlin.concurrent.thread

class MainActivity : AppCompatActivity() {

    private val handler = Handler(Looper.getMainLooper())
    private var polling = false
    private var lastIssuedAt: String? = null

    private lateinit var codeText: TextView
    private lateinit var statusText: TextView

    private val pollRunnable = object : Runnable {
        override fun run() {
            pollOnce()
            if (polling) handler.postDelayed(this, POLL_INTERVAL_MS)
        }
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_main)
        codeText = findViewById(R.id.codeText)
        statusText = findViewById(R.id.statusText)

        if (DeviceStore.getDeviceToken(this) == null) {
            registerDevice()
        } else {
            statusText.text = getString(R.string.connecting)
        }
    }

    override fun onResume() {
        super.onResume()
        lastIssuedAt = null
        polling = true
        handler.post(pollRunnable)
    }

    override fun onPause() {
        super.onPause()
        polling = false
        handler.removeCallbacks(pollRunnable)
    }

    private fun registerDevice() {
        statusText.text = getString(R.string.registering)
        thread {
            val result = ApiClient.post("/api/tv/register")
            runOnUiThread {
                if (isFinishing) return@runOnUiThread
                val json = result.body
                if (result.statusCode == 200 && json != null) {
                    DeviceStore.setDeviceToken(this, json.optString("deviceToken"))
                    codeText.text = json.optString("code")
                    statusText.text = getString(R.string.enter_code_prompt)
                } else {
                    statusText.text = getString(R.string.register_failed)
                }
            }
        }
    }

    private fun pollOnce() {
        val deviceToken = DeviceStore.getDeviceToken(this) ?: return
        thread {
            val result = ApiClient.get("/api/tv/poll?device_token=$deviceToken")
            runOnUiThread {
                if (!polling || isFinishing) return@runOnUiThread

                if (result.statusCode == 404) {
                    // This device was forgotten server-side (unpaired) — start fresh.
                    DeviceStore.clear(this)
                    registerDevice()
                    return@runOnUiThread
                }

                val json = result.body ?: return@runOnUiThread
                if (!json.optBoolean("paired", false)) {
                    return@runOnUiThread
                }

                codeText.text = ""
                statusText.text = getString(R.string.connected_waiting)

                val castJson = json.optJSONObject("cast") ?: return@runOnUiThread
                val cast = CastInfo.fromJson(castJson) ?: return@runOnUiThread
                if (cast.issuedAt != lastIssuedAt) {
                    lastIssuedAt = cast.issuedAt
                    startActivity(
                        Intent(this, PlayerActivity::class.java).apply {
                            putExtra(PlayerActivity.EXTRA_MEDIA_TYPE, cast.mediaType)
                            putExtra(PlayerActivity.EXTRA_TMDB_ID, cast.tmdbId)
                            cast.season?.let { putExtra(PlayerActivity.EXTRA_SEASON, it) }
                            cast.episode?.let { putExtra(PlayerActivity.EXTRA_EPISODE, it) }
                            putExtra(PlayerActivity.EXTRA_VIEW_TOKEN, cast.viewToken)
                            putExtra(PlayerActivity.EXTRA_ISSUED_AT, cast.issuedAt)
                        },
                    )
                }
            }
        }
    }

    companion object {
        private const val POLL_INTERVAL_MS = 3000L
    }
}
