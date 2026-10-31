package com.example.ui.screens

import androidx.compose.animation.AnimatedVisibility
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
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.Send
import androidx.compose.material.icons.filled.AccountBalance
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material.icons.filled.Fingerprint
import androidx.compose.material.icons.filled.Person
import androidx.compose.material.icons.filled.Shield
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.DropdownMenuItem
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.ExposedDropdownMenuBox
import androidx.compose.material3.ExposedDropdownMenuDefaults
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.MenuAnchorType
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
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.data.model.AccountEntity
import com.example.data.model.BeneficiaryEntity
import com.example.data.model.TransactionEntity
import com.example.ui.TransferState
import com.example.ui.components.LuminaTopBar
import com.example.ui.components.SarReceiptDialog
import com.example.ui.theme.LuminaBlue
import com.example.ui.theme.LuminaCardDark
import com.example.ui.theme.LuminaEmerald
import com.example.ui.theme.LuminaGold
import com.example.ui.theme.LuminaNavyDark
import com.example.ui.theme.LuminaRose

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun TransfersScreen(
    account: AccountEntity?,
    beneficiaries: List<BeneficiaryEntity>,
    transferState: TransferState,
    onBackClick: () -> Unit,
    onUpdateRecipient: (String) -> Unit,
    onUpdateAccount: (String) -> Unit,
    onUpdateBank: (String) -> Unit,
    onUpdateAmount: (String) -> Unit,
    onUpdateConcept: (String) -> Unit,
    onSelectBeneficiary: (BeneficiaryEntity) -> Unit,
    onExecuteTransferWithBiometric: () -> Unit,
    onDismissReceipt: () -> Unit
) {
    var selectedTab by remember { mutableIntStateOf(0) }
    val banks = listOf(
        "Lumina Bank",
        "BAC Credomatic Honduras",
        "Banco Ficohsa",
        "Banco Atlántida",
        "Banpaís",
        "Banco de Occidente",
        "Banco Davivienda"
    )
    var isBankDropdownExpanded by remember { mutableStateOf(false) }

    LazyColumn(
        modifier = Modifier
            .fillMaxSize()
            .background(MaterialTheme.colorScheme.background)
            .testTag("transfers_screen"),
        contentPadding = PaddingValues(bottom = 120.dp)
    ) {
        item {
            LuminaTopBar(
                title = "Transferencias",
                subtitle = "ACH Inmediato Honduras",
                showBackButton = true,
                onBackClick = onBackClick
            )
        }

        // Tab selection: Entre cuentas Lumina vs ACH Interbancario
        item {
            TabRow(
                selectedTabIndex = selectedTab,
                containerColor = MaterialTheme.colorScheme.surfaceVariant,
                contentColor = MaterialTheme.colorScheme.onSurface,
                indicator = { tabPositions ->
                    TabRowDefaults.SecondaryIndicator(
                        Modifier.tabIndicatorOffset(tabPositions[selectedTab]),
                        color = LuminaBlue
                    )
                },
                modifier = Modifier.padding(horizontal = 20.dp)
            ) {
                Tab(
                    selected = selectedTab == 0,
                    onClick = {
                        selectedTab = 0
                        onUpdateBank("Lumina Bank")
                    },
                    text = { Text("A Cuenta Lumina", fontSize = 13.sp) }
                )
                Tab(
                    selected = selectedTab == 1,
                    onClick = {
                        selectedTab = 1
                        if (transferState.bankName == "Lumina Bank") {
                            onUpdateBank("BAC Credomatic Honduras")
                        }
                    },
                    text = { Text("ACH Interbancario", fontSize = 13.sp) }
                )
            }
        }

        // Frequent Beneficiaries
        item {
            Spacer(modifier = Modifier.height(16.dp))
            Text(
                text = "Beneficiarios Guardados",
                fontSize = 13.sp,
                fontWeight = FontWeight.Bold,
                color = MaterialTheme.colorScheme.onSurface,
                modifier = Modifier.padding(horizontal = 20.dp)
            )

            Spacer(modifier = Modifier.height(8.dp))

            LazyRow(
                contentPadding = PaddingValues(horizontal = 20.dp),
                horizontalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                items(beneficiaries) { ben ->
                    val isSelected = transferState.recipientName == ben.name
                    Card(
                        modifier = Modifier
                            .clickable { onSelectBeneficiary(ben) }
                            .testTag("beneficiary_${ben.id}"),
                        shape = RoundedCornerShape(14.dp),
                        colors = CardDefaults.cardColors(
                            containerColor = if (isSelected) LuminaBlue.copy(alpha = 0.25f) else MaterialTheme.colorScheme.surfaceVariant
                        ),
                        border = CardDefaults.outlinedCardBorder().copy(
                            brush = androidx.compose.ui.graphics.SolidColor(
                                if (isSelected) LuminaBlue else MaterialTheme.colorScheme.outline.copy(alpha = 0.3f)
                            )
                        )
                    ) {
                        Row(
                            modifier = Modifier.padding(horizontal = 12.dp, vertical = 8.dp),
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Box(
                                modifier = Modifier
                                    .size(32.dp)
                                    .clip(CircleShape)
                                    .background(LuminaBlue),
                                contentAlignment = Alignment.Center
                            ) {
                                Text(
                                    text = ben.initials,
                                    fontSize = 12.sp,
                                    fontWeight = FontWeight.Bold,
                                    color = Color.White
                                )
                            }
                            Spacer(modifier = Modifier.width(8.dp))
                            Column {
                                Text(
                                    text = ben.alias,
                                    fontSize = 12.sp,
                                    fontWeight = FontWeight.Bold,
                                    color = MaterialTheme.colorScheme.onSurface
                                )
                                Text(
                                    text = ben.bankName,
                                    fontSize = 10.sp,
                                    color = MaterialTheme.colorScheme.onSurfaceVariant
                                )
                            }
                        }
                    }
                }
            }
        }

        // Transfer Form
        item {
            Spacer(modifier = Modifier.height(18.dp))
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
                    // Balance info row
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Text(
                            text = "Saldo Disponible:",
                            fontSize = 12.sp,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                        Text(
                            text = String.format("L %,.2f", account?.balanceHnl ?: 0.0),
                            fontSize = 14.sp,
                            fontWeight = FontWeight.Bold,
                            color = LuminaEmerald
                        )
                    }

                    Spacer(modifier = Modifier.height(14.dp))

                    // Bank Selector (if ACH)
                    if (selectedTab == 1) {
                        ExposedDropdownMenuBox(
                            expanded = isBankDropdownExpanded,
                            onExpandedChange = { isBankDropdownExpanded = it }
                        ) {
                            OutlinedTextField(
                                value = transferState.bankName,
                                onValueChange = {},
                                readOnly = true,
                                label = { Text("Banco de Destino ACH") },
                                trailingIcon = { ExposedDropdownMenuDefaults.TrailingIcon(expanded = isBankDropdownExpanded) },
                                modifier = Modifier
                                    .menuAnchor(MenuAnchorType.PrimaryNotEditable, true)
                                    .fillMaxWidth()
                                    .testTag("bank_selector"),
                                colors = OutlinedTextFieldDefaults.colors(
                                    focusedBorderColor = LuminaBlue,
                                    unfocusedBorderColor = MaterialTheme.colorScheme.outline,
                                    focusedTextColor = MaterialTheme.colorScheme.onSurface,
                                    unfocusedTextColor = MaterialTheme.colorScheme.onSurface,
                                    focusedContainerColor = MaterialTheme.colorScheme.surface,
                                    unfocusedContainerColor = MaterialTheme.colorScheme.surface
                                )
                            )

                            ExposedDropdownMenu(
                                expanded = isBankDropdownExpanded,
                                onDismissRequest = { isBankDropdownExpanded = false }
                            ) {
                                banks.forEach { bank ->
                                    DropdownMenuItem(
                                        text = { Text(bank) },
                                        onClick = {
                                            onUpdateBank(bank)
                                            isBankDropdownExpanded = false
                                        }
                                    )
                                }
                            }
                        }

                        Spacer(modifier = Modifier.height(12.dp))
                    }

                    // Recipient Name
                    OutlinedTextField(
                        value = transferState.recipientName,
                        onValueChange = onUpdateRecipient,
                        label = { Text("Nombre del Destinatario") },
                        placeholder = { Text("Ej. Sofía Valladares") },
                        leadingIcon = {
                            Icon(Icons.Default.Person, contentDescription = null, tint = LuminaBlue)
                        },
                        modifier = Modifier
                            .fillMaxWidth()
                            .testTag("transfer_recipient_input"),
                        colors = OutlinedTextFieldDefaults.colors(
                            focusedBorderColor = LuminaBlue,
                            unfocusedBorderColor = MaterialTheme.colorScheme.outline,
                            focusedTextColor = MaterialTheme.colorScheme.onSurface,
                            unfocusedTextColor = MaterialTheme.colorScheme.onSurface,
                            focusedContainerColor = MaterialTheme.colorScheme.surface,
                            unfocusedContainerColor = MaterialTheme.colorScheme.surface
                        )
                    )

                    Spacer(modifier = Modifier.height(12.dp))

                    // Account Number
                    OutlinedTextField(
                        value = transferState.accountNumber,
                        onValueChange = onUpdateAccount,
                        label = { Text("Número de Cuenta") },
                        placeholder = { Text("01-002-XXXXXX-X o IBAN") },
                        keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                        leadingIcon = {
                            Icon(Icons.Default.AccountBalance, contentDescription = null, tint = LuminaBlue)
                        },
                        modifier = Modifier
                            .fillMaxWidth()
                            .testTag("transfer_account_input"),
                        colors = OutlinedTextFieldDefaults.colors(
                            focusedBorderColor = LuminaBlue,
                            unfocusedBorderColor = MaterialTheme.colorScheme.outline,
                            focusedTextColor = MaterialTheme.colorScheme.onSurface,
                            unfocusedTextColor = MaterialTheme.colorScheme.onSurface,
                            focusedContainerColor = MaterialTheme.colorScheme.surface,
                            unfocusedContainerColor = MaterialTheme.colorScheme.surface
                        )
                    )

                    Spacer(modifier = Modifier.height(12.dp))

                    // Amount in HNL
                    OutlinedTextField(
                        value = transferState.amountText,
                        onValueChange = onUpdateAmount,
                        label = { Text("Monto a Transferir (HNL)") },
                        placeholder = { Text("0.00") },
                        prefix = {
                            Text("L ", fontWeight = FontWeight.Bold, color = LuminaGold)
                        },
                        keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Decimal),
                        modifier = Modifier
                            .fillMaxWidth()
                            .testTag("transfer_amount_input"),
                        colors = OutlinedTextFieldDefaults.colors(
                            focusedBorderColor = LuminaBlue,
                            unfocusedBorderColor = MaterialTheme.colorScheme.outline,
                            focusedTextColor = MaterialTheme.colorScheme.onSurface,
                            unfocusedTextColor = MaterialTheme.colorScheme.onSurface,
                            focusedContainerColor = MaterialTheme.colorScheme.surface,
                            unfocusedContainerColor = MaterialTheme.colorScheme.surface
                        )
                    )

                    Spacer(modifier = Modifier.height(8.dp))

                    // Preset Amount Chips & Max Balance
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(6.dp)
                    ) {
                        val presets = listOf("500", "1000", "2500", "5000")
                        presets.forEach { preset ->
                            Box(
                                modifier = Modifier
                                    .clip(RoundedCornerShape(8.dp))
                                    .background(MaterialTheme.colorScheme.surface)
                                    .border(0.8.dp, MaterialTheme.colorScheme.outline.copy(alpha = 0.5f), RoundedCornerShape(8.dp))
                                    .clickable { onUpdateAmount(preset) }
                                    .padding(horizontal = 8.dp, vertical = 5.dp)
                            ) {
                                Text(
                                    text = "L $preset",
                                    fontSize = 11.sp,
                                    fontWeight = FontWeight.SemiBold,
                                    color = MaterialTheme.colorScheme.onSurface
                                )
                            }
                        }

                        Spacer(modifier = Modifier.weight(1f))

                        Box(
                            modifier = Modifier
                                .clip(RoundedCornerShape(8.dp))
                                .background(LuminaBlue.copy(alpha = 0.15f))
                                .border(0.8.dp, LuminaBlue.copy(alpha = 0.4f), RoundedCornerShape(8.dp))
                                .clickable {
                                    val max = account?.balanceHnl ?: 0.0
                                    onUpdateAmount(String.format(java.util.Locale.US, "%.2f", max))
                                }
                                .padding(horizontal = 8.dp, vertical = 5.dp)
                        ) {
                            Text(
                                text = "Máximo",
                                fontSize = 11.sp,
                                fontWeight = FontWeight.Bold,
                                color = LuminaBlue
                            )
                        }
                    }

                    Spacer(modifier = Modifier.height(12.dp))

                    // Concept / Note
                    OutlinedTextField(
                        value = transferState.concept,
                        onValueChange = onUpdateConcept,
                        label = { Text("Concepto o Motivo (Opcional)") },
                        placeholder = { Text("Ej. Pago de alquiler o cena") },
                        modifier = Modifier.fillMaxWidth(),
                        colors = OutlinedTextFieldDefaults.colors(
                            focusedBorderColor = LuminaBlue,
                            unfocusedBorderColor = MaterialTheme.colorScheme.outline,
                            focusedTextColor = MaterialTheme.colorScheme.onSurface,
                            unfocusedTextColor = MaterialTheme.colorScheme.onSurface,
                            focusedContainerColor = MaterialTheme.colorScheme.surface,
                            unfocusedContainerColor = MaterialTheme.colorScheme.surface
                        )
                    )

                    // Error Message Display
                    AnimatedVisibility(visible = transferState.errorMessage != null) {
                        Text(
                            text = transferState.errorMessage ?: "",
                            color = LuminaRose,
                            fontSize = 12.sp,
                            fontWeight = FontWeight.Medium,
                            modifier = Modifier.padding(top = 10.dp)
                        )
                    }

                    Spacer(modifier = Modifier.height(20.dp))

                    // Transfer Submit Button with Biometric badge
                    Button(
                        onClick = onExecuteTransferWithBiometric,
                        enabled = !transferState.isTransferring,
                        modifier = Modifier
                            .fillMaxWidth()
                            .height(52.dp)
                            .testTag("execute_transfer_button"),
                        colors = ButtonDefaults.buttonColors(containerColor = LuminaBlue),
                        shape = RoundedCornerShape(14.dp)
                    ) {
                        if (transferState.isTransferring) {
                            CircularProgressIndicator(
                                color = Color.White,
                                modifier = Modifier.size(22.dp),
                                strokeWidth = 2.dp
                            )
                        } else {
                            Icon(
                                imageVector = Icons.Default.Fingerprint,
                                contentDescription = "Biometría",
                                modifier = Modifier.size(20.dp)
                            )
                            Spacer(modifier = Modifier.width(8.dp))
                            Text(
                                text = "Autorizar con Biometría",
                                fontWeight = FontWeight.Bold,
                                fontSize = 14.sp
                            )
                        }
                    }

                    Spacer(modifier = Modifier.height(8.dp))

                    Text(
                        text = "Transferencia protegida por firma electrónica y cifrado bancario SAR",
                        fontSize = 10.sp,
                        color = Color(0xFF64748B),
                        modifier = Modifier.align(Alignment.CenterHorizontally)
                    )
                }
            }
        }
    }

    // Comprobante Digital Modal
    transferState.lastCompletedTransaction?.let { tx ->
        SarReceiptDialog(
            transaction = tx,
            onDismiss = onDismissReceipt
        )
    }
}
