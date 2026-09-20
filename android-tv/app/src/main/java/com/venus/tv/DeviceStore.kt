package com.venus.tv

import android.content.Context

object DeviceStore {
    private const val PREFS = "venus_tv"
    private const val KEY_DEVICE_TOKEN = "device_token"

    fun getDeviceToken(context: Context): String? =
        context.getSharedPreferences(PREFS, Context.MODE_PRIVATE).getString(KEY_DEVICE_TOKEN, null)

    fun setDeviceToken(context: Context, token: String) {
        context.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
            .edit()
            .putString(KEY_DEVICE_TOKEN, token)
            .apply()
    }

    fun clear(context: Context) {
        context.getSharedPreferences(PREFS, Context.MODE_PRIVATE).edit().clear().apply()
    }
}
