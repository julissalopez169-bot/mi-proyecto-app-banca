package com.example.notification

import android.Manifest
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.os.Build
import androidx.core.app.ActivityCompat
import androidx.core.app.NotificationCompat
import androidx.core.app.NotificationManagerCompat
import com.example.MainActivity
import com.example.R
import com.example.data.LuminaDatabase
import com.example.data.model.NotificationEntity
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch
import java.util.UUID

class LuminaNotificationManager(private val context: Context) {

    private val notificationManagerCompat = NotificationManagerCompat.from(context)
    private val database = LuminaDatabase.getInstance(context)

    companion object {
        const val CHANNEL_TRANSFERS = "lumina_transfers_channel"
        const val CHANNEL_SECURITY = "lumina_security_channel"
        const val CHANNEL_CARDS = "lumina_cards_channel"
        const val CHANNEL_GENERAL = "lumina_general_channel"
        const val CHANNEL_UPDATES = "lumina_updates_channel"

        @Volatile
        private var INSTANCE: LuminaNotificationManager? = null

        fun getInstance(context: Context): LuminaNotificationManager {
            return INSTANCE ?: synchronized(this) {
                val instance = LuminaNotificationManager(context.applicationContext)
                INSTANCE = instance
                instance
            }
        }
    }

    init {
        createNotificationChannels()
    }

    private fun createNotificationChannels() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val notificationManager =
                context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager

            val transfersChannel = NotificationChannel(
                CHANNEL_TRANSFERS,
                "Transferencias y Pagos",
                NotificationManager.IMPORTANCE_HIGH
            ).apply {
                description = "Alertas instantáneas de transferencias enviadas y recibidas en tiempo real"
                enableVibration(true)
                enableLights(true)
            }

            val securityChannel = NotificationChannel(
                CHANNEL_SECURITY,
                "Seguridad y Accesos",
                NotificationManager.IMPORTANCE_HIGH
            ).apply {
                description = "Alertas de autenticación biométrica, accesos y seguridad de cuenta"
                enableVibration(true)
            }

            val cardsChannel = NotificationChannel(
                CHANNEL_CARDS,
                "Alertas de Tarjetas",
                NotificationManager.IMPORTANCE_DEFAULT
            ).apply {
                description = "Notificaciones de compras, bloqueos y límites de tarjetas"
            }

            val generalChannel = NotificationChannel(
                CHANNEL_GENERAL,
                "General y Novedades",
                NotificationManager.IMPORTANCE_DEFAULT
            ).apply {
                description = "Información general y novedades de Lumina Bank"
            }

            val updatesChannel = NotificationChannel(
                CHANNEL_UPDATES,
                "Actualizaciones de la Aplicación",
                NotificationManager.IMPORTANCE_HIGH
            ).apply {
                description = "Avisos de nuevas versiones y mejoras disponibles para Lumina Bank"
                enableVibration(true)
                enableLights(true)
            }

            notificationManager.createNotificationChannels(
                listOf(transfersChannel, securityChannel, cardsChannel, generalChannel, updatesChannel)
            )
        }
    }

    fun hasNotificationPermission(): Boolean {
        return if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            ActivityCompat.checkSelfPermission(
                context,
                Manifest.permission.POST_NOTIFICATIONS
            ) == PackageManager.PERMISSION_GRANTED
        } else {
            notificationManagerCompat.areNotificationsEnabled()
        }
    }

    fun sendPushNotification(
        title: String,
        message: String,
        category: String = "transfers",
        channelId: String = CHANNEL_TRANSFERS
    ) {
        val notificationId = (System.currentTimeMillis() % 100000).toInt()

        // 1. Save to Room database so it displays in notification inbox
        CoroutineScope(Dispatchers.IO).launch {
            val entity = NotificationEntity(
                id = UUID.randomUUID().toString(),
                title = title,
                message = message,
                timestamp = System.currentTimeMillis(),
                category = category,
                isRead = false
            )
            database.notificationDao().insertNotification(entity)
        }

        // 2. Post Android system push notification if permitted
        if (hasNotificationPermission()) {
            val intent = Intent(context, MainActivity::class.java).apply {
                flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP
            }
            val pendingIntent = PendingIntent.getActivity(
                context,
                notificationId,
                intent,
                PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
            )

            val builder = NotificationCompat.Builder(context, channelId)
                .setSmallIcon(R.drawable.ic_launcher_foreground)
                .setContentTitle(title)
                .setContentText(message)
                .setStyle(NotificationCompat.BigTextStyle().bigText(message))
                .setPriority(NotificationCompat.PRIORITY_HIGH)
                .setAutoCancel(true)
                .setContentIntent(pendingIntent)
                .setDefaults(NotificationCompat.DEFAULT_ALL)

            try {
                notificationManagerCompat.notify(notificationId, builder.build())
            } catch (e: SecurityException) {
                // Permission not granted or revoked
            }
        }
    }

    fun notifyTransferSent(amount: Double, recipient: String, reference: String) {
        val formattedAmount = String.format("L %,.2f", amount)
        sendPushNotification(
            title = "Transferencia Exitosa",
            message = "Has enviado $formattedAmount a $recipient. Ref: $reference",
            category = "transfers",
            channelId = CHANNEL_TRANSFERS
        )
    }

    fun notifyTransferReceived(amount: Double, sender: String, reference: String) {
        val formattedAmount = String.format("L %,.2f", amount)
        sendPushNotification(
            title = "¡Ingreso Recibido!",
            message = "Se han acreditado $formattedAmount de $sender. Ref: $reference",
            category = "transfers",
            channelId = CHANNEL_TRANSFERS
        )
    }

    fun notifyCardStatusChanged(cardTier: String, isFrozen: Boolean) {
        val statusText = if (isFrozen) "congelada temporalmente" else "descongelada y activa"
        sendPushNotification(
            title = "Seguridad de Tarjeta",
            message = "Tu tarjeta $cardTier ha sido $statusText con éxito.",
            category = "cards",
            channelId = CHANNEL_CARDS
        )
    }

    fun notifySecurityAlert(title: String, message: String) {
        sendPushNotification(
            title = title,
            message = message,
            category = "security",
            channelId = CHANNEL_SECURITY
        )
    }

    fun scheduleSimulatedPush(
        delaySeconds: Int,
        title: String,
        message: String,
        category: String
    ) {
        CoroutineScope(Dispatchers.Default).launch {
            delay(delaySeconds * 1000L)
            sendPushNotification(
                title = title,
                message = message,
                category = category,
                channelId = if (category == "security") CHANNEL_SECURITY else CHANNEL_TRANSFERS
            )
        }
    }

    fun notifyUpdateAvailable(versionName: String, releaseNotes: String, downloadUrl: String) {
        sendPushNotification(
            title = "🚀 Actualización disponible (v$versionName)",
            message = "Toca para instalar las últimas mejoras y funciones de Lumina Bank.",
            category = "updates",
            channelId = CHANNEL_UPDATES
        )
    }
}
