package com.example.ui.components

import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.fadeIn
import androidx.compose.animation.scaleIn
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowForward
import androidx.compose.material.icons.filled.Download
import androidx.compose.material.icons.filled.Schedule
import androidx.compose.material.icons.filled.SystemUpdate
import androidx.compose.material.icons.filled.Warning
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.window.Dialog
import androidx.compose.ui.window.DialogProperties
import com.example.ui.theme.LuminaBlue
import com.example.ui.theme.LuminaCardDark
import com.example.ui.theme.LuminaCardLight
import com.example.ui.theme.LuminaEmerald
import com.example.ui.theme.LuminaNavy
import com.example.ui.theme.LuminaRose
import com.example.update.AppUpdateInfo

@Composable
fun AppUpdateDialog(
    updateInfo: AppUpdateInfo,
    currentVersionName: String,
    currentVersionCode: Int,
    isDarkMode: Boolean,
    onUpdateNow: () -> Unit,
    onRemindLater: () -> Unit,
    onDismiss: () -> Unit
) {
    val cardBg = if (isDarkMode) LuminaCardDark else LuminaCardLight
    val textPrimary = if (isDarkMode) Color.White else LuminaNavy
    val textSecondary = if (isDarkMode) Color(0xFF94A3B8) else Color(0xFF64748B)

    Dialog(
        onDismissRequest = {
            if (!updateInfo.isMandatory) onDismiss()
        },
        properties = DialogProperties(
            dismissOnBackPress = !updateInfo.isMandatory,
            dismissOnClickOutside = !updateInfo.isMandatory
        )
    ) {
        AnimatedVisibility(
            visible = true,
            enter = fadeIn() + scaleIn(initialScale = 0.9f)
        ) {
            Surface(
                modifier = Modifier
                    .fillMaxWidth()
                    .testTag("dialog_app_update"),
                shape = RoundedCornerShape(26.dp),
                color = cardBg,
                shadowElevation = 16.dp
            ) {
                Column(
                    modifier = Modifier.padding(24.dp),
                    horizontalAlignment = Alignment.CenterHorizontally
                ) {
                    // Update Badge Icon
                    Box(
                        modifier = Modifier
                            .size(64.dp)
                            .clip(CircleShape)
                            .background(LuminaBlue.copy(alpha = 0.15f))
                            .border(2.dp, LuminaBlue.copy(alpha = 0.3f), CircleShape),
                        contentAlignment = Alignment.Center
                    ) {
                        Icon(
                            imageVector = Icons.Default.SystemUpdate,
                            contentDescription = "Actualización",
                            tint = LuminaBlue,
                            modifier = Modifier.size(34.dp)
                        )
                    }

                    Spacer(modifier = Modifier.height(14.dp))

                    Text(
                        text = "¡Nueva Versión Disponible!",
                        fontSize = 20.sp,
                        fontWeight = FontWeight.Bold,
                        color = textPrimary
                    )

                    Spacer(modifier = Modifier.height(4.dp))

                    Text(
                        text = "Lumina Bank v${updateInfo.versionName}",
                        fontSize = 14.sp,
                        fontWeight = FontWeight.SemiBold,
                        color = LuminaBlue
                    )

                    Spacer(modifier = Modifier.height(14.dp))

                    // Version Compare Card
                    Card(
                        modifier = Modifier.fillMaxWidth(),
                        shape = RoundedCornerShape(14.dp),
                        colors = CardDefaults.cardColors(
                            containerColor = if (isDarkMode) Color(0xFF1E293B) else Color(0xFFF1F5F9)
                        )
                    ) {
                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(horizontal = 16.dp, vertical = 12.dp),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Column {
                                Text(
                                    text = "INSTALADA",
                                    fontSize = 10.sp,
                                    fontWeight = FontWeight.Bold,
                                    color = textSecondary
                                )
                                Text(
                                    text = "v$currentVersionName ($currentVersionCode)",
                                    fontSize = 13.sp,
                                    fontWeight = FontWeight.Bold,
                                    color = textPrimary
                                )
                            }

                            Icon(
                                imageVector = Icons.AutoMirrored.Filled.ArrowForward,
                                contentDescription = null,
                                tint = LuminaEmerald,
                                modifier = Modifier.size(20.dp)
                            )

                            Column(horizontalAlignment = Alignment.End) {
                                Text(
                                    text = "NUEVA VERSIÓN",
                                    fontSize = 10.sp,
                                    fontWeight = FontWeight.Bold,
                                    color = LuminaEmerald
                                )
                                Text(
                                    text = "v${updateInfo.versionName} (${updateInfo.versionCode})",
                                    fontSize = 13.sp,
                                    fontWeight = FontWeight.Bold,
                                    color = LuminaEmerald
                                )
                            }
                        }
                    }

                    Spacer(modifier = Modifier.height(14.dp))

                    // Mandatory Warning if applicable
                    if (updateInfo.isMandatory) {
                        Box(
                            modifier = Modifier
                                .fillMaxWidth()
                                .clip(RoundedCornerShape(10.dp))
                                .background(LuminaRose.copy(alpha = 0.12f))
                                .padding(10.dp)
                        ) {
                            Row(verticalAlignment = Alignment.CenterVertically) {
                                Icon(
                                    imageVector = Icons.Default.Warning,
                                    contentDescription = null,
                                    tint = LuminaRose,
                                    modifier = Modifier.size(16.dp)
                                )
                                Spacer(modifier = Modifier.width(8.dp))
                                Text(
                                    text = "Actualización obligatoria para continuar operando con seguridad.",
                                    fontSize = 11.sp,
                                    fontWeight = FontWeight.SemiBold,
                                    color = LuminaRose
                                )
                            }
                        }
                        Spacer(modifier = Modifier.height(10.dp))
                    }

                    // Release notes section
                    Column(
                        modifier = Modifier
                            .fillMaxWidth()
                            .clip(RoundedCornerShape(12.dp))
                            .background(if (isDarkMode) Color(0xFF1E293B).copy(alpha = 0.5f) else Color(0xFFF8FAFC))
                            .padding(14.dp)
                    ) {
                        Text(
                            text = "Novedades y Mejoras:",
                            fontSize = 12.sp,
                            fontWeight = FontWeight.Bold,
                            color = textPrimary
                        )
                        Spacer(modifier = Modifier.height(6.dp))
                        Box(modifier = Modifier.heightIn(max = 140.dp)) {
                            Text(
                                text = updateInfo.releaseNotes.ifBlank { "Mejoras de estabilidad y rendimiento general." },
                                fontSize = 12.sp,
                                lineHeight = 18.sp,
                                color = textSecondary,
                                modifier = Modifier.verticalScroll(rememberScrollState())
                            )
                        }
                    }

                    Spacer(modifier = Modifier.height(20.dp))

                    // Action Buttons
                    Button(
                        onClick = onUpdateNow,
                        colors = ButtonDefaults.buttonColors(containerColor = LuminaBlue),
                        shape = RoundedCornerShape(14.dp),
                        modifier = Modifier
                            .fillMaxWidth()
                            .height(48.dp)
                            .testTag("btn_update_now")
                    ) {
                        Icon(Icons.Default.Download, contentDescription = null, modifier = Modifier.size(18.dp))
                        Spacer(modifier = Modifier.width(8.dp))
                        Text(
                            text = "Actualizar Ahora",
                            fontWeight = FontWeight.Bold,
                            fontSize = 14.sp
                        )
                    }

                    if (!updateInfo.isMandatory) {
                        Spacer(modifier = Modifier.height(10.dp))

                        OutlinedButton(
                            onClick = onRemindLater,
                            shape = RoundedCornerShape(14.dp),
                            modifier = Modifier
                                .fillMaxWidth()
                                .height(46.dp)
                                .testTag("btn_remind_later")
                        ) {
                            Icon(
                                imageVector = Icons.Default.Schedule,
                                contentDescription = null,
                                modifier = Modifier.size(16.dp),
                                tint = textSecondary
                            )
                            Spacer(modifier = Modifier.width(8.dp))
                            Text(
                                text = "Recordar más tarde",
                                color = textSecondary,
                                fontWeight = FontWeight.SemiBold,
                                fontSize = 13.sp
                            )
                        }
                    }
                }
            }
        }
    }
}
