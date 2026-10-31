package com.example.ui.screens

import android.content.ClipData
import android.content.ClipboardManager
import android.content.Context
import android.widget.Toast
import androidx.compose.animation.core.RepeatMode
import androidx.compose.animation.core.animateFloat
import androidx.compose.animation.core.infiniteRepeatable
import androidx.compose.animation.core.rememberInfiniteTransition
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
import androidx.compose.foundation.layout.offset
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material.icons.filled.ContentCopy
import androidx.compose.material.icons.filled.FlashOn
import androidx.compose.material.icons.filled.QrCode
import androidx.compose.material.icons.filled.QrCode2
import androidx.compose.material.icons.filled.QrCodeScanner
import androidx.compose.material.icons.filled.Share
import androidx.compose.material.icons.filled.Storefront
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
import androidx.compose.material3.Tab
import androidx.compose.material3.TabRow
import androidx.compose.material3.TabRowDefaults
import androidx.compose.material3.TabRowDefaults.tabIndicatorOffset
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
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
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.window.Dialog
import com.example.data.model.AccountEntity
import com.example.ui.components.LuminaTopBar
import com.example.ui.theme.LuminaBlue
import com.example.ui.theme.LuminaEmerald
import com.example.ui.theme.LuminaGold
import com.example.ui.theme.LuminaRose

@Composable
fun QrPayScreen(
    account: AccountEntity?,
    onBackClick: () -> Unit,
    onExecuteQrPayment: ((merchant: String, amount: Double, concept: String, onResult: (Boolean, String) -> Unit) -> Unit)? = null
) {
    val context = LocalContext.current
    var selectedTab by remember { mutableIntStateOf(0) } // 0: Generar QR, 1: Escanear / Pagar

    // Tab Generar Estado
    var customAmount by remember { mutableStateOf("") }

    // Tab Escanear Estado
    var isFlashOn by remember { mutableStateOf(false) }
    var scannedMerchant by remember { mutableStateOf<String?>(null) }
    var scannedAmount by remember { mutableStateOf<Double?>(null) }
    var scannedConcept by remember { mutableStateOf("") }
    var showPaymentConfirmationDialog by remember { mutableStateOf(false) }

    // Simulación de escáner en vivo con láser
    val infiniteTransition = rememberInfiniteTransition(label = "laser")
    val laserOffset by infiniteTransition.animateFloat(
        initialValue = 0f,
        targetValue = 180f,
        animationSpec = infiniteRepeatable(
            animation = tween(1400),
            repeatMode = RepeatMode.Reverse
        ),
        label = "laser_y"
    )

    LazyColumn(
        modifier = Modifier
            .fillMaxSize()
            .background(MaterialTheme.colorScheme.background)
            .testTag("qr_pay_screen"),
        contentPadding = PaddingValues(bottom = 90.dp),
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        item {
            LuminaTopBar(
                title = "Pagos con QR Nova",
                subtitle = "Cobros y Pagos Instantáneos",
                showBackButton = true,
                onBackClick = onBackClick
            )
        }

        // TABS: GENERAR COBRO / ESCANEAR Y PAGAR
        item {
            Spacer(modifier = Modifier.height(6.dp))
            TabRow(
                selectedTabIndex = selectedTab,
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 20.dp)
                    .clip(RoundedCornerShape(14.dp)),
                containerColor = MaterialTheme.colorScheme.surfaceVariant,
                indicator = { tabPositions ->
                    TabRowDefaults.SecondaryIndicator(
                        Modifier.tabIndicatorOffset(tabPositions[selectedTab]),
                        color = if (selectedTab == 0) LuminaBlue else LuminaEmerald,
                        height = 3.dp
                    )
                }
            ) {
                Tab(
                    selected = selectedTab == 0,
                    onClick = { selectedTab = 0 },
                    text = {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Icon(Icons.Default.QrCode2, contentDescription = null, modifier = Modifier.size(18.dp))
                            Spacer(modifier = Modifier.width(6.dp))
                            Text("Cobrar con QR", fontWeight = FontWeight.Bold, fontSize = 13.sp)
                        }
                    },
                    selectedContentColor = LuminaBlue,
                    unselectedContentColor = MaterialTheme.colorScheme.onSurfaceVariant
                )

                Tab(
                    selected = selectedTab == 1,
                    onClick = { selectedTab = 1 },
                    text = {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Icon(Icons.Default.QrCodeScanner, contentDescription = null, modifier = Modifier.size(18.dp))
                            Spacer(modifier = Modifier.width(6.dp))
                            Text("Escanear y Pagar", fontWeight = FontWeight.Bold, fontSize = 13.sp)
                        }
                    },
                    selectedContentColor = LuminaEmerald,
                    unselectedContentColor = MaterialTheme.colorScheme.onSurfaceVariant
                )
            }
        }

        // =========================================================================
        // PESTAÑA 0: GENERAR CÓDIGO QR PARA COBRO
        // =========================================================================
        if (selectedTab == 0) {
            item {
                Spacer(modifier = Modifier.height(14.dp))
                Card(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(horizontal = 20.dp),
                    shape = RoundedCornerShape(24.dp),
                    colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant),
                    border = CardDefaults.outlinedCardBorder().copy(
                        brush = androidx.compose.ui.graphics.SolidColor(MaterialTheme.colorScheme.outline.copy(alpha = 0.3f))
                    )
                ) {
                    Column(
                        modifier = Modifier.padding(22.dp),
                        horizontalAlignment = Alignment.CenterHorizontally
                    ) {
                        Text(
                            text = "Código de Cobro QR Personalizado",
                            fontSize = 12.sp,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )

                        Text(
                            text = account?.accountHolder ?: "Titular Registrado",
                            fontSize = 17.sp,
                            fontWeight = FontWeight.Bold,
                            color = MaterialTheme.colorScheme.onSurface
                        )

                        Spacer(modifier = Modifier.height(14.dp))

                        // QR Visual Code Box
                        Box(
                            modifier = Modifier
                                .size(210.dp)
                                .clip(RoundedCornerShape(16.dp))
                                .background(Color.White)
                                .padding(16.dp),
                            contentAlignment = Alignment.Center
                        ) {
                            Column(
                                horizontalAlignment = Alignment.CenterHorizontally,
                                verticalArrangement = Arrangement.Center
                            ) {
                                Icon(
                                    imageVector = Icons.Default.QrCode2,
                                    contentDescription = "Código QR",
                                    tint = Color(0xFF0F172A),
                                    modifier = Modifier.size(165.dp)
                                )
                            }
                        }

                        Spacer(modifier = Modifier.height(14.dp))

                        if (customAmount.isNotEmpty()) {
                            Text(
                                text = "Monto a Cobrar: L $customAmount",
                                fontSize = 16.sp,
                                fontWeight = FontWeight.ExtraBold,
                                color = LuminaEmerald
                            )
                            Spacer(modifier = Modifier.height(6.dp))
                        }

                        Text(
                            text = "Cuenta: ${account?.accountNumber ?: "01-002-849182-4"}",
                            fontSize = 12.sp,
                            fontFamily = FontFamily.Monospace,
                            color = Color(0xFFCBD5E1)
                        )

                        Text(
                            text = "IBAN: ${account?.ibanHn ?: "HN45 0001 0028 4918 2401"}",
                            fontSize = 11.sp,
                            fontFamily = FontFamily.Monospace,
                            color = Color(0xFF64748B)
                        )

                        Spacer(modifier = Modifier.height(16.dp))

                        // Presets de monto rápido
                        Text("Presets de Monto Rápido:", fontSize = 11.sp, color = Color(0xFF94A3B8))
                        Spacer(modifier = Modifier.height(6.dp))
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.spacedBy(6.dp)
                        ) {
                            listOf("100", "250", "500", "1000").forEach { preset ->
                                Box(
                                    modifier = Modifier
                                        .weight(1f)
                                        .clip(RoundedCornerShape(8.dp))
                                        .background(if (customAmount == preset) LuminaBlue else Color(0xFF1E293B))
                                        .clickable { customAmount = preset }
                                        .padding(vertical = 6.dp),
                                    contentAlignment = Alignment.Center
                                ) {
                                    Text("L $preset", fontSize = 11.sp, color = Color.White, fontWeight = FontWeight.Bold)
                                }
                            }
                        }

                        Spacer(modifier = Modifier.height(12.dp))

                        // Custom amount input
                        OutlinedTextField(
                            value = customAmount,
                            onValueChange = { customAmount = it },
                            label = { Text("Monto específico (Opcional)") },
                            placeholder = { Text("Ej. 350.00") },
                            prefix = { Text("L ", fontWeight = FontWeight.Bold, color = LuminaGold) },
                            keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                            modifier = Modifier.fillMaxWidth(),
                            colors = OutlinedTextFieldDefaults.colors(
                                focusedBorderColor = LuminaBlue,
                                unfocusedBorderColor = Color(0xFF334155),
                                focusedTextColor = Color.White,
                                unfocusedTextColor = Color.White
                            )
                        )

                        Spacer(modifier = Modifier.height(16.dp))

                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.spacedBy(10.dp)
                        ) {
                            OutlinedButton(
                                onClick = {
                                    val text = "Cobro QR Lumina Bank: ${account?.accountHolder} - Cuenta: ${account?.accountNumber}${if (customAmount.isNotEmpty()) " - Monto: L $customAmount" else ""}"
                                    val clipboard = context.getSystemService(Context.CLIPBOARD_SERVICE) as ClipboardManager
                                    clipboard.setPrimaryClip(ClipData.newPlainText("Cobro QR", text))
                                    Toast.makeText(context, "Datos de cobro QR copiados", Toast.LENGTH_SHORT).show()
                                },
                                modifier = Modifier.weight(1f)
                            ) {
                                Icon(Icons.Default.ContentCopy, contentDescription = null, modifier = Modifier.size(16.dp))
                                Spacer(modifier = Modifier.width(6.dp))
                                Text("Copiar", fontSize = 12.sp)
                            }

                            Button(
                                onClick = {
                                    Toast.makeText(context, "Código de cobro QR listo para compartir", Toast.LENGTH_SHORT).show()
                                },
                                colors = ButtonDefaults.buttonColors(containerColor = LuminaBlue),
                                modifier = Modifier.weight(1f)
                            ) {
                                Icon(Icons.Default.Share, contentDescription = null, modifier = Modifier.size(16.dp))
                                Spacer(modifier = Modifier.width(6.dp))
                                Text("Compartir", fontSize = 12.sp)
                            }
                        }
                    }
                }
            }
        }

        // =========================================================================
        // PESTAÑA 1: ESCANEAR Y PAGAR CON QR (COMERCIOS Y AMIGOS)
        // =========================================================================
        if (selectedTab == 1) {
            item {
                Spacer(modifier = Modifier.height(14.dp))

                // Visor de Cámara y Escáner Láser
                Card(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(horizontal = 20.dp),
                    shape = RoundedCornerShape(24.dp),
                    colors = CardDefaults.cardColors(containerColor = Color(0xFF0F172A))
                ) {
                    Column(
                        modifier = Modifier.padding(20.dp),
                        horizontalAlignment = Alignment.CenterHorizontally
                    ) {
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Text(
                                text = "Visor de Escaneo QR",
                                fontSize = 14.sp,
                                fontWeight = FontWeight.Bold,
                                color = Color.White
                            )

                            IconButton(
                                onClick = {
                                    isFlashOn = !isFlashOn
                                    Toast.makeText(context, if (isFlashOn) "Flash activado" else "Flash apagado", Toast.LENGTH_SHORT).show()
                                }
                            ) {
                                Icon(
                                    imageVector = Icons.Default.FlashOn,
                                    contentDescription = "Flash",
                                    tint = if (isFlashOn) LuminaGold else Color(0xFF94A3B8)
                                )
                            }
                        }

                        Spacer(modifier = Modifier.height(12.dp))

                        // Marco del visor de escáner animado
                        Box(
                            modifier = Modifier
                                .size(220.dp)
                                .clip(RoundedCornerShape(20.dp))
                                .background(Color(0xFF020617))
                                .border(2.dp, LuminaEmerald, RoundedCornerShape(20.dp)),
                            contentAlignment = Alignment.Center
                        ) {
                            Icon(
                                imageVector = Icons.Default.QrCodeScanner,
                                contentDescription = null,
                                tint = Color(0xFF1E293B),
                                modifier = Modifier.size(130.dp)
                            )

                            // Línea láser de escaneo en movimiento
                            Box(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .height(3.dp)
                                    .offset(y = (laserOffset - 90).dp)
                                    .background(LuminaEmerald)
                            )
                        }

                        Spacer(modifier = Modifier.height(16.dp))

                        Text(
                            text = "Apunta al código QR del comercio o de tu amigo para pagar al instante",
                            fontSize = 12.sp,
                            color = Color(0xFF94A3B8),
                            textAlign = androidx.compose.ui.text.style.TextAlign.Center
                        )

                        Spacer(modifier = Modifier.height(18.dp))
                        HorizontalDivider(color = Color(0xFF1E293B))
                        Spacer(modifier = Modifier.height(14.dp))

                        // Accesos directos a QR de comercios populares de Honduras
                        Text(
                            text = "Simular Escaneo Rápido de QR:",
                            fontSize = 12.sp,
                            fontWeight = FontWeight.Bold,
                            color = Color(0xFFCBD5E1),
                            modifier = Modifier.align(Alignment.Start)
                        )

                        Spacer(modifier = Modifier.height(10.dp))

                        val demoQrs = listOf(
                            Triple("Supermercados La Colonia", 485.50, "Compra en caja Express #4"),
                            Triple("Café El Barista Tegucigalpa", 135.00, "Consumo café de especialidad"),
                            Triple("Gasolinera Uno Próceres", 750.00, "Combustible Super"),
                            Triple("Farmacias del Ahorro", 260.00, "Medicamentos y cuidado personal")
                        )

                        demoQrs.forEach { (merchant, amount, concept) ->
                            Card(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .padding(vertical = 4.dp)
                                    .clickable {
                                        scannedMerchant = merchant
                                        scannedAmount = amount
                                        scannedConcept = concept
                                        showPaymentConfirmationDialog = true
                                    },
                                shape = RoundedCornerShape(12.dp),
                                colors = CardDefaults.cardColors(containerColor = Color(0xFF1E293B))
                            ) {
                                Row(
                                    modifier = Modifier
                                        .fillMaxWidth()
                                        .padding(12.dp),
                                    verticalAlignment = Alignment.CenterVertically,
                                    horizontalArrangement = Arrangement.SpaceBetween
                                ) {
                                    Row(verticalAlignment = Alignment.CenterVertically) {
                                        Box(
                                            modifier = Modifier
                                                .size(36.dp)
                                                .clip(CircleShape)
                                                .background(LuminaEmerald.copy(alpha = 0.2f)),
                                            contentAlignment = Alignment.Center
                                        ) {
                                            Icon(Icons.Default.Storefront, contentDescription = null, tint = LuminaEmerald, modifier = Modifier.size(18.dp))
                                        }
                                        Spacer(modifier = Modifier.width(10.dp))
                                        Column {
                                            Text(merchant, fontSize = 12.sp, fontWeight = FontWeight.Bold, color = Color.White)
                                            Text(concept, fontSize = 10.sp, color = Color(0xFF94A3B8))
                                        }
                                    }

                                    Text(
                                        text = "L ${String.format("%,.2f", amount)}",
                                        fontSize = 13.sp,
                                        fontWeight = FontWeight.Bold,
                                        color = LuminaEmerald
                                    )
                                }
                            }
                        }
                    }
                }
            }
        }
    }

    // DIÁLOGO DE CONFIRMACIÓN DE PAGO QR
    if (showPaymentConfirmationDialog && scannedMerchant != null && scannedAmount != null) {
        Dialog(onDismissRequest = { showPaymentConfirmationDialog = false }) {
            Card(
                shape = RoundedCornerShape(24.dp),
                colors = CardDefaults.cardColors(containerColor = Color(0xFF0F172A)),
                modifier = Modifier.fillMaxWidth()
            ) {
                Column(modifier = Modifier.padding(22.dp)) {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Box(
                            modifier = Modifier
                                .size(40.dp)
                                .clip(CircleShape)
                                .background(LuminaEmerald.copy(alpha = 0.2f)),
                            contentAlignment = Alignment.Center
                        ) {
                            Icon(Icons.Default.CheckCircle, contentDescription = null, tint = LuminaEmerald)
                        }
                        Spacer(modifier = Modifier.width(12.dp))
                        Column {
                            Text("Confirmar Pago QR", fontSize = 17.sp, fontWeight = FontWeight.Bold, color = Color.White)
                            Text("Autorización Inmediata Nova", fontSize = 11.sp, color = Color(0xFF94A3B8))
                        }
                    }

                    Spacer(modifier = Modifier.height(18.dp))

                    Text("Comercio / Destino:", fontSize = 11.sp, color = Color(0xFF94A3B8))
                    Text(scannedMerchant!!, fontSize = 15.sp, fontWeight = FontWeight.Bold, color = Color.White)

                    Spacer(modifier = Modifier.height(10.dp))

                    Text("Concepto:", fontSize = 11.sp, color = Color(0xFF94A3B8))
                    Text(scannedConcept, fontSize = 12.sp, color = Color(0xFFCBD5E1))

                    Spacer(modifier = Modifier.height(14.dp))

                    Text("Total a Pagar:", fontSize = 11.sp, color = Color(0xFF94A3B8))
                    Text(
                        text = "L ${String.format("%,.2f", scannedAmount!!)}",
                        fontSize = 26.sp,
                        fontWeight = FontWeight.ExtraBold,
                        color = LuminaEmerald
                    )

                    Spacer(modifier = Modifier.height(8.dp))

                    Text(
                        text = "Saldo disponible: L ${String.format("%,.2f", account?.balanceHnl ?: 0.0)}",
                        fontSize = 11.sp,
                        color = Color(0xFF94A3B8)
                    )

                    Spacer(modifier = Modifier.height(20.dp))

                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(10.dp)
                    ) {
                        OutlinedButton(
                            onClick = { showPaymentConfirmationDialog = false },
                            modifier = Modifier.weight(1f)
                        ) {
                            Text("Cancelar", color = Color(0xFF94A3B8))
                        }

                        Button(
                            onClick = {
                                showPaymentConfirmationDialog = false
                                if (onExecuteQrPayment != null) {
                                    onExecuteQrPayment(scannedMerchant!!, scannedAmount!!, scannedConcept) { success, msg ->
                                        Toast.makeText(context, msg, Toast.LENGTH_LONG).show()
                                    }
                                } else {
                                    Toast.makeText(context, "Pago de L ${scannedAmount} procesado con éxito", Toast.LENGTH_SHORT).show()
                                }
                            },
                            colors = ButtonDefaults.buttonColors(containerColor = LuminaEmerald),
                            modifier = Modifier.weight(1f)
                        ) {
                            Text("Pagar Ahora")
                        }
                    }
                }
            }
        }
    }
}
