package com.example.ui.screens

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
import androidx.compose.foundation.shape.RoundedCornerShape
import android.widget.Toast
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Close
import androidx.compose.material.icons.filled.Download
import androidx.compose.material.icons.filled.Lock
import androidx.compose.material.icons.filled.PictureAsPdf
import androidx.compose.material.icons.filled.Search
import androidx.compose.material.icons.filled.Share
import androidx.compose.material.icons.filled.Shield
import androidx.compose.material.icons.filled.VerifiedUser
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
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
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.window.Dialog
import com.example.data.model.AccountEntity
import com.example.util.SarStatementGenerator
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.data.model.TransactionEntity
import com.example.ui.components.LuminaTopBar
import com.example.ui.components.SarReceiptDialog
import com.example.ui.components.TransactionListItem
import com.example.ui.theme.LuminaBlue
import com.example.ui.theme.LuminaCardDark
import com.example.ui.theme.LuminaEmerald
import com.example.ui.theme.LuminaGold
import com.example.ui.theme.LuminaNavyDark
import com.example.ui.theme.LuminaRose

@Composable
fun TransactionsScreen(
    transactions: List<TransactionEntity>,
    onBackClick: () -> Unit,
    onSelectTransaction: (TransactionEntity) -> Unit,
    selectedTransaction: TransactionEntity?,
    onDismissReceipt: () -> Unit,
    account: AccountEntity? = null
) {
    val context = LocalContext.current
    var searchQuery by remember { mutableStateOf("") }
    var selectedCategory by remember { mutableStateOf("Todos") }
    var showMonthlyStatementDialog by remember { mutableStateOf(false) }

    val categories = listOf("Todos", "Transferencia", "Depósito", "Compras", "Servicios")

    val filteredTransactions = transactions.filter { tx ->
        val matchesCategory = if (selectedCategory == "Todos") true else tx.category.equals(selectedCategory, ignoreCase = true)
        val matchesQuery = searchQuery.isBlank() ||
                tx.title.contains(searchQuery, ignoreCase = true) ||
                tx.subtitle.contains(searchQuery, ignoreCase = true) ||
                tx.recipientOrSender.contains(searchQuery, ignoreCase = true) ||
                tx.referenceNumber.contains(searchQuery, ignoreCase = true)
        matchesCategory && matchesQuery
    }

    val totalIncome = transactions.filter { it.isIncome }.sumOf { it.amount }
    val totalExpense = transactions.filter { !it.isIncome }.sumOf { it.amount }

    LazyColumn(
        modifier = Modifier
            .fillMaxSize()
            .background(MaterialTheme.colorScheme.background)
            .testTag("transactions_screen"),
        contentPadding = PaddingValues(bottom = 90.dp)
    ) {
        item {
            LuminaTopBar(
                title = "Historial Inmutable",
                subtitle = "Libro Mayor Contable y SAR (No modificable)",
                showBackButton = true,
                onBackClick = onBackClick
            )
        }

        // Immutable Ledger Security Notice
        item {
            Card(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 20.dp, vertical = 6.dp),
                shape = RoundedCornerShape(16.dp),
                colors = CardDefaults.cardColors(
                    containerColor = Color(0xFF0F1E36)
                ),
                border = CardDefaults.outlinedCardBorder().copy(
                    brush = androidx.compose.ui.graphics.SolidColor(LuminaBlue.copy(alpha = 0.5f))
                )
            ) {
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(14.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Box(
                        modifier = Modifier
                            .size(38.dp)
                            .clip(RoundedCornerShape(10.dp))
                            .background(LuminaBlue.copy(alpha = 0.2f)),
                        contentAlignment = Alignment.Center
                    ) {
                        Icon(
                            imageVector = Icons.Default.Lock,
                            contentDescription = "Registro Inmutable",
                            tint = LuminaBlue,
                            modifier = Modifier.size(20.dp)
                        )
                    }

                    Spacer(modifier = Modifier.width(12.dp))

                    Column(modifier = Modifier.weight(1f)) {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Text(
                                text = "Registro Permanente e Inalterable",
                                fontSize = 13.sp,
                                fontWeight = FontWeight.Bold,
                                color = Color.White
                            )
                            Spacer(modifier = Modifier.width(6.dp))
                            Icon(
                                imageVector = Icons.Default.VerifiedUser,
                                contentDescription = "Verificado",
                                tint = LuminaEmerald,
                                modifier = Modifier.size(14.dp)
                            )
                        }
                        Spacer(modifier = Modifier.height(2.dp))
                        Text(
                            text = "Por normativa bancaria y fiscal SAR, ninguna transacción puede ser eliminada, revertida arbitrariamente o editada de este historial.",
                            fontSize = 11.sp,
                            color = Color(0xFF94A3B8),
                            lineHeight = 15.sp
                        )
                    }
                }
            }
        }

        // Summary Metric Cards
        item {
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 20.dp, vertical = 6.dp),
                horizontalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                Card(
                    modifier = Modifier.weight(1f),
                    shape = RoundedCornerShape(16.dp),
                    colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant),
                    border = CardDefaults.outlinedCardBorder().copy(
                        brush = androidx.compose.ui.graphics.SolidColor(MaterialTheme.colorScheme.outline.copy(alpha = 0.3f))
                    )
                ) {
                    Column(modifier = Modifier.padding(14.dp)) {
                        Text(text = "Ingresos del Mes", fontSize = 11.sp, color = MaterialTheme.colorScheme.onSurfaceVariant)
                        Spacer(modifier = Modifier.height(4.dp))
                        Text(
                            text = String.format("L %,.2f", totalIncome),
                            fontSize = 15.sp,
                            fontWeight = FontWeight.Bold,
                            color = LuminaEmerald
                        )
                    }
                }

                Card(
                    modifier = Modifier.weight(1f),
                    shape = RoundedCornerShape(16.dp),
                    colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant),
                    border = CardDefaults.outlinedCardBorder().copy(
                        brush = androidx.compose.ui.graphics.SolidColor(MaterialTheme.colorScheme.outline.copy(alpha = 0.3f))
                    )
                ) {
                    Column(modifier = Modifier.padding(14.dp)) {
                        Text(text = "Egresos y Pagos", fontSize = 11.sp, color = MaterialTheme.colorScheme.onSurfaceVariant)
                        Spacer(modifier = Modifier.height(4.dp))
                        Text(
                            text = String.format("L %,.2f", totalExpense),
                            fontSize = 15.sp,
                            fontWeight = FontWeight.Bold,
                            color = MaterialTheme.colorScheme.onSurface
                        )
                    }
                }
            }
        }

        // Exportación de Estado de Cuenta Oficial SAR en PDF
        item {
            Card(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 20.dp, vertical = 6.dp),
                shape = RoundedCornerShape(16.dp),
                colors = CardDefaults.cardColors(containerColor = Color(0xFF131D33)),
                border = CardDefaults.outlinedCardBorder().copy(
                    brush = androidx.compose.ui.graphics.SolidColor(LuminaGold.copy(alpha = 0.4f))
                )
            ) {
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(14.dp),
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.SpaceBetween
                ) {
                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        modifier = Modifier.weight(1f)
                    ) {
                        Box(
                            modifier = Modifier
                                .size(40.dp)
                                .clip(RoundedCornerShape(10.dp))
                                .background(LuminaGold.copy(alpha = 0.2f)),
                            contentAlignment = Alignment.Center
                        ) {
                            Icon(
                                imageVector = Icons.Default.PictureAsPdf,
                                contentDescription = null,
                                tint = LuminaGold,
                                modifier = Modifier.size(22.dp)
                            )
                        }
                        Spacer(modifier = Modifier.width(12.dp))
                        Column {
                            Text(
                                text = "Estado de Cuenta SAR (PDF)",
                                fontSize = 13.sp,
                                fontWeight = FontWeight.Bold,
                                color = Color.White
                            )
                            Text(
                                text = "Comprobante fiscal con CAI y firma digital",
                                fontSize = 11.sp,
                                color = Color(0xFF94A3B8)
                            )
                        }
                    }

                    Button(
                        onClick = { showMonthlyStatementDialog = true },
                        colors = ButtonDefaults.buttonColors(containerColor = LuminaBlue),
                        shape = RoundedCornerShape(10.dp),
                        contentPadding = PaddingValues(horizontal = 12.dp, vertical = 6.dp)
                    ) {
                        Icon(Icons.Default.Download, contentDescription = null, modifier = Modifier.size(16.dp))
                        Spacer(modifier = Modifier.width(4.dp))
                        Text("Exportar", fontSize = 12.sp, fontWeight = FontWeight.Bold)
                    }
                }
            }
        }

        // Search Bar
        item {
            OutlinedTextField(
                value = searchQuery,
                onValueChange = { searchQuery = it },
                placeholder = { Text("Buscar por nombre, banco o referencia...") },
                leadingIcon = {
                    Icon(Icons.Default.Search, contentDescription = "Buscar", tint = LuminaBlue)
                },
                trailingIcon = {
                    if (searchQuery.isNotEmpty()) {
                        IconButton(onClick = { searchQuery = "" }) {
                            Icon(Icons.Default.Close, contentDescription = "Limpiar", tint = Color(0xFF94A3B8))
                        }
                    }
                },
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 20.dp, vertical = 8.dp)
                    .testTag("transactions_search_input"),
                shape = RoundedCornerShape(14.dp),
                colors = OutlinedTextFieldDefaults.colors(
                    focusedBorderColor = LuminaBlue,
                    unfocusedBorderColor = Color(0xFF334155),
                    focusedTextColor = Color.White,
                    unfocusedTextColor = Color.White
                )
            )
        }

        // Category Filter Chips
        item {
            LazyRow(
                contentPadding = PaddingValues(horizontal = 20.dp, vertical = 6.dp),
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                items(categories) { cat ->
                    val isSelected = selectedCategory == cat
                    Box(
                        modifier = Modifier
                            .clip(RoundedCornerShape(10.dp))
                            .background(
                                if (isSelected) LuminaBlue else Color(0xFF1E293B)
                            )
                            .clickable { selectedCategory = cat }
                            .padding(horizontal = 14.dp, vertical = 8.dp)
                    ) {
                        Text(
                            text = cat,
                            fontSize = 12.sp,
                            fontWeight = if (isSelected) FontWeight.Bold else FontWeight.Normal,
                            color = if (isSelected) Color.White else Color(0xFFCBD5E1)
                        )
                    }
                }
            }
        }

        // Transactions Count
        item {
            Spacer(modifier = Modifier.height(8.dp))
            Text(
                text = "${filteredTransactions.size} movimientos encontrados",
                fontSize = 11.sp,
                color = Color(0xFF94A3B8),
                modifier = Modifier.padding(horizontal = 20.dp, vertical = 4.dp)
            )
        }

        // List of transactions
        if (filteredTransactions.isEmpty()) {
            item {
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(40.dp),
                    contentAlignment = Alignment.Center
                ) {
                    Text(
                        text = "No se encontraron movimientos con los filtros aplicados.",
                        color = Color(0xFF64748B),
                        fontSize = 13.sp
                    )
                }
            }
        } else {
            items(filteredTransactions) { tx ->
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

    // Modal if selected
    selectedTransaction?.let { tx ->
        SarReceiptDialog(
            transaction = tx,
            onDismiss = onDismissReceipt
        )
    }

    // Modal Estado de Cuenta SAR
    if (showMonthlyStatementDialog) {
        SarMonthlyStatementDialog(
            account = account,
            transactions = transactions,
            onDismiss = { showMonthlyStatementDialog = false },
            onExportPdf = {
                val pdfFile = SarStatementGenerator.generatePdfStatement(context, account, transactions)
                if (pdfFile != null) {
                    Toast.makeText(context, "Estado de cuenta PDF generado con éxito", Toast.LENGTH_SHORT).show()
                    SarStatementGenerator.sharePdfStatement(context, pdfFile)
                } else {
                    Toast.makeText(context, "Error al generar archivo PDF", Toast.LENGTH_SHORT).show()
                }
            }
        )
    }
}

@Composable
fun SarMonthlyStatementDialog(
    account: AccountEntity?,
    transactions: List<TransactionEntity>,
    onDismiss: () -> Unit,
    onExportPdf: () -> Unit
) {
    val totalCreditos = transactions.filter { it.isIncome }.sumOf { it.amount }
    val totalDebitos = transactions.filter { !it.isIncome }.sumOf { it.amount }
    val saldoActual = account?.balanceHnl ?: 0.0

    Dialog(onDismissRequest = onDismiss) {
        Card(
            shape = RoundedCornerShape(24.dp),
            colors = CardDefaults.cardColors(containerColor = Color(0xFF0F172A)),
            modifier = Modifier.fillMaxWidth()
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
                                .size(40.dp)
                                .clip(RoundedCornerShape(10.dp))
                                .background(LuminaGold.copy(alpha = 0.2f)),
                            contentAlignment = Alignment.Center
                        ) {
                            Icon(Icons.Default.PictureAsPdf, contentDescription = null, tint = LuminaGold)
                        }
                        Spacer(modifier = Modifier.width(12.dp))
                        Column {
                            Text("Estado de Cuenta SAR", fontSize = 16.sp, fontWeight = FontWeight.Bold, color = Color.White)
                            Text("Período Mensual Oficial", fontSize = 11.sp, color = Color(0xFF94A3B8))
                        }
                    }

                    IconButton(onClick = onDismiss, modifier = Modifier.size(28.dp)) {
                        Icon(Icons.Default.Close, contentDescription = "Cerrar", tint = Color(0xFF94A3B8))
                    }
                }

                Spacer(modifier = Modifier.height(16.dp))

                // Certificación SAR Box
                Card(
                    shape = RoundedCornerShape(12.dp),
                    colors = CardDefaults.cardColors(containerColor = Color(0xFF1E293B))
                ) {
                    Column(modifier = Modifier.padding(14.dp)) {
                        Text("DATOS FISCALES DEL SAR", fontSize = 10.sp, fontWeight = FontWeight.Bold, color = LuminaGold)
                        Spacer(modifier = Modifier.height(4.dp))
                        Text("CAI: ${SarStatementGenerator.SAR_CAI}", fontSize = 10.sp, color = Color(0xFFCBD5E1), fontFamily = androidx.compose.ui.text.font.FontFamily.Monospace)
                        Text("Rango: ${SarStatementGenerator.SAR_RANGO}", fontSize = 9.sp, color = Color(0xFF94A3B8))
                        Text("RTN Emisor: ${SarStatementGenerator.SAR_RTN_BANCO}", fontSize = 9.sp, color = Color(0xFF94A3B8))
                    }
                }

                Spacer(modifier = Modifier.height(14.dp))

                // Resumen de montos
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween
                ) {
                    Column {
                        Text("Créditos del Mes", fontSize = 11.sp, color = Color(0xFF94A3B8))
                        Text("+L ${String.format("%,.2f", totalCreditos)}", fontSize = 14.sp, fontWeight = FontWeight.Bold, color = LuminaEmerald)
                    }
                    Column(horizontalAlignment = Alignment.End) {
                        Text("Débitos del Mes", fontSize = 11.sp, color = Color(0xFF94A3B8))
                        Text("-L ${String.format("%,.2f", totalDebitos)}", fontSize = 14.sp, fontWeight = FontWeight.Bold, color = LuminaRose)
                    }
                }

                Spacer(modifier = Modifier.height(10.dp))
                HorizontalDivider(color = Color(0xFF334155))
                Spacer(modifier = Modifier.height(10.dp))

                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween
                ) {
                    Text("Saldo al Corte:", fontSize = 12.sp, color = Color.White)
                    Text("L ${String.format("%,.2f", saldoActual)}", fontSize = 15.sp, fontWeight = FontWeight.ExtraBold, color = LuminaBlue)
                }

                Spacer(modifier = Modifier.height(8.dp))
                Text("Total Transacciones: ${transactions.size} movimientos auditados", fontSize = 11.sp, color = Color(0xFF94A3B8))

                Spacer(modifier = Modifier.height(20.dp))

                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(10.dp)
                ) {
                    OutlinedButton(
                        onClick = onDismiss,
                        modifier = Modifier.weight(1f)
                    ) {
                        Text("Cerrar", color = Color(0xFF94A3B8))
                    }

                    Button(
                        onClick = onExportPdf,
                        colors = ButtonDefaults.buttonColors(containerColor = LuminaBlue),
                        modifier = Modifier.weight(1.3f)
                    ) {
                        Icon(Icons.Default.Download, contentDescription = null, modifier = Modifier.size(16.dp))
                        Spacer(modifier = Modifier.width(6.dp))
                        Text("Descargar PDF", fontWeight = FontWeight.Bold)
                    }
                }
            }
        }
    }
}
