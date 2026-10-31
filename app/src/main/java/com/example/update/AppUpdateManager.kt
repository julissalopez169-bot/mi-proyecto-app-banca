
package com.example.update

import android.content.Context
import android.content.Intent
import android.net.Uri
import android.util.Log
import com.example.BuildConfig
import com.example.data.supabase.SupabaseManager
import com.example.notification.LuminaNotificationManager
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import org.json.JSONArray
import java.net.HttpURLConnection
import java.net.URL

data class AppUpdateInfo(
    val versionCode: Int,
    val versionName: String,
    val releaseNotes: String,
    val downloadUrl: String,
    val isMandatory: Boolean = false,
    val publishedAt: String = "",
    val sha256: String = ""
)

class AppUpdateManager(
    private val context: Context,
    private val supabaseManager: SupabaseManager,
    private val notificationManager: LuminaNotificationManager
) {

    private var snoozedVersionThisSession: Int = -1

    companion object {
        private const val TAG = "AppUpdateManager"

        @Volatile
        private var INSTANCE: AppUpdateManager? = null

        fun getInstance(
            context: Context,
            supabaseManager: SupabaseManager,
            notificationManager: LuminaNotificationManager
        ): AppUpdateManager {
            return INSTANCE ?: synchronized(this) {
                val instance = AppUpdateManager(
                    context.applicationContext,
                    supabaseManager,
                    notificationManager
                )
                INSTANCE = instance
                instance
            }
        }
    }

    val currentVersionCode: Int = BuildConfig.VERSION_CODE
    val currentVersionName: String = BuildConfig.VERSION_NAME

    suspend fun checkForUpdates(
        forceCheck: Boolean = false
    ): Result<AppUpdateInfo?> = withContext(Dispatchers.IO) {
        try {
            val urlStr = supabaseManager.supabaseUrl
            val keyStr = supabaseManager.supabaseAnonKey

            if (urlStr.isNotBlank() && keyStr.isNotBlank()) {
                val endpoint =
                    "$urlStr/rest/v1/app_updates?select=*&order=version_code.desc&limit=1"

                val conn = (URL(endpoint).openConnection() as HttpURLConnection).apply {
                    requestMethod = "GET"
                    setRequestProperty("apikey", keyStr)
                    setRequestProperty("Authorization", "Bearer $keyStr")
                    setRequestProperty("Content-Type", "application/json")
                    connectTimeout = 8000
                    readTimeout = 8000
                }

                try {
                    if (conn.responseCode == HttpURLConnection.HTTP_OK) {
                        val body = conn.inputStream.bufferedReader().use {
                            it.readText()
                        }

                        val jsonArray = JSONArray(body)

                        if (jsonArray.length() > 0) {
                            val obj = jsonArray.getJSONObject(0)

                            val remoteCode = obj.optInt("version_code", 1)
                            val remoteName = obj.optString("version_name", "1.1.0")
                            val notes = obj.optString(
                                "release_notes",
                                "Mejoras de rendimiento y corrección de errores."
                            )
                            val download = obj.optString("download_url", "")
                            val mandatory = obj.optBoolean("is_mandatory", false)
                            val published = obj.optString("published_at", "")
                            val sha256 = obj.optString("sha256", "").trim()

                            val updateInfo = AppUpdateInfo(
                                versionCode = remoteCode,
                                versionName = remoteName,
                                releaseNotes = notes,
                                downloadUrl = download,
                                isMandatory = mandatory,
                                publishedAt = published,
                                sha256 = sha256
                            )

                            if (remoteCode > currentVersionCode) {
                                if (
                                    !forceCheck &&
                                    isSnoozed(remoteCode) &&
                                    !mandatory
                                ) {
                                    Log.d(
                                        TAG,
                                        "Update $remoteCode available but snoozed."
                                    )
                                    return@withContext Result.success(null)
                                }

                                return@withContext Result.success(updateInfo)
                            }

                            return@withContext Result.success(null)
                        }
                    } else {
                        Log.e(TAG, "Supabase respondió con código ${conn.responseCode}")
                    }
                } finally {
                    conn.disconnect()
                }
            }

            Result.success(null)
        } catch (e: Exception) {
            Log.e(TAG, "Error checking for updates", e)
            Result.failure(e)
        }
    }

    fun snoozeUpdate(versionCode: Int) {
        snoozedVersionThisSession = versionCode
    }

    fun clearSnooze() {
        snoozedVersionThisSession = -1
    }

    private fun isSnoozed(versionCode: Int): Boolean {
        return snoozedVersionThisSession == versionCode
    }

    fun simulateUpdate(
        versionName: String = "1.1.0",
        versionCode: Int = 2,
        releaseNotes: String = "Mejoras de rendimiento y corrección de errores.",
        downloadUrl: String = ""
    ): AppUpdateInfo {
        clearSnooze()

        val update = AppUpdateInfo(
            versionCode = versionCode,
            versionName = versionName,
            releaseNotes = releaseNotes,
            downloadUrl = downloadUrl,
            isMandatory = false,
            publishedAt = "Hoy"
        )

        notificationManager.notifyUpdateAvailable(
            versionName = versionName,
            releaseNotes = "Nueva versión de Banca Nova lista para instalar.",
            downloadUrl = downloadUrl
        )

        return update
    }

    /**
     * Launches the update download by opening the download URL in the browser or installer.
     */
    fun launchUpdateDownload(context: Context, downloadUrl: String) {
        try {
            val url = if (downloadUrl.isBlank()) "https://github.com" else downloadUrl
            val intent = Intent(Intent.ACTION_VIEW, Uri.parse(url)).apply {
                flags = Intent.FLAG_ACTIVITY_NEW_TASK
            }
            context.startActivity(intent)
        } catch (e: Exception) {
            Log.e(TAG, "Error launching update download: ${e.message}", e)
        }
    }

    /**
     * Downloads the APK in background, verifies SHA-256 integrity (if provided), checks for HTML error page,
     * and launches the system package installer via FileProvider.
     */
    suspend fun downloadAndInstallUpdate(
        context: Context,
        updateInfo: AppUpdateInfo,
        onProgress: (Int) -> Unit = {},
        onError: (String) -> Unit = {}
    ): Boolean = withContext(Dispatchers.IO) {
        if (updateInfo.downloadUrl.isBlank()) {
            onError("URL de descarga no válida.")
            return@withContext false
        }

        val appContext = context.applicationContext
        val apkFile = java.io.File(appContext.cacheDir, "update_${updateInfo.versionCode}.apk")

        try {
            if (apkFile.exists()) {
                apkFile.delete()
            }

            val url = URL(updateInfo.downloadUrl)
            var connection = (url.openConnection() as HttpURLConnection).apply {
                requestMethod = "GET"
                connectTimeout = 15000
                readTimeout = 30000
                instanceFollowRedirects = true
            }

            var responseCode = connection.responseCode
            var redirectCount = 0
            while ((responseCode == HttpURLConnection.HTTP_MOVED_TEMP ||
                    responseCode == HttpURLConnection.HTTP_MOVED_PERM ||
                    responseCode == HttpURLConnection.HTTP_SEE_OTHER) && redirectCount < 5) {
                val newUrl = connection.getHeaderField("Location")
                connection.disconnect()
                connection = (URL(newUrl).openConnection() as HttpURLConnection).apply {
                    requestMethod = "GET"
                    connectTimeout = 15000
                    readTimeout = 30000
                    instanceFollowRedirects = true
                }
                responseCode = connection.responseCode
                redirectCount++
            }

            if (responseCode != HttpURLConnection.HTTP_OK) {
                onError("Error HTTP al descargar: $responseCode")
                connection.disconnect()
                return@withContext false
            }

            val contentLength = connection.contentLength

            connection.inputStream.use { input ->
                apkFile.outputStream().use { output ->
                    val buffer = ByteArray(8192)
                    var bytesRead: Int
                    var totalBytesRead = 0L
                    while (input.read(buffer).also { bytesRead = it } != -1) {
                        output.write(buffer, 0, bytesRead)
                        totalBytesRead += bytesRead
                        if (contentLength > 0) {
                            val progress = ((totalBytesRead * 100) / contentLength).toInt()
                            onProgress(progress)
                        }
                    }
                }
            }
            connection.disconnect()

            // Verify if downloaded file is an HTML page (e.g. GitHub 404 page) instead of APK
            if (apkFile.exists() && apkFile.length() > 0) {
                val firstBytes = ByteArray(100)
                apkFile.inputStream().use { it.read(firstBytes) }
                val startContent = String(firstBytes, Charsets.UTF_8).trimStart()
                if (startContent.startsWith("<!DOCTYPE html", ignoreCase = true) ||
                    startContent.startsWith("<html", ignoreCase = true)) {
                    apkFile.delete()
                    onError("El enlace de descarga apunta a una página web y no a un APK válido.")
                    return@withContext false
                }
            }

            // Verify SHA-256 integrity if provided
            if (updateInfo.sha256.isNotBlank()) {
                val calculatedHash = calculateSha256(apkFile)
                if (!calculatedHash.equals(updateInfo.sha256, ignoreCase = true)) {
                    apkFile.delete()
                    onError("Error de integridad: El hash SHA-256 no coincide.")
                    return@withContext false
                }
            }

            // Install APK via FileProvider
            installApk(appContext, apkFile)
            true
        } catch (e: Exception) {
            Log.e(TAG, "Error downloading and installing update", e)
            if (apkFile.exists()) apkFile.delete()
            onError("Error de descarga: ${e.message}")
            false
        }
    }

    private fun calculateSha256(file: java.io.File): String {
        val digest = java.security.MessageDigest.getInstance("SHA-256")
        file.inputStream().use { fis ->
            val buffer = ByteArray(8192)
            var bytesRead: Int
            while (fis.read(buffer).also { bytesRead = it } != -1) {
                digest.update(buffer, 0, bytesRead)
            }
        }
        return digest.digest().joinToString("") { "%02x".format(it) }
    }

    private fun installApk(context: Context, apkFile: java.io.File) {
        val apkUri: Uri = androidx.core.content.FileProvider.getUriForFile(
            context,
            "${context.packageName}.fileprovider",
            apkFile
        )

        val intent = Intent(Intent.ACTION_VIEW).apply {
            setDataAndType(apkUri, "application/vnd.android.package-archive")
            flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_GRANT_READ_URI_PERMISSION
        }
        context.startActivity(intent)
    }
}
