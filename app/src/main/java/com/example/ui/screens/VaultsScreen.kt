package com.example.ui.screens

import android.widget.Toast
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
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.AutoAwesome
import androidx.compose.material.icons.filled.Delete
import androidx.compose.material.icons.filled.DirectionsCar
import androidx.compose.material.icons.filled.Flight
import androidx.compose.material.icons.filled.Home
import androidx.compose.material.icons.filled.Savings
import androidx.compose.material.icons.filled.School
import androidx.compose.material.icons.filled.Security
import androidx.compose.material.icons.filled.Star
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.FloatingActionButton
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.LinearProgressIndicator
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.OutlinedTextFieldDefaults
import androidx.compose.material3.Switch
import androidx.compose.material3.SwitchDefaults
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.window.Dialog
import com.example.data.model.AccountEntity
import com.example.data.model.SavingsVaultEntity
import com.example.ui.components.LuminaTopBar
import com.example.ui.theme.LuminaBlue
import com.example.ui.theme.LuminaCardDark
import com.example.ui.theme.LuminaEmerald
import com.example.ui.theme.LuminaGold
import com.example.ui.theme.LuminaNavyDark
import com.example.ui.theme.LuminaRose

@Composable
fun VaultsScreen(
    account: AccountEntity?,
    vaults: List<SavingsVaultEntity>,
    onBackClick: () -> Unit,
    onCreateVault: (name: String, target: Double, category: String, colorHex: String) -> Unit,
    onDepositToVault: (vault: SavingsVaultEntity, amount: Double, onResult: (Boolean, String) -> Unit) -> Unit,
    onWithdrawFromVault: (vault: SavingsVaultEntity, amount: Double, onResult: (Boolean, String) -> Unit) -> Unit,
    onToggleAutoRoundUp: (vaultId: String, active: Boolean) -> Unit,
    onDeleteVault: (vaultId: String) -> Unit
) {
    val context = LocalContext.current
    var showCreateDialog by remember { mutableStateOf(false) }
    var selectedVaultForDeposit by remember { mutableStateOf<SavingsVaultEntity?>(null) }
    var selectedVaultForWithdraw by remember { mutableStateOf<SavingsVaultEntity?>(null) }

    val totalSavedInVaults = vaults.sumOf { it.currentAmount }
    val activeRoundUpVault = vaults.firstOrNull { it.isAutoRoundUpActive }

    Box(modifier = Modifier.fillMaxSize()) {
        LazyColumn(
            modifier = Modifier
                .fillMaxSize()
                .background(MaterialTheme.colorScheme.background)
                .testTag("vaults_screen"),
            contentPadding = PaddingValues(bottom = 100.dp)
        ) {
            item {
                LuminaTopBar(
                    title = "Bóvedas de Ahorro",
                    subtitle = "Alcancías Digitales y Redondeo Automático",
                    showBackButton = true,
                    onBackClick = onBackClick
                )
            }

            // 1. Resumen de Ahorros Consolidado
            item {
                Spacer(modifier = Modifier.height(10.dp))
                Card(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(horizontal = 20.dp),
                    shape = RoundedCornerShape(24.dp),
                    colors = CardDefaults.cardColors(containerColor = LuminaCardDark)
                ) {
                    Column(modifier = Modifier.padding(22.dp)) {
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Text(
                                text = "TOTAL EN ALCANCÍAS",
                                fontSize = 11.sp,
                                fontWeight = FontWeight.Bold,
                                color = Color(0xFF94A3B8)
                            )
                            Box(
                                modifier = Modifier
                                    .clip(RoundedCornerShape(8.dp))
                                    .background(LuminaEmerald.copy(alpha = 0.15f))
                                    .padding(horizontal = 8.dp, vertical = 4.dp)
                            ) {
                                Text(
                                    text = "${vaults.size} Bóvedas activas",
                                    fontSize = 11.sp,
                                    fontWeight = FontWeight.Bold,
                                    color = LuminaEmerald
                                )
                            }
                        }

                        Spacer(modifier = Modifier.height(8.dp))

                        Text(
                            text = String.format("L %,.2f", totalSavedInVaults),
                            fontSize = 32.sp,
                            fontWeight = FontWeight.ExtraBold,
                            color = Color.White
                        )

                        Spacer(modifier = Modifier.height(6.dp))

                        Text(
                            text = "Saldo Disponible en Cuenta: L ${String.format("%,.2f", account?.balanceHnl ?: 0.0)}",
                            fontSize = 12.sp,
                            color = Color(0xFFCBD5E1)
                        )
                    }
                }
            }

            // 2. Control de Redondeo Automático de Gastos (Alcancía Digital Inteligente)
            item {
                Spacer(modifier = Modifier.height(16.dp))
                Card(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(horizontal = 20.dp),
                    shape = RoundedCornerShape(20.dp),
                    colors = CardDefaults.cardColors(
                        containerColor = if (activeRoundUpVault != null) Color(0xFF0F2624) else MaterialTheme.colorScheme.surfaceVariant
                    ),
                    border = CardDefaults.outlinedCardBorder().copy(
                        brush = androidx.compose.ui.graphics.SolidColor(
                            if (activeRoundUpVault != null) LuminaEmerald.copy(alpha = 0.6f) else MaterialTheme.colorScheme.outline.copy(alpha = 0.3f)
                        )
                    )
                ) {
                    Column(modifier = Modifier.padding(18.dp)) {
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.SpaceBetween
                        ) {
                            Row(
                                verticalAlignment = Alignment.CenterVertically,
                                modifier = Modifier.weight(1f)
                            ) {
                                Box(
                                    modifier = Modifier
                                        .size(42.dp)
                                        .clip(CircleShape)
                                        .background(if (activeRoundUpVault != null) LuminaEmerald else Color(0xFF334155)),
                                    contentAlignment = Alignment.Center
                                ) {
                                    Icon(
                                        imageVector = Icons.Default.AutoAwesome,
                                        contentDescription = null,
                                        tint = Color.White,
                                        modifier = Modifier.size(22.dp)
                                    )
                                }
                                Spacer(modifier = Modifier.width(12.dp))
                                Column {
                                    Text(
                                        text = "Redondeo Automático de Gastos",
                                        fontWeight = FontWeight.Bold,
                                        fontSize = 14.sp,
                                        color = MaterialTheme.colorScheme.onSurface
                                    )
                                    Text(
                                        text = if (activeRoundUpVault != null) "Activo en: ${activeRoundUpVault.name}" else "Desactivado",
                                        fontSize = 11.sp,
                                        color = if (activeRoundUpVault != null) LuminaEmerald else MaterialTheme.colorScheme.onSurfaceVariant
                                    )
                                }
                            }

                            Switch(
                                checked = activeRoundUpVault != null,
                                onCheckedChange = { isChecked ->
                                    if (isChecked) {
                                        val firstVault = vaults.firstOrNull()
                                        if (firstVault != null) {
                                            onToggleAutoRoundUp(firstVault.id, true)
                                            Toast.makeText(context, "Redondeo activado en '${firstVault.name}'", Toast.LENGTH_SHORT).show()
                                        } else {
                                            Toast.makeText(context, "Crea una bóveda primero", Toast.LENGTH_SHORT).show()
                                        }
                                    } else {
                                        activeRoundUpVault?.let { onToggleAutoRoundUp(it.id, false) }
                                    }
                                },
                                colors = SwitchDefaults.colors(
                                    checkedThumbColor = Color.White,
                                    checkedTrackColor = LuminaEmerald
                                )
                            )
                        }

                        Spacer(modifier = Modifier.height(10.dp))
                        Text(
                            text = "Ahorra sin darte cuenta: cada pago o transferencia se redondea al múltiplo de L 10 (ej. L 132.50 -> L 140.00) y la diferencia (L 7.50) se deposita directo en tu alcancía.",
                            fontSize = 11.sp,
                            color = MaterialTheme.colorScheme.onSurfaceVariant,
                            lineHeight = 15.sp
                        )
                    }
                }
            }

            // 3. Título de Bóvedas
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
                        text = "Mis Bolsillos de Ahorro",
                        fontSize = 16.sp,
                        fontWeight = FontWeight.Bold,
                        color = MaterialTheme.colorScheme.onBackground
                    )

                    Button(
                        onClick = { showCreateDialog = true },
                        colors = ButtonDefaults.buttonColors(containerColor = LuminaBlue),
                        contentPadding = PaddingValues(horizontal = 12.dp, vertical = 6.dp)
                    ) {
                        Icon(Icons.Default.Add, contentDescription = null, modifier = Modifier.size(16.dp))
                        Spacer(modifier = Modifier.width(4.dp))
                        Text("Nueva Bóveda", fontSize = 12.sp)
                    }
                }
            }

            // 4. Lista de Bóvedas
            items(vaults) { vault ->
                Spacer(modifier = Modifier.height(12.dp))
                VaultCardItem(
                    vault = vault,
                    onDeposit = { selectedVaultForDeposit = vault },
                    onWithdraw = { selectedVaultForWithdraw = vault },
                    onToggleRoundUp = { active -> onToggleAutoRoundUp(vault.id, active) },
                    onDelete = { onDeleteVault(vault.id) }
                )
            }
        }

        // FAB de creación rápida
        FloatingActionButton(
            onClick = { showCreateDialog = true },
            modifier = Modifier
                .align(Alignment.BottomEnd)
                .padding(24.dp)
                .testTag("fab_create_vault"),
            containerColor = LuminaEmerald,
            contentColor = Color.White
        ) {
            Icon(Icons.Default.Add, contentDescription = "Crear Bóveda")
        }
    }

    // DIALOG: CREAR BÓVEDA
    if (showCreateDialog) {
        CreateVaultDialog(
            onDismiss = { showCreateDialog = false },
            onConfirm = { name, target, category, colorHex ->
                onCreateVault(name, target, category, colorHex)
                showCreateDialog = false
                Toast.makeText(context, "Bóveda '$name' creada con éxito", Toast.LENGTH_SHORT).show()
            }
        )
    }

    // DIALOG: ABONAR A BÓVEDA
    selectedVaultForDeposit?.let { vault ->
        DepositWithdrawDialog(
            title = "Abonar a ${vault.name}",
            actionLabel = "Abonar Dinero",
            availableBalance = account?.balanceHnl ?: 0.0,
            isDeposit = true,
            onDismiss = { selectedVaultForDeposit = null },
            onConfirm = { amount ->
                onDepositToVault(vault, amount) { success, msg ->
                    Toast.makeText(context, msg, Toast.LENGTH_SHORT).show()
                    if (success) selectedVaultForDeposit = null
                }
            }
        )
    }

    // DIALOG: RETIRAR DE BÓVEDA
    selectedVaultForWithdraw?.let { vault ->
        DepositWithdrawDialog(
            title = "Retirar de ${vault.name}",
            actionLabel = "Retirar a Cuenta",
            availableBalance = vault.currentAmount,
            isDeposit = false,
            onDismiss = { selectedVaultForWithdraw = null },
            onConfirm = { amount ->
                onWithdrawFromVault(vault, amount) { success, msg ->
                    Toast.makeText(context, msg, Toast.LENGTH_SHORT).show()
                    if (success) selectedVaultForWithdraw = null
                }
            }
        )
    }
}

@Composable
fun VaultCardItem(
    vault: SavingsVaultEntity,
    onDeposit: () -> Unit,
    onWithdraw: () -> Unit,
    onToggleRoundUp: (Boolean) -> Unit,
    onDelete: () -> Unit
) {
    val progress = (vault.currentAmount / vault.targetAmount).toFloat().coerceIn(0f, 1f)
    val percentage = (progress * 100).toInt()

    val vaultColor = try {
        Color(android.graphics.Color.parseColor(vault.colorHex))
    } catch (e: Exception) {
        LuminaBlue
    }

    val iconVector = when (vault.category.lowercase()) {
        "vacaciones", "viajes" -> Icons.Default.Flight
        "auto", "vehículo" -> Icons.Default.DirectionsCar
        "hogar", "casa" -> Icons.Default.Home
        "educación" -> Icons.Default.School
        "emergencias" -> Icons.Default.Security
        else -> Icons.Default.Savings
    }

    Card(
        modifier = Modifier
            .fillMaxWidth()
            .padding(horizontal = 20.dp),
        shape = RoundedCornerShape(20.dp),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant)
    ) {
        Column(modifier = Modifier.padding(18.dp)) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Box(
                        modifier = Modifier
                            .size(44.dp)
                            .clip(CircleShape)
                            .background(vaultColor.copy(alpha = 0.2f)),
                        contentAlignment = Alignment.Center
                    ) {
                        Icon(iconVector, contentDescription = null, tint = vaultColor, modifier = Modifier.size(22.dp))
                    }
                    Spacer(modifier = Modifier.width(12.dp))
                    Column {
                        Text(
                            text = vault.name,
                            fontWeight = FontWeight.Bold,
                            fontSize = 15.sp,
                            color = MaterialTheme.colorScheme.onSurface
                        )
                        Text(
                            text = vault.category,
                            fontSize = 11.sp,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    }
                }

                Row(verticalAlignment = Alignment.CenterVertically) {
                    if (vault.isAutoRoundUpActive) {
                        Box(
                            modifier = Modifier
                                .clip(RoundedCornerShape(6.dp))
                                .background(LuminaEmerald.copy(alpha = 0.2f))
                                .padding(horizontal = 6.dp, vertical = 2.dp)
                        ) {
                            Text("Redondeo Activo", fontSize = 9.sp, fontWeight = FontWeight.Bold, color = LuminaEmerald)
                        }
                        Spacer(modifier = Modifier.width(6.dp))
                    }
                    IconButton(onClick = onDelete, modifier = Modifier.size(32.dp)) {
                        Icon(Icons.Default.Delete, contentDescription = "Eliminar", tint = Color(0xFF94A3B8), modifier = Modifier.size(18.dp))
                    }
                }
            }

            Spacer(modifier = Modifier.height(14.dp))

            // Montos y Barra de Progreso
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.Bottom
            ) {
                Column {
                    Text("Ahorrado", fontSize = 10.sp, color = Color(0xFF94A3B8))
                    Text(
                        text = "L ${String.format("%,.2f", vault.currentAmount)}",
                        fontWeight = FontWeight.ExtraBold,
                        fontSize = 18.sp,
                        color = Color.White
                    )
                }

                Column(horizontalAlignment = Alignment.End) {
                    Text("Meta: L ${String.format("%,.2f", vault.targetAmount)}", fontSize = 11.sp, color = Color(0xFFCBD5E1))
                    Text("$percentage%", fontWeight = FontWeight.Bold, fontSize = 14.sp, color = vaultColor)
                }
            }

            Spacer(modifier = Modifier.height(8.dp))

            LinearProgressIndicator(
                progress = { progress },
                modifier = Modifier
                    .fillMaxWidth()
                    .height(8.dp)
                    .clip(RoundedCornerShape(4.dp)),
                color = vaultColor,
                trackColor = Color(0xFF1E293B)
            )

            Spacer(modifier = Modifier.height(14.dp))
            HorizontalDivider(color = Color(0xFF334155).copy(alpha = 0.5f))
            Spacer(modifier = Modifier.height(12.dp))

            // Botones de Acción: Abonar y Retirar
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(10.dp)
            ) {
                Button(
                    onClick = onDeposit,
                    colors = ButtonDefaults.buttonColors(containerColor = LuminaEmerald),
                    modifier = Modifier.weight(1f),
                    shape = RoundedCornerShape(12.dp)
                ) {
                    Text("Abonar (+)", fontSize = 12.sp, fontWeight = FontWeight.Bold)
                }

                OutlinedButton(
                    onClick = onWithdraw,
                    modifier = Modifier.weight(1f),
                    shape = RoundedCornerShape(12.dp)
                ) {
                    Text("Retirar (-)", fontSize = 12.sp, color = MaterialTheme.colorScheme.onSurface)
                }

                IconButton(
                    onClick = { onToggleRoundUp(!vault.isAutoRoundUpActive) },
                    modifier = Modifier
                        .clip(RoundedCornerShape(12.dp))
                        .background(if (vault.isAutoRoundUpActive) LuminaGold.copy(alpha = 0.2f) else Color(0xFF1E293B))
                ) {
                    Icon(
                        imageVector = Icons.Default.Star,
                        contentDescription = "Hacer alcancía de redondeo",
                        tint = if (vault.isAutoRoundUpActive) LuminaGold else Color(0xFF94A3B8)
                    )
                }
            }
        }
    }
}

@Composable
fun CreateVaultDialog(
    onDismiss: () -> Unit,
    onConfirm: (name: String, target: Double, category: String, colorHex: String) -> Unit
) {
    var name by remember { mutableStateOf("") }
    var targetText by remember { mutableStateOf("") }
    var selectedCategory by remember { mutableStateOf("Emergencias") }
    var selectedColor by remember { mutableStateOf("#10B981") }

    val categories = listOf("Emergencias", "Vacaciones", "Auto", "Hogar", "Educación", "Tecnología")
    val colors = listOf("#10B981", "#0EA5E9", "#F59E0B", "#EC4899", "#8B5CF6", "#64748B")

    Dialog(onDismissRequest = onDismiss) {
        Card(
            shape = RoundedCornerShape(24.dp),
            colors = CardDefaults.cardColors(containerColor = Color(0xFF0F172A)),
            modifier = Modifier.fillMaxWidth()
        ) {
            Column(modifier = Modifier.padding(22.dp)) {
                Text(
                    text = "Nueva Bóveda de Ahorro",
                    fontSize = 18.sp,
                    fontWeight = FontWeight.Bold,
                    color = Color.White
                )

                Spacer(modifier = Modifier.height(14.dp))

                OutlinedTextField(
                    value = name,
                    onValueChange = { name = it },
                    label = { Text("Nombre de la meta") },
                    placeholder = { Text("Ej. Vacaciones Roatán") },
                    modifier = Modifier.fillMaxWidth(),
                    colors = OutlinedTextFieldDefaults.colors(
                        focusedTextColor = Color.White,
                        unfocusedTextColor = Color.White
                    )
                )

                Spacer(modifier = Modifier.height(10.dp))

                OutlinedTextField(
                    value = targetText,
                    onValueChange = { targetText = it },
                    label = { Text("Monto Meta (Lempiras)") },
                    prefix = { Text("L ", fontWeight = FontWeight.Bold, color = LuminaEmerald) },
                    placeholder = { Text("Ej. 25000.00") },
                    keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                    modifier = Modifier.fillMaxWidth(),
                    colors = OutlinedTextFieldDefaults.colors(
                        focusedTextColor = Color.White,
                        unfocusedTextColor = Color.White
                    )
                )

                Spacer(modifier = Modifier.height(14.dp))

                Text("Categoría:", fontSize = 12.sp, color = Color(0xFF94A3B8))
                Spacer(modifier = Modifier.height(6.dp))

                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(6.dp)
                ) {
                    categories.take(3).forEach { cat ->
                        Box(
                            modifier = Modifier
                                .clip(RoundedCornerShape(8.dp))
                                .background(if (selectedCategory == cat) LuminaBlue else Color(0xFF1E293B))
                                .clickable { selectedCategory = cat }
                                .padding(horizontal = 8.dp, vertical = 6.dp)
                        ) {
                            Text(cat, fontSize = 11.sp, color = Color.White)
                        }
                    }
                }

                Spacer(modifier = Modifier.height(6.dp))

                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(6.dp)
                ) {
                    categories.drop(3).forEach { cat ->
                        Box(
                            modifier = Modifier
                                .clip(RoundedCornerShape(8.dp))
                                .background(if (selectedCategory == cat) LuminaBlue else Color(0xFF1E293B))
                                .clickable { selectedCategory = cat }
                                .padding(horizontal = 8.dp, vertical = 6.dp)
                        ) {
                            Text(cat, fontSize = 11.sp, color = Color.White)
                        }
                    }
                }

                Spacer(modifier = Modifier.height(14.dp))

                Text("Color:", fontSize = 12.sp, color = Color(0xFF94A3B8))
                Spacer(modifier = Modifier.height(6.dp))

                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    colors.forEach { hex ->
                        val col = Color(android.graphics.Color.parseColor(hex))
                        Box(
                            modifier = Modifier
                                .size(28.dp)
                                .clip(CircleShape)
                                .background(col)
                                .clickable { selectedColor = hex }
                        )
                    }
                }

                Spacer(modifier = Modifier.height(20.dp))

                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(10.dp)
                ) {
                    OutlinedButton(
                        onClick = onDismiss,
                        modifier = Modifier.weight(1f)
                    ) {
                        Text("Cancelar", color = Color(0xFF94A3B8))
                    }

                    Button(
                        onClick = {
                            val target = targetText.toDoubleOrNull() ?: 1000.0
                            if (name.isNotBlank()) {
                                onConfirm(name, target, selectedCategory, selectedColor)
                            }
                        },
                        colors = ButtonDefaults.buttonColors(containerColor = LuminaEmerald),
                        modifier = Modifier.weight(1f)
                    ) {
                        Text("Crear Meta")
                    }
                }
            }
        }
    }
}

@Composable
fun DepositWithdrawDialog(
    title: String,
    actionLabel: String,
    availableBalance: Double,
    isDeposit: Boolean,
    onDismiss: () -> Unit,
    onConfirm: (amount: Double) -> Unit
) {
    var amountText by remember { mutableStateOf("") }

    Dialog(onDismissRequest = onDismiss) {
        Card(
            shape = RoundedCornerShape(24.dp),
            colors = CardDefaults.cardColors(containerColor = Color(0xFF0F172A)),
            modifier = Modifier.fillMaxWidth()
        ) {
            Column(modifier = Modifier.padding(22.dp)) {
                Text(
                    text = title,
                    fontSize = 18.sp,
                    fontWeight = FontWeight.Bold,
                    color = Color.White
                )

                Spacer(modifier = Modifier.height(8.dp))

                Text(
                    text = if (isDeposit) "Saldo disponible en cuenta: L ${String.format("%,.2f", availableBalance)}"
                    else "Saldo en la bóveda: L ${String.format("%,.2f", availableBalance)}",
                    fontSize = 12.sp,
                    color = Color(0xFF94A3B8)
                )

                Spacer(modifier = Modifier.height(14.dp))

                OutlinedTextField(
                    value = amountText,
                    onValueChange = { amountText = it },
                    label = { Text("Monto a transferir") },
                    prefix = { Text("L ", fontWeight = FontWeight.Bold, color = LuminaEmerald) },
                    placeholder = { Text("0.00") },
                    keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                    modifier = Modifier.fillMaxWidth(),
                    colors = OutlinedTextFieldDefaults.colors(
                        focusedTextColor = Color.White,
                        unfocusedTextColor = Color.White
                    )
                )

                Spacer(modifier = Modifier.height(10.dp))

                // Presets rápidos
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    listOf(500.0, 1000.0, 2500.0, 5000.0).forEach { preset ->
                        Box(
                            modifier = Modifier
                                .weight(1f)
                                .clip(RoundedCornerShape(8.dp))
                                .background(Color(0xFF1E293B))
                                .clickable { amountText = preset.toString() }
                                .padding(vertical = 6.dp),
                            contentAlignment = Alignment.Center
                        ) {
                            Text("L ${preset.toInt()}", fontSize = 11.sp, color = Color.White)
                        }
                    }
                }

                Spacer(modifier = Modifier.height(20.dp))

                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(10.dp)
                ) {
                    OutlinedButton(
                        onClick = onDismiss,
                        modifier = Modifier.weight(1f)
                    ) {
                        Text("Cancelar", color = Color(0xFF94A3B8))
                    }

                    Button(
                        onClick = {
                            val amt = amountText.toDoubleOrNull()
                            if (amt != null && amt > 0.0) {
                                onConfirm(amt)
                            }
                        },
                        colors = ButtonDefaults.buttonColors(
                            containerColor = if (isDeposit) LuminaEmerald else LuminaBlue
                        ),
                        modifier = Modifier.weight(1f)
                    ) {
                        Text(actionLabel)
                    }
                }
            }
        }
    }
}
