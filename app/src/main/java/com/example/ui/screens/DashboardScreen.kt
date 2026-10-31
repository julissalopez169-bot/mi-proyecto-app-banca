package com.example.ui.screens

import androidx.compose.animation.AnimatedVisibility
import androidx.compose.foundation.background
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
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowForward
import androidx.compose.material.icons.automirrored.filled.Login
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.Bolt
import androidx.compose.material.icons.filled.Close
import androidx.compose.material.icons.filled.CloudDone
import androidx.compose.material.icons.filled.DarkMode
import androidx.compose.material.icons.filled.LightMode
import androidx.compose.material.icons.filled.Lock
import androidx.compose.material.icons.filled.NotificationsActive
import androidx.compose.material.icons.filled.PictureAsPdf
import androidx.compose.material.icons.filled.PieChart
import androidx.compose.material.icons.filled.QrCodeScanner
import androidx.compose.material.icons.filled.Savings
import androidx.compose.material.icons.filled.Shield
import androidx.compose.material.icons.filled.Storage
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.data.model.AccountEntity
import com.example.data.model.BeneficiaryEntity
import com.example.data.model.CardEntity
import com.example.data.model.TransactionEntity
import com.example.ui.Screen
import com.example.ui.components.BalanceCard
import com.example.ui.components.InteractiveCardItem
import com.example.ui.components.LuminaTopBar
import com.example.ui.components.TransactionListItem
import com.example.ui.theme.LuminaBlue
import com.example.ui.theme.LuminaCardDark
import com.example.ui.theme.LuminaEmerald
import com.example.ui.theme.LuminaGold
import com.example.ui.theme.LuminaNavyDark
import com.example.ui.theme.LuminaRose

import androidx.compose.material.icons.filled.Check
import androidx.compose.material.icons.filled.Person
import androidx.compose.material.icons.filled.SwapHoriz
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.OutlinedTextFieldDefaults
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.window.Dialog
import android.widget.Toast

@Composable
fun DashboardScreen(
    account: AccountEntity?,
    cards: List<CardEntity>,
    transactions: List<TransactionEntity>,
    beneficiaries: List<BeneficiaryEntity>,
    unreadNotificationsCount: Int,
    isBalanceHidden: Boolean,
    isUsdCurrency: Boolean,
    isDarkMode: Boolean = true,
    onToggleDarkMode: () -> Unit = {},
    showNotificationBanner: Boolean,
    onRequestNotificationPermission: () -> Unit,
    onDismissNotificationBanner: () -> Unit,
    onToggleBalanceHidden: () -> Unit,
    onToggleCurrency: () -> Unit,
    onNavigate: (Screen) -> Unit,
    onSelectBeneficiary: (BeneficiaryEntity) -> Unit,
    onToggleCardFreeze: (CardEntity) -> Unit,
    onCardRevealSensitive: (CardEntity) -> Unit,
    onSelectTransaction: (TransactionEntity) -> Unit,
    onQuickSimulateDeposit: () -> Unit,
    onLockApp: () -> Unit,
    registeredAccounts: List<AccountEntity> = emptyList(),
    onSwitchAccount: (name: String, accountNumber: String, balance: Double) -> Unit = { _, _, _ -> },
    isSupabaseConfigured: Boolean = false
) {
    val context = LocalContext.current
    var showAccountSwitcherDialog by remember { mutableStateOf(false) }
    var customNewName by remember { mutableStateOf("") }

    val userInitials = account?.accountHolder?.let { holder ->
        val parts = holder.split(" ").filter { it.isNotBlank() }
        when {
            parts.size >= 2 -> "${parts[0].first().uppercase()}${parts[1].first().uppercase()}"
            parts.isNotEmpty() -> parts[0].take(2).uppercase()
            else -> "UN"
        }
    } ?: "UN"

    val availableAccounts = remember(registeredAccounts, account) {
        val list = if (registeredAccounts.isNotEmpty()) registeredAccounts else listOfNotNull(account)
        list.map { acc -> Triple(acc.accountHolder, acc.accountNumber, acc.balanceHnl) }
    }

    if (showAccountSwitcherDialog) {
        Dialog(onDismissRequest = { showAccountSwitcherDialog = false }) {
            Card(
                shape = RoundedCornerShape(24.dp),
                colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(8.dp)
                    .testTag("dialog_account_switcher")
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
                                Icon(
                                    Icons.Default.SwapHoriz,
                                    contentDescription = null,
                                    tint = LuminaBlue,
                                    modifier = Modifier.size(20.dp)
                                )
                            }
                            Spacer(modifier = Modifier.width(10.dp))
                            Column {
                                Text(
                                    text = "Cambiar de Cuenta",
                                    fontWeight = FontWeight.Bold,
                                    fontSize = 16.sp,
                                    color = MaterialTheme.colorScheme.onSurface
                                )
                                Text(
                                    text = "Selecciona o ingresa otra cuenta",
                                    fontSize = 11.sp,
                                    color = MaterialTheme.colorScheme.onSurfaceVariant
                                )
                            }
                        }
                        IconButton(
                            onClick = { showAccountSwitcherDialog = false },
                            modifier = Modifier.size(28.dp)
                        ) {
                            Icon(Icons.Default.Close, contentDescription = "Cerrar", tint = MaterialTheme.colorScheme.onSurfaceVariant)
                        }
                    }

                    Spacer(modifier = Modifier.height(14.dp))
                    Text(
                        text = "CUENTAS DISPONIBLES",
                        fontSize = 10.sp,
                        fontWeight = FontWeight.Bold,
                        color = LuminaBlue,
                        letterSpacing = 1.sp
                    )
                    Spacer(modifier = Modifier.height(8.dp))

                    availableAccounts.forEach { (name, accNum, bal) ->
                        val isCurrent = account?.accountHolder.equals(name, ignoreCase = true)
                        Card(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(vertical = 4.dp)
                                .clip(RoundedCornerShape(12.dp))
                                .clickable {
                                    onSwitchAccount(name, accNum, bal)
                                    Toast.makeText(context, "Bienvenido(a) $name", Toast.LENGTH_SHORT).show()
                                    showAccountSwitcherDialog = false
                                }
                                .testTag("account_switch_item_${name.replace(" ", "_")}"),
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
                                        Text(
                                            text = name,
                                            fontWeight = FontWeight.Bold,
                                            fontSize = 13.sp,
                                            color = MaterialTheme.colorScheme.onSurface
                                        )
                                        Text(
                                            text = "No. $accNum",
                                            fontSize = 10.sp,
                                            color = MaterialTheme.colorScheme.onSurfaceVariant
                                        )
                                    }
                                }

                                Row(verticalAlignment = Alignment.CenterVertically) {
                                    Text(
                                        text = String.format("L %,.2f", bal),
                                        fontWeight = FontWeight.Bold,
                                        fontSize = 12.sp,
                                        color = LuminaEmerald
                                    )
                                    if (isCurrent) {
                                        Spacer(modifier = Modifier.width(6.dp))
                                        Icon(
                                            Icons.Default.Check,
                                            contentDescription = "Activa",
                                            tint = LuminaBlue,
                                            modifier = Modifier.size(16.dp)
                                        )
                                    }
                                }
                            }
                        }
                    }

                    Spacer(modifier = Modifier.height(14.dp))
                    Text(
                        text = "INGRESAR OTRO NOMBRE / USUARIO",
                        fontSize = 10.sp,
                        fontWeight = FontWeight.Bold,
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                        letterSpacing = 1.sp
                    )
                    Spacer(modifier = Modifier.height(6.dp))

                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        OutlinedTextField(
                            value = customNewName,
                            onValueChange = { customNewName = it },
                            placeholder = { Text("Ej: Andrea Morales", fontSize = 12.sp) },
                            singleLine = true,
                            modifier = Modifier
                                .weight(1f)
                                .testTag("input_custom_account_name"),
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
                                    onSwitchAccount(formatted, newAccNum, 20000.0)
                                    Toast.makeText(context, "Bienvenido(a) $formatted", Toast.LENGTH_SHORT).show()
                                    showAccountSwitcherDialog = false
                                }
                            },
                            shape = RoundedCornerShape(12.dp),
                            colors = ButtonDefaults.buttonColors(containerColor = LuminaBlue),
                            modifier = Modifier.testTag("btn_switch_to_custom_name")
                        ) {
                            Text("Cambiar", fontSize = 12.sp, fontWeight = FontWeight.Bold)
                        }
                    }

                    Spacer(modifier = Modifier.height(14.dp))
                    HorizontalDivider(color = MaterialTheme.colorScheme.outline.copy(alpha = 0.2f))
                    Spacer(modifier = Modifier.height(8.dp))

                    TextButton(
                        onClick = {
                            showAccountSwitcherDialog = false
                            onLockApp()
                        },
                        modifier = Modifier
                            .fillMaxWidth()
                            .testTag("btn_go_to_login_screen")
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
            .testTag("dashboard_screen"),
        contentPadding = PaddingValues(bottom = 90.dp)
    ) {
        // 1. Top Bar
        item {
            LuminaTopBar(
                title = account?.accountHolder?.let { "Hola, ${it.split(" ").first()}" } ?: "Hola, Usuario",
                subtitle = "Banca Nova Honduras",
                showBackButton = false,
                unreadNotificationsCount = unreadNotificationsCount,
                onNotificationsClick = { onNavigate(Screen.NOTIFICATIONS) },
                onSecurityClick = { onNavigate(Screen.SECURITY) },
                onLockClick = onLockApp,
                isDarkMode = isDarkMode,
                onToggleDarkMode = onToggleDarkMode,
                userInitials = userInitials,
                onProfileClick = { showAccountSwitcherDialog = true }
            )
        }

        // 2. Notification Permission / Real-time Push Status Banner
        item {
            AnimatedVisibility(visible = showNotificationBanner) {
                Card(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(horizontal = 20.dp, vertical = 6.dp),
                    shape = RoundedCornerShape(16.dp),
                    colors = CardDefaults.cardColors(containerColor = Color(0xFF1E293B))
                ) {
                    Row(
                        modifier = Modifier.padding(14.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Box(
                            modifier = Modifier
                                .size(38.dp)
                                .clip(CircleShape)
                                .background(LuminaBlue.copy(alpha = 0.2f)),
                            contentAlignment = Alignment.Center
                        ) {
                            Icon(
                                imageVector = Icons.Default.NotificationsActive,
                                contentDescription = "Push",
                                tint = LuminaBlue,
                                modifier = Modifier.size(20.dp)
                            )
                        }

                        Spacer(modifier = Modifier.width(12.dp))

                        Column(modifier = Modifier.weight(1f)) {
                            Text(
                                text = "Notificaciones Push Activas",
                                fontSize = 12.sp,
                                fontWeight = FontWeight.Bold,
                                color = Color.White
                            )
                            Text(
                                text = "Recibe alertas en tiempo real de transferencias y seguridad.",
                                fontSize = 11.sp,
                                color = Color(0xFF94A3B8)
                            )
                        }

                        Button(
                            onClick = onRequestNotificationPermission,
                            colors = ButtonDefaults.buttonColors(containerColor = LuminaBlue),
                            shape = RoundedCornerShape(10.dp),
                            contentPadding = PaddingValues(horizontal = 10.dp, vertical = 6.dp)
                        ) {
                            Text("Activar", fontSize = 11.sp)
                        }

                        IconButton(
                            onClick = onDismissNotificationBanner,
                            modifier = Modifier.size(24.dp)
                        ) {
                            Icon(Icons.Default.Close, contentDescription = "Cerrar", tint = Color(0xFF94A3B8))
                        }
                    }
                }
            }
        }

        // 3. Balance Card with quick actions
        item {
            BalanceCard(
                account = account,
                isBalanceHidden = isBalanceHidden,
                isUsdCurrency = isUsdCurrency,
                onToggleBalanceHidden = onToggleBalanceHidden,
                onToggleCurrency = onToggleCurrency,
                onTransferClick = { onNavigate(Screen.TRANSFERS) },
                onReceiveQrClick = { onNavigate(Screen.QR_PAY) },
                onCardsClick = { onNavigate(Screen.CARDS) },
                onHistoryClick = { onNavigate(Screen.TRANSACTIONS) }
            )
        }

        // 3.5. Quick Preferences: Modo Oscuro/Claro & Iniciar Sesión / Cerrar Sesión
        item {
            Spacer(modifier = Modifier.height(10.dp))
            Card(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 20.dp),
                shape = RoundedCornerShape(16.dp),
                colors = CardDefaults.cardColors(
                    containerColor = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.7f)
                )
            ) {
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(horizontal = 12.dp, vertical = 10.dp),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    // Modo Oscuro / Modo Claro Toggle Chip
                    Row(
                        modifier = Modifier
                            .clip(RoundedCornerShape(12.dp))
                            .background(MaterialTheme.colorScheme.surface)
                            .clickable(onClick = onToggleDarkMode)
                            .padding(horizontal = 12.dp, vertical = 8.dp)
                            .testTag("dashboard_theme_toggle_chip"),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Icon(
                            imageVector = if (isDarkMode) Icons.Default.LightMode else Icons.Default.DarkMode,
                            contentDescription = if (isDarkMode) "Cambiar a Modo Claro" else "Cambiar a Modo Oscuro",
                            tint = if (isDarkMode) LuminaGold else LuminaBlue,
                            modifier = Modifier.size(18.dp)
                        )
                        Spacer(modifier = Modifier.width(8.dp))
                        Column {
                            Text(
                                text = if (isDarkMode) "Modo Claro" else "Modo Oscuro",
                                fontSize = 12.sp,
                                fontWeight = FontWeight.Bold,
                                color = MaterialTheme.colorScheme.onSurface
                            )
                            Text(
                                text = if (isDarkMode) "Tema: Nocturno" else "Tema: Diurno",
                                fontSize = 9.sp,
                                color = MaterialTheme.colorScheme.onSurfaceVariant
                            )
                        }
                    }

                    // Iniciar Sesión / Cambiar Cuenta Chip
                    Row(
                        modifier = Modifier
                            .clip(RoundedCornerShape(12.dp))
                            .background(MaterialTheme.colorScheme.surface)
                            .clickable { showAccountSwitcherDialog = true }
                            .padding(horizontal = 12.dp, vertical = 8.dp)
                            .testTag("dashboard_session_toggle_chip"),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Icon(
                            imageVector = Icons.Default.SwapHoriz,
                            contentDescription = "Cambiar Cuenta / Iniciar Sesión",
                            tint = LuminaRose,
                            modifier = Modifier.size(18.dp)
                        )
                        Spacer(modifier = Modifier.width(8.dp))
                        Column {
                            Text(
                                text = "Cambiar Cuenta",
                                fontSize = 12.sp,
                                fontWeight = FontWeight.Bold,
                                color = MaterialTheme.colorScheme.onSurface
                            )
                            Text(
                                text = "Cambiar usuario",
                                fontSize = 9.sp,
                                color = MaterialTheme.colorScheme.onSurfaceVariant
                            )
                        }
                    }
                }
            }
        }

        // 3.8. Accesos Rápidos: Bóvedas de Ahorro, Presupuestos, Cobro QR y SAR
        item {
            Spacer(modifier = Modifier.height(14.dp))
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 20.dp),
                horizontalArrangement = Arrangement.spacedBy(10.dp)
            ) {
                // Bóvedas / Alcancías
                Card(
                    modifier = Modifier
                        .weight(1f)
                        .clickable { onNavigate(Screen.VAULTS) },
                    shape = RoundedCornerShape(16.dp),
                    colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant)
                ) {
                    Column(
                        modifier = Modifier.padding(12.dp),
                        horizontalAlignment = Alignment.CenterHorizontally
                    ) {
                        Box(
                            modifier = Modifier
                                .size(38.dp)
                                .clip(CircleShape)
                                .background(LuminaEmerald.copy(alpha = 0.2f)),
                            contentAlignment = Alignment.Center
                        ) {
                            Icon(Icons.Default.Savings, contentDescription = null, tint = LuminaEmerald, modifier = Modifier.size(20.dp))
                        }
                        Spacer(modifier = Modifier.height(6.dp))
                        Text("Bóvedas", fontWeight = FontWeight.Bold, fontSize = 12.sp, color = MaterialTheme.colorScheme.onSurface)
                        Text("Alcancías", fontSize = 9.sp, color = MaterialTheme.colorScheme.onSurfaceVariant)
                    }
                }

                // Presupuestos & Gastos
                Card(
                    modifier = Modifier
                        .weight(1f)
                        .clickable { onNavigate(Screen.BUDGET) },
                    shape = RoundedCornerShape(16.dp),
                    colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant)
                ) {
                    Column(
                        modifier = Modifier.padding(12.dp),
                        horizontalAlignment = Alignment.CenterHorizontally
                    ) {
                        Box(
                            modifier = Modifier
                                .size(38.dp)
                                .clip(CircleShape)
                                .background(LuminaBlue.copy(alpha = 0.2f)),
                            contentAlignment = Alignment.Center
                        ) {
                            Icon(Icons.Default.PieChart, contentDescription = null, tint = LuminaBlue, modifier = Modifier.size(20.dp))
                        }
                        Spacer(modifier = Modifier.height(6.dp))
                        Text("Presupuesto", fontWeight = FontWeight.Bold, fontSize = 12.sp, color = MaterialTheme.colorScheme.onSurface)
                        Text("Gráficos", fontSize = 9.sp, color = MaterialTheme.colorScheme.onSurfaceVariant)
                    }
                }

                // Escaneo y Cobro QR
                Card(
                    modifier = Modifier
                        .weight(1f)
                        .clickable { onNavigate(Screen.QR_PAY) },
                    shape = RoundedCornerShape(16.dp),
                    colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant)
                ) {
                    Column(
                        modifier = Modifier.padding(12.dp),
                        horizontalAlignment = Alignment.CenterHorizontally
                    ) {
                        Box(
                            modifier = Modifier
                                .size(38.dp)
                                .clip(CircleShape)
                                .background(Color(0xFF8B5CF6).copy(alpha = 0.2f)),
                            contentAlignment = Alignment.Center
                        ) {
                            Icon(Icons.Default.QrCodeScanner, contentDescription = null, tint = Color(0xFF8B5CF6), modifier = Modifier.size(20.dp))
                        }
                        Spacer(modifier = Modifier.height(6.dp))
                        Text("Pagar QR", fontWeight = FontWeight.Bold, fontSize = 12.sp, color = MaterialTheme.colorScheme.onSurface)
                        Text("Escáner", fontSize = 9.sp, color = MaterialTheme.colorScheme.onSurfaceVariant)
                    }
                }

                // Estado de Cuenta SAR
                Card(
                    modifier = Modifier
                        .weight(1f)
                        .clickable { onNavigate(Screen.TRANSACTIONS) },
                    shape = RoundedCornerShape(16.dp),
                    colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant)
                ) {
                    Column(
                        modifier = Modifier.padding(12.dp),
                        horizontalAlignment = Alignment.CenterHorizontally
                    ) {
                        Box(
                            modifier = Modifier
                                .size(38.dp)
                                .clip(CircleShape)
                                .background(LuminaGold.copy(alpha = 0.2f)),
                            contentAlignment = Alignment.Center
                        ) {
                            Icon(Icons.Default.PictureAsPdf, contentDescription = null, tint = LuminaGold, modifier = Modifier.size(20.dp))
                        }
                        Spacer(modifier = Modifier.height(6.dp))
                        Text("Estado SAR", fontWeight = FontWeight.Bold, fontSize = 12.sp, color = MaterialTheme.colorScheme.onSurface)
                        Text("PDF Oficial", fontSize = 9.sp, color = MaterialTheme.colorScheme.onSurfaceVariant)
                    }
                }
            }
        }

        // 4. Quick Beneficiaries (Transferencia Rápida)
        item {
            Spacer(modifier = Modifier.height(14.dp))
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 20.dp),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = "Transferencia Rápida",
                    fontSize = 15.sp,
                    fontWeight = FontWeight.Bold,
                    color = MaterialTheme.colorScheme.onBackground
                )

                Text(
                    text = "Ver contactos",
                    fontSize = 12.sp,
                    color = LuminaBlue,
                    modifier = Modifier.clickable { onNavigate(Screen.TRANSFERS) }
                )
            }

            Spacer(modifier = Modifier.height(10.dp))

            LazyRow(
                contentPadding = PaddingValues(horizontal = 20.dp),
                horizontalArrangement = Arrangement.spacedBy(14.dp)
            ) {
                // Add new beneficiary shortcut
                item {
                    Column(
                        horizontalAlignment = Alignment.CenterHorizontally,
                        modifier = Modifier.clickable { onNavigate(Screen.TRANSFERS) }
                    ) {
                        Box(
                            modifier = Modifier
                                .size(52.dp)
                                .clip(CircleShape)
                                .background(Color(0xFF1E293B)),
                            contentAlignment = Alignment.Center
                        ) {
                            Icon(Icons.Default.Add, contentDescription = "Nuevo", tint = Color.White)
                        }
                        Spacer(modifier = Modifier.height(4.dp))
                        Text("Nuevo", fontSize = 11.sp, color = Color(0xFF94A3B8))
                    }
                }

                items(beneficiaries) { ben ->
                    Column(
                        horizontalAlignment = Alignment.CenterHorizontally,
                        modifier = Modifier.clickable {
                            onSelectBeneficiary(ben)
                            onNavigate(Screen.TRANSFERS)
                        }
                    ) {
                        val avatarColor = try {
                            Color(android.graphics.Color.parseColor(ben.colorHex))
                        } catch (e: Exception) {
                            LuminaBlue
                        }

                        Box(
                            modifier = Modifier
                                .size(52.dp)
                                .clip(CircleShape)
                                .background(avatarColor),
                            contentAlignment = Alignment.Center
                        ) {
                            Text(
                                text = ben.initials,
                                fontWeight = FontWeight.Bold,
                                color = Color.White,
                                fontSize = 16.sp
                            )
                        }
                        Spacer(modifier = Modifier.height(4.dp))
                        Text(
                            text = ben.alias,
                            fontSize = 11.sp,
                            color = MaterialTheme.colorScheme.onSurface,
                            maxLines = 1
                        )
                    }
                }
            }
        }

        // 5. Featured Cards Carousel
        item {
            Spacer(modifier = Modifier.height(20.dp))
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 20.dp),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = "Mis Tarjetas Lumina",
                    fontSize = 15.sp,
                    fontWeight = FontWeight.Bold,
                    color = MaterialTheme.colorScheme.onSurface
                )

                Text(
                    text = "Gestionar (${cards.size})",
                    fontSize = 12.sp,
                    color = LuminaBlue,
                    modifier = Modifier.clickable { onNavigate(Screen.CARDS) }
                )
            }

            Spacer(modifier = Modifier.height(10.dp))

            if (cards.isNotEmpty()) {
                val primaryCard = cards.first()
                Box(modifier = Modifier.padding(horizontal = 20.dp)) {
                    InteractiveCardItem(
                        card = primaryCard,
                        onToggleFreeze = { onToggleCardFreeze(primaryCard) },
                        onRevealCvvWithBiometric = { onCardRevealSensitive(primaryCard) }
                    )
                }

                // Quick card actions row below the card
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(horizontal = 24.dp, vertical = 8.dp),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(
                        text = "Toca la tarjeta para ver reverso y CVV",
                        fontSize = 11.sp,
                        color = Color(0xFF94A3B8)
                    )

                    TextButton(
                        onClick = { onToggleCardFreeze(primaryCard) },
                        contentPadding = PaddingValues(0.dp)
                    ) {
                        Text(
                            text = if (primaryCard.isFrozen) "Descongelar" else "Congelar",
                            color = if (primaryCard.isFrozen) LuminaEmerald else LuminaGold,
                            fontSize = 12.sp,
                            fontWeight = FontWeight.Bold
                        )
                    }
                }
            }
        }

        // 6. Recent Movements Header
        item {
            Spacer(modifier = Modifier.height(14.dp))
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 20.dp, vertical = 4.dp),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = "Últimos Movimientos",
                    fontSize = 15.sp,
                    fontWeight = FontWeight.Bold,
                    color = MaterialTheme.colorScheme.onBackground
                )

                Text(
                    text = "Ver todos",
                    fontSize = 12.sp,
                    color = LuminaBlue,
                    modifier = Modifier.clickable { onNavigate(Screen.TRANSACTIONS) }
                )
            }
        }

        // Recent Movements items
        if (transactions.isEmpty()) {
            item {
                Text(
                    text = "No hay transacciones registradas aún.",
                    fontSize = 12.sp,
                    color = Color(0xFF64748B),
                    modifier = Modifier.padding(horizontal = 20.dp, vertical = 12.dp)
                )
            }
        } else {
            items(transactions.take(5)) { tx ->
                TransactionListItem(
                    transaction = tx,
                    onClick = { onSelectTransaction(tx) }
                )
                HorizontalDivider(
                    color = Color(0xFF1E293B),
                    modifier = Modifier.padding(horizontal = 20.dp)
                )
            }
        }
    }
}
