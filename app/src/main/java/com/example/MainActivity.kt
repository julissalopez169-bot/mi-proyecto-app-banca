package com.example

import android.Manifest
import android.content.pm.PackageManager
import android.os.Build
import android.os.Bundle
import android.widget.Toast
import android.view.MotionEvent
import androidx.activity.compose.BackHandler
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.activity.viewModels
import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.animation.slideInVertically
import androidx.compose.animation.slideOutVertically
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.imePadding
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.layout.widthIn
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Timer
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.Icon
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.input.pointer.PointerEventPass
import androidx.compose.ui.input.pointer.pointerInput
import androidx.compose.ui.platform.LocalFocusManager
import androidx.compose.ui.platform.LocalSoftwareKeyboardController
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.core.app.ActivityCompat
import androidx.core.content.ContextCompat
import androidx.fragment.app.FragmentActivity
import com.example.data.model.CardEntity
import com.example.data.model.TransactionEntity
import com.example.security.BiometricStatus
import com.example.ui.LuminaViewModel
import com.example.ui.Screen
import com.example.ui.components.AppUpdateDialog
import com.example.ui.components.LuminaBottomNavigation
import com.example.ui.theme.LuminaGold
import com.example.ui.theme.LuminaRose
import com.example.ui.screens.BudgetScreen
import com.example.ui.screens.CardsScreen
import com.example.ui.screens.DashboardScreen
import com.example.ui.screens.LockScreen
import com.example.ui.screens.NotificationsScreen
import com.example.ui.screens.QrPayScreen
import com.example.ui.screens.SecurityScreen
import com.example.ui.screens.TransactionsScreen
import com.example.ui.screens.TransfersScreen
import com.example.ui.screens.VaultsScreen
import com.example.ui.theme.LuminaTheme

class MainActivity : FragmentActivity() {

    private val viewModel: LuminaViewModel by viewModels()

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()

        setContent {
            val isDarkMode by viewModel.isDarkMode.collectAsState()
            LuminaTheme(darkTheme = isDarkMode) {
                val isLocked by viewModel.isAppLocked.collectAsState()
                val currentScreen by viewModel.currentScreen.collectAsState()
                val unreadCount by viewModel.unreadNotificationsCount.collectAsState()
                val biometricStatus by viewModel.biometricStatus.collectAsState()
                val pinError by viewModel.pinError.collectAsState()

                // Data flows
                val account by viewModel.account.collectAsState()
                val cards by viewModel.cards.collectAsState()
                val transactions by viewModel.transactions.collectAsState()
                val beneficiaries by viewModel.beneficiaries.collectAsState()
                val notifications by viewModel.notifications.collectAsState()
                val isBalanceHidden by viewModel.isBalanceHidden.collectAsState()
                val isUsdCurrency by viewModel.isUsdCurrency.collectAsState()
                val transferState by viewModel.transferState.collectAsState()
                val selectedTransaction by viewModel.selectedTransaction.collectAsState()
                val showNotifBanner by viewModel.showNotificationPermissionBanner.collectAsState()
                val isSupabaseConfigured by viewModel.isSupabaseConfigured.collectAsState()
                val isSupabaseLoading by viewModel.isSupabaseLoading.collectAsState()
                val supabaseStatusMessage by viewModel.supabaseStatusMessage.collectAsState()
                val vaults by viewModel.vaults.collectAsState()
                val budgetLimits by viewModel.budgetLimits.collectAsState()
                val availableUpdate by viewModel.availableUpdate.collectAsState()
                val isCheckingUpdate by viewModel.isCheckingUpdate.collectAsState()
                val lockReason by viewModel.lockReason.collectAsState()
                val inactivityRemaining by viewModel.inactivitySecondsRemaining.collectAsState()
                val registeredAccounts by viewModel.registeredAccounts.collectAsState()
                val top2Users by viewModel.top2Users.collectAsState()
                val allUsersPublic by viewModel.allUsersPublic.collectAsState()

                fun requestFingerprint(
                    title: String = "Banca en Línea",
                    subtitle: String = "Confirma tu huella registrada en tu celular",
                    accountHolder: String? = null,
                    onSuccess: () -> Unit,
                    onFallbackToPassword: ((String) -> Unit)? = null
                ) {
                    val status = viewModel.biometricHelper.checkBiometricStatus()
                    if (status != BiometricStatus.AVAILABLE) {
                        val message = when (status) {
                            BiometricStatus.NOT_ENROLLED -> "Tu celular no tiene huellas dactilares registradas en los ajustes del sistema. Por favor ingresa con tu contraseña."
                            BiometricStatus.NO_HARDWARE -> "Este celular no posee sensor de huellas dactilares. Ingresa con tu contraseña."
                            BiometricStatus.HW_UNAVAILABLE -> "Sensor de huellas no disponible temporalmente. Ingresa con tu contraseña."
                            else -> "Biometría no disponible en este dispositivo. Ingresa con tu contraseña."
                        }
                        if (onFallbackToPassword != null) {
                            onFallbackToPassword(message)
                        } else {
                            Toast.makeText(this@MainActivity, message, Toast.LENGTH_LONG).show()
                        }
                        return
                    }

                    viewModel.biometricHelper.promptBiometric(
                        activity = this@MainActivity,
                        title = title,
                        subtitle = subtitle,
                        negativeButtonText = "Ingresar con contraseña",
                        onSuccess = onSuccess,
                        onFallbackToPassword = { reason ->
                            if (onFallbackToPassword != null) {
                                onFallbackToPassword(reason)
                            } else {
                                Toast.makeText(this@MainActivity, reason, Toast.LENGTH_SHORT).show()
                            }
                        },
                        onError = { _, errString ->
                            val msg = "Sensor biométrico: $errString. Ingresa con tu contraseña."
                            if (onFallbackToPassword != null) {
                                onFallbackToPassword(msg)
                            } else {
                                Toast.makeText(this@MainActivity, msg, Toast.LENGTH_SHORT).show()
                            }
                        }
                    )
                }

                val focusManager = LocalFocusManager.current
                val keyboardController = LocalSoftwareKeyboardController.current

                // Clear focus & action modes gracefully whenever screen changes or app locks
                LaunchedEffect(isLocked) {
                    focusManager.clearFocus(force = true)
                    keyboardController?.hide()
                }

                LaunchedEffect(currentScreen) {
                    focusManager.clearFocus(force = true)
                    keyboardController?.hide()
                }

                // Check permission on startup
                LaunchedEffect(Unit) {
                    requestNotificationPermission()
                }

                // Global Back Handler
                BackHandler(enabled = !isLocked && currentScreen != Screen.DASHBOARD) {
                    viewModel.navigateBack()
                }

                if (isLocked) {
                    LockScreen(
                        biometricStatus = biometricStatus,
                        pinError = pinError,
                        lockReason = lockReason,
                        isDarkMode = isDarkMode,
                        onToggleDarkMode = { viewModel.toggleDarkMode() },
                        onBiometricClick = { typedUser, onFallback ->
                            requestFingerprint(
                                title = "Banca Nova",
                                subtitle = if (!typedUser.isNullOrBlank()) "Confirma tu huella para acceder como $typedUser" else "Confirma tu huella registrada en tu celular",
                                accountHolder = typedUser,
                                onSuccess = {
                                    viewModel.unlockWithBiometrics(typedUsername = typedUser)
                                },
                                onFallbackToPassword = onFallback
                            )
                        },
                        onBiometricForAccount = { acc, onFallback ->
                            requestFingerprint(
                                title = "Banca Nova",
                                subtitle = "Confirma tu huella para acceder a ${acc.accountHolder}",
                                accountHolder = acc.accountHolder,
                                onSuccess = {
                                    viewModel.unlockWithBiometrics(accountToSelect = acc)
                                },
                                onFallbackToPassword = onFallback
                            )
                        },
                        onBiometricForUser = { user, onFallback ->
                            requestFingerprint(
                                title = "Banca Nova",
                                subtitle = "Confirma tu huella para acceder a ${user.fullName}",
                                accountHolder = user.fullName,
                                onSuccess = {
                                    viewModel.unlockWithBiometrics(userToSelect = user)
                                },
                                onFallbackToPassword = onFallback
                            )
                        },
                        onRegisterBiometricForUser = { userIdOrAccount ->
                            requestFingerprint(
                                title = "Vincular Huella Digital",
                                subtitle = "Coloca tu dedo en el sensor para vincular tu credencial biométrica",
                                accountHolder = null,
                                onSuccess = {
                                    viewModel.registerBiometricForUser(userIdOrAccount) {
                                        Toast.makeText(this@MainActivity, "¡Huella digital vinculada exitosamente con tu cuenta!", Toast.LENGTH_LONG).show()
                                    }
                                },
                                onFallbackToPassword = { reason ->
                                    Toast.makeText(this@MainActivity, reason, Toast.LENGTH_SHORT).show()
                                }
                            )
                        },
                        onPinEntered = { pin ->
                            viewModel.checkPin(pin)
                        },
                        onLoginWithCredentials = { username, password ->
                            viewModel.loginWithCredentials(username, password)
                        },
                        registeredAccounts = registeredAccounts,
                        top2Users = top2Users,
                        allUsersPublic = allUsersPublic,
                        knownDeviceUsernames = viewModel.getDeviceUsernames(),
                        onCheckPasswordRepeated = { pass -> viewModel.isPasswordRepeated(pass) },
                        onSelectSavedAccount = { name, accNum, bal ->
                            viewModel.switchUserAccount(name, accNum, bal)
                        },
                        onRegisterAccount = { fullName, username, email, phone, password, onError ->
                            viewModel.registerAccount(
                                fullName = fullName,
                                username = username,
                                email = email,
                                phone = phone,
                                password = password,
                                onSuccess = {
                                    Toast.makeText(this@MainActivity, "¡Cuenta guardada exitosamente en la base de datos!", Toast.LENGTH_LONG).show()
                                },
                                onError = { errMsg ->
                                    onError(errMsg)
                                    Toast.makeText(this@MainActivity, errMsg, Toast.LENGTH_LONG).show()
                                }
                            )
                        },
                        onDeleteAccount = { accNum ->
                            viewModel.deleteRegisteredAccount(accNum)
                        },
                        onClearAllAccounts = {
                            viewModel.clearAccountsHistory()
                        },
                        onClearError = { viewModel.clearAuthError() }
                    )
                } else {
                    Scaffold(
                        modifier = Modifier.fillMaxSize(),
                        bottomBar = {
                            if (currentScreen in listOf(Screen.DASHBOARD, Screen.TRANSFERS, Screen.CARDS, Screen.TRANSACTIONS, Screen.NOTIFICATIONS)) {
                                LuminaBottomNavigation(
                                    currentScreen = currentScreen,
                                    unreadNotificationsCount = unreadCount,
                                    onNavigate = { screen ->
                                        viewModel.navigateTo(screen)
                                    }
                                )
                            }
                        }
                    ) { innerPadding ->
                        Box(
                            modifier = Modifier
                                .fillMaxSize()
                                .padding(innerPadding)
                                .imePadding()
                                .pointerInput(Unit) {
                                    awaitPointerEventScope {
                                        while (true) {
                                            awaitPointerEvent(PointerEventPass.Initial)
                                            viewModel.onUserActivityDetected()
                                        }
                                    }
                                }
                                .clickable(
                                    interactionSource = remember { MutableInteractionSource() },
                                    indication = null
                                ) {
                                    focusManager.clearFocus()
                                    viewModel.onUserActivityDetected()
                                },
                            contentAlignment = Alignment.TopCenter
                        ) {
                            Box(
                                modifier = Modifier
                                    .fillMaxSize()
                                    .widthIn(max = 640.dp)
                            ) {
                                when (currentScreen) {
                                Screen.DASHBOARD -> {
                                    DashboardScreen(
                                        account = account,
                                        cards = cards,
                                        transactions = transactions,
                                        beneficiaries = beneficiaries,
                                        unreadNotificationsCount = unreadCount,
                                        isBalanceHidden = isBalanceHidden,
                                        isUsdCurrency = isUsdCurrency,
                                        isDarkMode = isDarkMode,
                                        onToggleDarkMode = { viewModel.toggleDarkMode() },
                                        showNotificationBanner = showNotifBanner,
                                        onRequestNotificationPermission = {
                                            requestNotificationPermission()
                                        },
                                        onDismissNotificationBanner = { viewModel.dismissNotificationBanner() },
                                        onToggleBalanceHidden = { viewModel.toggleBalanceVisibility() },
                                        onToggleCurrency = { viewModel.toggleCurrency() },
                                        onNavigate = { screen -> viewModel.navigateTo(screen) },
                                        onSelectBeneficiary = { ben -> viewModel.selectBeneficiary(ben) },
                                        onToggleCardFreeze = { card -> viewModel.toggleCardFreeze(card) },
                                        onCardRevealSensitive = { card ->
                                            requestFingerprint(
                                                title = "Ver Datos de Tarjeta",
                                                subtitle = "Verifica tu huella para mostrar CVV y número",
                                                onSuccess = {
                                                    Toast.makeText(this@MainActivity, "Datos confidenciales revelados", Toast.LENGTH_SHORT).show()
                                                }
                                            )
                                        },
                                        onSelectTransaction = { tx -> viewModel.setSelectedTransaction(tx) },
                                        onQuickSimulateDeposit = {
                                            viewModel.simulateIncomingDeposit(
                                                amount = 4500.0,
                                                sender = "Banco Atlántida - ACH",
                                                bank = "Banco Atlántida"
                                            )
                                        },
                                        onLockApp = { viewModel.lockApp() },
                                        registeredAccounts = registeredAccounts,
                                        onSwitchAccount = { name, accNum, bal ->
                                            requestFingerprint(
                                                title = "Cambiar de Cuenta",
                                                subtitle = "Confirma tu huella digital para acceder como $name",
                                                accountHolder = name,
                                                onSuccess = {
                                                    viewModel.switchUserAccount(name, accNum, bal)
                                                }
                                            )
                                        },
                                        isSupabaseConfigured = isSupabaseConfigured
                                    )
                                }

                                Screen.TRANSFERS -> {
                                    TransfersScreen(
                                        account = account,
                                        beneficiaries = beneficiaries,
                                        transferState = transferState,
                                        onBackClick = { viewModel.navigateBack() },
                                        onUpdateRecipient = { viewModel.updateTransferRecipient(it) },
                                        onUpdateAccount = { viewModel.updateTransferAccount(it) },
                                        onUpdateBank = { viewModel.updateTransferBank(it) },
                                        onUpdateAmount = { viewModel.updateTransferAmount(it) },
                                        onUpdateConcept = { viewModel.updateTransferConcept(it) },
                                        onSelectBeneficiary = { ben -> viewModel.selectBeneficiary(ben) },
                                        onExecuteTransferWithBiometric = {
                                            if (viewModel.biometricHelper.isBiometricForTransfersRequired) {
                                                requestFingerprint(
                                                    title = "Autorizar Transferencia",
                                                    subtitle = "Confirma tu huella para enviar L ${transferState.amountText}",
                                                    onSuccess = {
                                                        viewModel.executeTransfer { _ -> }
                                                    }
                                                )
                                            } else {
                                                viewModel.executeTransfer { _ -> }
                                            }
                                        },
                                        onDismissReceipt = { viewModel.dismissReceipt() }
                                    )
                                }

                                Screen.CARDS -> {
                                    CardsScreen(
                                        cards = cards,
                                        onBackClick = { viewModel.navigateBack() },
                                        onToggleFreeze = { card -> viewModel.toggleCardFreeze(card) },
                                        onUpdateLimit = { id, limit -> viewModel.updateCardLimit(id, limit) },
                                        onAddNewCard = { tier, type, theme -> viewModel.addNewCard(tier, type, theme) },
                                        onBiometricRevealCvv = { card, onRevealed ->
                                            requestFingerprint(
                                                title = "Revelar CVV de ${card.cardTier}",
                                                subtitle = "Verifica tu huella digital para ver CVV",
                                                onSuccess = { onRevealed() }
                                            )
                                        },
                                        onUpdateTheme = { id, theme, tier ->
                                            viewModel.updateCardTheme(id, theme, tier)
                                        },
                                        onRegenerateCvv = { id, tier, onDone ->
                                            viewModel.regenerateCardCvv(id, tier, onDone)
                                        },
                                        onUpdateFeatures = { id, online, contactless, atm ->
                                            viewModel.updateCardFeatures(id, online, contactless, atm)
                                        }
                                    )
                                }

                                Screen.TRANSACTIONS -> {
                                    TransactionsScreen(
                                        transactions = transactions,
                                        onBackClick = { viewModel.navigateBack() },
                                        onSelectTransaction = { tx -> viewModel.setSelectedTransaction(tx) },
                                        selectedTransaction = selectedTransaction,
                                        onDismissReceipt = { viewModel.setSelectedTransaction(null) },
                                        account = account
                                    )
                                }

                                Screen.NOTIFICATIONS -> {
                                    NotificationsScreen(
                                        notifications = notifications,
                                        unreadCount = unreadCount,
                                        onBackClick = { viewModel.navigateBack() },
                                        onMarkAsRead = { id -> viewModel.markNotificationAsRead(id) },
                                        onMarkAllAsRead = { viewModel.markAllNotificationsAsRead() },
                                        onClearAll = { viewModel.clearAllNotifications() },
                                        onSimulateDeposit = {
                                            viewModel.simulateRealtimeIncomingTransfer(
                                                amount = 4500.0,
                                                sender = "Sofía Valladares - Ficohsa",
                                                bank = "Banco Ficohsa",
                                                concept = "Acreditación ACH / Realtime WebSockets"
                                            )
                                        },
                                        onSimulateSecurityAlert = {
                                            viewModel.notificationManager.sendPushNotification(
                                                title = "Alerta de Seguridad",
                                                message = "Se ha verificado un nuevo acceso seguro a tu cuenta desde Tegucigalpa, Honduras.",
                                                category = "security",
                                                channelId = com.example.notification.LuminaNotificationManager.CHANNEL_SECURITY
                                            )
                                        },
                                        onSchedulePush = { delaySec ->
                                            viewModel.schedulePush(
                                                delaySeconds = delaySec,
                                                title = "¡Transferencia Acreditada en Vivo!",
                                                message = "Has recibido L 1,200.00 de Carlos Mendoza vía WebSockets / Supabase Realtime.",
                                                category = "transfers"
                                            )
                                        }
                                    )
                                }

                                Screen.QR_PAY -> {
                                    QrPayScreen(
                                        account = account,
                                        onBackClick = { viewModel.navigateBack() },
                                        onExecuteQrPayment = { merchant, amount, concept, onResult ->
                                            viewModel.executeQrPayment(merchant, amount, concept, onResult)
                                        }
                                    )
                                }

                                Screen.VAULTS -> {
                                    VaultsScreen(
                                        account = account,
                                        vaults = vaults,
                                        onBackClick = { viewModel.navigateBack() },
                                        onCreateVault = { name, target, cat, col ->
                                            viewModel.createVault(name, target, cat, col)
                                        },
                                        onDepositToVault = { vault, amt, res ->
                                            viewModel.depositToVault(vault, amt, res)
                                        },
                                        onWithdrawFromVault = { vault, amt, res ->
                                            viewModel.withdrawFromVault(vault, amt, res)
                                        },
                                        onToggleAutoRoundUp = { id, active ->
                                            viewModel.toggleVaultAutoRoundUp(id, active)
                                        },
                                        onDeleteVault = { id ->
                                            viewModel.deleteVault(id)
                                        }
                                    )
                                }

                                Screen.BUDGET -> {
                                    BudgetScreen(
                                        transactions = transactions,
                                        budgetLimits = budgetLimits,
                                        onBackClick = { viewModel.navigateBack() },
                                        onUpdateLimit = { cat, lim ->
                                            viewModel.updateBudgetLimit(cat, lim)
                                        }
                                    )
                                }

                                Screen.SECURITY -> {
                                    SecurityScreen(
                                        biometricHelper = viewModel.biometricHelper,
                                        biometricStatus = biometricStatus,
                                        isDarkMode = isDarkMode,
                                        onToggleDarkMode = { viewModel.toggleDarkMode() },
                                        onBackClick = { viewModel.navigateBack() },
                                        onTestBiometric = { onSuccess ->
                                            requestFingerprint(
                                                title = "Prueba de Biometría",
                                                subtitle = "Verificación de sensor biométrico",
                                                onSuccess = onSuccess
                                            )
                                        },
                                        onLockAppNow = { viewModel.lockApp() },
                                        onRegisterBiometric = {
                                            requestFingerprint(
                                                title = "Vincular Huella Digital",
                                                subtitle = "Coloca tu dedo en el sensor para vincular tu credencial biométrica",
                                                accountHolder = account?.accountHolder,
                                                onSuccess = {
                                                    account?.let { viewModel.registerBiometricForUser(it.accountNumber) }
                                                    Toast.makeText(this@MainActivity, "¡Huella digital registrada exitosamente!", Toast.LENGTH_LONG).show()
                                                }
                                            )
                                        },
                                        account = account,
                                        registeredAccounts = registeredAccounts,
                                        onSwitchAccount = { name, accNum, bal ->
                                            requestFingerprint(
                                                title = "Cambiar de Cuenta",
                                                subtitle = "Confirma tu huella digital para acceder como $name",
                                                accountHolder = name,
                                                onSuccess = {
                                                    viewModel.switchUserAccount(name, accNum, bal)
                                                }
                                            )
                                        },
                                        supabaseManager = viewModel.supabaseManager,
                                        isSupabaseConfigured = isSupabaseConfigured,
                                        isSupabaseLoading = isSupabaseLoading,
                                        supabaseStatusMessage = supabaseStatusMessage,
                                        onSaveSupabaseConfig = { url, key ->
                                            viewModel.saveSupabaseCredentials(url, key)
                                        },
                                        onTestSupabaseConnection = { onResult ->
                                            viewModel.testSupabaseConnection(onResult)
                                        },
                                        onSyncSupabase = { onResult ->
                                            viewModel.syncDataWithSupabase(onResult)
                                        },
                                        onClearSupabaseConfig = {
                                            viewModel.clearSupabaseCredentials()
                                        },
                                        appUpdateManager = viewModel.appUpdateManager,
                                        isCheckingUpdate = isCheckingUpdate,
                                        onCheckForUpdates = { force, onResult ->
                                            viewModel.checkForUpdates(force, onResult)
                                        },
                                        onSimulateUpdate = {
                                            viewModel.simulateUpdateForTesting()
                                        },
                                        inactivityRemainingSeconds = inactivityRemaining,
                                        onTestInactivityLock = {
                                            viewModel.testInactivityLockNow()
                                        }
                                    )
                                }
                            }

                            // Floating Inactivity Warning Pill when countdown is low (<= 8s)
                            AnimatedVisibility(
                                visible = !isLocked && inactivityRemaining in 1..8,
                                enter = fadeIn() + slideInVertically(),
                                exit = fadeOut() + slideOutVertically(),
                                modifier = Modifier
                                    .align(Alignment.TopCenter)
                                    .padding(top = 16.dp, start = 16.dp, end = 16.dp)
                            ) {
                                Card(
                                    shape = RoundedCornerShape(20.dp),
                                    colors = CardDefaults.cardColors(
                                        containerColor = if (isDarkMode) Color(0xFF2E1F0F) else Color(0xFFFEF3C7)
                                    ),
                                    border = CardDefaults.outlinedCardBorder().copy(
                                        brush = androidx.compose.ui.graphics.SolidColor(if (inactivityRemaining <= 5) LuminaRose else LuminaGold)
                                    ),
                                    modifier = Modifier
                                        .clickable { viewModel.onUserActivityDetected() }
                                ) {
                                    Row(
                                        modifier = Modifier.padding(horizontal = 14.dp, vertical = 8.dp),
                                        verticalAlignment = Alignment.CenterVertically
                                    ) {
                                        Icon(
                                            imageVector = Icons.Default.Timer,
                                            contentDescription = null,
                                            tint = if (inactivityRemaining <= 5) LuminaRose else LuminaGold,
                                            modifier = Modifier.size(16.dp)
                                        )
                                        Spacer(modifier = Modifier.width(8.dp))
                                        Text(
                                            text = "Cierre por inactividad en ${inactivityRemaining}s • Toca para mantener sesión",
                                            fontSize = 11.sp,
                                            fontWeight = FontWeight.Bold,
                                            color = if (isDarkMode) Color(0xFFFDE68A) else Color(0xFF92400E)
                                        )
                                    }
                                }
                            }
                        }
                    }
                }
            }

                // Global In-App Update Dialog
                availableUpdate?.let { updateInfo ->
                    AppUpdateDialog(
                        updateInfo = updateInfo,
                        currentVersionName = viewModel.appUpdateManager.currentVersionName,
                        currentVersionCode = viewModel.appUpdateManager.currentVersionCode,
                        isDarkMode = isDarkMode,
                        onUpdateNow = {
                            viewModel.dismissUpdateDialog()
                            viewModel.appUpdateManager.launchUpdateDownload(this@MainActivity, updateInfo.downloadUrl)
                        },
                        onRemindLater = {
                            viewModel.snoozeUpdate()
                            Toast.makeText(this@MainActivity, "Te recordaremos más tarde", Toast.LENGTH_SHORT).show()
                        },
                        onDismiss = {
                            viewModel.dismissUpdateDialog()
                        }
                    )
                }
            }
        }
    }

    private fun triggerBiometricPrompt(
        title: String,
        subtitle: String,
        onSuccess: () -> Unit,
        onError: (errorCode: Int, errString: String) -> Unit
    ) {
        viewModel.biometricHelper.promptBiometric(
            activity = this,
            title = title,
            subtitle = subtitle,
            negativeButtonText = "Ingresar con contraseña",
            onSuccess = onSuccess,
            onFallbackToPassword = { reason ->
                onError(-1, reason)
            },
            onError = onError
        )
    }

    private fun requestNotificationPermission() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            val hasPerm = ContextCompat.checkSelfPermission(
                this,
                Manifest.permission.POST_NOTIFICATIONS
            ) == PackageManager.PERMISSION_GRANTED
            if (!hasPerm) {
                ActivityCompat.requestPermissions(
                    this,
                    arrayOf(Manifest.permission.POST_NOTIFICATIONS),
                    PERMISSION_REQUEST_NOTIFICATIONS
                )
            } else {
                viewModel.onNotificationPermissionUpdated()
            }
        } else {
            viewModel.dismissNotificationBanner()
        }
    }

    override fun onRequestPermissionsResult(
        requestCode: Int,
        permissions: Array<out String>,
        grantResults: IntArray
    ) {
        super.onRequestPermissionsResult(requestCode, permissions, grantResults)
        if (requestCode == PERMISSION_REQUEST_NOTIFICATIONS) {
            val isGranted = grantResults.isNotEmpty() && grantResults[0] == PackageManager.PERMISSION_GRANTED
            viewModel.onNotificationPermissionUpdated()
            if (isGranted) {
                Toast.makeText(this, "Notificaciones Push activadas en tiempo real", Toast.LENGTH_SHORT).show()
            }
        }
    }

    override fun onUserInteraction() {
        super.onUserInteraction()
        viewModel.onUserActivityDetected()
    }

    override fun dispatchTouchEvent(ev: MotionEvent?): Boolean {
        viewModel.onUserActivityDetected()
        return super.dispatchTouchEvent(ev)
    }

    override fun onResume() {
        super.onResume()
        if (!viewModel.isAppLocked.value) {
            viewModel.startInactivityMonitor()
        }
    }

    companion object {
        private const val PERMISSION_REQUEST_NOTIFICATIONS = 1001
    }
}
