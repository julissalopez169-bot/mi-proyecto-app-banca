package com.example.data.model

import androidx.room.Entity
import androidx.room.PrimaryKey

@Entity(tableName = "accounts")
data class AccountEntity(
    @PrimaryKey val accountNumber: String,
    val accountHolder: String,
    val balanceHnl: Double,
    val balanceUsd: Double,
    val accountType: String,
    val sarTaxId: String,
    val ibanHn: String,
    val isActive: Boolean = true,
    val lastActiveTimestamp: Long = System.currentTimeMillis()
)

@Entity(tableName = "cards")
data class CardEntity(
    @PrimaryKey val id: String,
    val cardTier: String, // "Zafiro Digital", "Oro 24K", "Titanium Black"
    val cardType: String, // "DÉBITO" / "CRÉDITO"
    val cardNumber: String,
    val expiry: String,
    val cvv: String,
    val cardHolder: String,
    val isFrozen: Boolean,
    val dailyLimit: Double,
    val onlineEnabled: Boolean,
    val contactlessEnabled: Boolean,
    val atmEnabled: Boolean,
    val colorTheme: String // "zafiro", "oro", "titanium", "esmeralda"
)

@Entity(tableName = "transactions")
data class TransactionEntity(
    @PrimaryKey val id: String,
    val title: String,
    val subtitle: String,
    val amount: Double,
    val isIncome: Boolean,
    val timestamp: Long,
    val category: String, // "Transferencia", "Depósito", "Compras", "Servicios"
    val recipientOrSender: String,
    val bankName: String,
    val referenceNumber: String,
    val sarAuthCode: String
)

@Entity(tableName = "notifications")
data class NotificationEntity(
    @PrimaryKey val id: String,
    val title: String,
    val message: String,
    val timestamp: Long,
    val category: String, // "transfers", "security", "cards", "system"
    val isRead: Boolean,
    val deepLink: String? = null
)

@Entity(tableName = "beneficiaries")
data class BeneficiaryEntity(
    @PrimaryKey val id: String,
    val name: String,
    val accountNumber: String,
    val bankName: String,
    val alias: String,
    val initials: String,
    val colorHex: String
)

@Entity(tableName = "savings_vaults")
data class SavingsVaultEntity(
    @PrimaryKey val id: String,
    val name: String,
    val targetAmount: Double,
    val currentAmount: Double,
    val category: String, // "Vacaciones", "Emergencias", "Auto", "Educación", "Hogar", "Metas"
    val colorHex: String,
    val isAutoRoundUpActive: Boolean = false,
    val createdAt: Long = System.currentTimeMillis()
)

@Entity(tableName = "budget_limits")
data class BudgetLimitEntity(
    @PrimaryKey val category: String, // "Restaurantes", "Servicios", "Compras", "Supermercado", "Transporte", "Otros"
    val monthlyLimit: Double,
    val colorHex: String = "#3B82F6",
    val iconName: String = "category"
)

/**
 * Entidad de Usuario del Sistema y Base de Datos (Room Database).
 * Almacena el registro integral de la cuenta:
 * ID, usuario, nombre completo, correo, teléfono, rol y hash de contraseña.
 * 
 * REGLA DE SEGURIDAD CRÍTICA:
 * La contraseña NUNCA se almacena en texto plano; únicamente se persiste
 * su hash criptográfico irreversible (PBKDF2/bcrypt) con sal criptográfica aleatoria.
 */
@Entity(tableName = "users")
data class UserEntity(
    @PrimaryKey val id: String,
    val username: String,
    val fullName: String,
    val email: String,
    val phone: String = "",
    val role: String = "CLIENTE",
    val passwordHash: String,
    val defaultPasswordAssigned: Boolean = false,
    val biometricRegistered: Boolean = false,
    val biometricCredentialId: String? = null,
    val registeredAt: Long = System.currentTimeMillis(),
    val lastActiveTimestamp: Long = System.currentTimeMillis(),
    val accountNumber: String,
    val isActive: Boolean = true
)

/**
 * DTO / Proyección Pública de Usuario para la Vista y Capa de Presentación.
 * REGLA ESTRICTA DE SEGURIDAD:
 * Excluye y omite EXPLÍCITAMENTE el campo de la contraseña y de su hash.
 * Garantiza que la interfaz de usuario y las respuestas jamás expongan credenciales.
 */
data class PublicUserDto(
    val id: String,
    val username: String,
    val fullName: String,
    val email: String,
    val phone: String = "",
    val role: String = "CLIENTE",
    val biometricRegistered: Boolean = false,
    val biometricCredentialId: String? = null,
    val registeredAt: Long = System.currentTimeMillis(),
    val lastActiveTimestamp: Long = System.currentTimeMillis(),
    val accountNumber: String,
    val isActive: Boolean = true
)

