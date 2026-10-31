package com.example.ui.screens

import android.widget.Toast
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
import androidx.compose.material.icons.automirrored.filled.Send
import androidx.compose.material.icons.filled.Bolt
import androidx.compose.material.icons.filled.Check
import androidx.compose.material.icons.filled.CreditCard
import androidx.compose.material.icons.filled.DeleteSweep
import androidx.compose.material.icons.filled.Info
import androidx.compose.material.icons.filled.Notifications
import androidx.compose.material.icons.filled.NotificationsActive
import androidx.compose.material.icons.filled.Security
import androidx.compose.material.icons.filled.Timer
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
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
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.data.model.NotificationEntity
import com.example.ui.components.LuminaTopBar
import com.example.ui.theme.LuminaBlue
import com.example.ui.theme.LuminaCardDark
import com.example.ui.theme.LuminaEmerald
import com.example.ui.theme.LuminaGold
import com.example.ui.theme.LuminaNavyDark
import com.example.ui.theme.LuminaRose
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

@Composable
fun NotificationsScreen(
    notifications: List<NotificationEntity>,
    unreadCount: Int,
    onBackClick: () -> Unit,
    onMarkAsRead: (String) -> Unit,
    onMarkAllAsRead: () -> Unit,
    onClearAll: () -> Unit,
    onSimulateDeposit: () -> Unit,
    onSimulateSecurityAlert: () -> Unit,
    onSchedulePush: (seconds: Int) -> Unit
) {
    val context = LocalContext.current
    var selectedFilter by remember { mutableStateOf("Todas") }
    val filters = listOf("Todas", "Transferencias", "Seguridad", "Tarjetas")

    val filteredList = notifications.filter { item ->
        when (selectedFilter) {
            "Transferencias" -> item.category == "transfers"
            "Seguridad" -> item.category == "security"
            "Tarjetas" -> item.category == "cards"
            else -> true
        }
    }

    LazyColumn(
        modifier = Modifier
            .fillMaxSize()
            .background(MaterialTheme.colorScheme.background)
            .testTag("notifications_screen"),
        contentPadding = PaddingValues(bottom = 90.dp)
    ) {
        item {
            LuminaTopBar(
                title = "Centro de Alertas",
                subtitle = "Historial y notificaciones de tu cuenta",
                showBackButton = true,
                onBackClick = onBackClick
            )
        }

        // Action controls: Mark all as read & Clear
        item {
            Spacer(modifier = Modifier.height(8.dp))
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 20.dp, vertical = 4.dp),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = "Bandeja de Entrada ($unreadCount no leídas)",
                    fontSize = 13.sp,
                    fontWeight = FontWeight.Bold,
                    color = MaterialTheme.colorScheme.onSurface
                )

                Row {
                    if (unreadCount > 0) {
                        TextButton(onClick = onMarkAllAsRead, contentPadding = PaddingValues(horizontal = 6.dp)) {
                            Text("Leídas", fontSize = 11.sp, color = LuminaBlue)
                        }
                    }
                    if (notifications.isNotEmpty()) {
                        TextButton(onClick = onClearAll, contentPadding = PaddingValues(horizontal = 6.dp)) {
                            Text("Vaciar", fontSize = 11.sp, color = LuminaRose)
                        }
                    }
                }
            }
        }

        // WebSockets / Supabase Realtime Push Receiver Panel
        item {
            Card(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 20.dp, vertical = 6.dp),
                shape = RoundedCornerShape(18.dp),
                colors = CardDefaults.cardColors(containerColor = Color(0xFF0F1E36)),
                border = CardDefaults.outlinedCardBorder().copy(
                    brush = androidx.compose.ui.graphics.SolidColor(LuminaEmerald.copy(alpha = 0.5f))
                )
            ) {
                Column(modifier = Modifier.padding(16.dp)) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Box(
                                modifier = Modifier
                                    .size(10.dp)
                                    .clip(CircleShape)
                                    .background(LuminaEmerald)
                            )
                            Spacer(modifier = Modifier.width(8.dp))
                            Text(
                                text = "WebSockets / Realtime Activo",
                                fontSize = 13.sp,
                                fontWeight = FontWeight.Bold,
                                color = Color.White
                            )
                        }

                        Box(
                            modifier = Modifier
                                .clip(RoundedCornerShape(6.dp))
                                .background(LuminaEmerald.copy(alpha = 0.2f))
                                .padding(horizontal = 8.dp, vertical = 2.dp)
                        ) {
                            Text("En Vivo", fontSize = 10.sp, fontWeight = FontWeight.Bold, color = LuminaEmerald)
                        }
                    }

                    Spacer(modifier = Modifier.height(6.dp))
                    Text(
                        text = "Recibes alertas instantáneas cada vez que alguien te transfiera dinero sin necesidad de recargar la aplicación.",
                        fontSize = 11.sp,
                        color = Color(0xFF94A3B8),
                        lineHeight = 15.sp
                    )

                    Spacer(modifier = Modifier.height(12.dp))

                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        Button(
                            onClick = onSimulateDeposit,
                            colors = ButtonDefaults.buttonColors(containerColor = LuminaEmerald),
                            shape = RoundedCornerShape(10.dp),
                            contentPadding = PaddingValues(horizontal = 10.dp, vertical = 6.dp),
                            modifier = Modifier.weight(1f)
                        ) {
                            Icon(Icons.Default.Bolt, contentDescription = null, modifier = Modifier.size(14.dp))
                            Spacer(modifier = Modifier.width(4.dp))
                            Text("Simular Transferencia", fontSize = 11.sp, fontWeight = FontWeight.Bold)
                        }

                        OutlinedButton(
                            onClick = { onSchedulePush(5) },
                            shape = RoundedCornerShape(10.dp),
                            contentPadding = PaddingValues(horizontal = 10.dp, vertical = 6.dp),
                            modifier = Modifier.weight(1f)
                        ) {
                            Icon(Icons.Default.Timer, contentDescription = null, modifier = Modifier.size(14.dp))
                            Spacer(modifier = Modifier.width(4.dp))
                            Text("Alerta en 5s", fontSize = 11.sp)
                        }
                    }
                }
            }
        }

        // Filter Pills
        item {
            LazyRow(
                contentPadding = PaddingValues(horizontal = 20.dp, vertical = 4.dp),
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                items(filters) { filter ->
                    val isSelected = selectedFilter == filter
                    Box(
                        modifier = Modifier
                            .clip(RoundedCornerShape(10.dp))
                            .background(if (isSelected) LuminaBlue else Color(0xFF1E293B))
                            .clickable { selectedFilter = filter }
                            .padding(horizontal = 12.dp, vertical = 6.dp)
                    ) {
                        Text(
                            text = filter,
                            fontSize = 11.sp,
                            fontWeight = if (isSelected) FontWeight.Bold else FontWeight.Normal,
                            color = if (isSelected) Color.White else Color(0xFFCBD5E1)
                        )
                    }
                }
            }
        }

        // Notification Items
        if (filteredList.isEmpty()) {
            item {
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(40.dp),
                    contentAlignment = Alignment.Center
                ) {
                    Column(horizontalAlignment = Alignment.CenterHorizontally) {
                        Icon(
                            imageVector = Icons.Default.Notifications,
                            contentDescription = null,
                            tint = Color(0xFF475569),
                            modifier = Modifier.size(40.dp)
                        )
                        Spacer(modifier = Modifier.height(10.dp))
                        Text(
                            text = "No tienes notificaciones en esta categoría.",
                            color = Color(0xFF64748B),
                            fontSize = 12.sp
                        )
                    }
                }
            }
        } else {
            items(filteredList) { notif ->
                NotificationRowItem(
                    notification = notif,
                    onClick = { onMarkAsRead(notif.id) }
                )
                HorizontalDivider(color = Color(0xFF1E293B), modifier = Modifier.padding(horizontal = 20.dp))
            }
        }
    }
}

@Composable
fun NotificationRowItem(
    notification: NotificationEntity,
    onClick: () -> Unit
) {
    val dateFormat = remember { SimpleDateFormat("dd MMM, hh:mm a", Locale("es", "HN")) }
    val formattedDate = remember(notification.timestamp) { dateFormat.format(Date(notification.timestamp)) }

    val icon = when (notification.category) {
        "transfers" -> Icons.AutoMirrored.Filled.Send
        "security" -> Icons.Default.Security
        "cards" -> Icons.Default.CreditCard
        else -> Icons.Default.Info
    }

    val iconTint = when (notification.category) {
        "transfers" -> LuminaEmerald
        "security" -> LuminaBlue
        "cards" -> LuminaGold
        else -> Color.White
    }

    Row(
        modifier = Modifier
            .fillMaxWidth()
            .clickable(onClick = onClick)
            .background(if (!notification.isRead) LuminaBlue.copy(alpha = 0.08f) else Color.Transparent)
            .padding(horizontal = 20.dp, vertical = 14.dp),
        verticalAlignment = Alignment.Top
    ) {
        Box(
            modifier = Modifier
                .size(40.dp)
                .clip(CircleShape)
                .background(iconTint.copy(alpha = 0.15f)),
            contentAlignment = Alignment.Center
        ) {
            Icon(
                imageVector = icon,
                contentDescription = null,
                tint = iconTint,
                modifier = Modifier.size(20.dp)
            )
        }

        Spacer(modifier = Modifier.width(12.dp))

        Column(modifier = Modifier.weight(1f)) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = notification.title,
                    fontSize = 13.sp,
                    fontWeight = if (!notification.isRead) FontWeight.Bold else FontWeight.SemiBold,
                    color = MaterialTheme.colorScheme.onSurface
                )

                if (!notification.isRead) {
                    Box(
                        modifier = Modifier
                            .size(8.dp)
                            .clip(CircleShape)
                            .background(LuminaBlue)
                    )
                }
            }

            Spacer(modifier = Modifier.height(2.dp))

            Text(
                text = notification.message,
                fontSize = 12.sp,
                color = Color(0xFFCBD5E1),
                lineHeight = 16.sp
            )

            Spacer(modifier = Modifier.height(4.dp))

            Text(
                text = formattedDate,
                fontSize = 10.sp,
                color = Color(0xFF64748B)
            )
        }
    }
}
