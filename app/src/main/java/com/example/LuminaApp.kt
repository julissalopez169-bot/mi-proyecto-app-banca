package com.example

import android.app.Application
import com.example.data.LuminaRepository
import com.example.notification.LuminaNotificationManager
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch

class LuminaApp : Application() {
    lateinit var repository: LuminaRepository
        private set
    lateinit var notificationManager: LuminaNotificationManager
        private set

    override fun onCreate() {
        super.onCreate()
        notificationManager = LuminaNotificationManager.getInstance(this)
        repository = LuminaRepository.getInstance(this)

        CoroutineScope(Dispatchers.IO).launch {
            repository.checkAndInitializeData()
        }
    }
}
