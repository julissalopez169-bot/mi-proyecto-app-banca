package com.example.ui.screens

import android.widget.Toast
import androidx.compose.animation.core.animateFloatAsState
import androidx.compose.animation.core.tween
import androidx.compose.foundation.Canvas
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
import androidx.compose.material.icons.automirrored.filled.ReceiptLong
import androidx.compose.material.icons.automirrored.filled.Send
import androidx.compose.material.icons.filled.DirectionsCar
import androidx.compose.material.icons.filled.Edit
import androidx.compose.material.icons.filled.Restaurant
import androidx.compose.material.icons.filled.ShoppingBag
import androidx.compose.material.icons.filled.ShoppingCart
import androidx.compose.material.icons.filled.Warning
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.Icon
import androidx.compose.material3.LinearProgressIndicator
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.OutlinedTextFieldDefaults
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.StrokeCap
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.window.Dialog
import com.example.data.model.BudgetLimitEntity
import com.example.data.model.TransactionEntity
import com.example.ui.components.LuminaTopBar
import com.example.ui.theme.LuminaBlue
import com.example.ui.theme.LuminaCardDark
import com.example.ui.theme.LuminaEmerald
import com.example.ui.theme.LuminaGold
import com.example.ui.theme.LuminaRose

@Composable
fun BudgetScreen(
    transactions: List<TransactionEntity>,
    budgetLimits: List<BudgetLimitEntity>,
    onBackClick: () -> Unit,
    onUpdateLimit: (category: String, limit: Double) -> Unit
) {
    val context = LocalContext.current
    var editingCategory by remember { mutableStateOf<BudgetLimitEntity?>(null) }

    // Calcular gastos reales por categoría (únicamente débitos/gastos)
    val expenseTransactions = transactions.filter { !it.isIncome }
    val totalSpent = expenseTransactions.sumOf { it.amount }

    // Mapear gastos por categoría
    val spentByCategory = mutableMapOf<String, Double>()
    for (tx in expenseTransactions) {
        val cat = when {
            tx.category.contains("Restaurante", ignoreCase = true) || tx.title.contains("Café", ignoreCase = true) || tx.subtitle.contains("Restaurante", ignoreCase = true) -> "Restaurantes"
            tx.category.contains("Supermercado", ignoreCase = true) || tx.subtitle.contains("Supermercado", ignoreCase = true) || tx.title.contains("Colonia", ignoreCase = true) -> "Supermercado"
            tx.category.contains("Servicios", ignoreCase = true) || tx.title.contains("ENEE", ignoreCase = true) || tx.title.contains("SANAA", ignoreCase = true) || tx.title.contains("Claro", ignoreCase = true) -> "Servicios"
            tx.category.contains("Compras", ignoreCase = true) || tx.title.contains("Tienda", ignoreCase = true) || tx.title.contains("Amazon", ignoreCase = true) || tx.title.contains("QR", ignoreCase = true) -> "Compras"
            tx.category.contains("Transporte", ignoreCase = true) || tx.title.contains("Gasolinera", ignoreCase = true) || tx.title.contains("Uber", ignoreCase = true) -> "Transporte"
            else -> "Transferencia"
        }
        spentByCategory[cat] = (spentByCategory[cat] ?: 0.0) + tx.amount
    }

    val totalBudget = budgetLimits.sumOf { it.monthlyLimit }
    val globalProgress = if (totalBudget > 0) (totalSpent / totalBudget).toFloat().coerceIn(0f, 1f) else 0f
    val globalPercentage = (globalProgress * 100).toInt()

    LazyColumn(
        modifier = Modifier
            .fillMaxSize()
            .background(MaterialTheme.colorScheme.background)
            .testTag("budget_screen"),
        contentPadding = PaddingValues(bottom = 90.dp)
    ) {
        item {
            LuminaTopBar(
                title = "Presupuestos y Gastos",
                subtitle = "Control Financiero y Límites Mensuales",
                showBackButton = true,
                onBackClick = onBackClick
            )
        }

        // 1. Resumen Consolidado del Mes
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
                            text = "GASTO TOTAL DEL MES",
                            fontSize = 11.sp,
                            fontWeight = FontWeight.Bold,
                            color = Color(0xFF94A3B8)
                        )
                        Box(
                            modifier = Modifier
                                .clip(RoundedCornerShape(8.dp))
                                .background(
                                    if (globalPercentage > 90) LuminaRose.copy(alpha = 0.2f)
                                    else if (globalPercentage > 75) LuminaGold.copy(alpha = 0.2f)
                                    else LuminaEmerald.copy(alpha = 0.2f)
                                )
                                .padding(horizontal = 8.dp, vertical = 4.dp)
                        ) {
                            Text(
                                text = "$globalPercentage% Consumido",
                                fontSize = 11.sp,
                                fontWeight = FontWeight.Bold,
                                color = if (globalPercentage > 90) LuminaRose else if (globalPercentage > 75) LuminaGold else LuminaEmerald
                            )
                        }
                    }

                    Spacer(modifier = Modifier.height(6.dp))

                    Text(
                        text = "L ${String.format("%,.2f", totalSpent)}",
                        fontSize = 32.sp,
                        fontWeight = FontWeight.ExtraBold,
                        color = Color.White
                    )

                    Spacer(modifier = Modifier.height(6.dp))

                    Text(
                        text = "Presupuesto Mensual Global: L ${String.format("%,.2f", totalBudget)}",
                        fontSize = 12.sp,
                        color = Color(0xFFCBD5E1)
                    )

                    Spacer(modifier = Modifier.height(14.dp))

                    LinearProgressIndicator(
                        progress = { globalProgress },
                        modifier = Modifier
                            .fillMaxWidth()
                            .height(10.dp)
                            .clip(RoundedCornerShape(5.dp)),
                        color = if (globalPercentage > 90) LuminaRose else if (globalPercentage > 75) LuminaGold else LuminaEmerald,
                        trackColor = Color(0xFF1E293B)
                    )
                }
            }
        }

        // 2. Gráfico Interactivo de Distribución Donut por Categorías
        item {
            Spacer(modifier = Modifier.height(18.dp))
            Card(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 20.dp),
                shape = RoundedCornerShape(24.dp),
                colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant)
            ) {
                Column(
                    modifier = Modifier.padding(20.dp),
                    horizontalAlignment = Alignment.CenterHorizontally
                ) {
                    Text(
                        text = "Distribución de Gastos por Categoría",
                        fontSize = 15.sp,
                        fontWeight = FontWeight.Bold,
                        color = MaterialTheme.colorScheme.onSurface,
                        modifier = Modifier.align(Alignment.Start)
                    )

                    Spacer(modifier = Modifier.height(20.dp))

                    // Custom Canvas Donut Chart
                    Box(
                        modifier = Modifier.size(190.dp),
                        contentAlignment = Alignment.Center
                    ) {
                        DonutExpenseChart(
                            budgetLimits = budgetLimits,
                            spentByCategory = spentByCategory,
                            totalSpent = totalSpent
                        )

                        Column(horizontalAlignment = Alignment.CenterHorizontally) {
                            Text("Total", fontSize = 11.sp, color = Color(0xFF94A3B8))
                            Text(
                                text = "L ${String.format("%,.0f", totalSpent)}",
                                fontSize = 16.sp,
                                fontWeight = FontWeight.Bold,
                                color = Color.White
                            )
                        }
                    }

                    Spacer(modifier = Modifier.height(20.dp))

                    // Leyenda de categorías
                    Column(
                        modifier = Modifier.fillMaxWidth(),
                        verticalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        budgetLimits.chunked(2).forEach { rowLimits ->
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.SpaceBetween
                            ) {
                                rowLimits.forEach { limit ->
                                    val catColor = try {
                                        Color(android.graphics.Color.parseColor(limit.colorHex))
                                    } catch (e: Exception) {
                                        LuminaBlue
                                    }
                                    val catSpent = spentByCategory[limit.category] ?: 0.0
                                    val pct = if (totalSpent > 0) ((catSpent / totalSpent) * 100).toInt() else 0

                                    Row(
                                        verticalAlignment = Alignment.CenterVertically,
                                        modifier = Modifier.weight(1f)
                                    ) {
                                        Box(
                                            modifier = Modifier
                                                .size(10.dp)
                                                .clip(CircleShape)
                                                .background(catColor)
                                        )
                                        Spacer(modifier = Modifier.width(6.dp))
                                        Text(
                                            text = "${limit.category} ($pct%)",
                                            fontSize = 11.sp,
                                            color = MaterialTheme.colorScheme.onSurfaceVariant
                                        )
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }

        // 3. Título de Categorías y Límites
        item {
            Spacer(modifier = Modifier.height(22.dp))
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 20.dp),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = "Límites por Categoría",
                    fontSize = 16.sp,
                    fontWeight = FontWeight.Bold,
                    color = MaterialTheme.colorScheme.onBackground
                )

                Text(
                    text = "Toca para ajustar",
                    fontSize = 11.sp,
                    color = LuminaBlue
                )
            }
        }

        // 4. Lista de Categorías con Barras de Progreso Individuales
        items(budgetLimits) { limit ->
            Spacer(modifier = Modifier.height(12.dp))
            val catSpent = spentByCategory[limit.category] ?: 0.0
            CategoryBudgetItem(
                limit = limit,
                spent = catSpent,
                onEditClick = { editingCategory = limit }
            )
        }
    }

    // DIALOG: EDITAR LÍMITE DE PRESUPUESTO
    editingCategory?.let { limit ->
        EditBudgetLimitDialog(
            category = limit.category,
            currentLimit = limit.monthlyLimit,
            onDismiss = { editingCategory = null },
            onConfirm = { newLimit ->
                onUpdateLimit(limit.category, newLimit)
                editingCategory = null
                Toast.makeText(context, "Límite de '${limit.category}' actualizado a L ${String.format("%,.2f", newLimit)}", Toast.LENGTH_SHORT).show()
            }
        )
    }
}

@Composable
fun DonutExpenseChart(
    budgetLimits: List<BudgetLimitEntity>,
    spentByCategory: Map<String, Double>,
    totalSpent: Double
) {
    Canvas(modifier = Modifier.fillMaxSize()) {
        val strokeWidth = 26f
        val radius = (size.minDimension - strokeWidth) / 2
        val center = Offset(size.width / 2, size.height / 2)

        if (totalSpent <= 0.0) {
            drawCircle(
                color = Color(0xFF1E293B),
                radius = radius,
                center = center,
                style = Stroke(width = strokeWidth)
            )
            return@Canvas
        }

        var startAngle = -90f
        budgetLimits.forEach { limit ->
            val spent = spentByCategory[limit.category] ?: 0.0
            val sweepAngle = ((spent / totalSpent) * 360f).toFloat()

            if (sweepAngle > 0.5f) {
                val color = try {
                    Color(android.graphics.Color.parseColor(limit.colorHex))
                } catch (e: Exception) {
                    LuminaBlue
                }

                drawArc(
                    color = color,
                    startAngle = startAngle,
                    sweepAngle = sweepAngle - 2f, // Pequeño espacio entre arcos
                    useCenter = false,
                    topLeft = Offset(center.x - radius, center.y - radius),
                    size = Size(radius * 2, radius * 2),
                    style = Stroke(width = strokeWidth, cap = StrokeCap.Round)
                )
                startAngle += sweepAngle
            }
        }
    }
}

@Composable
fun CategoryBudgetItem(
    limit: BudgetLimitEntity,
    spent: Double,
    onEditClick: () -> Unit
) {
    val progress = (spent / limit.monthlyLimit).toFloat().coerceIn(0f, 1f)
    val percentage = ((spent / limit.monthlyLimit) * 100).toInt()
    val isOverBudget = spent > limit.monthlyLimit

    val catColor = try {
        Color(android.graphics.Color.parseColor(limit.colorHex))
    } catch (e: Exception) {
        LuminaBlue
    }

    val iconVector = when (limit.category.lowercase()) {
        "restaurantes" -> Icons.Default.Restaurant
        "supermercado" -> Icons.Default.ShoppingCart
        "servicios" -> Icons.AutoMirrored.Filled.ReceiptLong
        "compras" -> Icons.Default.ShoppingBag
        "transporte" -> Icons.Default.DirectionsCar
        else -> Icons.AutoMirrored.Filled.Send
    }

    Card(
        modifier = Modifier
            .fillMaxWidth()
            .padding(horizontal = 20.dp)
            .clickable(onClick = onEditClick),
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
                            .size(42.dp)
                            .clip(CircleShape)
                            .background(catColor.copy(alpha = 0.2f)),
                        contentAlignment = Alignment.Center
                    ) {
                        Icon(iconVector, contentDescription = null, tint = catColor, modifier = Modifier.size(20.dp))
                    }
                    Spacer(modifier = Modifier.width(12.dp))
                    Column {
                        Text(
                            text = limit.category,
                            fontWeight = FontWeight.Bold,
                            fontSize = 15.sp,
                            color = MaterialTheme.colorScheme.onSurface
                        )
                        Text(
                            text = if (isOverBudget) "¡Presupuesto superado!" else "Límite: L ${String.format("%,.2f", limit.monthlyLimit)}",
                            fontSize = 11.sp,
                            color = if (isOverBudget) LuminaRose else MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    }
                }

                Row(verticalAlignment = Alignment.CenterVertically) {
                    Text(
                        text = "$percentage%",
                        fontWeight = FontWeight.ExtraBold,
                        fontSize = 14.sp,
                        color = if (isOverBudget) LuminaRose else if (percentage > 75) LuminaGold else LuminaEmerald
                    )
                    Spacer(modifier = Modifier.width(8.dp))
                    Icon(Icons.Default.Edit, contentDescription = "Editar", tint = Color(0xFF94A3B8), modifier = Modifier.size(16.dp))
                }
            }

            Spacer(modifier = Modifier.height(14.dp))

            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                Text(
                    text = "Gastado: L ${String.format("%,.2f", spent)}",
                    fontSize = 12.sp,
                    fontWeight = FontWeight.SemiBold,
                    color = Color.White
                )

                val remaining = (limit.monthlyLimit - spent).coerceAtLeast(0.0)
                Text(
                    text = "Disponible: L ${String.format("%,.2f", remaining)}",
                    fontSize = 11.sp,
                    color = Color(0xFFCBD5E1)
                )
            }

            Spacer(modifier = Modifier.height(8.dp))

            LinearProgressIndicator(
                progress = { progress },
                modifier = Modifier
                    .fillMaxWidth()
                    .height(8.dp)
                    .clip(RoundedCornerShape(4.dp)),
                color = if (isOverBudget) LuminaRose else if (percentage > 75) LuminaGold else catColor,
                trackColor = Color(0xFF1E293B)
            )
        }
    }
}

@Composable
fun EditBudgetLimitDialog(
    category: String,
    currentLimit: Double,
    onDismiss: () -> Unit,
    onConfirm: (newLimit: Double) -> Unit
) {
    var limitText by remember { mutableStateOf(currentLimit.toInt().toString()) }

    Dialog(onDismissRequest = onDismiss) {
        Card(
            shape = RoundedCornerShape(24.dp),
            colors = CardDefaults.cardColors(containerColor = Color(0xFF0F172A)),
            modifier = Modifier.fillMaxWidth()
        ) {
            Column(modifier = Modifier.padding(22.dp)) {
                Text(
                    text = "Límite para $category",
                    fontSize = 18.sp,
                    fontWeight = FontWeight.Bold,
                    color = Color.White
                )

                Spacer(modifier = Modifier.height(8.dp))

                Text(
                    text = "Define cuánto deseas gastar como máximo por mes en esta categoría:",
                    fontSize = 12.sp,
                    color = Color(0xFF94A3B8)
                )

                Spacer(modifier = Modifier.height(14.dp))

                OutlinedTextField(
                    value = limitText,
                    onValueChange = { limitText = it },
                    label = { Text("Límite Mensual") },
                    prefix = { Text("L ", fontWeight = FontWeight.Bold, color = LuminaBlue) },
                    keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                    modifier = Modifier.fillMaxWidth(),
                    colors = OutlinedTextFieldDefaults.colors(
                        focusedTextColor = Color.White,
                        unfocusedTextColor = Color.White
                    )
                )

                Spacer(modifier = Modifier.height(12.dp))

                // Presets rápidos
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    listOf(3000.0, 6000.0, 10000.0, 15000.0).forEach { preset ->
                        Box(
                            modifier = Modifier
                                .weight(1f)
                                .clip(RoundedCornerShape(8.dp))
                                .background(Color(0xFF1E293B))
                                .clickable { limitText = preset.toInt().toString() }
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
                            val newLim = limitText.toDoubleOrNull()
                            if (newLim != null && newLim > 0.0) {
                                onConfirm(newLim)
                            }
                        },
                        colors = ButtonDefaults.buttonColors(containerColor = LuminaBlue),
                        modifier = Modifier.weight(1f)
                    ) {
                        Text("Guardar Límite")
                    }
                }
            }
        }
    }
}
