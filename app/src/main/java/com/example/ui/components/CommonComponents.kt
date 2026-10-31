package com.example.ui.components

import android.content.ClipData
import android.content.ClipboardManager
import android.content.Context
import android.widget.Toast
import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.core.animateFloatAsState
import androidx.compose.animation.core.tween
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
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.layout.widthIn
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.automirrored.filled.Send
import androidx.compose.material.icons.filled.AcUnit
import androidx.compose.material.icons.filled.AccountBalance
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material.icons.filled.ContentCopy
import androidx.compose.material.icons.filled.CreditCard
import androidx.compose.material.icons.filled.DarkMode
import androidx.compose.material.icons.filled.Fingerprint
import androidx.compose.material.icons.filled.History
import androidx.compose.material.icons.filled.Home
import androidx.compose.material.icons.filled.LightMode
import androidx.compose.material.icons.filled.Lock
import androidx.compose.material.icons.filled.LockOpen
import androidx.compose.material.icons.filled.Notifications
import androidx.compose.material.icons.filled.Palette
import androidx.compose.material.icons.filled.QrCode
import androidx.compose.material.icons.filled.Refresh
import androidx.compose.material.icons.filled.Security
import androidx.compose.material.icons.filled.Share
import androidx.compose.material.icons.filled.Shield
import androidx.compose.material.icons.filled.ShoppingBag
import androidx.compose.material.icons.filled.Visibility
import androidx.compose.material.icons.filled.VisibilityOff
import androidx.compose.ui.draw.drawBehind
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Shadow
import androidx.compose.ui.text.TextStyle
import androidx.compose.material3.Badge
import androidx.compose.material3.BadgedBox
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.DividerDefaults
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.NavigationBar
import androidx.compose.material3.NavigationBarItem
import androidx.compose.material3.NavigationBarItemDefaults
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.window.Dialog
import com.example.data.model.AccountEntity
import com.example.data.model.CardEntity
import com.example.data.model.TransactionEntity
import com.example.ui.Screen
import com.example.ui.theme.LuminaBlue
import com.example.ui.theme.LuminaCardDark
import com.example.ui.theme.LuminaEmerald
import com.example.ui.theme.LuminaGold
import com.example.ui.theme.LuminaNavy
import com.example.ui.theme.LuminaRose
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

@Composable
fun LuminaTopBar(
    title: String,
    subtitle: String? = null,
    showBackButton: Boolean = false,
    onBackClick: () -> Unit = {},
    unreadNotificationsCount: Int = 0,
    onNotificationsClick: () -> Unit = {},
    onSecurityClick: () -> Unit = {},
    onLockClick: () -> Unit = {},
    isDarkMode: Boolean = true,
    onToggleDarkMode: (() -> Unit)? = null,
    userInitials: String = "",
    onProfileClick: (() -> Unit)? = null
) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .padding(horizontal = 20.dp, vertical = 12.dp),
        horizontalArrangement = Arrangement.SpaceBetween,
        verticalAlignment = Alignment.CenterVertically
    ) {
        Row(
            verticalAlignment = Alignment.CenterVertically,
            modifier = Modifier.weight(1f)
        ) {
            if (showBackButton) {
                IconButton(
                    onClick = onBackClick,
                    modifier = Modifier
                        .testTag("top_bar_back_button")
                        .size(40.dp)
                ) {
                    Icon(
                        imageVector = Icons.AutoMirrored.Filled.ArrowBack,
                        contentDescription = "Volver",
                        tint = MaterialTheme.colorScheme.onBackground
                    )
                }
                Spacer(modifier = Modifier.width(8.dp))
            } else {
                val initials = if (userInitials.isNotBlank()) {
                    userInitials
                } else {
                    val clean = title.replace("Hola,", "").replace("Hola", "").trim()
                    val words = clean.split(" ").filter { it.isNotBlank() }
                    when {
                        words.size >= 2 -> "${words[0].firstOrNull()?.uppercase() ?: ""}${words[1].firstOrNull()?.uppercase() ?: ""}"
                        words.isNotEmpty() -> words[0].take(2).uppercase()
                        else -> "U"
                    }
                }
                Box(
                    modifier = Modifier
                        .size(42.dp)
                        .clip(CircleShape)
                        .background(
                            Brush.linearGradient(
                                listOf(LuminaBlue, Color(0xFF6366F1))
                            )
                        )
                        .clickable(enabled = onProfileClick != null) { onProfileClick?.invoke() }
                        .testTag("top_bar_profile_avatar"),
                    contentAlignment = Alignment.Center
                ) {
                    Text(
                        text = initials,
                        fontWeight = FontWeight.Bold,
                        color = Color.White,
                        fontSize = 15.sp
                    )
                }
                Spacer(modifier = Modifier.width(12.dp))
            }

            Column {
                Text(
                    text = title,
                    style = MaterialTheme.typography.titleMedium,
                    fontWeight = FontWeight.Bold,
                    color = MaterialTheme.colorScheme.onBackground,
                    maxLines = 1,
                    overflow = TextOverflow.Ellipsis
                )
                if (subtitle != null) {
                    Text(
                        text = subtitle,
                        style = MaterialTheme.typography.labelSmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }
            }
        }

        Row(verticalAlignment = Alignment.CenterVertically) {
            // Dark / Light Mode Switcher in Top Bar
            if (onToggleDarkMode != null) {
                IconButton(
                    onClick = onToggleDarkMode,
                    modifier = Modifier
                        .testTag("top_bar_theme_toggle_button")
                        .size(42.dp)
                ) {
                    Icon(
                        imageVector = if (isDarkMode) Icons.Default.LightMode else Icons.Default.DarkMode,
                        contentDescription = if (isDarkMode) "Cambiar a Modo Claro" else "Cambiar a Modo Oscuro",
                        tint = if (isDarkMode) LuminaGold else LuminaBlue
                    )
                }
            }

            IconButton(
                onClick = onNotificationsClick,
                modifier = Modifier
                    .testTag("top_bar_notifications_button")
                    .size(42.dp)
            ) {
                BadgedBox(
                    badge = {
                        if (unreadNotificationsCount > 0) {
                            Badge(
                                containerColor = LuminaRose,
                                contentColor = Color.White
                            ) {
                                Text(
                                    text = if (unreadNotificationsCount > 9) "9+" else "$unreadNotificationsCount",
                                    fontSize = 10.sp
                                )
                            }
                        }
                    }
                ) {
                    Icon(
                        imageVector = Icons.Default.Notifications,
                        contentDescription = "Notificaciones",
                        tint = if (unreadNotificationsCount > 0) LuminaGold else MaterialTheme.colorScheme.onBackground
                    )
                }
            }

            IconButton(
                onClick = onSecurityClick,
                modifier = Modifier
                    .testTag("top_bar_security_button")
                    .size(42.dp)
            ) {
                Icon(
                    imageVector = Icons.Default.Security,
                    contentDescription = "Seguridad",
                    tint = LuminaBlue
                )
            }

            IconButton(
                onClick = onLockClick,
                modifier = Modifier
                    .testTag("top_bar_lock_button")
                    .size(42.dp)
            ) {
                Icon(
                    imageVector = Icons.Default.Lock,
                    contentDescription = "Bloquear / Cerrar Sesión",
                    tint = MaterialTheme.colorScheme.onSurfaceVariant
                )
            }
        }
    }
}

@Composable
fun LuminaBottomNavigation(
    currentScreen: Screen,
    unreadNotificationsCount: Int,
    onNavigate: (Screen) -> Unit
) {
    NavigationBar(
        containerColor = MaterialTheme.colorScheme.surface,
        contentColor = MaterialTheme.colorScheme.onSurface,
        tonalElevation = 8.dp
    ) {
        NavigationBarItem(
            selected = currentScreen == Screen.DASHBOARD,
            onClick = { onNavigate(Screen.DASHBOARD) },
            icon = { Icon(Icons.Default.Home, contentDescription = "Inicio") },
            label = { Text("Inicio", fontSize = 11.sp) },
            colors = NavigationBarItemDefaults.colors(
                selectedIconColor = Color.White,
                selectedTextColor = LuminaBlue,
                indicatorColor = LuminaBlue
            ),
            modifier = Modifier.testTag("nav_dashboard")
        )

        NavigationBarItem(
            selected = currentScreen == Screen.TRANSFERS,
            onClick = { onNavigate(Screen.TRANSFERS) },
            icon = { Icon(Icons.AutoMirrored.Filled.Send, contentDescription = "Transferir") },
            label = { Text("Transferir", fontSize = 11.sp) },
            colors = NavigationBarItemDefaults.colors(
                selectedIconColor = Color.White,
                selectedTextColor = LuminaBlue,
                indicatorColor = LuminaBlue
            ),
            modifier = Modifier.testTag("nav_transfers")
        )

        NavigationBarItem(
            selected = currentScreen == Screen.CARDS,
            onClick = { onNavigate(Screen.CARDS) },
            icon = { Icon(Icons.Default.CreditCard, contentDescription = "Tarjetas") },
            label = { Text("Tarjetas", fontSize = 11.sp) },
            colors = NavigationBarItemDefaults.colors(
                selectedIconColor = Color.White,
                selectedTextColor = LuminaBlue,
                indicatorColor = LuminaBlue
            ),
            modifier = Modifier.testTag("nav_cards")
        )

        NavigationBarItem(
            selected = currentScreen == Screen.TRANSACTIONS,
            onClick = { onNavigate(Screen.TRANSACTIONS) },
            icon = { Icon(Icons.Default.History, contentDescription = "Historial") },
            label = { Text("Movimientos", fontSize = 11.sp) },
            colors = NavigationBarItemDefaults.colors(
                selectedIconColor = Color.White,
                selectedTextColor = LuminaBlue,
                indicatorColor = LuminaBlue
            ),
            modifier = Modifier.testTag("nav_transactions")
        )

        NavigationBarItem(
            selected = currentScreen == Screen.NOTIFICATIONS,
            onClick = { onNavigate(Screen.NOTIFICATIONS) },
            icon = {
                BadgedBox(
                    badge = {
                        if (unreadNotificationsCount > 0) {
                            Badge(
                                containerColor = LuminaRose,
                                contentColor = Color.White
                            ) {
                                Text("$unreadNotificationsCount", fontSize = 9.sp)
                            }
                        }
                    }
                ) {
                    Icon(Icons.Default.Notifications, contentDescription = "Notificaciones")
                }
            },
            label = { Text("Alertas", fontSize = 11.sp) },
            colors = NavigationBarItemDefaults.colors(
                selectedIconColor = Color.White,
                selectedTextColor = LuminaBlue,
                indicatorColor = LuminaBlue
            ),
            modifier = Modifier.testTag("nav_notifications")
        )
    }
}

@Composable
fun BalanceCard(
    account: AccountEntity?,
    isBalanceHidden: Boolean,
    isUsdCurrency: Boolean,
    onToggleBalanceHidden: () -> Unit,
    onToggleCurrency: () -> Unit,
    onTransferClick: () -> Unit,
    onReceiveQrClick: () -> Unit,
    onCardsClick: () -> Unit,
    onHistoryClick: () -> Unit
) {
    val context = LocalContext.current
    Card(
        modifier = Modifier
            .fillMaxWidth()
            .padding(horizontal = 20.dp, vertical = 6.dp),
        shape = RoundedCornerShape(26.dp),
        colors = CardDefaults.cardColors(containerColor = LuminaCardDark)
    ) {
        Column(
            modifier = Modifier
                .background(
                    Brush.verticalGradient(
                        colors = listOf(
                            Color(0xFF1E293B),
                            Color(0xFF131D33)
                        )
                    )
                )
                .padding(20.dp)
        ) {
            // Top tag row
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Box(
                        modifier = Modifier
                            .clip(RoundedCornerShape(8.dp))
                            .background(Color(0xFF0F172A))
                            .padding(horizontal = 8.dp, vertical = 4.dp)
                    ) {
                        Text(
                            text = if (isUsdCurrency) "USD ($)" else "HONDURAS (HNL)",
                            fontSize = 11.sp,
                            fontWeight = FontWeight.Bold,
                            color = LuminaGold
                        )
                    }

                    Spacer(modifier = Modifier.width(8.dp))

                    Text(
                        text = "Cuenta Digital Nova",
                        fontSize = 12.sp,
                        color = Color(0xFF94A3B8)
                    )
                }

                Row(verticalAlignment = Alignment.CenterVertically) {
                    IconButton(
                        onClick = onToggleCurrency,
                        modifier = Modifier
                            .size(36.dp)
                            .testTag("toggle_currency_button")
                    ) {
                        Text(
                            text = if (isUsdCurrency) "HNL" else "USD",
                            fontSize = 11.sp,
                            fontWeight = FontWeight.Bold,
                            color = LuminaBlue
                        )
                    }

                    IconButton(
                        onClick = onToggleBalanceHidden,
                        modifier = Modifier
                            .size(36.dp)
                            .testTag("toggle_balance_visibility")
                    ) {
                        Icon(
                            imageVector = if (isBalanceHidden) Icons.Default.VisibilityOff else Icons.Default.Visibility,
                            contentDescription = "Mostrar u ocultar saldo",
                            tint = Color(0xFF94A3B8)
                        )
                    }
                }
            }

            Spacer(modifier = Modifier.height(14.dp))

            // Main Balance Display
            Text(
                text = "Saldo Disponible",
                fontSize = 12.sp,
                fontWeight = FontWeight.Medium,
                color = Color(0xFF94A3B8)
            )

            Spacer(modifier = Modifier.height(4.dp))

            val displayAmount = if (account != null) {
                if (isUsdCurrency) {
                    String.format("$ %,.2f", account.balanceUsd)
                } else {
                    String.format("L %,.2f", account.balanceHnl)
                }
            } else {
                "L 0.00"
            }

            Text(
                text = if (isBalanceHidden) "••••••••••" else displayAmount,
                fontSize = 34.sp,
                fontWeight = FontWeight.ExtraBold,
                color = Color.White,
                letterSpacing = (-0.5).sp
            )

            Spacer(modifier = Modifier.height(8.dp))

            // Account Number with copy
            if (account != null) {
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    modifier = Modifier
                        .clickable {
                            val clipboard =
                                context.getSystemService(Context.CLIPBOARD_SERVICE) as ClipboardManager
                            val clip = ClipData.newPlainText("Cuenta", account.accountNumber)
                            clipboard.setPrimaryClip(clip)
                            Toast
                                .makeText(context, "Número de cuenta copiado", Toast.LENGTH_SHORT)
                                .show()
                        }
                        .padding(vertical = 4.dp)
                ) {
                    Text(
                        text = "No. ${account.accountNumber}",
                        fontSize = 12.sp,
                        color = Color(0xFFCBD5E1),
                        fontFamily = FontFamily.Monospace
                    )
                    Spacer(modifier = Modifier.width(6.dp))
                    Text(
                        text = "COPIAR",
                        fontSize = 10.sp,
                        fontWeight = FontWeight.Bold,
                        color = LuminaBlue
                    )
                }
            }

            Spacer(modifier = Modifier.height(18.dp))
            HorizontalDivider(color = Color(0xFF334155).copy(alpha = 0.5f))
            Spacer(modifier = Modifier.height(18.dp))

            // 4 Action Buttons
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                QuickActionItem(
                    icon = Icons.AutoMirrored.Filled.Send,
                    label = "Transferir",
                    backgroundColor = LuminaBlue,
                    onClick = onTransferClick,
                    tag = "action_transfer"
                )
                QuickActionItem(
                    icon = Icons.Default.QrCode,
                    label = "Cobro QR",
                    backgroundColor = Color(0xFF4F46E5),
                    onClick = onReceiveQrClick,
                    tag = "action_qr"
                )
                QuickActionItem(
                    icon = Icons.Default.CreditCard,
                    label = "Tarjetas",
                    backgroundColor = Color(0xFF0F766E),
                    onClick = onCardsClick,
                    tag = "action_cards"
                )
                QuickActionItem(
                    icon = Icons.Default.History,
                    label = "Historial",
                    backgroundColor = Color(0xFF334155),
                    onClick = onHistoryClick,
                    tag = "action_history"
                )
            }
        }
    }
}

@Composable
fun QuickActionItem(
    icon: ImageVector,
    label: String,
    backgroundColor: Color,
    onClick: () -> Unit,
    tag: String
) {
    Column(
        horizontalAlignment = Alignment.CenterHorizontally,
        modifier = Modifier
            .clickable(onClick = onClick)
            .testTag(tag)
            .padding(4.dp)
    ) {
        Box(
            modifier = Modifier
                .size(48.dp)
                .clip(CircleShape)
                .background(backgroundColor),
            contentAlignment = Alignment.Center
        ) {
            Icon(
                imageVector = icon,
                contentDescription = label,
                tint = Color.White,
                modifier = Modifier.size(22.dp)
            )
        }
        Spacer(modifier = Modifier.height(6.dp))
        Text(
            text = label,
            fontSize = 11.sp,
            fontWeight = FontWeight.Medium,
            color = Color(0xFFE2E8F0)
        )
    }
}

@Composable
fun InteractiveCardItem(
    card: CardEntity,
    onToggleFreeze: () -> Unit,
    onRevealCvvWithBiometric: () -> Unit,
    showSensitiveDetails: Boolean = false,
    onCopyCardNumber: (() -> Unit)? = null,
    onChangeTheme: ((String) -> Unit)? = null
) {
    val context = LocalContext.current
    var isFlipped by remember { mutableStateOf(false) }
    var showNumbers by remember { mutableStateOf(showSensitiveDetails) }

    val rotation by animateFloatAsState(
        targetValue = if (isFlipped) 180f else 0f,
        animationSpec = tween(durationMillis = 500),
        label = "cardFlip"
    )

    // Luxury palettes for the 4 physical card finishes
    val (gradientColors, borderBrush, chipGlow) = when (card.colorTheme.lowercase()) {
        "oro", "gold" -> Triple(
            listOf(
                Color(0xFF2E1500),
                Color(0xFF572600),
                Color(0xFF8F3E00),
                Color(0xFFD97706),
                Color(0xFFFDE68A),
                Color(0xFFB45309)
            ),
            Brush.linearGradient(
                listOf(
                    Color(0xFFFDE68A),
                    Color(0xFF92400E),
                    Color(0xFFFEF08A),
                    Color(0xFF78350F)
                )
            ),
            Color(0xFFFEF08A)
        )
        "titanium", "obsidian", "black" -> Triple(
            listOf(
                Color(0xFF030712),
                Color(0xFF0F172A),
                Color(0xFF1E293B),
                Color(0xFF334155),
                Color(0xFF1E293B),
                Color(0xFF0F172A)
            ),
            Brush.linearGradient(
                listOf(
                    Color(0xFF94A3B8),
                    Color(0xFF334155),
                    Color(0xFFCBD5E1),
                    Color(0xFF1E293B)
                )
            ),
            Color(0xFFE2E8F0)
        )
        "esmeralda", "emerald" -> Triple(
            listOf(
                Color(0xFF022C22),
                Color(0xFF064E3B),
                Color(0xFF047857),
                Color(0xFF10B981),
                Color(0xFF065F46),
                Color(0xFF022C22)
            ),
            Brush.linearGradient(
                listOf(
                    Color(0xFF6EE7B7),
                    Color(0xFF047857),
                    Color(0xFFA7F3D0),
                    Color(0xFF064E3B)
                )
            ),
            Color(0xFFFDE047)
        )
        else -> Triple( // Zafiro (Sapphire Cobalt)
            listOf(
                Color(0xFF030D1B),
                Color(0xFF071E3D),
                Color(0xFF00438F),
                Color(0xFF0071E3),
                Color(0xFF38BDF8),
                Color(0xFF0A2540)
            ),
            Brush.linearGradient(
                listOf(
                    Color(0xFF7DD3FC),
                    Color(0xFF0051A8),
                    Color(0xFFBAE6FD),
                    Color(0xFF071E3D)
                )
            ),
            Color(0xFFFCD34D)
        )
    }

    Column(modifier = Modifier.fillMaxWidth()) {
        // Physical Card Container with 3D Flip
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .height(220.dp)
                .graphicsLayer {
                    rotationY = rotation
                    cameraDistance = 14f * density
                }
                .clip(RoundedCornerShape(22.dp))
                .border(width = 1.2.dp, brush = borderBrush, shape = RoundedCornerShape(22.dp))
                .background(Brush.linearGradient(gradientColors))
                .drawBehind {
                    // Security guilloche micro-lines
                    val lineStep = 32f
                    val totalLines = ((size.width + size.height) / lineStep).toInt()
                    for (i in 0..totalLines) {
                        drawLine(
                            color = Color.White.copy(alpha = 0.038f),
                            start = Offset(i * lineStep - size.height, 0f),
                            end = Offset(i * lineStep, size.height),
                            strokeWidth = 1.2f
                        )
                    }
                    // Specular light radial reflection
                    drawCircle(
                        brush = Brush.radialGradient(
                            colors = listOf(Color.White.copy(alpha = 0.16f), Color.Transparent),
                            center = Offset(size.width * 0.82f, size.height * 0.18f),
                            radius = size.width * 0.48f
                        )
                    )
                }
                .clickable { isFlipped = !isFlipped }
                .padding(20.dp)
        ) {
            if (rotation <= 90f) {
                // ==========================================
                // FRONT OF PHYSICAL CARD
                // ==========================================
                Column(
                    modifier = Modifier.fillMaxSize(),
                    verticalArrangement = Arrangement.SpaceBetween
                ) {
                    // 1. TOP HEADER: Logo, Brand & Tier Capsule
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Box(
                                modifier = Modifier
                                    .size(28.dp)
                                    .clip(RoundedCornerShape(8.dp))
                                    .background(Color.White.copy(alpha = 0.15f))
                                    .border(0.8.dp, Color.White.copy(alpha = 0.35f), RoundedCornerShape(8.dp)),
                                contentAlignment = Alignment.Center
                            ) {
                                Icon(
                                    imageVector = Icons.Default.Shield,
                                    contentDescription = null,
                                    tint = LuminaGold,
                                    modifier = Modifier.size(16.dp)
                                )
                            }
                            Spacer(modifier = Modifier.width(8.dp))
                            Column {
                                Text(
                                    text = "LUMINA BANK",
                                    fontWeight = FontWeight.ExtraBold,
                                    fontSize = 15.sp,
                                    color = Color.White,
                                    letterSpacing = 1.5.sp,
                                    style = TextStyle(
                                        shadow = Shadow(
                                            color = Color.Black.copy(alpha = 0.5f),
                                            offset = Offset(1f, 1f),
                                            blurRadius = 2f
                                        )
                                    )
                                )
                                Text(
                                    text = "BANCA NOVA HONDURAS",
                                    fontSize = 8.sp,
                                    fontWeight = FontWeight.Bold,
                                    color = Color.White.copy(alpha = 0.75f),
                                    letterSpacing = 1.sp
                                )
                            }
                        }

                        // Status Badge: Active vs Frozen
                        Row(
                            verticalAlignment = Alignment.CenterVertically,
                            modifier = Modifier
                                .clip(RoundedCornerShape(20.dp))
                                .background(
                                    if (card.isFrozen) LuminaRose.copy(alpha = 0.9f)
                                    else Color.White.copy(alpha = 0.18f)
                                )
                                .border(
                                    0.8.dp,
                                    if (card.isFrozen) LuminaRose else Color.White.copy(alpha = 0.3f),
                                    RoundedCornerShape(20.dp)
                                )
                                .padding(horizontal = 9.dp, vertical = 3.5.dp)
                        ) {
                            Box(
                                modifier = Modifier
                                    .size(6.dp)
                                    .clip(CircleShape)
                                    .background(if (card.isFrozen) Color.White else LuminaEmerald)
                            )
                            Spacer(modifier = Modifier.width(5.dp))
                            Text(
                                text = if (card.isFrozen) "CONGELADA" else card.cardTier.uppercase(),
                                fontSize = 9.sp,
                                fontWeight = FontWeight.ExtraBold,
                                color = Color.White,
                                letterSpacing = 0.5.sp
                            )
                        }
                    }

                    // 2. EMV SECURITY CHIP & CONTACTLESS NFC SYMBOL
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        // Realistic EMV Smart Chip
                        Box(
                            modifier = Modifier
                                .size(width = 44.dp, height = 32.dp)
                                .clip(RoundedCornerShape(6.dp))
                                .background(
                                    Brush.linearGradient(
                                        listOf(
                                            Color(0xFFFDE047),
                                            Color(0xFFF59E0B),
                                            Color(0xFFD97706)
                                        )
                                    )
                                )
                                .border(1.dp, Color(0xFF78350F), RoundedCornerShape(6.dp))
                        ) {
                            // Chip contact divider circuit lines
                            Box(
                                modifier = Modifier
                                    .fillMaxSize()
                                    .padding(horizontal = 3.dp, vertical = 2.dp)
                            ) {
                                // Horizontal center divide
                                Box(
                                    modifier = Modifier
                                        .fillMaxWidth()
                                        .height(1.dp)
                                        .align(Alignment.Center)
                                        .background(Color(0xFF78350F).copy(alpha = 0.7f))
                                )
                                // Center square contact core
                                Box(
                                    modifier = Modifier
                                        .size(14.dp)
                                        .align(Alignment.Center)
                                        .clip(RoundedCornerShape(2.dp))
                                        .background(Color(0xFFFBBF24))
                                        .border(0.8.dp, Color(0xFF78350F), RoundedCornerShape(2.dp))
                                )
                            }
                        }

                        // Contactless NFC Wave Indicator
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Text(
                                text = "●)))",
                                color = Color.White.copy(alpha = 0.9f),
                                fontSize = 16.sp,
                                fontWeight = FontWeight.ExtraBold,
                                letterSpacing = 1.sp,
                                style = TextStyle(
                                    shadow = Shadow(
                                        color = Color.Black.copy(alpha = 0.4f),
                                        offset = Offset(1f, 1f),
                                        blurRadius = 1f
                                    )
                                )
                            )
                        }
                    }

                    // 3. CARD NUMBER (Embossed style with shadow)
                    val rawNumber = card.cardNumber.replace(" ", "")
                    val last4 = if (rawNumber.length >= 4) rawNumber.takeLast(4) else "5220"
                    val displayNumber = if (showNumbers || showSensitiveDetails) {
                        "4152  8892  3410  $last4"
                    } else {
                        "••••  ••••  ••••  $last4"
                    }

                    Text(
                        text = displayNumber,
                        fontFamily = FontFamily.Monospace,
                        fontSize = 19.sp,
                        fontWeight = FontWeight.Bold,
                        color = Color.White,
                        letterSpacing = 2.sp,
                        style = TextStyle(
                            shadow = Shadow(
                                color = Color.Black.copy(alpha = 0.75f),
                                offset = Offset(1.5f, 2f),
                                blurRadius = 2.5f
                            )
                        )
                    )

                    // 4. FOOTER: Holder, Expiry & Hologram Logo
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.Bottom
                    ) {
                        // Card Holder
                        Column {
                            Text(
                                text = "TITULAR DE LA TARJETA",
                                fontSize = 8.sp,
                                fontWeight = FontWeight.Bold,
                                color = Color.White.copy(alpha = 0.7f),
                                letterSpacing = 0.8.sp
                            )
                            Text(
                                text = card.cardHolder.uppercase(),
                                fontSize = 12.sp,
                                fontWeight = FontWeight.Bold,
                                color = Color.White,
                                letterSpacing = 0.5.sp,
                                style = TextStyle(
                                    shadow = Shadow(
                                        color = Color.Black.copy(alpha = 0.5f),
                                        offset = Offset(1f, 1f),
                                        blurRadius = 2f
                                    )
                                )
                            )
                        }

                        // Expiration
                        Column {
                            Text(
                                text = "VENCE",
                                fontSize = 8.sp,
                                fontWeight = FontWeight.Bold,
                                color = Color.White.copy(alpha = 0.7f),
                                letterSpacing = 0.8.sp
                            )
                            Text(
                                text = card.expiry,
                                fontSize = 12.sp,
                                fontWeight = FontWeight.Bold,
                                color = Color.White,
                                style = TextStyle(
                                    shadow = Shadow(
                                        color = Color.Black.copy(alpha = 0.5f),
                                        offset = Offset(1f, 1f),
                                        blurRadius = 2f
                                    )
                                )
                            )
                        }

                        // Hologram Payment Network Badge (Dual overlapping foil circles)
                        Row(
                            verticalAlignment = Alignment.CenterVertically,
                            modifier = Modifier
                                .clip(RoundedCornerShape(8.dp))
                                .background(Color.Black.copy(alpha = 0.25f))
                                .padding(horizontal = 6.dp, vertical = 2.dp)
                        ) {
                            Box(
                                modifier = Modifier
                                    .size(16.dp)
                                    .clip(CircleShape)
                                    .background(Color(0xFFEF4444).copy(alpha = 0.9f))
                            )
                            Box(
                                modifier = Modifier
                                    .size(16.dp)
                                    .graphicsLayer { translationX = -12f }
                                    .clip(CircleShape)
                                    .background(Color(0xFFF59E0B).copy(alpha = 0.85f))
                            )
                            Text(
                                text = "NOVA",
                                fontSize = 10.sp,
                                fontWeight = FontWeight.ExtraBold,
                                color = Color.White,
                                letterSpacing = 0.5.sp
                            )
                        }
                    }
                }

                // Frozen Frost Overlay (When frozen)
                if (card.isFrozen) {
                    Box(
                        modifier = Modifier
                            .fillMaxSize()
                            .clip(RoundedCornerShape(20.dp))
                            .background(Color(0xD9071B33))
                            .border(1.5.dp, Color(0xFF38BDF8), RoundedCornerShape(20.dp)),
                        contentAlignment = Alignment.Center
                    ) {
                        Column(horizontalAlignment = Alignment.CenterHorizontally) {
                            Box(
                                modifier = Modifier
                                    .size(46.dp)
                                    .clip(CircleShape)
                                    .background(LuminaRose.copy(alpha = 0.2f))
                                    .border(1.dp, LuminaRose, CircleShape),
                                contentAlignment = Alignment.Center
                            ) {
                                Icon(
                                    imageVector = Icons.Default.Lock,
                                    contentDescription = "Bloqueada",
                                    tint = LuminaRose,
                                    modifier = Modifier.size(24.dp)
                                )
                            }
                            Spacer(modifier = Modifier.height(6.dp))
                            Text(
                                text = "TARJETA CONGELADA",
                                fontSize = 13.sp,
                                fontWeight = FontWeight.ExtraBold,
                                color = Color.White,
                                letterSpacing = 1.sp
                            )
                            Text(
                                text = "Pagos, retiros y compras digitales pausados temporalmente",
                                fontSize = 9.sp,
                                color = Color(0xFF93C5FD),
                                textAlign = TextAlign.Center,
                                modifier = Modifier.padding(horizontal = 16.dp)
                            )
                        }
                    }
                }
            } else {
                // ==========================================
                // BACK OF PHYSICAL CARD (3D Flipped)
                // ==========================================
                Column(
                    modifier = Modifier
                        .fillMaxSize()
                        .graphicsLayer { rotationY = 180f },
                    verticalArrangement = Arrangement.SpaceBetween
                ) {
                    // Magnetic Stripe
                    Box(
                        modifier = Modifier
                            .fillMaxWidth()
                            .height(38.dp)
                            .background(Color(0xFF090D16))
                            .border(0.5.dp, Color.White.copy(alpha = 0.1f))
                    )

                    // Signature Strip & CVV
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(horizontal = 4.dp),
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.SpaceBetween
                    ) {
                        // White signature strip with security watermark
                        Box(
                            modifier = Modifier
                                .weight(1f)
                                .height(32.dp)
                                .clip(RoundedCornerShape(4.dp))
                                .background(Color(0xFFF8FAFC))
                                .border(0.8.dp, Color(0xFFCBD5E1), RoundedCornerShape(4.dp))
                                .padding(horizontal = 8.dp),
                            contentAlignment = Alignment.CenterStart
                        ) {
                            Text(
                                text = "FIRMA AUTORIZADA • ${card.cardHolder.uppercase()} •",
                                fontSize = 9.sp,
                                fontWeight = FontWeight.Bold,
                                color = Color(0xFF475569),
                                fontFamily = FontFamily.Cursive
                            )
                        }

                        Spacer(modifier = Modifier.width(10.dp))

                        // CVV Panel
                        Column(horizontalAlignment = Alignment.End) {
                            Text(
                                text = "CVV SEGURIDAD",
                                fontSize = 8.sp,
                                fontWeight = FontWeight.Bold,
                                color = Color.White.copy(alpha = 0.8f)
                            )
                            Box(
                                modifier = Modifier
                                    .clip(RoundedCornerShape(4.dp))
                                    .background(Color.White)
                                    .padding(horizontal = 8.dp, vertical = 4.dp)
                            ) {
                                Text(
                                    text = if (showSensitiveDetails) card.cvv else "•••",
                                    fontSize = 13.sp,
                                    fontWeight = FontWeight.ExtraBold,
                                    fontFamily = FontFamily.Monospace,
                                    color = Color(0xFF0F172A)
                                )
                            }
                        }
                    }

                    // Regulatory Text & QR Security token
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(horizontal = 4.dp),
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.SpaceBetween
                    ) {
                        Column(modifier = Modifier.weight(1f)) {
                            Text(
                                text = "Tarjeta emitida por Banca Nova Honduras bajo regulación CNBS y SAR.",
                                fontSize = 8.sp,
                                color = Color.White.copy(alpha = 0.8f),
                                lineHeight = 11.sp
                            )
                            Text(
                                text = "Reporte de robo o extravío: 2280-NOVA • Soporte VIP 24/7",
                                fontSize = 8.sp,
                                fontWeight = FontWeight.SemiBold,
                                color = LuminaGold
                            )
                        }

                        // Cryptographic contactless QR Stamp
                        Box(
                            modifier = Modifier
                                .size(34.dp)
                                .clip(RoundedCornerShape(6.dp))
                                .background(Color.White)
                                .padding(3.dp),
                            contentAlignment = Alignment.Center
                        ) {
                            Icon(
                                imageVector = Icons.Default.QrCode,
                                contentDescription = "Token QR",
                                tint = Color.Black,
                                modifier = Modifier.size(28.dp)
                            )
                        }
                    }

                    // Flip back helper label
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.Center
                    ) {
                        Text(
                            text = "Toca para girar la tarjeta al frente ↺",
                            fontSize = 9.sp,
                            fontWeight = FontWeight.Bold,
                            color = Color.White.copy(alpha = 0.85f)
                        )
                    }
                }
            }
        }

        Spacer(modifier = Modifier.height(10.dp))

        // QUICK ACTION TOOLBAR (Right below the card)
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.spacedBy(8.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            // 1. Girar Tarjeta (3D Flip)
            OutlinedButton(
                onClick = { isFlipped = !isFlipped },
                modifier = Modifier
                    .weight(1f)
                    .height(38.dp)
                    .testTag("btn_flip_card"),
                shape = RoundedCornerShape(10.dp),
                contentPadding = PaddingValues(horizontal = 6.dp, vertical = 4.dp),
                colors = ButtonDefaults.outlinedButtonColors(
                    containerColor = MaterialTheme.colorScheme.surfaceVariant
                ),
                border = ButtonDefaults.outlinedButtonBorder.copy(
                    brush = Brush.linearGradient(
                        listOf(
                            MaterialTheme.colorScheme.outline.copy(alpha = 0.5f),
                            MaterialTheme.colorScheme.outline.copy(alpha = 0.5f)
                        )
                    )
                )
            ) {
                Icon(Icons.Default.Refresh, contentDescription = null, modifier = Modifier.size(15.dp), tint = LuminaBlue)
                Spacer(modifier = Modifier.width(4.dp))
                Text(
                    text = if (isFlipped) "Frente" else "Reverso",
                    fontSize = 11.sp,
                    fontWeight = FontWeight.Bold,
                    color = MaterialTheme.colorScheme.onSurface
                )
            }

            // 2. Ver / Ocultar Números
            OutlinedButton(
                onClick = {
                    showNumbers = !showNumbers
                    if (showNumbers && !showSensitiveDetails) {
                        onRevealCvvWithBiometric()
                    }
                },
                modifier = Modifier
                    .weight(1f)
                    .height(38.dp)
                    .testTag("btn_toggle_card_numbers"),
                shape = RoundedCornerShape(10.dp),
                contentPadding = PaddingValues(horizontal = 6.dp, vertical = 4.dp),
                colors = ButtonDefaults.outlinedButtonColors(
                    containerColor = MaterialTheme.colorScheme.surfaceVariant
                ),
                border = ButtonDefaults.outlinedButtonBorder.copy(
                    brush = Brush.linearGradient(
                        listOf(
                            MaterialTheme.colorScheme.outline.copy(alpha = 0.5f),
                            MaterialTheme.colorScheme.outline.copy(alpha = 0.5f)
                        )
                    )
                )
            ) {
                Icon(
                    imageVector = if (showNumbers) Icons.Default.VisibilityOff else Icons.Default.Visibility,
                    contentDescription = null,
                    modifier = Modifier.size(15.dp),
                    tint = LuminaBlue
                )
                Spacer(modifier = Modifier.width(4.dp))
                Text(
                    text = if (showNumbers) "Ocultar" else "Ver N°",
                    fontSize = 11.sp,
                    fontWeight = FontWeight.Bold,
                    color = MaterialTheme.colorScheme.onSurface
                )
            }

            // 3. Copiar Número
            OutlinedButton(
                onClick = {
                    val clipboard = context.getSystemService(Context.CLIPBOARD_SERVICE) as ClipboardManager
                    val clip = ClipData.newPlainText("Tarjeta Lumina", "4152 8892 3410 ${card.cardNumber.takeLast(4)}")
                    clipboard.setPrimaryClip(clip)
                    Toast.makeText(context, "Número de tarjeta copiado al portapapeles", Toast.LENGTH_SHORT).show()
                    onCopyCardNumber?.invoke()
                },
                modifier = Modifier
                    .weight(1f)
                    .height(38.dp)
                    .testTag("btn_copy_card_number"),
                shape = RoundedCornerShape(10.dp),
                contentPadding = PaddingValues(horizontal = 6.dp, vertical = 4.dp),
                colors = ButtonDefaults.outlinedButtonColors(
                    containerColor = MaterialTheme.colorScheme.surfaceVariant
                ),
                border = ButtonDefaults.outlinedButtonBorder.copy(
                    brush = Brush.linearGradient(
                        listOf(
                            MaterialTheme.colorScheme.outline.copy(alpha = 0.5f),
                            MaterialTheme.colorScheme.outline.copy(alpha = 0.5f)
                        )
                    )
                )
            ) {
                Icon(Icons.Default.ContentCopy, contentDescription = null, modifier = Modifier.size(14.dp), tint = LuminaGold)
                Spacer(modifier = Modifier.width(4.dp))
                Text(
                    text = "Copiar",
                    fontSize = 11.sp,
                    fontWeight = FontWeight.Bold,
                    color = MaterialTheme.colorScheme.onSurface
                )
            }

            // 4. Congelar / Descongelar
            Button(
                onClick = onToggleFreeze,
                modifier = Modifier
                    .weight(1.1f)
                    .height(38.dp)
                    .testTag("btn_quick_freeze_card"),
                shape = RoundedCornerShape(10.dp),
                contentPadding = PaddingValues(horizontal = 6.dp, vertical = 4.dp),
                colors = ButtonDefaults.buttonColors(
                    containerColor = if (card.isFrozen) LuminaEmerald else LuminaRose
                )
            ) {
                Icon(
                    imageVector = if (card.isFrozen) Icons.Default.LockOpen else Icons.Default.AcUnit,
                    contentDescription = null,
                    modifier = Modifier.size(15.dp),
                    tint = Color.White
                )
                Spacer(modifier = Modifier.width(4.dp))
                Text(
                    text = if (card.isFrozen) "Activar" else "Congelar",
                    fontSize = 11.sp,
                    fontWeight = FontWeight.Bold,
                    color = Color.White
                )
            }
        }
    }
}

@Composable
fun TransactionListItem(
    transaction: TransactionEntity,
    onClick: () -> Unit
) {
    val dateFormat = remember { SimpleDateFormat("dd MMM, hh:mm a", Locale("es", "HN")) }
    val formattedDate = remember(transaction.timestamp) { dateFormat.format(Date(transaction.timestamp)) }

    Row(
        modifier = Modifier
            .fillMaxWidth()
            .clickable(onClick = onClick)
            .padding(horizontal = 20.dp, vertical = 12.dp),
        horizontalArrangement = Arrangement.SpaceBetween,
        verticalAlignment = Alignment.CenterVertically
    ) {
        Row(
            verticalAlignment = Alignment.CenterVertically,
            modifier = Modifier.weight(1f)
        ) {
            val icon = when (transaction.category) {
                "Transferencia" -> Icons.AutoMirrored.Filled.Send
                "Depósito" -> Icons.Default.AccountBalance
                "Compras" -> Icons.Default.ShoppingBag
                else -> Icons.Default.CreditCard
            }
            val iconBg = if (transaction.isIncome) LuminaEmerald.copy(alpha = 0.2f) else LuminaBlue.copy(alpha = 0.15f)
            val iconTint = if (transaction.isIncome) LuminaEmerald else LuminaBlue

            Box(
                modifier = Modifier
                    .size(44.dp)
                    .clip(CircleShape)
                    .background(iconBg),
                contentAlignment = Alignment.Center
            ) {
                Icon(
                    imageVector = icon,
                    contentDescription = transaction.category,
                    tint = iconTint,
                    modifier = Modifier.size(20.dp)
                )
            }

            Spacer(modifier = Modifier.width(14.dp))

            Column {
                Text(
                    text = transaction.title,
                    fontWeight = FontWeight.SemiBold,
                    fontSize = 14.sp,
                    color = Color.White,
                    maxLines = 1,
                    overflow = TextOverflow.Ellipsis
                )
                Text(
                    text = transaction.subtitle,
                    fontSize = 12.sp,
                    color = Color(0xFF94A3B8),
                    maxLines = 1,
                    overflow = TextOverflow.Ellipsis
                )
                Text(
                    text = formattedDate,
                    fontSize = 10.sp,
                    color = Color(0xFF64748B)
                )
            }
        }

        Spacer(modifier = Modifier.width(8.dp))

        Column(horizontalAlignment = Alignment.End) {
            val prefix = if (transaction.isIncome) "+ " else "- "
            val amountFormatted = String.format("L %,.2f", transaction.amount)
            val textColor = if (transaction.isIncome) LuminaEmerald else Color.White

            Text(
                text = prefix + amountFormatted,
                fontWeight = FontWeight.Bold,
                fontSize = 15.sp,
                color = textColor
            )

            Text(
                text = transaction.referenceNumber,
                fontSize = 10.sp,
                color = Color(0xFF64748B)
            )
        }
    }
}

@Composable
fun SarReceiptDialog(
    transaction: TransactionEntity,
    onDismiss: () -> Unit
) {
    val context = LocalContext.current
    val dateFormat = remember { SimpleDateFormat("dd/MM/yyyy HH:mm:ss", Locale("es", "HN")) }
    val formattedDate = remember(transaction.timestamp) { dateFormat.format(Date(transaction.timestamp)) }

    Dialog(onDismissRequest = onDismiss) {
        Surface(
            shape = RoundedCornerShape(24.dp),
            color = LuminaCardDark,
            modifier = Modifier.fillMaxWidth()
        ) {
            Column(
                modifier = Modifier.padding(24.dp),
                horizontalAlignment = Alignment.CenterHorizontally
            ) {
                Box(
                    modifier = Modifier
                        .size(56.dp)
                        .clip(CircleShape)
                        .background(LuminaEmerald.copy(alpha = 0.2f)),
                    contentAlignment = Alignment.Center
                ) {
                    Icon(
                        imageVector = Icons.Default.CheckCircle,
                        contentDescription = "Comprobante",
                        tint = LuminaEmerald,
                        modifier = Modifier.size(32.dp)
                    )
                }

                Spacer(modifier = Modifier.height(12.dp))

                Text(
                    text = "Comprobante Digital",
                    fontSize = 18.sp,
                    fontWeight = FontWeight.Bold,
                    color = Color.White
                )

                Text(
                    text = "Banca Nova Honduras - Lumina Bank",
                    fontSize = 11.sp,
                    color = Color(0xFF94A3B8)
                )

                Spacer(modifier = Modifier.height(16.dp))

                Text(
                    text = String.format("L %,.2f", transaction.amount),
                    fontSize = 28.sp,
                    fontWeight = FontWeight.ExtraBold,
                    color = if (transaction.isIncome) LuminaEmerald else Color.White
                )

                Spacer(modifier = Modifier.height(16.dp))
                HorizontalDivider(color = Color(0xFF334155))
                Spacer(modifier = Modifier.height(16.dp))

                // Detail Items
                ReceiptDetailRow("Tipo", transaction.title)
                ReceiptDetailRow("Beneficiario/Origen", transaction.recipientOrSender)
                ReceiptDetailRow("Entidad / Banco", transaction.bankName)
                ReceiptDetailRow("Fecha y Hora", formattedDate)
                ReceiptDetailRow("No. Referencia", transaction.referenceNumber)
                ReceiptDetailRow("Código Autorización SAR", transaction.sarAuthCode)
                ReceiptDetailRow("Estado", "Acreditado en Tiempo Real")
                ReceiptDetailRow("Libro Contable", "Permanente e Inmutable (No eliminable)")

                Spacer(modifier = Modifier.height(20.dp))

                Row(modifier = Modifier.fillMaxWidth()) {
                    OutlinedButton(
                        onClick = {
                            val shareText = """
                                *COMPROBANTE LUMINA BANK HONDURAS*
                                Tipo: ${transaction.title}
                                Monto: L ${String.format("%,.2f", transaction.amount)}
                                Beneficiario: ${transaction.recipientOrSender}
                                Banco: ${transaction.bankName}
                                Ref: ${transaction.referenceNumber}
                                SAR: ${transaction.sarAuthCode}
                                Fecha: $formattedDate
                            """.trimIndent()

                            val clipboard = context.getSystemService(Context.CLIPBOARD_SERVICE) as ClipboardManager
                            clipboard.setPrimaryClip(ClipData.newPlainText("Comprobante", shareText))
                            Toast.makeText(context, "Comprobante copiado al portapapeles", Toast.LENGTH_SHORT).show()
                        },
                        modifier = Modifier.weight(1f),
                        colors = ButtonDefaults.outlinedButtonColors(contentColor = Color.White)
                    ) {
                        Icon(Icons.Default.Share, contentDescription = "Compartir", modifier = Modifier.size(16.dp))
                        Spacer(modifier = Modifier.width(6.dp))
                        Text("Copiar", fontSize = 12.sp)
                    }

                    Spacer(modifier = Modifier.width(12.dp))

                    Button(
                        onClick = onDismiss,
                        modifier = Modifier.weight(1f),
                        colors = ButtonDefaults.buttonColors(containerColor = LuminaBlue)
                    ) {
                        Text("Cerrar", fontSize = 12.sp)
                    }
                }
            }
        }
    }
}

@Composable
fun ReceiptDetailRow(label: String, value: String) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .padding(vertical = 4.dp),
        horizontalArrangement = Arrangement.SpaceBetween
    ) {
        Text(text = label, fontSize = 11.sp, color = Color(0xFF94A3B8))
        Text(
            text = value,
            fontSize = 11.sp,
            fontWeight = FontWeight.SemiBold,
            color = Color.White,
            textAlign = TextAlign.End,
            modifier = Modifier.widthIn(max = 180.dp)
        )
    }
}
