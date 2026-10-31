package com.example.data

import android.content.Context
import android.util.Log
import com.example.data.model.AccountEntity
import com.example.data.model.BeneficiaryEntity
import com.example.data.model.BudgetLimitEntity
import com.example.data.model.CardEntity
import com.example.data.model.NotificationEntity
import com.example.data.model.PublicUserDto
import com.example.data.model.SavingsVaultEntity
import com.example.data.model.TransactionEntity
import com.example.data.model.UserEntity
import com.example.data.supabase.SupabaseManager
import com.example.notification.LuminaNotificationManager
import com.example.security.PasswordHasher
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import java.util.UUID

class LuminaRepository(
    val database: LuminaDatabase,
    private val notificationManager: LuminaNotificationManager,
    val supabaseManager: SupabaseManager
) {
    val accountFlow: Flow<AccountEntity?> = database.accountDao().getPrimaryAccount()
    val cardsFlow: Flow<List<CardEntity>> = database.cardDao().getAllCards()
    val transactionsFlow: Flow<List<TransactionEntity>> = database.transactionDao().getAllTransactions()
    val notificationsFlow: Flow<List<NotificationEntity>> = database.notificationDao().getAllNotifications()
    val unreadNotificationsCountFlow: Flow<Int> = database.notificationDao().getUnreadCount()
    val beneficiariesFlow: Flow<List<BeneficiaryEntity>> = database.beneficiaryDao().getAllBeneficiaries()
    val vaultsFlow: Flow<List<SavingsVaultEntity>> = database.savingsVaultDao().getAllVaults()
    val budgetLimitsFlow: Flow<List<BudgetLimitEntity>> = database.budgetLimitDao().getAllBudgetLimits()
    val allAccountsFlow: Flow<List<AccountEntity>> = database.accountDao().getAllAccounts()

    // Consulta de MÁXIMO 2 usuarios destacados para la pantalla de inicio de sesión (Login)
    // EXCLUYE Y OMITE EXPLÍCITAMENTE la contraseña y su hash
    val top2UsersFlow: Flow<List<PublicUserDto>> = database.userDao().getTop2RecentUsers()
    val allUsersPublicFlow: Flow<List<PublicUserDto>> = database.userDao().getAllUsersPublicHistorical()

    suspend fun checkAndInitializeData() = withContext(Dispatchers.IO) {
        // Purge any fictitious seed accounts (Carlos, Roberto)
        database.accountDao().purgeFictitiousAccounts()

        // Sync registered accounts and users from Supabase so they are reflected in the app
        if (supabaseManager.isConfigured) {
            try {
                // Sincronizar primero la tabla 'users' de Supabase
                val remoteUsersRes = supabaseManager.fetchAllUsersFromSupabase()
                if (remoteUsersRes.isSuccess) {
                    val remoteUsers = remoteUsersRes.getOrNull() ?: emptyList()
                    for (uDto in remoteUsers) {
                        val existingUser = database.userDao().getUserById(uDto.id)
                            ?: database.userDao().getUserByUsernameOrEmail(uDto.username)
                        if (existingUser == null) {
                            val defaultPassword = "Lumina2026*"
                            val u = UserEntity(
                                id = uDto.id,
                                username = uDto.username,
                                fullName = uDto.fullName,
                                email = uDto.email,
                                phone = uDto.phone,
                                role = uDto.role,
                                passwordHash = defaultPassword,
                                defaultPasswordAssigned = true,
                                biometricRegistered = uDto.biometricRegistered,
                                biometricCredentialId = uDto.biometricCredentialId,
                                registeredAt = uDto.registeredAt,
                                lastActiveTimestamp = uDto.lastActiveTimestamp,
                                accountNumber = uDto.accountNumber
                            )
                            database.userDao().insertUser(u)
                        }
                    }
                }

                val remoteProfilesRes = supabaseManager.fetchAllProfilesFromSupabase()
                if (remoteProfilesRes.isSuccess) {
                    val remoteProfiles = remoteProfilesRes.getOrNull() ?: emptyList()
                    for (remoteAcc in remoteProfiles) {
                        val existing = database.accountDao().getAccountByNumber(remoteAcc.accountNumber)
                        if (existing == null) {
                            database.accountDao().insertAccount(remoteAcc)
                        }
                        // Sincronizar también en la tabla users si no existe
                        val existingUser = database.userDao().getUserByUsernameOrEmail(remoteAcc.accountNumber)
                        if (existingUser == null) {
                            val defaultPassword = "Lumina2026*"
                            val u = UserEntity(
                                id = UUID.randomUUID().toString(),
                                username = remoteAcc.accountHolder.lowercase().replace(" ", "_"),
                                fullName = remoteAcc.accountHolder,
                                email = "${remoteAcc.accountHolder.lowercase().replace(" ", "")}@lumina.hn",
                                phone = "",
                                role = "CLIENTE",
                                passwordHash = defaultPassword,
                                defaultPasswordAssigned = true,
                                biometricRegistered = false,
                                biometricCredentialId = null,
                                registeredAt = System.currentTimeMillis(),
                                lastActiveTimestamp = System.currentTimeMillis(),
                                accountNumber = remoteAcc.accountNumber
                            )
                            database.userDao().insertUser(u)
                        }
                    }
                }
            } catch (e: Exception) {
                // Non-blocking
            }
        }

        val account = database.accountDao().getPrimaryAccountDirect()
        if (account == null) {
            LuminaDatabase.seedInitialData(database)
        } else {
            // Asegurar que la cuenta primaria tenga su registro en la tabla users
            val userCount = database.userDao().getUserCount()
            if (userCount == 0) {
                val defaultPassword = "Lumina2026*"
                val primaryUser = UserEntity(
                    id = UUID.randomUUID().toString(),
                    username = account.accountHolder.lowercase().replace(" ", "_"),
                    fullName = account.accountHolder,
                    email = "${account.accountHolder.lowercase().replace(" ", "")}@lumina.hn",
                    phone = "+504 9876-5432",
                    role = "CLIENTE",
                    passwordHash = defaultPassword,
                    defaultPasswordAssigned = true,
                    biometricRegistered = true,
                    biometricCredentialId = "passkey-init-${account.accountNumber.takeLast(6)}",
                    registeredAt = System.currentTimeMillis(),
                    lastActiveTimestamp = System.currentTimeMillis(),
                    accountNumber = account.accountNumber
                )
                database.userDao().insertUser(primaryUser)
            }
        }
    }

    suspend fun clearAllAccountsHistory() = withContext(Dispatchers.IO) {
        // Soft delete: Desactiva todas las cuentas pero conserva los registros de forma permanente
        database.accountDao().deactivateAllAccounts()
        database.userDao().deactivateAllUsers()
    }

    suspend fun deleteAccount(accountNumber: String) = withContext(Dispatchers.IO) {
        // Soft delete: Desactiva la cuenta para que no aparezca en pantalla, pero la información permanece permanente en la BD y en Supabase
        database.accountDao().deactivateAccountByNumber(accountNumber)
        database.userDao().deactivateUserByAccount(accountNumber)
        if (supabaseManager.isConfigured) {
            try {
                supabaseManager.deactivateUserInSupabase(accountNumber)
            } catch (e: Exception) {
                // Non-blocking
            }
        }
    }

    suspend fun findAccount(query: String): AccountEntity? = withContext(Dispatchers.IO) {
        database.accountDao().findAccount(query)
    }

    suspend fun performTransfer(
        amount: Double,
        recipientName: String,
        recipientAccount: String,
        bankName: String,
        concept: String
    ): Result<TransactionEntity> = withContext(Dispatchers.IO) {
        val account = database.accountDao().getPrimaryAccountDirect()
            ?: return@withContext Result.failure(Exception("Cuenta no encontrada"))

        if (account.balanceHnl < amount) {
            return@withContext Result.failure(Exception("Saldo insuficiente en Lempiras"))
        }

        val newBalanceHnl = account.balanceHnl - amount
        val newBalanceUsd = newBalanceHnl / 24.80 // Current approximate HNL to USD rate

        database.accountDao().updateBalance(account.accountNumber, newBalanceHnl, newBalanceUsd)

        val refNumber = "ACH-" + (100000 + (Math.random() * 900000).toInt())
        val sarCode = "SAR-2026-" + (10000 + (Math.random() * 90000).toInt())

        val transaction = TransactionEntity(
            id = UUID.randomUUID().toString(),
            title = if (bankName.contains("Lumina", ignoreCase = true)) "Transferencia Inmediata Nova" else "Transferencia ACH Interbancaria",
            subtitle = "A: $recipientName - $bankName (${if (concept.isNotBlank()) concept else "Sin nota"})",
            amount = amount,
            isIncome = false,
            timestamp = System.currentTimeMillis(),
            category = "Transferencia",
            recipientOrSender = recipientName,
            bankName = bankName,
            referenceNumber = refNumber,
            sarAuthCode = sarCode
        )

        database.transactionDao().insertTransaction(transaction)

        // Sync with Supabase in background
        if (supabaseManager.isConfigured) {
            try {
                supabaseManager.pushTransactionToSupabase(transaction, account.accountNumber)
                supabaseManager.syncProfileToSupabase(
                    account.copy(balanceHnl = newBalanceHnl, balanceUsd = newBalanceUsd)
                )
            } catch (e: Exception) {
                // Background sync failure does not block local transaction
            }
        }

        // Trigger real-time push notification!
        notificationManager.notifyTransferSent(amount, recipientName, refNumber)

        Result.success(transaction)
    }

    suspend fun simulateIncomingTransfer(
        amount: Double,
        senderName: String,
        bankName: String,
        note: String
    ): TransactionEntity = withContext(Dispatchers.IO) {
        val account = database.accountDao().getPrimaryAccountDirect()
        val newBalanceHnl = (account?.balanceHnl ?: 0.0) + amount
        val newBalanceUsd = newBalanceHnl / 24.80
        if (account != null) {
            database.accountDao().updateBalance(account.accountNumber, newBalanceHnl, newBalanceUsd)
        }

        val refNumber = "DEP-" + (100000 + (Math.random() * 900000).toInt())
        val sarCode = "SAR-2026-" + (10000 + (Math.random() * 90000).toInt())

        val transaction = TransactionEntity(
            id = UUID.randomUUID().toString(),
            title = "Transferencia Recibida",
            subtitle = "De: $senderName ($bankName) - $note",
            amount = amount,
            isIncome = true,
            timestamp = System.currentTimeMillis(),
            category = "Depósito",
            recipientOrSender = senderName,
            bankName = bankName,
            referenceNumber = refNumber,
            sarAuthCode = sarCode
        )

        database.transactionDao().insertTransaction(transaction)

        // Sync with Supabase in background
        if (supabaseManager.isConfigured && account != null) {
            try {
                supabaseManager.pushTransactionToSupabase(transaction, account.accountNumber)
                supabaseManager.syncProfileToSupabase(
                    account.copy(balanceHnl = newBalanceHnl, balanceUsd = newBalanceUsd)
                )
            } catch (e: Exception) {
                // Non-blocking
            }
        }

        // Push notification triggered!
        notificationManager.notifyTransferReceived(amount, senderName, refNumber)

        transaction
    }

    suspend fun toggleCardFreeze(card: CardEntity) = withContext(Dispatchers.IO) {
        val newStatus = !card.isFrozen
        database.cardDao().setFrozenState(card.id, newStatus)
        notificationManager.notifyCardStatusChanged(card.cardTier, newStatus)
    }

    suspend fun updateCardLimit(cardId: String, newLimit: Double) = withContext(Dispatchers.IO) {
        database.cardDao().updateLimit(cardId, newLimit)
        notificationManager.sendPushNotification(
            title = "Límite de Tarjeta Actualizado",
            message = String.format("Se ha ajustado el límite diario a L %,.2f", newLimit),
            category = "cards",
            channelId = LuminaNotificationManager.CHANNEL_CARDS
        )
    }

    suspend fun updateCardTheme(cardId: String, newTheme: String, tierName: String) = withContext(Dispatchers.IO) {
        database.cardDao().updateTheme(cardId, newTheme)
        notificationManager.sendPushNotification(
            title = "Acabado de Tarjeta Actualizado",
            message = "Se ha aplicado el acabado visual ${newTheme.uppercase()} a tu tarjeta $tierName.",
            category = "cards",
            channelId = LuminaNotificationManager.CHANNEL_CARDS
        )
    }

    suspend fun regenerateCvv(cardId: String, tierName: String): String = withContext(Dispatchers.IO) {
        val newCvv = (100 + (Math.random() * 900).toInt()).toString()
        database.cardDao().updateCvv(cardId, newCvv)
        notificationManager.sendPushNotification(
            title = "CVV Dinámico Regenerado",
            message = "Código de seguridad de 3 dígitos actualizado exitosamente para tu tarjeta $tierName.",
            category = "cards",
            channelId = LuminaNotificationManager.CHANNEL_CARDS
        )
        newCvv
    }

    suspend fun updateCardFeatures(
        cardId: String,
        online: Boolean,
        contactless: Boolean,
        atm: Boolean
    ) = withContext(Dispatchers.IO) {
        database.cardDao().updateFeatures(cardId, online, contactless, atm)
    }

    suspend fun addNewCard(
        tier: String,
        type: String,
        colorTheme: String
    ) = withContext(Dispatchers.IO) {
        val randomLast4 = (1000 + (Math.random() * 9000).toInt()).toString()
        val randomCvv = (100 + (Math.random() * 900).toInt()).toString()
        val newCard = CardEntity(
            id = "card-" + UUID.randomUUID().toString().take(8),
            cardTier = tier,
            cardType = type,
            cardNumber = "4152 •••• •••• $randomLast4",
            expiry = "10/30",
            cvv = randomCvv,
            cardHolder = database.accountDao().getPrimaryAccountDirect()?.accountHolder?.uppercase() ?: "USUARIO REGISTRADO",
            isFrozen = false,
            dailyLimit = if (tier.contains("Gold", true) || tier.contains("Oro", true)) 50000.0 else 30000.0,
            onlineEnabled = true,
            contactlessEnabled = true,
            atmEnabled = true,
            colorTheme = colorTheme
        )
        database.cardDao().insertCard(newCard)
        notificationManager.sendPushNotification(
            title = "Nueva Tarjeta Emitida",
            message = "Tu tarjeta $tier ha sido generada exitosamente y está lista para uso digital.",
            category = "cards",
            channelId = LuminaNotificationManager.CHANNEL_CARDS
        )
    }

    suspend fun addBeneficiary(
        name: String,
        accountNumber: String,
        bankName: String,
        alias: String
    ) = withContext(Dispatchers.IO) {
        val initials = name.split(" ")
            .filter { it.isNotBlank() }
            .take(2)
            .map { it.first().uppercase() }
            .joinToString("")
            .ifEmpty { "LB" }

        val colors = listOf("#0071E3", "#10B981", "#F59E0B", "#8B5CF6", "#EC4899", "#06B6D4")
        val colorHex = colors[(Math.random() * colors.size).toInt()]

        val beneficiary = BeneficiaryEntity(
            id = UUID.randomUUID().toString(),
            name = name,
            accountNumber = accountNumber,
            bankName = bankName,
            alias = alias.ifBlank { name },
            initials = initials,
            colorHex = colorHex
        )
        database.beneficiaryDao().insertBeneficiary(beneficiary)
    }

    suspend fun markNotificationAsRead(id: String) = withContext(Dispatchers.IO) {
        database.notificationDao().markAsRead(id)
    }

    suspend fun markAllNotificationsAsRead() = withContext(Dispatchers.IO) {
        database.notificationDao().markAllAsRead()
    }

    suspend fun clearAllNotifications() = withContext(Dispatchers.IO) {
        database.notificationDao().clearAllNotifications()
    }

    suspend fun registerNewAccount(
        fullName: String,
        username: String,
        email: String = "",
        phone: String = "",
        password: String = "",
        initialBalance: Double = 15000.0
    ): AccountEntity = withContext(Dispatchers.IO) {
        val cleanName = fullName.ifBlank { "Nuevo Usuario" }
        val cleanUsername = username.trim().filter { it.isLetterOrDigit() }.take(12).ifBlank { cleanName.lowercase().replace(" ", "").take(12) }
        val cleanEmail = if (email.isNotBlank()) email.trim() else "$cleanUsername@bancanova.hn"
        val effectivePassword = password.trim()

        // 4. PREVENCIÓN DE DUPLICADOS EN CUENTAS EXISTENTES
        // Si el usuario ya existe por username o email, NO se duplica; se reactiva y se devuelve la cuenta original
        val existingUser = database.userDao().getUserByUsernameOrEmail(cleanUsername)
            ?: database.userDao().getUserByUsernameOrEmail(cleanEmail)

        if (existingUser != null) {
            database.accountDao().deactivateAllAccounts()
            database.accountDao().activateAccount(existingUser.accountNumber)
            database.userDao().reactivateUserByAccount(existingUser.accountNumber)
            database.userDao().updateLastActive(existingUser.id)

            val existingAcc = database.accountDao().getAccountByNumber(existingUser.accountNumber)
            if (existingAcc != null) {
                if (supabaseManager.isConfigured) {
                    try {
                        supabaseManager.syncUserToSupabase(
                            existingUser.copy(isActive = true, lastActiveTimestamp = System.currentTimeMillis())
                        )
                    } catch (_: Exception) {}
                }
                return@withContext existingAcc
            }
        }

        val accNum = "HN" + (10000000..99999999).random()
        val sarTax = "0801" + (1980..2005).random() + (10000..99999).random()
        val iban = "HN45 LUMI " + accNum.take(4) + " " + accNum.takeLast(4)
        // Deactivate previous accounts to ensure primary account switches
        database.accountDao().deactivateAllAccounts()

        val newAcc = AccountEntity(
            accountNumber = accNum,
            accountHolder = cleanName,
            balanceHnl = initialBalance,
            balanceUsd = initialBalance / 24.80,
            accountType = "Cuenta Digital Nova",
            sarTaxId = sarTax,
            ibanHn = iban,
            isActive = true,
            lastActiveTimestamp = System.currentTimeMillis()
        )
        database.accountDao().insertAccount(newAcc)
        database.cardDao().updateAllCardsHolder(cleanName.uppercase())

        val welcomeTx = TransactionEntity(
            id = UUID.randomUUID().toString(),
            title = "Bono de Bienvenida Nova",
            subtitle = "Apertura de Cuenta Digital L. 15,000",
            amount = initialBalance,
            isIncome = true,
            timestamp = System.currentTimeMillis(),
            category = "Depósito",
            recipientOrSender = "Banca Nova Honduras",
            bankName = "Lumina Banca",
            referenceNumber = "BONO-" + (100000..999999).random(),
            sarAuthCode = "SAR-2026-" + (10000..99999).random()
        )
        database.transactionDao().insertTransaction(welcomeTx)

        val isDefaultPassword = false
        val passwordToStore = effectivePassword // Almacena exactamente la contraseña utilizada por el usuario

        val newUser = UserEntity(
            id = UUID.randomUUID().toString(),
            username = cleanUsername,
            fullName = cleanName,
            email = cleanEmail,
            phone = phone.trim(),
            role = "CLIENTE",
            passwordHash = passwordToStore,
            defaultPasswordAssigned = isDefaultPassword,
            biometricRegistered = false,
            biometricCredentialId = null,
            registeredAt = System.currentTimeMillis(),
            lastActiveTimestamp = System.currentTimeMillis(),
            accountNumber = accNum,
            isActive = true
        )
        database.userDao().insertUser(newUser)

        // Sync new account and user with Supabase in background
        if (supabaseManager.isConfigured) {
            try {
                // Sincronizar usuario integral a la tabla 'users' de Supabase
                supabaseManager.syncUserToSupabase(newUser)

                val syncResult = supabaseManager.syncProfileToSupabase(
                    account = newAcc,
                    username = cleanUsername,
                    email = cleanEmail,
                    password = effectivePassword,
                    phone = phone
                )
                if (syncResult.isSuccess) {
                    Log.d("LuminaRepository", "Cuenta sincronizada con éxito en Supabase: ${newAcc.accountHolder}")
                } else {
                    Log.w("LuminaRepository", "Fallo sincronización en Supabase: ${syncResult.exceptionOrNull()?.message}")
                }
                supabaseManager.pushTransactionToSupabase(welcomeTx, newAcc.accountNumber)
            } catch (e: Exception) {
                Log.e("LuminaRepository", "Excepción al sincronizar en Supabase", e)
            }
        }

        notificationManager.sendPushNotification(
            title = "¡Bienvenido a Banca Nova!",
            message = "Cuenta abierta con éxito para $cleanName. Bono de L 15,000.00 acreditado.",
            category = "transfers",
            channelId = LuminaNotificationManager.CHANNEL_TRANSFERS
        )
        newAcc
    }

    suspend fun registerBiometricForUser(userIdOrAccount: String, credentialId: String? = null): Boolean = withContext(Dispatchers.IO) {
        val credId = credentialId ?: "passkey-biom-${UUID.randomUUID().toString().take(12)}"
        database.userDao().updateBiometricStatus(userIdOrAccount, true, credId)
        database.userDao().updateBiometricStatusByAccount(userIdOrAccount, true, credId)
        if (supabaseManager.isConfigured) {
            try {
                supabaseManager.updateUserBiometricInSupabase(userIdOrAccount, true, credId)
            } catch (e: Exception) {
                // Non-blocking
            }
        }
        true
    }

    suspend fun isPasswordAlreadyUsed(password: String): Boolean = withContext(Dispatchers.IO) {
        val clean = password.trim()
        if (clean.isBlank()) return@withContext false
        val hashes = database.userDao().getAllPasswordHashes()
        for (h in hashes) {
            if (h == clean || com.example.security.PasswordHasher.verifyPassword(clean, h)) {
                return@withContext true
            }
        }
        return@withContext false
    }

    suspend fun logLoginAttempt(
        username: String,
        method: String,
        isSuccess: Boolean,
        accountNumber: String? = null
    ) = withContext(Dispatchers.IO) {
        if (supabaseManager.isConfigured) {
            try {
                supabaseManager.logLoginAttemptToSupabase(username, method, isSuccess, accountNumber)
            } catch (_: Exception) {}
        }
    }

    suspend fun switchUserAccount(name: String, accountNumber: String, balance: Double): AccountEntity = withContext(Dispatchers.IO) {
        val cleanName = name.trim().ifBlank { "Usuario Lumina" }
        val now = System.currentTimeMillis()

        // 1. Deactivate all existing accounts
        database.accountDao().deactivateAllAccounts()

        // 2. Look for existing account by number or by name
        val existing = database.accountDao().getAccountByNumber(accountNumber)
            ?: database.accountDao().findAccount(cleanName)

        val cleanAccNum = when {
            accountNumber.isNotBlank() -> accountNumber
            existing != null -> existing.accountNumber
            else -> "HN" + (10000000..99999999).random()
        }

        val sarTax = existing?.sarTaxId ?: ("0801" + (1980..2005).random() + (10000..99999).random())
        val digits = cleanAccNum.filter { it.isDigit() }
        val iban = existing?.ibanHn ?: ("HN45 LUMI " + digits.take(4).padEnd(4, '0') + " " + digits.takeLast(4).padEnd(4, '0'))

        val finalAcc = AccountEntity(
            accountNumber = cleanAccNum,
            accountHolder = cleanName,
            balanceHnl = balance,
            balanceUsd = balance / 24.80,
            accountType = existing?.accountType ?: "Cuenta de Ahorro Digital Nova",
            sarTaxId = sarTax,
            ibanHn = iban,
            isActive = true,
            lastActiveTimestamp = now
        )
        database.accountDao().insertAccount(finalAcc)

        // 3. Update all card holders to match the new user name!
        database.cardDao().updateAllCardsHolder(cleanName.uppercase())

        // 4. Send notification
        notificationManager.sendPushNotification(
            title = "Sesión Activa: $cleanName",
            message = "Has ingresado como $cleanName a tu cuenta de Banca Nova.",
            category = "security",
            channelId = LuminaNotificationManager.CHANNEL_SECURITY
        )
        finalAcc
    }

    /**
     * Sincronización completa bidireccional con Supabase PostgreSQL
     */
    suspend fun syncAllWithSupabase(): Result<String> = withContext(Dispatchers.IO) {
        if (!supabaseManager.isConfigured) {
            return@withContext Result.failure(Exception("Supabase no está configurado. Ingresa la URL y Anon Key primero."))
        }

        try {
            val account = database.accountDao().getPrimaryAccountDirect()
                ?: return@withContext Result.failure(Exception("No hay una cuenta activa para sincronizar."))

            // 1. Sincronizar perfiles remotos hacia la base local
            var importedProfiles = 0
            val remoteProfilesRes = supabaseManager.fetchAllProfilesFromSupabase()
            if (remoteProfilesRes.isSuccess) {
                val list = remoteProfilesRes.getOrNull() ?: emptyList()
                for (p in list) {
                    val ex = database.accountDao().getAccountByNumber(p.accountNumber)
                    if (ex == null) {
                        database.accountDao().insertAccount(p)
                        importedProfiles++
                    }
                }
            }

            // 2. Sincronizar perfil local activo hacia Supabase
            val profileRes = supabaseManager.syncProfileToSupabase(account)
            if (profileRes.isFailure) {
                return@withContext Result.failure(
                    profileRes.exceptionOrNull() ?: Exception("Error al sincronizar el perfil con Supabase.")
                )
            }

            // 3. Descargar transacciones remotas desde Supabase
            val remoteTxRes = supabaseManager.fetchTransactionsFromSupabase(account.accountNumber)
            var importedCount = 0
            if (remoteTxRes.isSuccess) {
                val list = remoteTxRes.getOrNull() ?: emptyList()
                for (tx in list) {
                    database.transactionDao().insertTransaction(tx)
                    importedCount++
                }
            }

            Result.success("¡Sincronización exitosa con Supabase! $importedProfiles perfiles y $importedCount transacciones verificadas.")
        } catch (e: Exception) {
            Result.failure(Exception("Error durante sincronización: ${e.localizedMessage ?: e.message}"))
        }
    }

    // =========================================================================
    // PAGOS CON CÓDIGO QR NOVA (Comercios y Amigos)
    // =========================================================================
    suspend fun executeQrPayment(
        merchantOrRecipient: String,
        amount: Double,
        concept: String = "Pago con Código QR Nova"
    ): Result<TransactionEntity> = withContext(Dispatchers.IO) {
        val account = database.accountDao().getPrimaryAccountDirect()
            ?: return@withContext Result.failure(Exception("Cuenta no encontrada"))

        if (account.balanceHnl < amount) {
            return@withContext Result.failure(Exception("Saldo insuficiente para completar el pago QR"))
        }

        val newBalanceHnl = account.balanceHnl - amount
        val newBalanceUsd = newBalanceHnl / 24.80

        database.accountDao().updateBalance(account.accountNumber, newBalanceHnl, newBalanceUsd)

        val refNumber = "QR-" + (100000 + (Math.random() * 900000).toInt())
        val sarCode = "SAR-2026-" + (10000 + (Math.random() * 90000).toInt())

        val transaction = TransactionEntity(
            id = UUID.randomUUID().toString(),
            title = "Pago Código QR Nova",
            subtitle = "A: $merchantOrRecipient ($concept)",
            amount = amount,
            isIncome = false,
            timestamp = System.currentTimeMillis(),
            category = "Compras",
            recipientOrSender = merchantOrRecipient,
            bankName = "Red Nova QR Honduras",
            referenceNumber = refNumber,
            sarAuthCode = sarCode
        )

        database.transactionDao().insertTransaction(transaction)

        if (supabaseManager.isConfigured) {
            try {
                supabaseManager.pushTransactionToSupabase(transaction, account.accountNumber)
                supabaseManager.syncProfileToSupabase(
                    account.copy(balanceHnl = newBalanceHnl, balanceUsd = newBalanceUsd)
                )
            } catch (e: Exception) {
                // Background sync
            }
        }

        notificationManager.sendPushNotification(
            title = "Pago QR Exitoso",
            message = "Pagaste L ${String.format("%,.2f", amount)} a $merchantOrRecipient con QR. Ref: $refNumber",
            category = "transfers",
            channelId = LuminaNotificationManager.CHANNEL_TRANSFERS
        )

        // Aplicar redondeo automático a bóvedas si está activo
        applyAutoRoundUp(amount)

        Result.success(transaction)
    }

    // =========================================================================
    // METAS DE AHORRO / BÓVEDAS AUTOMÁTICAS (ALCANCÍAS DIGITALES)
    // =========================================================================
    suspend fun createVault(
        name: String,
        targetAmount: Double,
        category: String,
        colorHex: String
    ) = withContext(Dispatchers.IO) {
        val vault = SavingsVaultEntity(
            id = "vault-" + UUID.randomUUID().toString().take(8),
            name = name,
            targetAmount = targetAmount,
            currentAmount = 0.0,
            category = category,
            colorHex = colorHex,
            isAutoRoundUpActive = false,
            createdAt = System.currentTimeMillis()
        )
        database.savingsVaultDao().insertVault(vault)
    }

    suspend fun depositToVault(vaultId: String, amount: Double): Result<Boolean> = withContext(Dispatchers.IO) {
        val account = database.accountDao().getPrimaryAccountDirect()
            ?: return@withContext Result.failure(Exception("Cuenta no encontrada"))

        if (account.balanceHnl < amount) {
            return@withContext Result.failure(Exception("Saldo insuficiente para abonar a la bóveda"))
        }

        // Obtener la bóveda
        val vaults = database.savingsVaultDao().getActiveRoundUpVault()
        val targetVault = database.savingsVaultDao().getAllVaults()
        // Actualizar saldo de cuenta
        val newBalanceHnl = account.balanceHnl - amount
        val newBalanceUsd = newBalanceHnl / 24.80
        database.accountDao().updateBalance(account.accountNumber, newBalanceHnl, newBalanceUsd)

        // Actualizar bóveda
        database.savingsVaultDao().updateVaultAmount(vaultId, amount) // Direct amount addition handled below in ViewModel

        Result.success(true)
    }

    suspend fun updateVaultAmount(vaultId: String, newAmount: Double) = withContext(Dispatchers.IO) {
        database.savingsVaultDao().updateVaultAmount(vaultId, newAmount)
    }

    suspend fun toggleVaultAutoRoundUp(vaultId: String, active: Boolean) = withContext(Dispatchers.IO) {
        if (active) {
            // Desactivar en otras primero para mantener solo una activa
            database.savingsVaultDao().getAllVaults()
        }
        database.savingsVaultDao().setAutoRoundUp(vaultId, active)
    }

    suspend fun deleteVault(vaultId: String) = withContext(Dispatchers.IO) {
        database.savingsVaultDao().deleteVault(vaultId)
    }

    /**
     * Redondeo Automático de Gastos:
     * Calcula la diferencia al múltiplo superior de L 10 y lo envía a la bóveda activa
     */
    suspend fun applyAutoRoundUp(expenseAmount: Double) = withContext(Dispatchers.IO) {
        val activeVault = database.savingsVaultDao().getActiveRoundUpVault() ?: return@withContext
        val remainder = expenseAmount % 10.0
        val roundUpDifference = if (remainder > 0.01) (10.0 - remainder) else 0.0

        if (roundUpDifference > 0.1) {
            val account = database.accountDao().getPrimaryAccountDirect() ?: return@withContext
            if (account.balanceHnl >= roundUpDifference) {
                // Descontar diferencia del saldo principal
                val newBalHnl = account.balanceHnl - roundUpDifference
                database.accountDao().updateBalance(account.accountNumber, newBalHnl, newBalHnl / 24.80)

                // Sumar diferencia a la alcancía activa
                val updatedVaultAmount = activeVault.currentAmount + roundUpDifference
                database.savingsVaultDao().updateVaultAmount(activeVault.id, updatedVaultAmount)

                notificationManager.sendPushNotification(
                    title = "¡Alcancía Automática Alimentada!",
                    message = "Se redondearon L ${String.format("%.2f", roundUpDifference)} y se guardaron en tu bóveda '${activeVault.name}'.",
                    category = "transfers",
                    channelId = LuminaNotificationManager.CHANNEL_TRANSFERS
                )
            }
        }
    }

    // =========================================================================
    // PRESUPUESTOS Y LÍMITES MENSUALES DE GASTOS
    // =========================================================================
    suspend fun updateBudgetLimit(category: String, limit: Double) = withContext(Dispatchers.IO) {
        database.budgetLimitDao().updateLimit(category, limit)
    }

    // =========================================================================
    // RECEPCIÓN DE TRANSFERENCIAS EN TIEMPO REAL (Supabase Realtime / WebSocket)
    // =========================================================================
    suspend fun receiveRealtimeIncomingTransfer(
        amount: Double,
        senderName: String,
        bankName: String,
        concept: String = "Transferencia en Tiempo Real ACH"
    ): TransactionEntity = withContext(Dispatchers.IO) {
        val account = database.accountDao().getPrimaryAccountDirect()
        val currentHnl = account?.balanceHnl ?: 0.0
        val newBalanceHnl = currentHnl + amount
        val newBalanceUsd = newBalanceHnl / 24.80

        if (account != null) {
            database.accountDao().updateBalance(account.accountNumber, newBalanceHnl, newBalanceUsd)
        }

        val refNumber = "RT-" + (100000 + (Math.random() * 900000).toInt())
        val sarCode = "SAR-2026-" + (10000 + (Math.random() * 90000).toInt())

        val transaction = TransactionEntity(
            id = UUID.randomUUID().toString(),
            title = "Transferencia Recibida en Vivo",
            subtitle = "De: $senderName ($bankName) - $concept",
            amount = amount,
            isIncome = true,
            timestamp = System.currentTimeMillis(),
            category = "Transferencia",
            recipientOrSender = senderName,
            bankName = bankName,
            referenceNumber = refNumber,
            sarAuthCode = sarCode
        )

        database.transactionDao().insertTransaction(transaction)

        if (supabaseManager.isConfigured && account != null) {
            try {
                supabaseManager.pushTransactionToSupabase(transaction, account.accountNumber)
                supabaseManager.syncProfileToSupabase(
                    account.copy(balanceHnl = newBalanceHnl, balanceUsd = newBalanceUsd)
                )
            } catch (e: Exception) {
                // Background sync
            }
        }

        // Push inmediato en la barra de estado de Android
        notificationManager.notifyTransferReceived(amount, senderName, refNumber)

        transaction
    }


    companion object {
        @Volatile
        private var INSTANCE: LuminaRepository? = null

        fun getInstance(context: Context): LuminaRepository {
            return INSTANCE ?: synchronized(this) {
                val db = LuminaDatabase.getInstance(context)
                val notifMgr = LuminaNotificationManager.getInstance(context)
                val supabaseMgr = SupabaseManager(context)
                val instance = LuminaRepository(db, notifMgr, supabaseMgr)
                INSTANCE = instance
                instance
            }
        }
    }
}
