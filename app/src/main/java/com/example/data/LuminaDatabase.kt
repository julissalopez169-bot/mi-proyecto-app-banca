package com.example.data

import android.content.Context
import androidx.room.Database
import androidx.room.Room
import androidx.room.RoomDatabase
import androidx.sqlite.db.SupportSQLiteDatabase
import com.example.data.dao.AccountDao
import com.example.data.dao.BeneficiaryDao
import com.example.data.dao.BudgetLimitDao
import com.example.data.dao.CardDao
import com.example.data.dao.NotificationDao
import com.example.data.dao.SavingsVaultDao
import com.example.data.dao.TransactionDao
import com.example.data.dao.UserDao
import com.example.data.model.AccountEntity
import com.example.data.model.BeneficiaryEntity
import com.example.data.model.BudgetLimitEntity
import com.example.data.model.CardEntity
import com.example.data.model.NotificationEntity
import com.example.data.model.SavingsVaultEntity
import com.example.data.model.TransactionEntity
import com.example.data.model.UserEntity
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import java.util.UUID

@Database(
    entities = [
        UserEntity::class,
        AccountEntity::class,
        CardEntity::class,
        TransactionEntity::class,
        NotificationEntity::class,
        BeneficiaryEntity::class,
        SavingsVaultEntity::class,
        BudgetLimitEntity::class
    ],
    version = 4,
    exportSchema = false
)
abstract class LuminaDatabase : RoomDatabase() {

    abstract fun userDao(): UserDao
    abstract fun accountDao(): AccountDao
    abstract fun cardDao(): CardDao
    abstract fun transactionDao(): TransactionDao
    abstract fun notificationDao(): NotificationDao
    abstract fun beneficiaryDao(): BeneficiaryDao
    abstract fun savingsVaultDao(): SavingsVaultDao
    abstract fun budgetLimitDao(): BudgetLimitDao

    companion object {
        @Volatile
        private var INSTANCE: LuminaDatabase? = null

        fun getInstance(context: Context): LuminaDatabase {
            return INSTANCE ?: synchronized(this) {
                val instance = Room.databaseBuilder(
                    context.applicationContext,
                    LuminaDatabase::class.java,
                    "lumina_bank.db"
                )
                    .fallbackToDestructiveMigration(dropAllTables = true)
                    .addCallback(DatabaseCallback())
                    .build()
                INSTANCE = instance
                instance
            }
        }

        private class DatabaseCallback : RoomDatabase.Callback() {
            override fun onCreate(db: SupportSQLiteDatabase) {
                super.onCreate(db)
                // Seed initial data asynchronously
                CoroutineScope(Dispatchers.IO).launch {
                    val database = INSTANCE ?: return@launch
                    seedInitialData(database)
                }
            }
        }

        suspend fun seedInitialData(database: LuminaDatabase) {
            val now = System.currentTimeMillis()

            // 1. Historial de Cuentas limpio: Solo se mostrarán las cuentas que el usuario registre activamente

            // 2. Cards
            val initialCards = listOf(
                CardEntity(
                    id = "card-zafiro-01",
                    cardTier = "Zafiro Digital",
                    cardType = "DÉBITO",
                    cardNumber = "4152 •••• •••• 7719",
                    expiry = "08/29",
                    cvv = "842",
                    cardHolder = "JULISSA LÓPEZ",
                    isFrozen = false,
                    dailyLimit = 25000.0,
                    onlineEnabled = true,
                    contactlessEnabled = true,
                    atmEnabled = true,
                    colorTheme = "zafiro"
                ),
                CardEntity(
                    id = "card-oro-02",
                    cardTier = "Oro 24K Metálica",
                    cardType = "CRÉDITO",
                    cardNumber = "5234 •••• •••• 4401",
                    expiry = "12/28",
                    cvv = "319",
                    cardHolder = "CARLOS E MENDOZA",
                    isFrozen = false,
                    dailyLimit = 65000.0,
                    onlineEnabled = true,
                    contactlessEnabled = true,
                    atmEnabled = true,
                    colorTheme = "oro"
                ),
                CardEntity(
                    id = "card-titanium-03",
                    cardTier = "Titanium Black",
                    cardType = "PATRIMONIO",
                    cardNumber = "3782 •••• •••• 9012",
                    expiry = "05/30",
                    cvv = "773",
                    cardHolder = "CARLOS E MENDOZA",
                    isFrozen = false,
                    dailyLimit = 120000.0,
                    onlineEnabled = true,
                    contactlessEnabled = true,
                    atmEnabled = true,
                    colorTheme = "titanium"
                ),
                CardEntity(
                    id = "card-virtual-04",
                    cardTier = "Virtual Descartable",
                    cardType = "VIRTUAL",
                    cardNumber = "4512 •••• •••• 8831",
                    expiry = "10/31",
                    cvv = "519",
                    cardHolder = "CARLOS E MENDOZA",
                    isFrozen = false,
                    dailyLimit = 20000.0,
                    onlineEnabled = true,
                    contactlessEnabled = false,
                    atmEnabled = false,
                    colorTheme = "esmeralda"
                )
            )
            database.cardDao().insertAll(initialCards)

            // 3. Transactions
            val initialTransactions = listOf(
                TransactionEntity(
                    id = UUID.randomUUID().toString(),
                    title = "Transferencia ACH Inmediata",
                    subtitle = "A: Sofía Valladares - Ficohsa",
                    amount = 3500.00,
                    isIncome = false,
                    timestamp = now - 1000 * 60 * 45, // 45 mins ago
                    category = "Transferencia",
                    recipientOrSender = "Sofía Valladares",
                    bankName = "Banco Ficohsa",
                    referenceNumber = "ACH-774921",
                    sarAuthCode = "SAR-2026-90412"
                ),
                TransactionEntity(
                    id = UUID.randomUUID().toString(),
                    title = "Depósito de Nómina / Honorarios",
                    subtitle = "Lumina Enterprise Corp",
                    amount = 28500.00,
                    isIncome = true,
                    timestamp = now - 1000 * 60 * 60 * 18, // 18 hrs ago
                    category = "Depósito",
                    recipientOrSender = "Lumina Enterprise Corp",
                    bankName = "Lumina Bank",
                    referenceNumber = "DEP-993812",
                    sarAuthCode = "SAR-2026-11849"
                ),
                TransactionEntity(
                    id = UUID.randomUUID().toString(),
                    title = "Supermercados La Colonia",
                    subtitle = "Compra con Tarjeta Zafiro ••7719",
                    amount = 1845.20,
                    isIncome = false,
                    timestamp = now - 1000 * 60 * 60 * 32, // Yesterday
                    category = "Compras",
                    recipientOrSender = "La Colonia Próceres",
                    bankName = "POS Red Nova",
                    referenceNumber = "POS-449182",
                    sarAuthCode = "SAR-2026-88319"
                ),
                TransactionEntity(
                    id = UUID.randomUUID().toString(),
                    title = "Pago de Servicios ENEE Honduras",
                    subtitle = "Energía Eléctrica Residencia",
                    amount = 920.00,
                    isIncome = false,
                    timestamp = now - 1000 * 60 * 60 * 72, // 3 days ago
                    category = "Servicios",
                    recipientOrSender = "ENEE Honduras",
                    bankName = "Servicios Públicos",
                    referenceNumber = "SRV-102948",
                    sarAuthCode = "SAR-2026-74920"
                ),
                TransactionEntity(
                    id = UUID.randomUUID().toString(),
                    title = "Transferencia Recibida",
                    subtitle = "De: Roberto Durón - Atlántida",
                    amount = 4500.00,
                    isIncome = true,
                    timestamp = now - 1000 * 60 * 60 * 96,
                    category = "Transferencia",
                    recipientOrSender = "Roberto Durón",
                    bankName = "Banco Atlántida",
                    referenceNumber = "ACH-312984",
                    sarAuthCode = "SAR-2026-66291"
                )
            )
            database.transactionDao().insertAll(initialTransactions)

            // 4. Beneficiaries
            val initialBeneficiaries = listOf(
                BeneficiaryEntity(
                    id = "ben-1",
                    name = "Sofía Valladares",
                    accountNumber = "20-001-994123-1",
                    bankName = "Banco Ficohsa",
                    alias = "Sofi Ficohsa",
                    initials = "SV",
                    colorHex = "#38BDF8"
                ),
                BeneficiaryEntity(
                    id = "ben-2",
                    name = "Roberto Durón",
                    accountNumber = "11-402-832104-5",
                    bankName = "Banco Atlántida",
                    alias = "Roberto Atlántida",
                    initials = "RD",
                    colorHex = "#F59E0B"
                ),
                BeneficiaryEntity(
                    id = "ben-3",
                    name = "Elena Moncada",
                    accountNumber = "01-002-392184-7",
                    bankName = "Lumina Bank",
                    alias = "Elena Lumina",
                    initials = "EM",
                    colorHex = "#10B981"
                ),
                BeneficiaryEntity(
                    id = "ben-4",
                    name = "Marcos Andino",
                    accountNumber = "70-192-384729-0",
                    bankName = "BAC Credomatic",
                    alias = "Marcos BAC",
                    initials = "MA",
                    colorHex = "#EF4444"
                )
            )
            database.beneficiaryDao().insertAll(initialBeneficiaries)

            // 5. Initial Notifications
            val initialNotifications = listOf(
                NotificationEntity(
                    id = UUID.randomUUID().toString(),
                    title = "Bienvenido a Lumina Bank",
                    message = "Tu banca digital de alta velocidad en Lempiras está activa y asegurada con biometría.",
                    timestamp = now - 1000 * 60 * 120,
                    category = "system",
                    isRead = false
                ),
                NotificationEntity(
                    id = UUID.randomUUID().toString(),
                    title = "Seguridad Biométrica Activada",
                    message = "El acceso mediante huella dactilar y reconocimiento facial está listo para usarse.",
                    timestamp = now - 1000 * 60 * 90,
                    category = "security",
                    isRead = false
                ),
                NotificationEntity(
                    id = UUID.randomUUID().toString(),
                    title = "Depósito Acreditado",
                    message = "Has recibido L 28,500.00 de Lumina Enterprise Corp en tu cuenta.",
                    timestamp = now - 1000 * 60 * 60 * 18,
                    category = "transfers",
                    isRead = true
                )
            )
            database.notificationDao().insertAll(initialNotifications)

            // 6. Initial Savings Vaults ("Bóvedas de Ahorro / Alcancías Digitales")
            val initialVaults = listOf(
                SavingsVaultEntity(
                    id = "vault-emergencia-01",
                    name = "Fondo de Emergencia",
                    targetAmount = 50000.0,
                    currentAmount = 18500.0,
                    category = "Emergencias",
                    colorHex = "#10B981", // Emerald
                    isAutoRoundUpActive = true,
                    createdAt = now - 1000 * 60 * 60 * 24 * 30
                ),
                SavingsVaultEntity(
                    id = "vault-vacaciones-02",
                    name = "Vacaciones Roatán",
                    targetAmount = 25000.0,
                    currentAmount = 14200.0,
                    category = "Vacaciones",
                    colorHex = "#0EA5E9", // Sky blue
                    isAutoRoundUpActive = false,
                    createdAt = now - 1000 * 60 * 60 * 24 * 15
                ),
                SavingsVaultEntity(
                    id = "vault-auto-03",
                    name = "Enganche de Auto Nuevo",
                    targetAmount = 80000.0,
                    currentAmount = 32800.0,
                    category = "Auto",
                    colorHex = "#F59E0B", // Amber
                    isAutoRoundUpActive = false,
                    createdAt = now - 1000 * 60 * 60 * 24 * 60
                )
            )
            database.savingsVaultDao().insertAll(initialVaults)

            // 7. Initial Monthly Budget Limits & Categories
            val initialBudgetLimits = listOf(
                BudgetLimitEntity(
                    category = "Restaurantes",
                    monthlyLimit = 6000.0,
                    colorHex = "#F59E0B",
                    iconName = "restaurant"
                ),
                BudgetLimitEntity(
                    category = "Supermercado",
                    monthlyLimit = 12000.0,
                    colorHex = "#10B981",
                    iconName = "shopping_cart"
                ),
                BudgetLimitEntity(
                    category = "Servicios",
                    monthlyLimit = 5000.0,
                    colorHex = "#3B82F6",
                    iconName = "receipt_long"
                ),
                BudgetLimitEntity(
                    category = "Compras",
                    monthlyLimit = 8000.0,
                    colorHex = "#EC4899",
                    iconName = "shopping_bag"
                ),
                BudgetLimitEntity(
                    category = "Transporte",
                    monthlyLimit = 4000.0,
                    colorHex = "#8B5CF6",
                    iconName = "directions_car"
                ),
                BudgetLimitEntity(
                    category = "Transferencia",
                    monthlyLimit = 20000.0,
                    colorHex = "#64748B",
                    iconName = "send"
                )
            )
            database.budgetLimitDao().insertAll(initialBudgetLimits)
        }
    }
}
