package com.example.ui.screens

import android.content.ClipData
import android.content.ClipboardManager
import android.content.Context
import android.widget.Toast
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.automirrored.filled.HelpOutline
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material.icons.filled.Close
import androidx.compose.material.icons.filled.Cloud
import androidx.compose.material.icons.filled.CloudDone
import androidx.compose.material.icons.filled.CloudSync
import androidx.compose.material.icons.filled.ContentCopy
import androidx.compose.material.icons.filled.DarkMode
import androidx.compose.material.icons.filled.Delete
import androidx.compose.material.icons.filled.Fingerprint
import androidx.compose.material.icons.filled.Key
import androidx.compose.material.icons.filled.LightMode
import androidx.compose.material.icons.filled.Lock
import androidx.compose.material.icons.filled.Refresh
import androidx.compose.material.icons.filled.Security
import androidx.compose.material.icons.filled.Shield
import androidx.compose.material.icons.filled.Storage
import androidx.compose.material.icons.filled.Visibility
import androidx.compose.material.icons.filled.VisibilityOff
import androidx.compose.material.icons.filled.Warning
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.OutlinedTextFieldDefaults
import androidx.compose.material3.Surface
import androidx.compose.material3.Switch
import androidx.compose.material3.SwitchDefaults
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.text.input.VisualTransformation
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.window.Dialog
import com.example.data.supabase.SupabaseManager
import com.example.security.BiometricHelper
import com.example.security.BiometricStatus
import com.example.ui.components.LuminaTopBar
import com.example.ui.theme.LuminaBlue
import com.example.ui.theme.LuminaEmerald
import com.example.ui.theme.LuminaGold
import com.example.ui.theme.LuminaRose

import com.example.data.model.AccountEntity
import com.example.update.AppUpdateManager
import androidx.compose.material.icons.automirrored.filled.Login
import androidx.compose.material.icons.filled.Check
import androidx.compose.material.icons.filled.Code
import androidx.compose.material.icons.filled.HelpOutline
import androidx.compose.material.icons.filled.Info
import androidx.compose.material.icons.filled.NotificationsActive
import androidx.compose.material.icons.filled.Person
import androidx.compose.material.icons.filled.SwapHoriz
import androidx.compose.material.icons.filled.Sync
import androidx.compose.material.icons.filled.SystemUpdate
import androidx.compose.material.icons.filled.Timer

@Composable
fun SecurityScreen(
    biometricHelper: BiometricHelper,
    biometricStatus: BiometricStatus,
    isDarkMode: Boolean = true,
    onToggleDarkMode: () -> Unit = {},
    onBackClick: () -> Unit,
    onTestBiometric: (onSuccess: () -> Unit) -> Unit,
    onLockAppNow: () -> Unit,
    account: AccountEntity? = null,
    onSwitchAccount: ((name: String, accountNumber: String, balance: Double) -> Unit)? = null,
    supabaseManager: SupabaseManager? = null,
    isSupabaseConfigured: Boolean = false,
    isSupabaseLoading: Boolean = false,
    supabaseStatusMessage: String? = null,
    onSaveSupabaseConfig: ((String, String) -> Unit)? = null,
    onTestSupabaseConnection: ((onResult: (Boolean, String) -> Unit) -> Unit)? = null,
    onSyncSupabase: ((onResult: (Boolean, String) -> Unit) -> Unit)? = null,
    onClearSupabaseConfig: (() -> Unit)? = null,
    appUpdateManager: AppUpdateManager? = null,
    isCheckingUpdate: Boolean = false,
    onCheckForUpdates: ((force: Boolean, onResult: (Boolean, String) -> Unit) -> Unit)? = null,
    onSimulateUpdate: (() -> Unit)? = null,
    inactivityRemainingSeconds: Int = 40,
    onTestInactivityLock: (() -> Unit)? = null,
    onRegisterBiometric: (() -> Unit)? = null,
    registeredAccounts: List<AccountEntity> = emptyList()
) {
    val context = LocalContext.current
    var isBiometricEnabled by remember { mutableStateOf(biometricHelper.isBiometricEnabled) }
    var isBiometricForTransfers by remember { mutableStateOf(biometricHelper.isBiometricForTransfersRequired) }
    var showChangePinDialog by remember { mutableStateOf(false) }
    var showAccountSwitchDialog by remember { mutableStateOf(false) }
    var customNewName by remember { mutableStateOf("") }
    var showSupabaseConfigDialog by remember { mutableStateOf(false) }
    var showSqlScriptDialog by remember { mutableStateOf(false) }
    var showUpdateGuideDialog by remember { mutableStateOf(false) }
    var editSupabaseUrl by remember { mutableStateOf(supabaseManager?.supabaseUrl ?: "https://nrgyuposoruudmqjmysv.supabase.co") }
    var editSupabaseKey by remember { mutableStateOf(supabaseManager?.supabaseAnonKey ?: "sb_publishable_cyyWQu4ds6E_gTrL_sD_zw_AL5RlGst") }

    val availableAccounts = remember(registeredAccounts, account) {
        val list = if (registeredAccounts.isNotEmpty()) registeredAccounts else listOfNotNull(account)
        list.map { acc -> Triple(acc.accountHolder, acc.accountNumber, acc.balanceHnl) }
    }

    val userInitials = account?.accountHolder?.let { holder ->
        val parts = holder.split(" ").filter { it.isNotBlank() }
        when {
            parts.size >= 2 -> "${parts[0].first().uppercase()}${parts[1].first().uppercase()}"
            parts.isNotEmpty() -> parts[0].take(2).uppercase()
            else -> "UN"
        }
    } ?: "UN"

    val cardBg = MaterialTheme.colorScheme.surfaceVariant
    val textPrimary = MaterialTheme.colorScheme.onSurface
    val textSecondary = MaterialTheme.colorScheme.onSurfaceVariant
    val borderColor = MaterialTheme.colorScheme.outline.copy(alpha = 0.4f)

    if (showAccountSwitchDialog) {
        Dialog(onDismissRequest = { showAccountSwitchDialog = false }) {
            Card(
                shape = RoundedCornerShape(24.dp),
                colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(8.dp)
                    .testTag("security_account_switcher_dialog")
            ) {
                Column(modifier = Modifier.padding(22.dp)) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Box(
                                modifier = Modifier
                                    .size(36.dp)
                                    .clip(CircleShape)
                                    .background(LuminaBlue.copy(alpha = 0.2f)),
                                contentAlignment = Alignment.Center
                            ) {
                                Icon(Icons.Default.SwapHoriz, contentDescription = null, tint = LuminaBlue, modifier = Modifier.size(20.dp))
                            }
                            Spacer(modifier = Modifier.width(10.dp))
                            Column {
                                Text("Cambiar de Cuenta", fontWeight = FontWeight.Bold, fontSize = 16.sp, color = MaterialTheme.colorScheme.onSurface)
                                Text("Selecciona o ingresa otra cuenta", fontSize = 11.sp, color = MaterialTheme.colorScheme.onSurfaceVariant)
                            }
                        }
                        IconButton(onClick = { showAccountSwitchDialog = false }, modifier = Modifier.size(28.dp)) {
                            Icon(Icons.Default.Delete, contentDescription = "Cerrar", tint = MaterialTheme.colorScheme.onSurfaceVariant)
                        }
                    }

                    Spacer(modifier = Modifier.height(14.dp))
                    Text("CUENTAS DISPONIBLES", fontSize = 10.sp, fontWeight = FontWeight.Bold, color = LuminaBlue, letterSpacing = 1.sp)
                    Spacer(modifier = Modifier.height(8.dp))

                    availableAccounts.forEach { (name, accNum, bal) ->
                        val isCurrent = account?.accountHolder.equals(name, ignoreCase = true)
                        Card(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(vertical = 4.dp)
                                .clip(RoundedCornerShape(12.dp))
                                .clickable {
                                    onSwitchAccount?.invoke(name, accNum, bal)
                                    Toast.makeText(context, "Bienvenido(a) $name", Toast.LENGTH_SHORT).show()
                                    showAccountSwitchDialog = false
                                }
                                .testTag("security_switch_${name.replace(" ", "_")}"),
                            shape = RoundedCornerShape(12.dp),
                            colors = CardDefaults.cardColors(
                                containerColor = if (isCurrent) LuminaBlue.copy(alpha = 0.15f) else MaterialTheme.colorScheme.surfaceVariant
                            ),
                            border = if (isCurrent) CardDefaults.outlinedCardBorder().copy(
                                brush = androidx.compose.ui.graphics.SolidColor(LuminaBlue)
                            ) else null
                        ) {
                            Row(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .padding(12.dp),
                                horizontalArrangement = Arrangement.SpaceBetween,
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Row(verticalAlignment = Alignment.CenterVertically) {
                                    Box(
                                        modifier = Modifier
                                            .size(36.dp)
                                            .clip(CircleShape)
                                            .background(
                                                when {
                                                    name.contains("Julissa") -> Color(0xFF6366F1)
                                                    name.contains("Roberto") -> LuminaEmerald
                                                    else -> LuminaBlue
                                                }
                                            ),
                                        contentAlignment = Alignment.Center
                                    ) {
                                        Text(
                                            text = name.split(" ").take(2).mapNotNull { it.firstOrNull()?.uppercase() }.joinToString(""),
                                            color = Color.White,
                                            fontWeight = FontWeight.Bold,
                                            fontSize = 12.sp
                                        )
                                    }
                                    Spacer(modifier = Modifier.width(10.dp))
                                    Column {
                                        Text(text = name, fontWeight = FontWeight.Bold, fontSize = 13.sp, color = MaterialTheme.colorScheme.onSurface)
                                        Text(text = "No. $accNum", fontSize = 10.sp, color = MaterialTheme.colorScheme.onSurfaceVariant)
                                    }
                                }
                                Row(verticalAlignment = Alignment.CenterVertically) {
                                    Text(text = String.format("L %,.2f", bal), fontWeight = FontWeight.Bold, fontSize = 12.sp, color = LuminaEmerald)
                                    if (isCurrent) {
                                        Spacer(modifier = Modifier.width(6.dp))
                                        Icon(Icons.Default.Check, contentDescription = "Activa", tint = LuminaBlue, modifier = Modifier.size(16.dp))
                                    }
                                }
                            }
                        }
                    }

                    Spacer(modifier = Modifier.height(14.dp))
                    Text("INGRESAR OTRO NOMBRE / TITULAR", fontSize = 10.sp, fontWeight = FontWeight.Bold, color = MaterialTheme.colorScheme.onSurfaceVariant, letterSpacing = 1.sp)
                    Spacer(modifier = Modifier.height(6.dp))

                    Row(modifier = Modifier.fillMaxWidth(), verticalAlignment = Alignment.CenterVertically) {
                        OutlinedTextField(
                            value = customNewName,
                            onValueChange = { customNewName = it },
                            placeholder = { Text("Ej: Andrea Morales", fontSize = 12.sp) },
                            singleLine = true,
                            modifier = Modifier
                                .weight(1f)
                                .testTag("security_input_custom_name"),
                            shape = RoundedCornerShape(12.dp),
                            colors = OutlinedTextFieldDefaults.colors(
                                focusedBorderColor = LuminaBlue,
                                focusedContainerColor = MaterialTheme.colorScheme.surfaceVariant,
                                unfocusedContainerColor = MaterialTheme.colorScheme.surfaceVariant
                            )
                        )
                        Spacer(modifier = Modifier.width(8.dp))
                        Button(
                            onClick = {
                                if (customNewName.isNotBlank()) {
                                    val formatted = customNewName.trim()
                                    val newAccNum = "HN" + Math.abs(formatted.hashCode()).toString().take(8).padEnd(8, '4')
                                    onSwitchAccount?.invoke(formatted, newAccNum, 20000.0)
                                    Toast.makeText(context, "Bienvenido(a) $formatted", Toast.LENGTH_SHORT).show()
                                    showAccountSwitchDialog = false
                                }
                            },
                            shape = RoundedCornerShape(12.dp),
                            colors = ButtonDefaults.buttonColors(containerColor = LuminaBlue),
                            modifier = Modifier.testTag("security_btn_switch_name")
                        ) {
                            Text("Cambiar", fontSize = 12.sp, fontWeight = FontWeight.Bold)
                        }
                    }

                    Spacer(modifier = Modifier.height(14.dp))
                    HorizontalDivider(color = MaterialTheme.colorScheme.outline.copy(alpha = 0.2f))
                    Spacer(modifier = Modifier.height(8.dp))

                    TextButton(
                        onClick = {
                            showAccountSwitchDialog = false
                            onLockAppNow()
                        },
                        modifier = Modifier.fillMaxWidth().testTag("security_btn_go_login")
                    ) {
                        Icon(Icons.AutoMirrored.Filled.Login, contentDescription = null, tint = LuminaRose, modifier = Modifier.size(16.dp))
                        Spacer(modifier = Modifier.width(8.dp))
                        Text("Ir a pantalla de Iniciar Sesión / Registro", color = LuminaRose, fontSize = 12.sp, fontWeight = FontWeight.Bold)
                    }
                }
            }
        }
    }

    LazyColumn(
        modifier = Modifier
            .fillMaxSize()
            .background(MaterialTheme.colorScheme.background)
            .testTag("security_screen"),
        contentPadding = PaddingValues(bottom = 100.dp)
    ) {
        item {
            LuminaTopBar(
                title = "Seguridad y Privacidad",
                subtitle = "Protección Biométrica y Control de Acceso",
                showBackButton = true,
                onBackClick = onBackClick,
                isDarkMode = isDarkMode,
                onToggleDarkMode = onToggleDarkMode,
                userInitials = userInitials
            )
        }

        // =========================================================================
        // 0. TITULAR Y PERFIL ACTIVO (CAMBIAR DE CUENTA)
        // =========================================================================
        item {
            Card(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 20.dp, vertical = 6.dp),
                shape = RoundedCornerShape(20.dp),
                colors = CardDefaults.cardColors(containerColor = cardBg),
                border = CardDefaults.outlinedCardBorder().copy(
                    brush = androidx.compose.ui.graphics.SolidColor(borderColor)
                )
            ) {
                Column(modifier = Modifier.padding(20.dp)) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Row(
                            verticalAlignment = Alignment.CenterVertically,
                            modifier = Modifier.weight(1f)
                        ) {
                            Box(
                                modifier = Modifier
                                    .size(44.dp)
                                    .clip(CircleShape)
                                    .background(LuminaBlue),
                                contentAlignment = Alignment.Center
                            ) {
                                Text(
                                    text = userInitials,
                                    color = Color.White,
                                    fontWeight = FontWeight.Bold,
                                    fontSize = 16.sp
                                )
                            }

                            Spacer(modifier = Modifier.width(14.dp))

                            Column {
                                Text(
                                    text = account?.accountHolder ?: "Titular Registrado",
                                    fontSize = 15.sp,
                                    fontWeight = FontWeight.Bold,
                                    color = textPrimary
                                )
                                Text(
                                    text = "Cuenta: ${account?.accountNumber ?: "HN19 0000 0000 0000"}",
                                    fontSize = 11.sp,
                                    color = textSecondary
                                )
                                Text(
                                    text = "SAR RTN: ${account?.sarTaxId ?: "0801-1998-54321"}",
                                    fontSize = 10.sp,
                                    color = LuminaEmerald,
                                    fontWeight = FontWeight.SemiBold
                                )
                            }
                        }
                    }

                    Spacer(modifier = Modifier.height(14.dp))

                    Button(
                        onClick = { showAccountSwitchDialog = true },
                        colors = ButtonDefaults.buttonColors(containerColor = LuminaBlue),
                        shape = RoundedCornerShape(12.dp),
                        modifier = Modifier
                            .fillMaxWidth()
                            .testTag("security_btn_change_account")
                    ) {
                        Icon(Icons.Default.SwapHoriz, contentDescription = null, modifier = Modifier.size(18.dp))
                        Spacer(modifier = Modifier.width(8.dp))
                        Text("Cambiar a Otra Cuenta / Usuario", fontSize = 13.sp, fontWeight = FontWeight.Bold)
                    }
                }
            }
        }

        // =========================================================================
        // 1. THEME & VISUAL CONTRAST (MODO OSCURO / CLARO)
        // =========================================================================
        item {
            Card(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 20.dp, vertical = 6.dp),
                shape = RoundedCornerShape(20.dp),
                colors = CardDefaults.cardColors(containerColor = cardBg),
                border = CardDefaults.outlinedCardBorder().copy(
                    brush = androidx.compose.ui.graphics.SolidColor(borderColor)
                )
            ) {
                Column(modifier = Modifier.padding(20.dp)) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Row(
                            verticalAlignment = Alignment.CenterVertically,
                            modifier = Modifier.weight(1f)
                        ) {
                            Box(
                                modifier = Modifier
                                    .size(42.dp)
                                    .clip(CircleShape)
                                    .background(if (isDarkMode) LuminaGold.copy(alpha = 0.2f) else LuminaBlue.copy(alpha = 0.15f)),
                                contentAlignment = Alignment.Center
                            ) {
                                Icon(
                                    imageVector = if (isDarkMode) Icons.Default.DarkMode else Icons.Default.LightMode,
                                    contentDescription = null,
                                    tint = if (isDarkMode) LuminaGold else LuminaBlue,
                                    modifier = Modifier.size(22.dp)
                                )
                            }

                            Spacer(modifier = Modifier.width(14.dp))

                            Column {
                                Text(
                                    text = if (isDarkMode) "Modo Oscuro de Alto Contraste" else "Modo Claro Profesional",
                                    fontSize = 15.sp,
                                    fontWeight = FontWeight.Bold,
                                    color = textPrimary
                                )
                                Text(
                                    text = if (isDarkMode) "Fondo azul marino oscuro con tipografía nítida" else "Fondo claro con textos legibles y sombras suaves",
                                    fontSize = 11.sp,
                                    color = textSecondary
                                )
                            }
                        }

                        Switch(
                            checked = isDarkMode,
                            onCheckedChange = { onToggleDarkMode() },
                            colors = SwitchDefaults.colors(
                                checkedThumbColor = Color.White,
                                checkedTrackColor = LuminaBlue
                            )
                        )
                    }
                }
            }
        }

        // =========================================================================
        // 3. BIOMETRIC DIAGNOSTIC STATUS
        // =========================================================================
        item {
            Card(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 20.dp, vertical = 6.dp),
                shape = RoundedCornerShape(20.dp),
                colors = CardDefaults.cardColors(containerColor = cardBg),
                border = CardDefaults.outlinedCardBorder().copy(
                    brush = androidx.compose.ui.graphics.SolidColor(borderColor)
                )
            ) {
                Column(modifier = Modifier.padding(20.dp)) {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Box(
                            modifier = Modifier
                                .size(44.dp)
                                .clip(CircleShape)
                                .background(
                                    if (biometricStatus == BiometricStatus.AVAILABLE) LuminaEmerald.copy(alpha = 0.2f)
                                    else LuminaGold.copy(alpha = 0.2f)
                                ),
                            contentAlignment = Alignment.Center
                        ) {
                            Icon(
                                imageVector = if (biometricStatus == BiometricStatus.AVAILABLE) Icons.Default.Fingerprint else Icons.Default.Warning,
                                contentDescription = null,
                                tint = if (biometricStatus == BiometricStatus.AVAILABLE) LuminaEmerald else LuminaGold,
                                modifier = Modifier.size(24.dp)
                            )
                        }

                        Spacer(modifier = Modifier.width(14.dp))

                        Column {
                            Text(
                                text = "Sensor Biométrico (Huella / Rostro)",
                                fontSize = 15.sp,
                                fontWeight = FontWeight.Bold,
                                color = textPrimary
                            )
                            Text(
                                text = when (biometricStatus) {
                                    BiometricStatus.AVAILABLE -> "Hardware Activo y Operativo"
                                    BiometricStatus.NOT_ENROLLED -> "Sin huellas registradas en Android"
                                    BiometricStatus.NO_HARDWARE -> "Dispositivo sin hardware biométrico"
                                    else -> "Comprobando sensor biométrico..."
                                },
                                fontSize = 12.sp,
                                color = if (biometricStatus == BiometricStatus.AVAILABLE) LuminaEmerald else LuminaGold
                            )
                        }
                    }

                    Spacer(modifier = Modifier.height(16.dp))

                    Button(
                        onClick = {
                            onTestBiometric {
                                Toast.makeText(context, "¡Biometría confirmada correctamente!", Toast.LENGTH_SHORT).show()
                            }
                        },
                        colors = ButtonDefaults.buttonColors(containerColor = LuminaBlue),
                        shape = RoundedCornerShape(12.dp),
                        modifier = Modifier
                            .fillMaxWidth()
                            .testTag("test_biometric_button")
                    ) {
                        Icon(Icons.Default.Fingerprint, contentDescription = null, modifier = Modifier.size(18.dp))
                        Spacer(modifier = Modifier.width(8.dp))
                        Text("Probar Autenticación Biométrica", fontWeight = FontWeight.Bold, fontSize = 13.sp)
                    }

                    if (onRegisterBiometric != null) {
                        Spacer(modifier = Modifier.height(10.dp))
                        OutlinedButton(
                            onClick = onRegisterBiometric,
                            shape = RoundedCornerShape(12.dp),
                            modifier = Modifier
                                .fillMaxWidth()
                                .testTag("register_biometric_button")
                        ) {
                            Icon(Icons.Default.Key, contentDescription = null, tint = LuminaEmerald, modifier = Modifier.size(18.dp))
                            Spacer(modifier = Modifier.width(8.dp))
                            Text("Registrar / Vincular Huella Digital a esta Cuenta", fontWeight = FontWeight.SemiBold, fontSize = 12.sp, color = textPrimary)
                        }
                    }
                }
            }
        }

        // =========================================================================
        // 4. PREFERENCIAS DE ACCESO & PIN DE SEGURIDAD
        // =========================================================================
        item {
            Card(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 20.dp, vertical = 6.dp),
                shape = RoundedCornerShape(20.dp),
                colors = CardDefaults.cardColors(containerColor = cardBg),
                border = CardDefaults.outlinedCardBorder().copy(
                    brush = androidx.compose.ui.graphics.SolidColor(borderColor)
                )
            ) {
                Column(modifier = Modifier.padding(20.dp)) {
                    Text(
                        text = "Configuración de Acceso y Operaciones",
                        fontSize = 14.sp,
                        fontWeight = FontWeight.Bold,
                        color = textPrimary
                    )

                    Spacer(modifier = Modifier.height(12.dp))

                    // Biometric for app open
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(vertical = 8.dp),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Column(modifier = Modifier.weight(1f)) {
                            Text(
                                text = "Acceso con Huella / Rostro",
                                fontSize = 13.sp,
                                fontWeight = FontWeight.SemiBold,
                                color = textPrimary
                            )
                            Text(
                                text = "Solicitar biometría al abrir Banca Nova",
                                fontSize = 11.sp,
                                color = textSecondary
                            )
                        }
                        Switch(
                            checked = isBiometricEnabled,
                            onCheckedChange = {
                                isBiometricEnabled = it
                                biometricHelper.isBiometricEnabled = it
                            },
                            colors = SwitchDefaults.colors(
                                checkedThumbColor = Color.White,
                                checkedTrackColor = LuminaBlue
                            )
                        )
                    }

                    HorizontalDivider(color = borderColor)

                    // Biometric for transfers
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(vertical = 8.dp),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Column(modifier = Modifier.weight(1f)) {
                            Text(
                                text = "Autorizar Transferencias con Biometría",
                                fontSize = 13.sp,
                                fontWeight = FontWeight.SemiBold,
                                color = textPrimary
                            )
                            Text(
                                text = "Exigir huella dactilar para envíos de dinero y ACH",
                                fontSize = 11.sp,
                                color = textSecondary
                            )
                        }
                        Switch(
                            checked = isBiometricForTransfers,
                            onCheckedChange = {
                                isBiometricForTransfers = it
                                biometricHelper.isBiometricForTransfersRequired = it
                            },
                            colors = SwitchDefaults.colors(
                                checkedThumbColor = Color.White,
                                checkedTrackColor = LuminaBlue
                            )
                        )
                    }

                    HorizontalDivider(color = borderColor)

                    // Change PIN Row
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .clickable { showChangePinDialog = true }
                            .padding(vertical = 12.dp),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Icon(Icons.Default.Key, contentDescription = null, tint = LuminaGold, modifier = Modifier.size(20.dp))
                            Spacer(modifier = Modifier.width(10.dp))
                            Column {
                                Text("PIN de Seguridad", fontSize = 13.sp, fontWeight = FontWeight.SemiBold, color = textPrimary)
                                Text("Cambiar PIN de 4 dígitos", fontSize = 11.sp, color = textSecondary)
                            }
                        }
                        Text("EDITAR", fontSize = 11.sp, fontWeight = FontWeight.Bold, color = LuminaBlue)
                    }
                }
            }
        }

        // =========================================================================
        // 4. SUPABASE CLOUD DATABASE & SYNC
        // =========================================================================
        item {
            Card(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 20.dp, vertical = 6.dp)
                    .testTag("security_card_supabase"),
                shape = RoundedCornerShape(20.dp),
                colors = CardDefaults.cardColors(containerColor = cardBg),
                border = CardDefaults.outlinedCardBorder().copy(
                    brush = androidx.compose.ui.graphics.SolidColor(borderColor)
                )
            ) {
                Column(modifier = Modifier.padding(20.dp)) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Row(
                            verticalAlignment = Alignment.CenterVertically,
                            modifier = Modifier.weight(1f)
                        ) {
                            Box(
                                modifier = Modifier
                                    .size(44.dp)
                                    .clip(CircleShape)
                                    .background(if (isSupabaseConfigured) LuminaEmerald.copy(alpha = 0.2f) else LuminaBlue.copy(alpha = 0.2f)),
                                contentAlignment = Alignment.Center
                            ) {
                                Icon(
                                    imageVector = if (isSupabaseConfigured) Icons.Default.CloudDone else Icons.Default.Cloud,
                                    contentDescription = null,
                                    tint = if (isSupabaseConfigured) LuminaEmerald else LuminaBlue,
                                    modifier = Modifier.size(24.dp)
                                )
                            }

                            Spacer(modifier = Modifier.width(14.dp))

                            Column {
                                Row(verticalAlignment = Alignment.CenterVertically) {
                                    Text(
                                        text = "Base de Datos Supabase",
                                        fontSize = 15.sp,
                                        fontWeight = FontWeight.Bold,
                                        color = textPrimary
                                    )
                                    Spacer(modifier = Modifier.width(6.dp))
                                    Box(
                                        modifier = Modifier
                                            .clip(RoundedCornerShape(6.dp))
                                            .background(if (isSupabaseConfigured) LuminaEmerald.copy(alpha = 0.2f) else LuminaGold.copy(alpha = 0.2f))
                                            .padding(horizontal = 6.dp, vertical = 2.dp)
                                    ) {
                                        Text(
                                            text = if (isSupabaseConfigured) "CONECTADO" else "NO CONFIGURADO",
                                            fontSize = 9.sp,
                                            fontWeight = FontWeight.ExtraBold,
                                            color = if (isSupabaseConfigured) LuminaEmerald else LuminaGold
                                        )
                                    }
                                }
                                Text(
                                    text = "PostgreSQL en la nube • Sincronización de perfiles y movimientos",
                                    fontSize = 11.sp,
                                    color = textSecondary
                                )
                            }
                        }
                    }

                    Spacer(modifier = Modifier.height(12.dp))

                    val displayUrl = supabaseManager?.supabaseUrl ?: "https://nrgyuposoruudmqjmysv.supabase.co"
                    Surface(
                        modifier = Modifier.fillMaxWidth(),
                        shape = RoundedCornerShape(10.dp),
                        color = MaterialTheme.colorScheme.surface
                    ) {
                        Column(modifier = Modifier.padding(10.dp)) {
                            Row(verticalAlignment = Alignment.CenterVertically) {
                                Icon(Icons.Default.Storage, contentDescription = null, tint = LuminaBlue, modifier = Modifier.size(14.dp))
                                Spacer(modifier = Modifier.width(6.dp))
                                Text("URL:", fontSize = 11.sp, fontWeight = FontWeight.Bold, color = textPrimary)
                                Spacer(modifier = Modifier.width(4.dp))
                                Text(
                                    text = displayUrl,
                                    fontSize = 10.sp,
                                    color = textSecondary,
                                    maxLines = 1,
                                    fontFamily = FontFamily.Monospace
                                )
                            }
                        }
                    }

                    if (!supabaseStatusMessage.isNullOrBlank()) {
                        Spacer(modifier = Modifier.height(10.dp))
                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .clip(RoundedCornerShape(10.dp))
                                .background(if (supabaseStatusMessage.contains("exitos", ignoreCase = true) || supabaseStatusMessage.contains("verificada", ignoreCase = true)) LuminaEmerald.copy(alpha = 0.15f) else LuminaBlue.copy(alpha = 0.15f))
                                .padding(10.dp),
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Icon(
                                imageVector = if (supabaseStatusMessage.contains("exitos", ignoreCase = true)) Icons.Default.Check else Icons.Default.Info,
                                contentDescription = null,
                                tint = if (supabaseStatusMessage.contains("exitos", ignoreCase = true)) LuminaEmerald else LuminaBlue,
                                modifier = Modifier.size(16.dp)
                            )
                            Spacer(modifier = Modifier.width(8.dp))
                            Text(
                                text = supabaseStatusMessage,
                                fontSize = 11.sp,
                                fontWeight = FontWeight.SemiBold,
                                color = textPrimary
                            )
                        }
                    }

                    Spacer(modifier = Modifier.height(14.dp))

                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        Button(
                            onClick = {
                                onTestSupabaseConnection?.invoke { ok, msg ->
                                    Toast.makeText(context, msg, Toast.LENGTH_LONG).show()
                                }
                            },
                            enabled = !isSupabaseLoading,
                            colors = ButtonDefaults.buttonColors(containerColor = LuminaBlue),
                            shape = RoundedCornerShape(10.dp),
                            modifier = Modifier
                                .weight(1f)
                                .testTag("btn_test_supabase")
                        ) {
                            if (isSupabaseLoading) {
                                CircularProgressIndicator(modifier = Modifier.size(16.dp), color = Color.White, strokeWidth = 2.dp)
                            } else {
                                Icon(Icons.Default.Refresh, contentDescription = null, modifier = Modifier.size(16.dp))
                                Spacer(modifier = Modifier.width(6.dp))
                                Text("Probar", fontSize = 12.sp, fontWeight = FontWeight.Bold)
                            }
                        }

                        Button(
                            onClick = {
                                onSyncSupabase?.invoke { ok, msg ->
                                    Toast.makeText(context, msg, Toast.LENGTH_LONG).show()
                                }
                            },
                            enabled = !isSupabaseLoading,
                            colors = ButtonDefaults.buttonColors(containerColor = LuminaEmerald),
                            shape = RoundedCornerShape(10.dp),
                            modifier = Modifier
                                .weight(1f)
                                .testTag("btn_sync_supabase")
                        ) {
                            Icon(Icons.Default.Sync, contentDescription = null, modifier = Modifier.size(16.dp))
                            Spacer(modifier = Modifier.width(6.dp))
                            Text("Sincronizar", fontSize = 12.sp, fontWeight = FontWeight.Bold)
                        }
                    }

                    Spacer(modifier = Modifier.height(8.dp))

                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween
                    ) {
                        TextButton(
                            onClick = {
                                editSupabaseUrl = supabaseManager?.supabaseUrl ?: "https://nrgyuposoruudmqjmysv.supabase.co"
                                editSupabaseKey = supabaseManager?.supabaseAnonKey ?: "sb_publishable_cyyWQu4ds6E_gTrL_sD_zw_AL5RlGst"
                                showSupabaseConfigDialog = true
                            },
                            modifier = Modifier.testTag("btn_edit_supabase_creds")
                        ) {
                            Text("Configurar Claves", fontSize = 11.sp, color = LuminaBlue, fontWeight = FontWeight.Bold)
                        }

                        TextButton(
                            onClick = { showSqlScriptDialog = true },
                            modifier = Modifier.testTag("btn_view_sql_script")
                        ) {
                            Icon(Icons.Default.Code, contentDescription = null, tint = LuminaGold, modifier = Modifier.size(14.dp))
                            Spacer(modifier = Modifier.width(4.dp))
                            Text("Ver Script SQL", fontSize = 11.sp, color = LuminaGold, fontWeight = FontWeight.Bold)
                        }
                    }
                }
            }
        }

        // =========================================================================
        // 5. ACTUALIZACIONES DE LA APLICACIÓN (OTA)
        // =========================================================================
        item {
            Card(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 20.dp, vertical = 6.dp)
                    .testTag("security_card_updates"),
                shape = RoundedCornerShape(20.dp),
                colors = CardDefaults.cardColors(containerColor = cardBg),
                border = CardDefaults.outlinedCardBorder().copy(
                    brush = androidx.compose.ui.graphics.SolidColor(borderColor)
                )
            ) {
                Column(modifier = Modifier.padding(20.dp)) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Row(
                            verticalAlignment = Alignment.CenterVertically,
                            modifier = Modifier.weight(1f)
                        ) {
                            Box(
                                modifier = Modifier
                                    .size(44.dp)
                                    .clip(CircleShape)
                                    .background(LuminaBlue.copy(alpha = 0.2f)),
                                contentAlignment = Alignment.Center
                            ) {
                                Icon(
                                    imageVector = Icons.Default.SystemUpdate,
                                    contentDescription = null,
                                    tint = LuminaBlue,
                                    modifier = Modifier.size(24.dp)
                                )
                            }

                            Spacer(modifier = Modifier.width(14.dp))

                            Column {
                                Row(verticalAlignment = Alignment.CenterVertically) {
                                    Text(
                                        text = "Actualizaciones de App",
                                        fontSize = 15.sp,
                                        fontWeight = FontWeight.Bold,
                                        color = textPrimary
                                    )
                                    Spacer(modifier = Modifier.width(6.dp))
                                    Box(
                                        modifier = Modifier
                                            .clip(RoundedCornerShape(6.dp))
                                            .background(LuminaEmerald.copy(alpha = 0.15f))
                                            .padding(horizontal = 6.dp, vertical = 2.dp)
                                    ) {
                                        Text(
                                            text = "OTA",
                                            fontSize = 9.sp,
                                            fontWeight = FontWeight.Bold,
                                            color = LuminaEmerald
                                        )
                                    }
                                }
                                Text(
                                    text = "Instalada: v${appUpdateManager?.currentVersionName ?: "1.0"} (Build ${appUpdateManager?.currentVersionCode ?: 1})",
                                    fontSize = 12.sp,
                                    color = textSecondary
                                )
                            }
                        }
                    }

                    Spacer(modifier = Modifier.height(10.dp))

                    Text(
                        text = "Avisa automáticamente a los usuarios que ya tienen la app instalada con una notificación y diálogo para 'Actualizar' o 'Recordar más tarde'.",
                        fontSize = 12.sp,
                        lineHeight = 17.sp,
                        color = textSecondary
                    )

                    Spacer(modifier = Modifier.height(14.dp))

                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        Button(
                            onClick = {
                                onCheckForUpdates?.invoke(true) { hasUpdate, msg ->
                                    Toast.makeText(context, msg, Toast.LENGTH_LONG).show()
                                }
                            },
                            enabled = !isCheckingUpdate,
                            colors = ButtonDefaults.buttonColors(containerColor = LuminaBlue),
                            shape = RoundedCornerShape(10.dp),
                            modifier = Modifier
                                .weight(1f)
                                .testTag("btn_check_updates")
                        ) {
                            if (isCheckingUpdate) {
                                CircularProgressIndicator(modifier = Modifier.size(16.dp), color = Color.White, strokeWidth = 2.dp)
                            } else {
                                Icon(Icons.Default.Refresh, contentDescription = null, modifier = Modifier.size(15.dp))
                                Spacer(modifier = Modifier.width(4.dp))
                                Text("Buscar", fontSize = 12.sp, fontWeight = FontWeight.Bold)
                            }
                        }

                        Button(
                            onClick = {
                                onSimulateUpdate?.invoke()
                                Toast.makeText(context, "¡Alerta enviada! Revisa el diálogo en pantalla y tu barra de notificaciones", Toast.LENGTH_SHORT).show()
                            },
                            colors = ButtonDefaults.buttonColors(containerColor = LuminaEmerald),
                            shape = RoundedCornerShape(10.dp),
                            modifier = Modifier
                                .weight(1f)
                                .testTag("btn_simulate_update")
                        ) {
                            Icon(Icons.Default.NotificationsActive, contentDescription = null, modifier = Modifier.size(15.dp))
                            Spacer(modifier = Modifier.width(4.dp))
                            Text("Probar Alerta", fontSize = 12.sp, fontWeight = FontWeight.Bold)
                        }
                    }

                    Spacer(modifier = Modifier.height(8.dp))

                    TextButton(
                        onClick = { showUpdateGuideDialog = true },
                        modifier = Modifier
                            .fillMaxWidth()
                            .testTag("btn_view_update_guide")
                    ) {
                        Icon(Icons.AutoMirrored.Filled.HelpOutline, contentDescription = null, tint = LuminaGold, modifier = Modifier.size(15.dp))
                        Spacer(modifier = Modifier.width(6.dp))
                        Text(
                            text = "¿Cómo publicar versiones a mis usuarios?",
                            fontSize = 12.sp,
                            color = LuminaGold,
                            fontWeight = FontWeight.Bold
                        )
                    }
                }
            }
        }

        // =========================================================================
        // 6. BLOQUEO POR INACTIVIDAD (40 SEGUNDOS SIN RECIBIR SEÑAL)
        // =========================================================================
        item {
            Card(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 20.dp, vertical = 6.dp)
                    .testTag("card_inactivity_lock_40s"),
                shape = RoundedCornerShape(20.dp),
                colors = CardDefaults.cardColors(containerColor = cardBg),
                border = CardDefaults.outlinedCardBorder().copy(
                    brush = androidx.compose.ui.graphics.SolidColor(borderColor)
                )
            ) {
                Column(modifier = Modifier.padding(20.dp)) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Row(
                            verticalAlignment = Alignment.CenterVertically,
                            modifier = Modifier.weight(1f)
                        ) {
                            Box(
                                modifier = Modifier
                                    .size(44.dp)
                                    .clip(CircleShape)
                                    .background(LuminaGold.copy(alpha = 0.15f)),
                                contentAlignment = Alignment.Center
                            ) {
                                Icon(
                                    imageVector = Icons.Default.Timer,
                                    contentDescription = null,
                                    tint = LuminaGold,
                                    modifier = Modifier.size(24.dp)
                                )
                            }

                            Spacer(modifier = Modifier.width(14.dp))

                            Column {
                                Text(
                                    text = "Bloqueo por Inactividad",
                                    fontSize = 15.sp,
                                    fontWeight = FontWeight.Bold,
                                    color = textPrimary
                                )
                                Text(
                                    text = "40 segundos sin recibir señal",
                                    fontSize = 11.sp,
                                    color = textSecondary
                                )
                            }
                        }

                        // Badge Activo
                        Box(
                            modifier = Modifier
                                .clip(RoundedCornerShape(8.dp))
                                .background(LuminaEmerald.copy(alpha = 0.15f))
                                .padding(horizontal = 8.dp, vertical = 4.dp)
                        ) {
                            Text(
                                text = "ACTIVO 40s",
                                fontSize = 10.sp,
                                fontWeight = FontWeight.Bold,
                                color = LuminaEmerald
                            )
                        }
                    }

                    Spacer(modifier = Modifier.height(14.dp))

                    Text(
                        text = "Si la pantalla está encendida por 40 segundos sin recibir ninguna señal o interacción táctil, la sesión se cerrará automáticamente por seguridad bancaria y deberás iniciar sesión nuevamente para ingresar.",
                        fontSize = 12.sp,
                        color = textSecondary,
                        lineHeight = 17.sp
                    )

                    Spacer(modifier = Modifier.height(12.dp))

                    // Live countdown indicator
                    Card(
                        shape = RoundedCornerShape(12.dp),
                        colors = CardDefaults.cardColors(
                            containerColor = MaterialTheme.colorScheme.surface.copy(alpha = 0.7f)
                        ),
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(horizontal = 14.dp, vertical = 10.dp),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Row(verticalAlignment = Alignment.CenterVertically) {
                                Icon(
                                    imageVector = Icons.Default.Timer,
                                    contentDescription = null,
                                    tint = if (inactivityRemainingSeconds <= 10) LuminaRose else LuminaGold,
                                    modifier = Modifier.size(16.dp)
                                )
                                Spacer(modifier = Modifier.width(8.dp))
                                Text(
                                    text = "Tiempo sin señal restante:",
                                    fontSize = 12.sp,
                                    color = textPrimary,
                                    fontWeight = FontWeight.Medium
                                )
                            }
                            Text(
                                text = "${inactivityRemainingSeconds}s / 40s",
                                fontSize = 13.sp,
                                fontWeight = FontWeight.Bold,
                                color = if (inactivityRemainingSeconds <= 10) LuminaRose else LuminaEmerald
                            )
                        }
                    }

                    Spacer(modifier = Modifier.height(12.dp))

                    OutlinedButton(
                        onClick = {
                            onTestInactivityLock?.invoke()
                        },
                        shape = RoundedCornerShape(12.dp),
                        colors = ButtonDefaults.outlinedButtonColors(contentColor = LuminaGold),
                        modifier = Modifier
                            .fillMaxWidth()
                            .testTag("btn_test_inactivity_40s")
                    ) {
                        Icon(Icons.Default.Timer, contentDescription = null, modifier = Modifier.size(16.dp))
                        Spacer(modifier = Modifier.width(8.dp))
                        Text(
                            text = "Probar Cierre por Inactividad (40s)",
                            fontSize = 12.sp,
                            fontWeight = FontWeight.Bold
                        )
                    }
                }
            }
        }

        // =========================================================================
        // 7. LOCK APP IMMEDIATELY
        // =========================================================================
        item {
            Spacer(modifier = Modifier.height(10.dp))
            Box(modifier = Modifier.padding(horizontal = 20.dp)) {
                OutlinedButton(
                    onClick = onLockAppNow,
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(48.dp),
                    shape = RoundedCornerShape(14.dp),
                    colors = ButtonDefaults.outlinedButtonColors(contentColor = LuminaRose)
                ) {
                    Icon(Icons.Default.Lock, contentDescription = null, modifier = Modifier.size(18.dp))
                    Spacer(modifier = Modifier.width(8.dp))
                    Text("Bloquear Aplicación Ahora", fontWeight = FontWeight.Bold, fontSize = 13.sp)
                }
            }
        }
    }

    // =========================================================================
    // DIALOG: CAMBIAR PIN
    // =========================================================================
    if (showChangePinDialog) {
        var newPin by remember { mutableStateOf("") }
        Dialog(onDismissRequest = { showChangePinDialog = false }) {
            Surface(
                shape = RoundedCornerShape(20.dp),
                color = cardBg,
                border = CardDefaults.outlinedCardBorder().copy(
                    brush = androidx.compose.ui.graphics.SolidColor(borderColor)
                ),
                modifier = Modifier.fillMaxWidth()
            ) {
                Column(modifier = Modifier.padding(22.dp)) {
                    Text("Cambiar PIN de Seguridad", fontSize = 16.sp, fontWeight = FontWeight.Bold, color = textPrimary)
                    Spacer(modifier = Modifier.height(6.dp))
                    Text("Ingresa un nuevo PIN numérico de 4 dígitos:", fontSize = 12.sp, color = textSecondary)
                    Spacer(modifier = Modifier.height(14.dp))

                    OutlinedTextField(
                        value = newPin,
                        onValueChange = { if (it.length <= 4 && it.all { char -> char.isDigit() }) newPin = it },
                        label = { Text("Nuevo PIN") },
                        placeholder = { Text("4 dígitos") },
                        keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.NumberPassword),
                        modifier = Modifier.fillMaxWidth(),
                        colors = OutlinedTextFieldDefaults.colors(
                            focusedBorderColor = LuminaBlue,
                            unfocusedBorderColor = borderColor,
                            focusedTextColor = textPrimary,
                            unfocusedTextColor = textPrimary
                        )
                    )

                    Spacer(modifier = Modifier.height(16.dp))

                    Row(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                        OutlinedButton(
                            onClick = { showChangePinDialog = false },
                            modifier = Modifier.weight(1f)
                        ) {
                            Text("Cancelar", color = textPrimary)
                        }

                        Button(
                            onClick = {
                                if (newPin.length == 4) {
                                    biometricHelper.securityPin = newPin
                                    showChangePinDialog = false
                                    Toast.makeText(context, "PIN actualizado exitosamente", Toast.LENGTH_SHORT).show()
                                } else {
                                    Toast.makeText(context, "El PIN debe tener exactamente 4 dígitos", Toast.LENGTH_SHORT).show()
                                }
                            },
                            modifier = Modifier.weight(1f),
                            colors = ButtonDefaults.buttonColors(containerColor = LuminaBlue)
                        ) {
                            Text("Guardar")
                        }
                    }
                }
            }
        }
    }

    // =========================================================================
    // DIALOG: CONFIGURAR SUPABASE CREDENCIALES
    // =========================================================================
    if (showSupabaseConfigDialog) {
        Dialog(onDismissRequest = { showSupabaseConfigDialog = false }) {
            Surface(
                shape = RoundedCornerShape(20.dp),
                color = cardBg,
                border = CardDefaults.outlinedCardBorder().copy(
                    brush = androidx.compose.ui.graphics.SolidColor(borderColor)
                ),
                modifier = Modifier.fillMaxWidth()
            ) {
                Column(modifier = Modifier.padding(22.dp)) {
                    Text("Configurar Base de Datos Supabase", fontSize = 16.sp, fontWeight = FontWeight.Bold, color = textPrimary)
                    Spacer(modifier = Modifier.height(6.dp))
                    Text("Ingresa los datos de conexión REST de tu proyecto Supabase PostgreSQL:", fontSize = 12.sp, color = textSecondary)
                    Spacer(modifier = Modifier.height(14.dp))

                    OutlinedTextField(
                        value = editSupabaseUrl,
                        onValueChange = { editSupabaseUrl = it },
                        label = { Text("Supabase URL") },
                        placeholder = { Text("https://nrgyuposoruudmqjmysv.supabase.co") },
                        singleLine = true,
                        modifier = Modifier.fillMaxWidth(),
                        colors = OutlinedTextFieldDefaults.colors(
                            focusedBorderColor = LuminaBlue,
                            unfocusedBorderColor = borderColor,
                            focusedTextColor = textPrimary,
                            unfocusedTextColor = textPrimary
                        )
                    )

                    Spacer(modifier = Modifier.height(10.dp))

                    OutlinedTextField(
                        value = editSupabaseKey,
                        onValueChange = { editSupabaseKey = it },
                        label = { Text("Publishable / Anon Key") },
                        placeholder = { Text("sb_publishable_...") },
                        singleLine = true,
                        modifier = Modifier.fillMaxWidth(),
                        colors = OutlinedTextFieldDefaults.colors(
                            focusedBorderColor = LuminaBlue,
                            unfocusedBorderColor = borderColor,
                            focusedTextColor = textPrimary,
                            unfocusedTextColor = textPrimary
                        )
                    )

                    Spacer(modifier = Modifier.height(10.dp))

                    TextButton(
                        onClick = {
                            editSupabaseUrl = "https://nrgyuposoruudmqjmysv.supabase.co"
                            editSupabaseKey = "sb_publishable_cyyWQu4ds6E_gTrL_sD_zw_AL5RlGst"
                        },
                        modifier = Modifier.align(Alignment.End)
                    ) {
                        Text("Restablecer a valores por defecto", fontSize = 11.sp, color = LuminaBlue)
                    }

                    Spacer(modifier = Modifier.height(14.dp))

                    Row(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                        OutlinedButton(
                            onClick = { showSupabaseConfigDialog = false },
                            modifier = Modifier.weight(1f)
                        ) {
                            Text("Cancelar", color = textPrimary)
                        }

                        Button(
                            onClick = {
                                if (editSupabaseUrl.isNotBlank() && editSupabaseKey.isNotBlank()) {
                                    onSaveSupabaseConfig?.invoke(editSupabaseUrl.trim(), editSupabaseKey.trim())
                                    showSupabaseConfigDialog = false
                                    Toast.makeText(context, "Credenciales de Supabase guardadas", Toast.LENGTH_SHORT).show()
                                } else {
                                    Toast.makeText(context, "Por favor completa la URL y la Anon Key", Toast.LENGTH_SHORT).show()
                                }
                            },
                            modifier = Modifier.weight(1f),
                            colors = ButtonDefaults.buttonColors(containerColor = LuminaBlue)
                        ) {
                            Text("Guardar")
                        }
                    }
                }
            }
        }
    }

    // =========================================================================
    // DIALOG: SCRIPT SQL PARA SUPABASE
    // =========================================================================
    if (showSqlScriptDialog) {
        Dialog(onDismissRequest = { showSqlScriptDialog = false }) {
            Surface(
                shape = RoundedCornerShape(20.dp),
                color = cardBg,
                border = CardDefaults.outlinedCardBorder().copy(
                    brush = androidx.compose.ui.graphics.SolidColor(borderColor)
                ),
                modifier = Modifier
                    .fillMaxWidth()
                    .heightIn(max = 560.dp)
            ) {
                Column(modifier = Modifier.padding(20.dp)) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Text("Script SQL para Supabase", fontSize = 16.sp, fontWeight = FontWeight.Bold, color = textPrimary)
                        IconButton(onClick = { showSqlScriptDialog = false }) {
                            Icon(Icons.Default.Close, contentDescription = "Cerrar", tint = textSecondary)
                        }
                    }

                    Text(
                        "Copia y pega este script en el SQL Editor de tu panel de Supabase para crear las tablas 'profiles', 'transactions' y permisos RLS:",
                        fontSize = 11.sp,
                        color = textSecondary
                    )

                    Spacer(modifier = Modifier.height(10.dp))

                    Surface(
                        modifier = Modifier
                            .weight(1f)
                            .fillMaxWidth(),
                        shape = RoundedCornerShape(10.dp),
                        color = MaterialTheme.colorScheme.surface
                    ) {
                        Box(modifier = Modifier.padding(10.dp)) {
                            Text(
                                text = SupabaseManager.SQL_MIGRATION_SCRIPT,
                                fontSize = 9.sp,
                                fontFamily = FontFamily.Monospace,
                                color = textPrimary,
                                modifier = Modifier.verticalScroll(rememberScrollState())
                            )
                        }
                    }

                    Spacer(modifier = Modifier.height(14.dp))

                    Button(
                        onClick = {
                            val clipboard = context.getSystemService(Context.CLIPBOARD_SERVICE) as ClipboardManager
                            val clip = ClipData.newPlainText("Supabase SQL Script", SupabaseManager.SQL_MIGRATION_SCRIPT)
                            clipboard.setPrimaryClip(clip)
                            Toast.makeText(context, "¡Script SQL copiado al portapapeles!", Toast.LENGTH_SHORT).show()
                        },
                        colors = ButtonDefaults.buttonColors(containerColor = LuminaEmerald),
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Icon(Icons.Default.ContentCopy, contentDescription = null, modifier = Modifier.size(16.dp))
                        Spacer(modifier = Modifier.width(8.dp))
                        Text("Copiar Script SQL al Portapapeles", fontSize = 12.sp, fontWeight = FontWeight.Bold)
                    }
                }
            }
        }
    }

    // =========================================================================
    // DIALOG: GUÍA DE ACTUALIZACIONES PARA ADMINISTRADOR
    // =========================================================================
    if (showUpdateGuideDialog) {
        val updateSql = """
            -- Tabla para gestionar versiones de Lumina Bank en Supabase
            CREATE TABLE IF NOT EXISTS public.app_updates (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                version_code INT NOT NULL,
                version_name TEXT NOT NULL,
                release_notes TEXT NOT NULL,
                download_url TEXT NOT NULL,
                is_mandatory BOOLEAN DEFAULT false,
                created_at TIMESTAMPTZ DEFAULT NOW()
            );

            ALTER TABLE public.app_updates ENABLE ROW LEVEL SECURITY;
            CREATE POLICY "Lectura publica de versiones" ON public.app_updates FOR SELECT USING (true);

            -- Ejemplo para publicar una nueva versión:
            INSERT INTO public.app_updates (version_code, version_name, release_notes, download_url, is_mandatory)
            VALUES (
                2,
                '1.1.0',
                '• Transferencias instantáneas optimizadas\n• Notificaciones push automáticas\n• Sincronización con Supabase',
                'https://tudominio.com/app-release.apk',
                false
            );
        """.trimIndent()

        Dialog(onDismissRequest = { showUpdateGuideDialog = false }) {
            Surface(
                modifier = Modifier
                    .fillMaxWidth()
                    .heightIn(max = 620.dp),
                shape = RoundedCornerShape(22.dp),
                color = cardBg
            ) {
                Column(modifier = Modifier.padding(20.dp)) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Icon(Icons.Default.SystemUpdate, contentDescription = null, tint = LuminaBlue, modifier = Modifier.size(22.dp))
                            Spacer(modifier = Modifier.width(8.dp))
                            Text("Guía de Actualizaciones", fontSize = 16.sp, fontWeight = FontWeight.Bold, color = textPrimary)
                        }
                        IconButton(onClick = { showUpdateGuideDialog = false }) {
                            Icon(Icons.Default.Close, contentDescription = "Cerrar", tint = textSecondary)
                        }
                    }

                    Spacer(modifier = Modifier.height(10.dp))

                    Column(
                        modifier = Modifier
                            .weight(1f)
                            .verticalScroll(rememberScrollState())
                    ) {
                        Text(
                            text = "1. Requisitos para actualizar APK sobre APK:",
                            fontSize = 13.sp,
                            fontWeight = FontWeight.Bold,
                            color = LuminaEmerald
                        )
                        Spacer(modifier = Modifier.height(4.dp))
                        Text(
                            text = "• Mismo 'applicationId': com.aistudio.luminabank.vxkpqr\n" +
                                   "• Mismo Keystore de firma (el certificado con el que se firmó el primer APK).\n" +
                                   "• En 'build.gradle.kts': subir 'versionCode' de 1 a 2 y 'versionName' a '1.1'.\n" +
                                   "Si estos 3 coinciden, Android permite instalar la actualización encima sin borrar datos ni cuentas.",
                            fontSize = 12.sp,
                            lineHeight = 17.sp,
                            color = textSecondary
                        )

                        Spacer(modifier = Modifier.height(12.dp))

                        Text(
                            text = "2. Avisar a usuarios con Notificación y Diálogo:",
                            fontSize = 13.sp,
                            fontWeight = FontWeight.Bold,
                            color = LuminaBlue
                        )
                        Spacer(modifier = Modifier.height(4.dp))
                        Text(
                            text = "La aplicación ya tiene integrado el verificador OTA. Al abrir la app, consulta la tabla 'app_updates' en tu Supabase. Si 'version_code > versionCode actual', dispara la notificación push y el diálogo con 'Actualizar' y 'Recordar más tarde' (que pospone el aviso por 24 horas).",
                            fontSize = 12.sp,
                            lineHeight = 17.sp,
                            color = textSecondary
                        )

                        Spacer(modifier = Modifier.height(12.dp))

                        Text(
                            text = "3. Script SQL para tu Supabase:",
                            fontSize = 13.sp,
                            fontWeight = FontWeight.Bold,
                            color = LuminaGold
                        )
                        Spacer(modifier = Modifier.height(4.dp))

                        Surface(
                            modifier = Modifier.fillMaxWidth(),
                            shape = RoundedCornerShape(10.dp),
                            color = MaterialTheme.colorScheme.surface
                        ) {
                            Box(modifier = Modifier.padding(10.dp)) {
                                Text(
                                    text = updateSql,
                                    fontSize = 10.sp,
                                    fontFamily = FontFamily.Monospace,
                                    color = textPrimary
                                )
                            }
                        }
                    }

                    Spacer(modifier = Modifier.height(12.dp))

                    Button(
                        onClick = {
                            val clipboard = context.getSystemService(Context.CLIPBOARD_SERVICE) as ClipboardManager
                            val clip = ClipData.newPlainText("Supabase Update SQL", updateSql)
                            clipboard.setPrimaryClip(clip)
                            Toast.makeText(context, "¡Script de actualizaciones copiado!", Toast.LENGTH_SHORT).show()
                        },
                        colors = ButtonDefaults.buttonColors(containerColor = LuminaEmerald),
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Icon(Icons.Default.ContentCopy, contentDescription = null, modifier = Modifier.size(16.dp))
                        Spacer(modifier = Modifier.width(8.dp))
                        Text("Copiar SQL de Actualizaciones", fontSize = 12.sp, fontWeight = FontWeight.Bold)
                    }
                }
            }
        }
    }
}
