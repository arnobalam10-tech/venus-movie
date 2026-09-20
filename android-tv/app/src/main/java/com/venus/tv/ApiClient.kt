package com.venus.tv

import org.json.JSONObject
import java.io.BufferedReader
import java.io.InputStreamReader
import java.io.OutputStreamWriter
import java.net.HttpURLConnection
import java.net.URL

/**
 * Minimal HTTP client using only java.net — deliberately dependency-free
 * (no OkHttp/Retrofit) since this project can't be locally build-tested
 * before shipping; fewer moving parts means fewer ways for a first CI
 * build to fail.
 */
object ApiClient {

    data class ApiResult(val statusCode: Int, val body: JSONObject?)

    fun post(path: String): ApiResult = request("POST", path)

    fun get(path: String): ApiResult = request("GET", path)

    private fun request(method: String, path: String): ApiResult {
        val url = URL(BuildConfig.BASE_URL + path)
        val conn = url.openConnection() as HttpURLConnection
        return try {
            conn.requestMethod = method
            conn.connectTimeout = 10_000
            conn.readTimeout = 10_000
            if (method == "POST") {
                conn.doOutput = true
                conn.setRequestProperty("Content-Type", "application/json")
                OutputStreamWriter(conn.outputStream).use { it.write("{}") }
            }

            val code = conn.responseCode
            val stream = if (code in 200..299) conn.inputStream else conn.errorStream
            val text = stream?.let {
                BufferedReader(InputStreamReader(it)).use { reader -> reader.readText() }
            }
            val json = try {
                if (!text.isNullOrBlank()) JSONObject(text) else null
            } catch (e: Exception) {
                null
            }
            ApiResult(code, json)
        } catch (e: Exception) {
            ApiResult(-1, null)
        } finally {
            conn.disconnect()
        }
    }
}
