package com.example

import android.content.Context
import androidx.test.core.app.ApplicationProvider
import com.example.data.LuminaDatabase
import com.example.data.LuminaRepository
import com.example.data.supabase.SupabaseManager
import com.example.notification.LuminaNotificationManager
import com.example.security.PasswordHasher
import com.example.security.UserAuthManager
import kotlinx.coroutines.runBlocking
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertNotNull
import org.junit.Assert.assertTrue
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.annotation.Config

@RunWith(RobolectricTestRunner::class)
@Config(sdk = [34])
class AuthAndSecurityRobolectricTest {

    @Test
    fun `test password hashing and verification`() {
        val rawPassword = "MiPasswordSeguro2026*"
        val hashed = PasswordHasher.hashPassword(rawPassword)

        assertTrue("Hash must not be empty", hashed.isNotEmpty())
        assertTrue("Password must verify with its hash", PasswordHasher.verifyPassword(rawPassword, hashed))
        assertFalse("Wrong password must fail", PasswordHasher.verifyPassword("OtraPassword", hashed))
    }

    @Test
    fun `test user auth manager credentials and repeated password check`() {
        val context = ApplicationProvider.getApplicationContext<Context>()
        val authManager = UserAuthManager(context)
        authManager.clearAllCredentials()

        val username = "klopez26"
        val password = "ClaveUnica2026*"
        val email = "keren@test.com"
        val fullName = "Keren Lopez"
        val accountNumber = "HN12345678"

        // Save credentials
        authManager.saveCredentials(fullName, username, email, "", password, accountNumber)

        // Verify authentication
        val authResult = authManager.authenticate(username, password)
        assertTrue("Authentication with username must succeed", authResult.isSuccess)
        assertEquals(accountNumber, authResult.accountNumber)

        val authByEmail = authManager.authenticate(email, password)
        assertTrue("Authentication with email must succeed", authByEmail.isSuccess)

        // Verify repeated password detection
        assertTrue("Password should be flagged as already used", authManager.isPasswordUsedAnywhere(password))
        assertFalse("New password should not be flagged", authManager.isPasswordUsedAnywhere("PasswordTotalmenteNueva123*"))

        // Verify known device usernames
        val knownUsers = authManager.getAllKnownUsernames()
        assertTrue("Known usernames should include $username", knownUsers.contains(username))
    }

    @Test
    fun `test username suggestions logic rules`() {
        val fullName = "Keren Lopez"
        val clean = fullName.trim()
            .lowercase()
            .replace("á", "a")
            .replace("é", "e")
            .replace("í", "i")
            .replace("ó", "o")
            .replace("ú", "u")
            .replace("ñ", "n")
            .replace(Regex("[^a-z0-9\\s]"), "")
        val parts = clean.split(Regex("\\s+")).filter { it.isNotBlank() }

        val f = parts[0]
        val l = if (parts.size > 1) parts[1] else ""
        val year = "26"

        val raw = mutableListOf<String>()
        val fInit = f.take(1)
        raw.add((fInit + l).take(10) + year)
        raw.add((f + l).take(12))
        raw.add((fInit + l).take(9) + "dev")

        assertEquals(3, raw.size)
        for (item in raw) {
            assertTrue("Username must be <= 12 characters", item.length <= 12)
            assertTrue("Username must be alphanumeric only", item.all { it.isLetterOrDigit() })
            assertFalse("Username must not contain spaces", item.contains(" "))
        }
    }

    @Test
    fun `test account soft delete persistence in database`() = runBlocking {
        val context = ApplicationProvider.getApplicationContext<Context>()
        val database = LuminaDatabase.getInstance(context)
        val repository = LuminaRepository.getInstance(context)

        // Register a test account
        val newAccount = repository.registerNewAccount(
            fullName = "Test User",
            username = "testuser26",
            email = "testuser@lumina.hn",
            phone = "+504 9999-0000",
            password = "TestPassword2026*",
            initialBalance = 15000.0
        )

        assertNotNull(newAccount)
        val accNumber = newAccount.accountNumber

        // Soft delete the account
        repository.deleteAccount(accNumber)

        // Historical query must still retain the account
        val historicalAccounts = database.accountDao().getAllAccountsHistorical()
        val found = historicalAccounts.firstOrNull { it.accountNumber == accNumber }
        assertNotNull("Account must never be physically deleted", found)
        assertFalse("Account should be marked inactive (soft delete)", found!!.isActive)
    }
}
