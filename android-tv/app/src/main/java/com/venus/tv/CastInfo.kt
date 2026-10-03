package com.venus.tv

import org.json.JSONObject

data class CastInfo(
    val mediaType: String,
    val tmdbId: Int,
    val season: Int?,
    val episode: Int?,
    val viewToken: String,
    val issuedAt: String,
    val server: Int? = null,
) {
    val embedUrl: String
        get() {
            val serverParam = if (server != null) "&server=$server" else ""
            return if (mediaType == "tv") {
                "${BuildConfig.BASE_URL}/tv-embed/tv/$tmdbId/${season ?: 1}/${episode ?: 1}?token=$viewToken$serverParam"
            } else {
                "${BuildConfig.BASE_URL}/tv-embed/movie/$tmdbId?token=$viewToken$serverParam"
            }
        }

    companion object {
        fun fromJson(json: JSONObject): CastInfo? {
            val mediaType = json.optString("mediaType")
            val tmdbId = json.optInt("tmdbId", -1)
            val viewToken = json.optString("viewToken")
            val issuedAt = json.optString("issuedAt")
            if (mediaType.isEmpty() || tmdbId < 0 || viewToken.isEmpty() || issuedAt.isEmpty()) {
                return null
            }
            return CastInfo(
                mediaType = mediaType,
                tmdbId = tmdbId,
                season = if (json.isNull("season")) null else json.optInt("season"),
                episode = if (json.isNull("episode")) null else json.optInt("episode"),
                viewToken = viewToken,
                issuedAt = issuedAt,
                server = if (json.isNull("server")) null else json.optInt("server"),
            )
        }
    }
}
