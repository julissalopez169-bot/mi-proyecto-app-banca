package com.example.ui.screens

import android.content.ClipData
import android.content.ClipboardManager
import android.content.Context
import android.widget.Toast
import androidx.compose.foundation.BorderStroke
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
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.itemsIndexed
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.Check
import androidx.compose.material.icons.filled.ContentCopy
import androidx.compose.material.icons.filled.CreditCard
import androidx.compose.material.icons.filled.Fingerprint
import androidx.compose.material.icons.filled.Lock
import androidx.compose.material.icons.filled.LockOpen
import androidx.compose.material.icons.filled.Palette
import androidx.compose.material.icons.filled.Refresh
import androidx.compose.material.icons.filled.Security
import androidx.compose.material.icons.filled.Shield
import androidx.compose.material.icons.filled.Timer
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.Icon
import androidx.compose.material3.LinearProgressIndicator
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.Slider
import androidx.compose.material3.SliderDefaults
import androidx.compose.material3.Surface
import androidx.compose.material3.Switch
import androidx.compose.material3.SwitchDefaults
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableFloatStateOf
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import kotlinx.coroutines.delay
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.window.Dialog
import com.example.data.model.CardEntity
import com.example.ui.components.InteractiveCardItem
import com.example.ui.components.LuminaTopBar
import com.example.ui.theme.LuminaBlue
import com.example.ui.theme.LuminaEmerald
import com.example.ui.theme.LuminaGold
import com.example.ui.theme.LuminaRose

@Composable
fun CardsScreen(
    cards: List<CardEntity>,
    onBackClick: () -> Unit,
    onToggleFreeze: (CardEntity) -> Unit,
    onUpdateLimit: (String, Double) -> Unit,
    onAddNewCard: (String, String, String) -> Unit,
    onBiometricRevealCvv: (CardEntity, onRevealed: () -> Unit) -> Unit,
    onUpdateTheme: ((String, String, String) -> Unit)? = null,
    onRegenerateCvv: ((String, String, onDone: (String) -> Unit) -> Unit)? = null,
    onUpdateFeatures: ((String, Boolean, Boolean, Boolean) -> Unit)? = null
) {
    val context = LocalContext.current
    var selectedCardIndex by remember { mutableIntStateOf(0) }
    var showNewCardDialog by remember { mutableStateOf(false) }
    var revealedCvvCardId by remember { mutableStateOf<String?>(null) }

    val currentCard = cards.getOrNull(selectedCardIndex) ?: cards.firstOrNull()

    LazyColumn(
        modifier = Modifier
            .fillMaxSize()
            .background(MaterialTheme.colorScheme.background)
            .testTag("cards_screen"),
        contentPadding = PaddingValues(bottom = 90.dp)
    ) {
        item {
            LuminaTopBar(
                title = "Mis Tarjetas",
                subtitle = "Control y Seguridad en Tiempo Real",
                showBackButton = true,
                onBackClick = onBackClick
            )
        }

        // 1. SELECTOR DE TARJETAS (Pills con estilo ejecutivo)
        item {
            LazyRow(
                contentPadding = PaddingValues(horizontal = 20.dp, vertical = 6.dp),
                horizontalArrangement = Arrangement.spacedBy(10.dp)
            ) {
                itemsIndexed(cards) { index, card ->
                    val isSelected = index == selectedCardIndex
                    val last4 = card.cardNumber.replace(" ", "").takeLast(4)
                    Box(
                        modifier = Modifier
                            .clip(RoundedCornerShape(14.dp))
                            .background(
                                if (isSelected) LuminaBlue else MaterialTheme.colorScheme.surfaceVariant
                            )
                            .border(
                                1.dp,
                                if (isSelected) LuminaBlue else MaterialTheme.colorScheme.outline.copy(alpha = 0.5f),
                                RoundedCornerShape(14.dp)
                            )
                            .clickable {
                                selectedCardIndex = index
                                revealedCvvCardId = null
                            }
                            .padding(horizontal = 14.dp, vertical = 9.dp)
                    ) {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Box(
                                modifier = Modifier
                                    .size(8.dp)
                                    .clip(CircleShape)
                                    .background(
                                        when (card.colorTheme.lowercase()) {
                                            "oro", "gold" -> LuminaGold
                                            "esmeralda", "emerald" -> LuminaEmerald
                                            "titanium", "obsidian" -> Color(0xFF94A3B8)
                                            else -> LuminaBlue
                                        }
                                    )
                            )
                            Spacer(modifier = Modifier.width(6.dp))
                            Text(
                                text = "${card.cardTier} • $last4",
                                fontSize = 12.sp,
                                fontWeight = if (isSelected) FontWeight.Bold else FontWeight.Medium,
                                color = if (isSelected) Color.White else MaterialTheme.colorScheme.onSurface
                            )
                        }
                    }
                }

                // Add Card Pill
                item {
                    Box(
                        modifier = Modifier
                            .clip(RoundedCornerShape(14.dp))
                            .background(Color(0xFF0F766E))
                            .clickable { showNewCardDialog = true }
                            .padding(horizontal = 14.dp, vertical = 9.dp)
                    ) {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Icon(Icons.Default.Add, contentDescription = null, tint = Color.White, modifier = Modifier.size(16.dp))
                            Spacer(modifier = Modifier.width(6.dp))
                            Text("Nueva Tarjeta", fontSize = 12.sp, fontWeight = FontWeight.Bold, color = Color.White)
                        }
                    }
                }
            }
        }

        // 2. TARJETA FÍSICA INTERACTIVA CON ACABADO DE LUJO Y CONTROLES
        if (currentCard != null) {
            item {
                Spacer(modifier = Modifier.height(14.dp))
                Box(modifier = Modifier.padding(horizontal = 20.dp)) {
                    InteractiveCardItem(
                        card = currentCard,
                        onToggleFreeze = { onToggleFreeze(currentCard) },
                        onRevealCvvWithBiometric = {
                            onBiometricRevealCvv(currentCard) {
                                revealedCvvCardId = currentCard.id
                            }
                        },
                        showSensitiveDetails = revealedCvvCardId == currentCard.id,
                        onCopyCardNumber = {
                            Toast.makeText(context, "Número copiado: ${currentCard.cardNumber}", Toast.LENGTH_SHORT).show()
                        }
                    )
                }

                Text(
                    text = "Toca la tarjeta para girarla al reverso y consultar CVV o token QR.",
                    fontSize = 11.sp,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                    modifier = Modifier.padding(horizontal = 24.dp, vertical = 6.dp)
                )
            }

            // 3. PERSONALIZAR ACABADO DE LA TARJETA (Opciones de la web: Zafiro, Oro, Obsidiana, Esmeralda)
            item {
                Spacer(modifier = Modifier.height(14.dp))
                Card(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(horizontal = 20.dp),
                    shape = RoundedCornerShape(20.dp),
                    colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant),
                    border = CardDefaults.outlinedCardBorder().copy(
                        brush = Brush.linearGradient(
                            listOf(
                                MaterialTheme.colorScheme.outline.copy(alpha = 0.5f),
                                MaterialTheme.colorScheme.outline.copy(alpha = 0.5f)
                            )
                        )
                    )
                ) {
                    Column(modifier = Modifier.padding(18.dp)) {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Icon(
                                imageVector = Icons.Default.Palette,
                                contentDescription = null,
                                tint = LuminaBlue,
                                modifier = Modifier.size(20.dp)
                            )
                            Spacer(modifier = Modifier.width(8.dp))
                            Text(
                                text = "Personalizar Acabado y Material",
                                fontSize = 14.sp,
                                fontWeight = FontWeight.Bold,
                                color = MaterialTheme.colorScheme.onSurface
                            )
                        }

                        Spacer(modifier = Modifier.height(6.dp))
                        Text(
                            text = "Selecciona el acabado visual de titanio o metal precioso para esta tarjeta:",
                            fontSize = 11.sp,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )

                        Spacer(modifier = Modifier.height(12.dp))

                        // Grid de acabados
                        val finishes = listOf(
                            Triple("zafiro", "Zafiro Royal", LuminaBlue),
                            Triple("oro", "Oro Champán 24K", LuminaGold),
                            Triple("titanium", "Obsidiana Titanio", Color(0xFF475569)),
                            Triple("esmeralda", "Esmeralda Imperial", LuminaEmerald)
                        )

                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.spacedBy(8.dp)
                        ) {
                            finishes.forEach { (themeId, label, colorIndicator) ->
                                val isSelected = currentCard.colorTheme.lowercase() == themeId
                                Box(
                                    modifier = Modifier
                                        .weight(1f)
                                        .clip(RoundedCornerShape(12.dp))
                                        .background(
                                            if (isSelected) colorIndicator.copy(alpha = 0.18f)
                                            else MaterialTheme.colorScheme.surface
                                        )
                                        .border(
                                            width = if (isSelected) 1.8.dp else 0.8.dp,
                                            color = if (isSelected) colorIndicator else MaterialTheme.colorScheme.outline.copy(alpha = 0.5f),
                                            shape = RoundedCornerShape(12.dp)
                                        )
                                        .clickable {
                                            onUpdateTheme?.invoke(currentCard.id, themeId, currentCard.cardTier)
                                            Toast.makeText(context, "Acabado cambiado a $label", Toast.LENGTH_SHORT).show()
                                        }
                                        .padding(vertical = 10.dp, horizontal = 4.dp),
                                    contentAlignment = Alignment.Center
                                ) {
                                    Column(horizontalAlignment = Alignment.CenterHorizontally) {
                                        Box(
                                            modifier = Modifier
                                                .size(16.dp)
                                                .clip(CircleShape)
                                                .background(colorIndicator),
                                            contentAlignment = Alignment.Center
                                        ) {
                                            if (isSelected) {
                                                Icon(
                                                    Icons.Default.Check,
                                                    contentDescription = null,
                                                    tint = Color.White,
                                                    modifier = Modifier.size(12.dp)
                                                )
                                            }
                                        }
                                        Spacer(modifier = Modifier.height(4.dp))
                                        Text(
                                            text = label.split(" ")[0],
                                            fontSize = 10.sp,
                                            fontWeight = if (isSelected) FontWeight.ExtraBold else FontWeight.Medium,
                                            color = MaterialTheme.colorScheme.onSurface
                                        )
                                    }
                                }
                            }
                        }
                    }
                }
            }

            // 4. LÍMITE DIARIO Y AJUSTES DE SEGURIDAD
            item {
                Spacer(modifier = Modifier.height(14.dp))
                Card(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(horizontal = 20.dp),
                    shape = RoundedCornerShape(20.dp),
                    colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant),
                    border = CardDefaults.outlinedCardBorder().copy(
                        brush = Brush.linearGradient(
                            listOf(
                                MaterialTheme.colorScheme.outline.copy(alpha = 0.5f),
                                MaterialTheme.colorScheme.outline.copy(alpha = 0.5f)
                            )
                        )
                    )
                ) {
                    Column(modifier = Modifier.padding(20.dp)) {
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Text(
                                text = "Límite Diario de Gastos",
                                fontSize = 14.sp,
                                fontWeight = FontWeight.Bold,
                                color = MaterialTheme.colorScheme.onSurface
                            )
                            Text(
                                text = "Honduras SAR",
                                fontSize = 10.sp,
                                fontWeight = FontWeight.Bold,
                                color = LuminaEmerald
                            )
                        }

                        Spacer(modifier = Modifier.height(6.dp))

                        var sliderLimit by remember(currentCard.id, currentCard.dailyLimit) {
                            mutableFloatStateOf(currentCard.dailyLimit.toFloat())
                        }

                        Text(
                            text = String.format("L %,.0f / día", sliderLimit),
                            fontSize = 22.sp,
                            fontWeight = FontWeight.ExtraBold,
                            color = LuminaGold
                        )

                        Slider(
                            value = sliderLimit,
                            onValueChange = { sliderLimit = it },
                            onValueChangeFinished = {
                                onUpdateLimit(currentCard.id, sliderLimit.toDouble())
                                Toast.makeText(context, String.format("Límite diario fijado en L %,.0f", sliderLimit), Toast.LENGTH_SHORT).show()
                            },
                            valueRange = 5000f..250000f,
                            colors = SliderDefaults.colors(
                                thumbColor = LuminaGold,
                                activeTrackColor = LuminaBlue,
                                inactiveTrackColor = MaterialTheme.colorScheme.outline.copy(alpha = 0.5f)
                            )
                        )

                        // Quick step adjustments
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.spacedBy(6.dp)
                        ) {
                            listOf(
                                "+5,000" to 5000f,
                                "+10,000" to 10000f,
                                "+50,000" to 50000f,
                                "Máx (250k)" to 250000f
                            ).forEach { (label, addAmount) ->
                                OutlinedButton(
                                    onClick = {
                                        val newLimit = if (label.startsWith("Máx")) 250000f else (sliderLimit + addAmount).coerceAtMost(250000f)
                                        sliderLimit = newLimit
                                        onUpdateLimit(currentCard.id, newLimit.toDouble())
                                        Toast.makeText(context, String.format("Límite actualizado a L %,.0f", newLimit), Toast.LENGTH_SHORT).show()
                                    },
                                    modifier = Modifier
                                        .weight(1f)
                                        .height(32.dp),
                                    shape = RoundedCornerShape(8.dp),
                                    contentPadding = PaddingValues(horizontal = 2.dp, vertical = 2.dp),
                                    colors = ButtonDefaults.outlinedButtonColors(
                                        containerColor = MaterialTheme.colorScheme.surface
                                    )
                                ) {
                                    Text(label, fontSize = 9.sp, fontWeight = FontWeight.Bold, color = MaterialTheme.colorScheme.onSurface)
                                }
                            }
                        }

                        Spacer(modifier = Modifier.height(16.dp))
                        HorizontalDivider(color = MaterialTheme.colorScheme.outline.copy(alpha = 0.4f))
                        Spacer(modifier = Modifier.height(16.dp))

                        // Toggles de permisos con persistencia
                        var onlineEnabled by remember(currentCard.id, currentCard.onlineEnabled) { mutableStateOf(currentCard.onlineEnabled) }
                        var contactlessEnabled by remember(currentCard.id, currentCard.contactlessEnabled) { mutableStateOf(currentCard.contactlessEnabled) }
                        var atmEnabled by remember(currentCard.id, currentCard.atmEnabled) { mutableStateOf(currentCard.atmEnabled) }

                        CardToggleRow(
                            title = "Compras por Internet (E-commerce)",
                            description = "Transacciones en Amazon, Netflix, Uber y comercios online",
                            checked = onlineEnabled,
                            onCheckedChange = {
                                onlineEnabled = it
                                onUpdateFeatures?.invoke(currentCard.id, it, contactlessEnabled, atmEnabled)
                            }
                        )

                        CardToggleRow(
                            title = "Pagos Contactless (NFC)",
                            description = "Aproximación en terminales de pago POS y transporte",
                            checked = contactlessEnabled,
                            onCheckedChange = {
                                contactlessEnabled = it
                                onUpdateFeatures?.invoke(currentCard.id, onlineEnabled, it, atmEnabled)
                            }
                        )

                        CardToggleRow(
                            title = "Retiros en Cajeros ATM",
                            description = "Permitir retiros en cajeros de la red Banred y ACH Honduras",
                            checked = atmEnabled,
                            onCheckedChange = {
                                atmEnabled = it
                                onUpdateFeatures?.invoke(currentCard.id, onlineEnabled, contactlessEnabled, it)
                            }
                        )

                        Spacer(modifier = Modifier.height(12.dp))
                        HorizontalDivider(color = MaterialTheme.colorScheme.outline.copy(alpha = 0.4f))
                        Spacer(modifier = Modifier.height(14.dp))

                        // 5. TARJETA VIRTUAL CON CVV DINÁMICO DE 5 MINUTOS (Compras 100% Seguras)
                        var dynamicSecondsLeft by remember(currentCard.id) { mutableIntStateOf(300) }

                        LaunchedEffect(currentCard.id, dynamicSecondsLeft) {
                            if (dynamicSecondsLeft > 0) {
                                delay(1000L)
                                dynamicSecondsLeft -= 1
                            } else {
                                // Auto-regenerar al expirar los 5 minutos
                                onRegenerateCvv?.invoke(currentCard.id, currentCard.cardTier) { newCvv ->
                                    Toast.makeText(context, "¡CVV rotado automáticamente por seguridad! Nuevo código: $newCvv", Toast.LENGTH_SHORT).show()
                                }
                                dynamicSecondsLeft = 300
                            }
                        }

                        val minutes = dynamicSecondsLeft / 60
                        val seconds = dynamicSecondsLeft % 60
                        val timerString = String.format("%02d:%02d", minutes, seconds)
                        val timerProgress = dynamicSecondsLeft / 300f

                        Card(
                            modifier = Modifier.fillMaxWidth(),
                            shape = RoundedCornerShape(16.dp),
                            colors = CardDefaults.cardColors(containerColor = Color(0xFF0F1E36)),
                            border = CardDefaults.outlinedCardBorder().copy(
                                brush = androidx.compose.ui.graphics.SolidColor(LuminaBlue.copy(alpha = 0.5f))
                            )
                        ) {
                            Column(modifier = Modifier.padding(16.dp)) {
                                Row(
                                    modifier = Modifier.fillMaxWidth(),
                                    horizontalArrangement = Arrangement.SpaceBetween,
                                    verticalAlignment = Alignment.CenterVertically
                                ) {
                                    Row(verticalAlignment = Alignment.CenterVertically) {
                                        Icon(
                                            imageVector = Icons.Default.Timer,
                                            contentDescription = null,
                                            tint = LuminaGold,
                                            modifier = Modifier.size(18.dp)
                                        )
                                        Spacer(modifier = Modifier.width(6.dp))
                                        Text(
                                            text = "CVV Dinámico de 5 Minutos",
                                            fontWeight = FontWeight.Bold,
                                            fontSize = 13.sp,
                                            color = Color.White
                                        )
                                    }

                                    Box(
                                        modifier = Modifier
                                            .clip(RoundedCornerShape(8.dp))
                                            .background(Color(0xFF1E293B))
                                            .padding(horizontal = 8.dp, vertical = 4.dp)
                                    ) {
                                        Text(
                                            text = "Expira en $timerString",
                                            fontSize = 11.sp,
                                            fontWeight = FontWeight.Bold,
                                            color = if (dynamicSecondsLeft < 30) LuminaRose else LuminaGold
                                        )
                                    }
                                }

                                Spacer(modifier = Modifier.height(10.dp))

                                LinearProgressIndicator(
                                    progress = { timerProgress },
                                    modifier = Modifier
                                        .fillMaxWidth()
                                        .height(6.dp)
                                        .clip(RoundedCornerShape(3.dp)),
                                    color = if (dynamicSecondsLeft < 30) LuminaRose else LuminaBlue,
                                    trackColor = Color(0xFF1E293B)
                                )

                                Spacer(modifier = Modifier.height(12.dp))

                                Row(
                                    modifier = Modifier.fillMaxWidth(),
                                    horizontalArrangement = Arrangement.SpaceBetween,
                                    verticalAlignment = Alignment.CenterVertically
                                ) {
                                    Column {
                                        Text("Código CVV Actual", fontSize = 11.sp, color = Color(0xFF94A3B8))
                                        Text(
                                            text = currentCard.cvv,
                                            fontSize = 24.sp,
                                            fontWeight = FontWeight.ExtraBold,
                                            color = LuminaEmerald,
                                            letterSpacing = 4.sp
                                        )
                                    }

                                    Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                                        OutlinedButton(
                                            onClick = {
                                                val clipboard = context.getSystemService(Context.CLIPBOARD_SERVICE) as ClipboardManager
                                                clipboard.setPrimaryClip(ClipData.newPlainText("CVV", currentCard.cvv))
                                                Toast.makeText(context, "CVV copiado al portapapeles", Toast.LENGTH_SHORT).show()
                                            },
                                            shape = RoundedCornerShape(10.dp),
                                            contentPadding = PaddingValues(horizontal = 10.dp, vertical = 6.dp)
                                        ) {
                                            Icon(Icons.Default.ContentCopy, contentDescription = null, modifier = Modifier.size(14.dp))
                                            Spacer(modifier = Modifier.width(4.dp))
                                            Text("Copiar CVV", fontSize = 11.sp)
                                        }

                                        Button(
                                            onClick = {
                                                onRegenerateCvv?.invoke(currentCard.id, currentCard.cardTier) { newCvv ->
                                                    dynamicSecondsLeft = 300
                                                    Toast.makeText(context, "¡Nuevo CVV generado: $newCvv! Válido por 5 minutos", Toast.LENGTH_LONG).show()
                                                }
                                            },
                                            colors = ButtonDefaults.buttonColors(containerColor = LuminaBlue),
                                            shape = RoundedCornerShape(10.dp),
                                            contentPadding = PaddingValues(horizontal = 12.dp, vertical = 6.dp),
                                            modifier = Modifier.testTag("btn_regenerate_cvv")
                                        ) {
                                            Icon(Icons.Default.Refresh, contentDescription = null, modifier = Modifier.size(14.dp))
                                            Spacer(modifier = Modifier.width(4.dp))
                                            Text("Regenerar", fontSize = 11.sp, fontWeight = FontWeight.Bold)
                                        }
                                    }
                                }

                                Spacer(modifier = Modifier.height(6.dp))
                                Text(
                                    text = "Tarjeta descartable para internet: el código rota automáticamente cada 5 minutos para máxima protección contra clonación.",
                                    fontSize = 10.sp,
                                    color = Color(0xFF94A3B8),
                                    lineHeight = 14.sp
                                )
                            }
                        }
                    }
                }
            }
        }
    }

    // Modal para emitir nueva tarjeta
    if (showNewCardDialog) {
        Dialog(onDismissRequest = { showNewCardDialog = false }) {
            Surface(
                shape = RoundedCornerShape(22.dp),
                color = MaterialTheme.colorScheme.surfaceVariant,
                modifier = Modifier.fillMaxWidth(),
                border = BorderStroke(
                    1.dp,
                    MaterialTheme.colorScheme.outline.copy(alpha = 0.5f)
                )
            ) {
                Column(modifier = Modifier.padding(22.dp)) {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Box(
                            modifier = Modifier
                                .size(36.dp)
                                .clip(CircleShape)
                                .background(LuminaBlue.copy(alpha = 0.2f)),
                            contentAlignment = Alignment.Center
                        ) {
                            Icon(Icons.Default.CreditCard, contentDescription = null, tint = LuminaBlue, modifier = Modifier.size(20.dp))
                        }
                        Spacer(modifier = Modifier.width(10.dp))
                        Column {
                            Text(
                                text = "Emitir Tarjeta Digital Nova",
                                fontSize = 16.sp,
                                fontWeight = FontWeight.Bold,
                                color = MaterialTheme.colorScheme.onSurface
                            )
                            Text(
                                text = "Emisión instantánea vinculada a tu cuenta",
                                fontSize = 10.sp,
                                color = MaterialTheme.colorScheme.onSurfaceVariant
                            )
                        }
                    }

                    Spacer(modifier = Modifier.height(16.dp))

                    val tiers = listOf(
                        Triple("Zafiro Digital", "DÉBITO", "zafiro"),
                        Triple("Oro 24K Metálica", "CRÉDITO", "oro"),
                        Triple("Titanium Black", "PATRIMONIO", "titanium"),
                        Triple("Esmeralda Private", "DÉBITO", "esmeralda")
                    )

                    tiers.forEach { (tier, type, theme) ->
                        Card(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(vertical = 5.dp)
                                .clickable {
                                    onAddNewCard(tier, type, theme)
                                    showNewCardDialog = false
                                    Toast.makeText(context, "Tarjeta $tier emitida con éxito", Toast.LENGTH_SHORT).show()
                                },
                            shape = RoundedCornerShape(14.dp),
                            colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                            border = CardDefaults.outlinedCardBorder().copy(
                                brush = Brush.linearGradient(
                                    listOf(
                                        MaterialTheme.colorScheme.outline.copy(alpha = 0.4f),
                                        MaterialTheme.colorScheme.outline.copy(alpha = 0.4f)
                                    )
                                )
                            )
                        ) {
                            Row(
                                modifier = Modifier.padding(14.dp),
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Box(
                                    modifier = Modifier
                                        .size(34.dp)
                                        .clip(CircleShape)
                                        .background(
                                            when (theme) {
                                                "oro" -> LuminaGold
                                                "esmeralda" -> LuminaEmerald
                                                "titanium" -> Color(0xFF475569)
                                                else -> LuminaBlue
                                            }
                                        )
                                )
                                Spacer(modifier = Modifier.width(12.dp))
                                Column(modifier = Modifier.weight(1f)) {
                                    Text(
                                        text = tier,
                                        fontWeight = FontWeight.Bold,
                                        color = MaterialTheme.colorScheme.onSurface,
                                        fontSize = 13.sp
                                    )
                                    Text(
                                        text = "Tipo: $type • Emisión Inmediata SAR",
                                        fontSize = 11.sp,
                                        color = MaterialTheme.colorScheme.onSurfaceVariant
                                    )
                                }
                                Icon(Icons.Default.Add, contentDescription = null, tint = LuminaBlue, modifier = Modifier.size(18.dp))
                            }
                        }
                    }

                    Spacer(modifier = Modifier.height(14.dp))

                    OutlinedButton(
                        onClick = { showNewCardDialog = false },
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Text("Cancelar", color = MaterialTheme.colorScheme.onSurface)
                    }
                }
            }
        }
    }
}

@Composable
fun CardToggleRow(
    title: String,
    description: String,
    checked: Boolean,
    onCheckedChange: (Boolean) -> Unit
) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .padding(vertical = 8.dp),
        horizontalArrangement = Arrangement.SpaceBetween,
        verticalAlignment = Alignment.CenterVertically
    ) {
        Column(modifier = Modifier.weight(1f)) {
            Text(
                text = title,
                fontSize = 13.sp,
                fontWeight = FontWeight.SemiBold,
                color = MaterialTheme.colorScheme.onSurface
            )
            Text(
                text = description,
                fontSize = 11.sp,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
                lineHeight = 15.sp
            )
        }
        Spacer(modifier = Modifier.width(8.dp))
        Switch(
            checked = checked,
            onCheckedChange = onCheckedChange,
            colors = SwitchDefaults.colors(
                checkedThumbColor = Color.White,
                checkedTrackColor = LuminaBlue,
                uncheckedThumbColor = Color(0xFF94A3B8),
                uncheckedTrackColor = MaterialTheme.colorScheme.outline.copy(alpha = 0.5f)
            )
        )
    }
}
