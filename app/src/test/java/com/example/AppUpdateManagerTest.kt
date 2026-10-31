package com.example

import android.content.Context
import androidx.test.core.app.ApplicationProvider
import com.example.data.supabase.SupabaseManager
import com.example.notification.LuminaNotificationManager
import com.example.update.AppUpdateManager
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNotNull
import org.junit.Assert.assertTrue
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.annotation.Config

@RunWith(RobolectricTestRunner::class)
@Config(sdk = [34])
class AppUpdateManagerTest {

    @Test
    fun `test simulate update and snooze functionality`() {
        val context = ApplicationProvider.getApplicationContext<Context>()
        val supabaseManager = SupabaseManager(context)
        val notifManager = LuminaNotificationManager.getInstance(context)
        val updateManager = AppUpdateManager.getInstance(context, supabaseManager, notifManager)

        val update = updateManager.simulateUpdate(
            versionName = "2.0.0",
            versionCode = 5,
            releaseNotes = "Test update"
        )

        assertNotNull(update)
        assertEquals("2.0.0", update.versionName)
        assertEquals(5, update.versionCode)
        assertTrue(update.versionCode > updateManager.currentVersionCode)

        // Test snooze
        updateManager.snoozeUpdate(update.versionCode)
        updateManager.clearSnooze()
    }
}
