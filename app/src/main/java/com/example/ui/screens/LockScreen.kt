package com.example.ui.screens

import android.widget.Toast
import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.ui.res.painterResource
import com.example.R
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.imePadding
import androidx.compose.foundation.layout.navigationBarsPadding
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.statusBarsPadding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.layout.widthIn
import androidx.compose.foundation.horizontalScroll
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardActions
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.AccountBalance
import androidx.compose.material.icons.filled.AccountCircle
import androidx.compose.material.icons.filled.AutoAwesome
import androidx.compose.material.icons.filled.Check
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material.icons.filled.Close
import androidx.compose.material.icons.filled.DarkMode
import androidx.compose.material.icons.filled.Delete
import androidx.compose.material.icons.filled.Email
import androidx.compose.material.icons.filled.Fingerprint
import androidx.compose.material.icons.filled.Info
import androidx.compose.material.icons.filled.Key
import androidx.compose.material.icons.filled.LightMode
import androidx.compose.material.icons.filled.Lock
import androidx.compose.material.icons.filled.PhoneAndroid
import androidx.compose.material.icons.filled.Shield
import androidx.compose.material.icons.filled.Timer
import androidx.compose.material.icons.filled.Visibility
import androidx.compose.material.icons.filled.VisibilityOff
import androidx.compose.material.icons.filled.Warning
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.Checkbox
import androidx.compose.material3.CheckboxDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.OutlinedTextFieldDefaults
import androidx.compose.material3.SuggestionChip
import androidx.compose.material3.SuggestionChipDefaults
import androidx.compose.material3.Surface
import androidx.compose.material3.Tab
import androidx.compose.material3.TabRow
import androidx.compose.material3.TabRowDefaults
import androidx.compose.material3.TabRowDefaults.tabIndicatorOffset
import androidx.compose.material3.Text
import androidx.compose.ui.window.Dialog
import com.example.data.model.PublicUserDto
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.focus.FocusRequester
import androidx.compose.ui.focus.focusRequester
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.LocalFocusManager
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.ImeAction
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.text.input.VisualTransformation
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.data.model.AccountEntity
import com.example.security.BiometricStatus
import com.example.ui.theme.LuminaBlue
import com.example.ui.theme.LuminaEmerald
import com.example.ui.theme.LuminaGold
import com.example.ui.theme.LuminaRose
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch

/**
 * Pantalla de Iniciar Sesión (Login) estilo Banca en Línea BAC Credomatic.
 * Enfoque en autenticación biométrica nativa de alta seguridad y fallback inmediato a contraseña.
 */
@Composable
fun LockScreen(
    biometricStatus: BiometricStatus,
    pinError: String?,
    lockReason: String? = null,
    isDarkMode: Boolean,
    onToggleDarkMode: () -> Unit,
    onBiometricClick: (username: String?, onFallback: (String) -> Unit) -> Unit,
    onBiometricForAccount: ((account: AccountEntity, onFallback: (String) -> Unit) -> Unit)? = null,
    onBiometricForUser: ((user: PublicUserDto, onFallback: (String) -> Unit) -> Unit)? = null,
    onRegisterBiometricForUser: ((userIdOrAccount: String) -> Unit)? = null,
    onPinEntered: (String) -> Unit = {},
    onLoginWithCredentials: (username: String, password: String) -> Unit,
    registeredAccounts: List<AccountEntity> = emptyList(),
    top2Users: List<PublicUserDto> = emptyList(),
    allUsersPublic: List<PublicUserDto> = emptyList(),
    knownDeviceUsernames: List<String> = emptyList(),
    onCheckPasswordRepeated: (suspend (String) -> Boolean)? = null,
    onSelectSavedAccount: (name: String, accountNumber: String, balance: Double) -> Unit = { _, _, _ -> },
    onRegisterAccount: (fullName: String, username: String, email: String, phone: String, password: String, onError: (String) -> Unit) -> Unit = { _, _, _, _, _, _ -> },
    onDeleteAccount: ((String) -> Unit)? = null,
    onClearAllAccounts: (() -> Unit)? = null,
    onClearError: () -> Unit = {}
) {
    val context = LocalContext.current
    val focusManager = LocalFocusManager.current
    val coroutineScope = rememberCoroutineScope()
    val scrollState = rememberScrollState()
    val passwordFocusRequester = remember { FocusRequester() }

    // 0 = Iniciar Sesión, 1 = Apertura de Cuenta Digital
    var selectedTab by remember { mutableIntStateOf(0) }

    // Modal de confirmación al presionar uno de los 2 usuarios destacados
    var selectedUserForModal by remember { mutableStateOf<PublicUserDto?>(null) }
    var modalPasswordInput by remember { mutableStateOf("") }
    var modalAuthOption by remember { mutableIntStateOf(0) } // 0 = Contraseña, 1 = Huella Digital
    var modalErrorMessage by remember { mutableStateOf<String?>(null) }
    var isAuthenticatingModal by remember { mutableStateOf(false) }
    var passwordValidationError by remember { mutableStateOf<String?>(null) }
    var emailValidationError by remember { mutableStateOf<String?>(null) }
    var regPasswordVisible by remember { mutableStateOf(false) }

    // Campos de Entrada: Vacíos por defecto para que el usuario escriba su cuenta
    var usernameInput by remember { mutableStateOf("") }
    var passwordInput by remember { mutableStateOf("") }
    var isPasswordVisible by remember { mutableStateOf(false) }

    // Gestión de estados de carga y concurrencia para evitar clics múltiples
    var isAuthenticatingWithPassword by remember { mutableStateOf(false) }
    var isBiometricPromptActive by remember { mutableStateOf(false) }

    // Mensaje contextual de fallback (cancelación, fallo o sensor ocupado)
    var fallbackMessage by remember { mutableStateOf<String?>(null) }

    // Formulario de Registro de Nueva Cuenta
    var regFullName by remember { mutableStateOf("") }
    var regUsername by remember { mutableStateOf("") }
    var regEmail by remember { mutableStateOf("") }
    var regPhone by remember { mutableStateOf("") }
    var regPassword by remember { mutableStateOf("") }
    var isRegistering by remember { mutableStateOf(false) }

    // Función de fallback centralizada que habilita contraseña y coloca el foco
    val handleFallbackToPassword: (String) -> Unit = { reason ->
        isBiometricPromptActive = false
        fallbackMessage = reason
        coroutineScope.launch {
            delay(150)
            try {
                passwordFocusRequester.requestFocus()
            } catch (_: Exception) {}
        }
    }

    // Colores con estética empresarial bancaria BAC Credomatic
    val bgGradient = if (isDarkMode) {
        listOf(Color(0xFF090E17), Color(0xFF0F172A))
    } else {
        listOf(Color(0xFFF8FAFC), Color(0xFFEDF2F7))
    }
    val cardBg = if (isDarkMode) Color(0xFF131D33) else Color.White
    val textPrimary = if (isDarkMode) Color(0xFFF8FAFC) else Color(0xFF0F172A)
    val textSecondary = if (isDarkMode) Color(0xFF94A3B8) else Color(0xFF64748B)
    val borderColor = if (isDarkMode) Color(0xFF24324D) else Color(0xFFE2E8F0)
    val inputBg = if (isDarkMode) Color(0xFF0B1220) else Color(0xFFF8FAFC)

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(Brush.verticalGradient(bgGradient))
            .statusBarsPadding()
            .navigationBarsPadding()
            .imePadding()
    ) {
        Column(
            modifier = Modifier
                .fillMaxSize()
                .verticalScroll(scrollState)
                .padding(horizontal = 20.dp, vertical = 12.dp),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            // =========================================================================
            // 1. CABECERA LIMPIA CON BRANDING BANCARIO DISCRETO (ESTILO BAC)
            // =========================================================================
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(vertical = 8.dp),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                // Logotipo / Emblema Corporativo Banca Nova
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Image(
                        painter = painterResource(id = R.drawable.banca_nova_logo),
                        contentDescription = "Banca Nova Logo",
                        modifier = Modifier
                            .size(42.dp)
                            .clip(RoundedCornerShape(12.dp))
                    )
                    Spacer(modifier = Modifier.width(10.dp))
                    Column {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Text(
                                text = "Banca",
                                fontSize = 18.sp,
                                fontWeight = FontWeight.ExtraBold,
                                color = LuminaBlue,
                                letterSpacing = 0.5.sp
                            )
                            Text(
                                text = " Nova",
                                fontSize = 18.sp,
                                fontWeight = FontWeight.Bold,
                                color = textPrimary
                            )
                        }
                        Text(
                            text = "Banca Móvil Digital",
                            fontSize = 11.sp,
                            fontWeight = FontWeight.Medium,
                            color = textSecondary
                        )
                    }
                }

                // Selector de Tema Institucional (Modo Oscuro / Claro)
                IconButton(
                    onClick = onToggleDarkMode,
                    modifier = Modifier
                        .size(38.dp)
                        .clip(CircleShape)
                        .background(if (isDarkMode) Color(0xFF1E293B) else Color(0xFFE2E8F0))
                        .testTag("btn_toggle_dark_mode")
                ) {
                    Icon(
                        imageVector = if (isDarkMode) Icons.Default.LightMode else Icons.Default.DarkMode,
                        contentDescription = "Cambiar Tema",
                        tint = if (isDarkMode) LuminaGold else Color(0xFF334155),
                        modifier = Modifier.size(18.dp)
                    )
                }
            }

            Spacer(modifier = Modifier.height(10.dp))

            // =========================================================================
            // AVISO DE SESIÓN CERRADA POR INACTIVIDAD (40 SEGUNDOS)
            // =========================================================================
            if (lockReason != null) {
                Card(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(bottom = 14.dp)
                        .testTag("inactivity_lock_banner"),
                    shape = RoundedCornerShape(14.dp),
                    colors = CardDefaults.cardColors(
                        containerColor = if (isDarkMode) Color(0xFF451A03) else Color(0xFFFEF3C7)
                    ),
                    border = CardDefaults.outlinedCardBorder().copy(
                        brush = Brush.linearGradient(listOf(LuminaGold, LuminaGold))
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
                                .size(34.dp)
                                .clip(CircleShape)
                                .background(LuminaGold.copy(alpha = 0.25f)),
                            contentAlignment = Alignment.Center
                        ) {
                            Icon(
                                imageVector = Icons.Default.Timer,
                                contentDescription = null,
                                tint = LuminaGold,
                                modifier = Modifier.size(20.dp)
                            )
                        }
                        Spacer(modifier = Modifier.width(12.dp))
                        Column(modifier = Modifier.weight(1f)) {
                            Text(
                                text = "Sesión cerrada por inactividad",
                                fontSize = 13.sp,
                                fontWeight = FontWeight.Bold,
                                color = if (isDarkMode) Color(0xFFFDE68A) else Color(0xFF92400E)
                            )
                            Text(
                                text = "Por tu seguridad, la sesión se cerró tras 40 segundos sin actividad. Ingresa con tu huella o contraseña.",
                                fontSize = 11.sp,
                                color = if (isDarkMode) Color(0xFFFDE68A).copy(alpha = 0.9f) else Color(0xFF92400E).copy(alpha = 0.9f)
                            )
                        }
                    }
                }
            }

            // =========================================================================
            // 2. TARJETA PRINCIPAL FLOTANTE CON LOS CAMPOS DE ENTRADA (ESTILO BAC)
            // =========================================================================
            Card(
                modifier = Modifier
                    .fillMaxWidth()
                    .widthIn(max = 480.dp)
                    .testTag("bac_login_card"),
                shape = RoundedCornerShape(20.dp),
                colors = CardDefaults.cardColors(containerColor = cardBg),
                elevation = CardDefaults.cardElevation(defaultElevation = 6.dp),
                border = CardDefaults.outlinedCardBorder().copy(
                    brush = Brush.linearGradient(listOf(borderColor, borderColor))
                )
            ) {
                Column(modifier = Modifier.padding(20.dp)) {
                    // Pestañas Segmentadas Institucionales
                    TabRow(
                        selectedTabIndex = selectedTab,
                        containerColor = inputBg,
                        contentColor = LuminaBlue,
                        indicator = { tabPositions ->
                            TabRowDefaults.SecondaryIndicator(
                                Modifier.tabIndicatorOffset(tabPositions[selectedTab]),
                                color = LuminaBlue,
                                height = 3.dp
                            )
                        },
                        divider = {},
                        modifier = Modifier
                            .clip(RoundedCornerShape(12.dp))
                            .border(1.dp, borderColor, RoundedCornerShape(12.dp))
                    ) {
                        Tab(
                            selected = selectedTab == 0,
                            onClick = {
                                selectedTab = 0
                                onClearError()
                                fallbackMessage = null
                            },
                            text = {
                                Text(
                                    text = "Iniciar Sesión",
                                    fontSize = 13.sp,
                                    fontWeight = if (selectedTab == 0) FontWeight.Bold else FontWeight.Medium,
                                    color = if (selectedTab == 0) LuminaBlue else textSecondary
                                )
                            },
                            modifier = Modifier.testTag("tab_login")
                        )
                        Tab(
                            selected = selectedTab == 1,
                            onClick = {
                                selectedTab = 1
                                onClearError()
                                fallbackMessage = null
                            },
                            text = {
                                Text(
                                    text = "Crear Cuenta",
                                    fontSize = 13.sp,
                                    fontWeight = if (selectedTab == 1) FontWeight.Bold else FontWeight.Medium,
                                    color = if (selectedTab == 1) LuminaBlue else textSecondary
                                )
                            },
                            modifier = Modifier.testTag("tab_register")
                        )
                    }

                    Spacer(modifier = Modifier.height(20.dp))

                    // =====================================================================
                    // VISTA 0: INICIAR SESIÓN (HUELLA NATIVA Y CONTRASEÑA FALLBACK)
                    // =====================================================================
                    if (selectedTab == 0) {
                        // Mensaje de Fallback o Error Contextual
                        val displayNotice = fallbackMessage ?: pinError
                        if (displayNotice != null) {
                            Row(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .clip(RoundedCornerShape(10.dp))
                                    .background(
                                        if (fallbackMessage != null) LuminaGold.copy(alpha = 0.15f)
                                        else LuminaRose.copy(alpha = 0.15f)
                                    )
                                    .border(
                                        1.dp,
                                        if (fallbackMessage != null) LuminaGold.copy(alpha = 0.4f)
                                        else LuminaRose.copy(alpha = 0.4f),
                                        RoundedCornerShape(10.dp)
                                    )
                                    .padding(12.dp)
                                    .testTag("auth_feedback_notice"),
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Icon(
                                    imageVector = if (fallbackMessage != null) Icons.Default.Info else Icons.Default.Warning,
                                    contentDescription = null,
                                    tint = if (fallbackMessage != null) LuminaGold else LuminaRose,
                                    modifier = Modifier.size(18.dp)
                                )
                                Spacer(modifier = Modifier.width(10.dp))
                                Text(
                                    text = displayNotice,
                                    fontSize = 12.sp,
                                    fontWeight = FontWeight.Medium,
                                    color = if (fallbackMessage != null) {
                                        if (isDarkMode) Color(0xFFFDE68A) else Color(0xFF92400E)
                                    } else LuminaRose
                                )
                            }
                            Spacer(modifier = Modifier.height(16.dp))
                        }

                        // 1. Campo de Usuario / Identificación (Vacío por defecto para escritura manual)
                        Text(
                            text = "Usuario o Correo",
                            fontSize = 12.sp,
                            fontWeight = FontWeight.SemiBold,
                            color = textPrimary
                        )
                        Spacer(modifier = Modifier.height(6.dp))
                        OutlinedTextField(
                            value = usernameInput,
                            onValueChange = {
                                usernameInput = it
                                onClearError()
                                fallbackMessage = null
                            },
                            placeholder = { Text("Escribe tu usuario o correo", fontSize = 13.sp, color = textSecondary) },
                            leadingIcon = {
                                Icon(Icons.Default.AccountCircle, contentDescription = null, tint = textSecondary, modifier = Modifier.size(20.dp))
                            },
                            singleLine = true,
                            enabled = !isAuthenticatingWithPassword && !isBiometricPromptActive,
                            keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Email, imeAction = ImeAction.Next),
                            modifier = Modifier
                                .fillMaxWidth()
                                .testTag("input_bac_username"),
                            shape = RoundedCornerShape(12.dp),
                            colors = OutlinedTextFieldDefaults.colors(
                                focusedBorderColor = LuminaBlue,
                                unfocusedBorderColor = borderColor,
                                focusedContainerColor = inputBg,
                                unfocusedContainerColor = inputBg,
                                focusedTextColor = textPrimary,
                                unfocusedTextColor = textPrimary
                            )
                        )

                        // 3. AUTOCOMPLETADO DE USUARIO PREVIAMENTE REGISTRADO EN EL DISPOSITIVO (LOGIN)
                        val loginUserSuggestions = remember(usernameInput, knownDeviceUsernames, allUsersPublic, registeredAccounts) {
                            val q = usernameInput.trim().lowercase()
                            if (q.isEmpty()) emptyList()
                            else {
                                val list = mutableListOf<String>()
                                for (u in knownDeviceUsernames) {
                                    if (u.lowercase().startsWith(q) || u.lowercase().contains(q)) {
                                        if (!list.contains(u)) list.add(u)
                                    }
                                }
                                for (u in allUsersPublic) {
                                    if (u.username.lowercase().startsWith(q) || u.username.lowercase().contains(q)) {
                                        if (!list.contains(u.username)) list.add(u.username)
                                    }
                                }
                                for (acc in registeredAccounts) {
                                    val userFromHolder = acc.accountHolder.lowercase().replace(" ", "_")
                                    if (userFromHolder.startsWith(q) || userFromHolder.contains(q)) {
                                        if (!list.contains(userFromHolder)) list.add(userFromHolder)
                                    }
                                }
                                list.take(3)
                            }
                        }

                        if (loginUserSuggestions.isNotEmpty()) {
                            Spacer(modifier = Modifier.height(4.dp))
                            Row(
                                verticalAlignment = Alignment.CenterVertically,
                                horizontalArrangement = Arrangement.spacedBy(4.dp)
                            ) {
                                Icon(
                                    imageVector = Icons.Default.PhoneAndroid,
                                    contentDescription = null,
                                    tint = LuminaEmerald,
                                    modifier = Modifier.size(12.dp)
                                )
                                Text(
                                    text = "Usuario registrado en este celular:",
                                    fontSize = 9.sp,
                                    fontWeight = FontWeight.Bold,
                                    color = LuminaEmerald
                                )
                            }
                            Spacer(modifier = Modifier.height(2.dp))
                            Row(
                                horizontalArrangement = Arrangement.spacedBy(6.dp),
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .horizontalScroll(rememberScrollState())
                            ) {
                                loginUserSuggestions.forEach { suggestion ->
                                    SuggestionChip(
                                        onClick = {
                                            usernameInput = suggestion
                                            onClearError()
                                        },
                                        label = {
                                            Text(
                                                text = "@$suggestion",
                                                fontSize = 11.sp,
                                                fontWeight = FontWeight.Bold,
                                                color = LuminaEmerald
                                            )
                                        },
                                        icon = {
                                            Icon(
                                                Icons.Default.AccountCircle,
                                                contentDescription = null,
                                                tint = LuminaEmerald,
                                                modifier = Modifier.size(13.dp)
                                            )
                                        },
                                        colors = SuggestionChipDefaults.suggestionChipColors(
                                            containerColor = LuminaEmerald.copy(alpha = 0.15f)
                                        ),
                                        border = BorderStroke(width = 1.dp, color = LuminaEmerald.copy(alpha = 0.5f))
                                    )
                                }
                            }
                        }

                        Spacer(modifier = Modifier.height(14.dp))

                        // 2. Campo de Contraseña (Protegida permanentemente con máscara de seguridad)
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Text(
                                text = "Contraseña",
                                fontSize = 12.sp,
                                fontWeight = FontWeight.SemiBold,
                                color = textPrimary
                            )
                        }
                        Spacer(modifier = Modifier.height(6.dp))
                        OutlinedTextField(
                            value = passwordInput,
                            onValueChange = {
                                passwordInput = it
                                onClearError()
                                fallbackMessage = null
                            },
                            placeholder = { Text("••••••••••••", fontSize = 13.sp, color = textSecondary) },
                            leadingIcon = {
                                Icon(Icons.Default.Lock, contentDescription = null, tint = textSecondary, modifier = Modifier.size(20.dp))
                            },
                            visualTransformation = PasswordVisualTransformation(),
                            keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Password, imeAction = ImeAction.Done),
                            keyboardActions = KeyboardActions(
                                onDone = {
                                    focusManager.clearFocus()
                                    if (usernameInput.isNotBlank() && passwordInput.isNotBlank()) {
                                        isAuthenticatingWithPassword = true
                                        onLoginWithCredentials(usernameInput, passwordInput)
                                        isAuthenticatingWithPassword = false
                                    } else {
                                        fallbackMessage = "Por favor completa tu usuario y contraseña."
                                    }
                                }
                            ),
                            singleLine = true,
                            enabled = !isAuthenticatingWithPassword && !isBiometricPromptActive,
                            modifier = Modifier
                                .fillMaxWidth()
                                .focusRequester(passwordFocusRequester)
                                .testTag("input_bac_password"),
                            shape = RoundedCornerShape(12.dp),
                            colors = OutlinedTextFieldDefaults.colors(
                                focusedBorderColor = LuminaBlue,
                                unfocusedBorderColor = borderColor,
                                focusedContainerColor = inputBg,
                                unfocusedContainerColor = inputBg,
                                focusedTextColor = textPrimary,
                                unfocusedTextColor = textPrimary
                            )
                        )

                        Spacer(modifier = Modifier.height(18.dp))

                        // 3. Botón de Acción Principal: INGRESAR CON CONTRASEÑA
                        Button(
                            onClick = {
                                focusManager.clearFocus()
                                if (usernameInput.isBlank()) {
                                    fallbackMessage = "Por favor escribe tu usuario o correo."
                                } else if (passwordInput.isBlank()) {
                                    fallbackMessage = "Por favor ingresa tu contraseña para continuar."
                                    passwordFocusRequester.requestFocus()
                                } else {
                                    isAuthenticatingWithPassword = true
                                    onLoginWithCredentials(usernameInput, passwordInput)
                                    isAuthenticatingWithPassword = false
                                }
                            },
                            colors = ButtonDefaults.buttonColors(containerColor = LuminaBlue),
                            shape = RoundedCornerShape(12.dp),
                            enabled = !isAuthenticatingWithPassword && !isBiometricPromptActive,
                            modifier = Modifier
                                .fillMaxWidth()
                                .height(48.dp)
                                .testTag("btn_bac_login_submit")
                        ) {
                            if (isAuthenticatingWithPassword) {
                                CircularProgressIndicator(color = Color.White, modifier = Modifier.size(20.dp), strokeWidth = 2.dp)
                            } else {
                                Text(
                                    text = "Ingresar",
                                    fontSize = 14.sp,
                                    fontWeight = FontWeight.Bold,
                                    color = Color.White
                                )
                            }
                        }

                        Spacer(modifier = Modifier.height(16.dp))

                        // 4. Divisor Estilo Institucional
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            HorizontalDivider(modifier = Modifier.weight(1f), color = borderColor)
                            Text(
                                text = "O CON AUTENTICACIÓN BIOMÉTRICA",
                                fontSize = 10.sp,
                                fontWeight = FontWeight.Bold,
                                color = textSecondary,
                                letterSpacing = 0.5.sp,
                                modifier = Modifier.padding(horizontal = 8.dp)
                            )
                            HorizontalDivider(modifier = Modifier.weight(1f), color = borderColor)
                        }

                        Spacer(modifier = Modifier.height(14.dp))

                        // 5. Botón Claro para Autenticar con Huella Dactilar NATIVA del teléfono
                        OutlinedButton(
                            onClick = {
                                focusManager.clearFocus()
                                onClearError()
                                fallbackMessage = null

                                // Validar estado biométrico previo a la solicitud nativa
                                if (biometricStatus != BiometricStatus.AVAILABLE) {
                                    val reason = when (biometricStatus) {
                                        BiometricStatus.NOT_ENROLLED -> "Tu celular no tiene huellas dactilares registradas en los ajustes del sistema. Por favor ingresa con tu contraseña."
                                        BiometricStatus.NO_HARDWARE -> "Este celular no posee sensor de huella dactilar. Por favor ingresa con tu contraseña."
                                        BiometricStatus.HW_UNAVAILABLE -> "Sensor biométrico ocupado o no disponible. Ingresa con tu contraseña."
                                        else -> "Biometría no disponible en este dispositivo. Ingresa con tu contraseña."
                                    }
                                    handleFallbackToPassword(reason)
                                } else {
                                    isBiometricPromptActive = true
                                    onBiometricClick(usernameInput.ifBlank { null }) { reason ->
                                        handleFallbackToPassword(reason)
                                    }
                                }
                            },
                            shape = RoundedCornerShape(12.dp),
                            enabled = !isAuthenticatingWithPassword && !isBiometricPromptActive,
                            colors = ButtonDefaults.outlinedButtonColors(
                                containerColor = if (isDarkMode) Color(0xFF0F1A2E) else Color(0xFFF1F5F9)
                            ),
                            border = ButtonDefaults.outlinedButtonBorder(enabled = !isAuthenticatingWithPassword && !isBiometricPromptActive).copy(
                                brush = Brush.linearGradient(
                                    listOf(
                                        LuminaEmerald.copy(alpha = 0.7f),
                                        LuminaBlue.copy(alpha = 0.7f)
                                    )
                                )
                            ),
                            modifier = Modifier
                                .fillMaxWidth()
                                .height(48.dp)
                                .testTag("btn_authenticate_fingerprint")
                        ) {
                            if (isBiometricPromptActive) {
                                CircularProgressIndicator(color = LuminaEmerald, modifier = Modifier.size(20.dp), strokeWidth = 2.dp)
                                Spacer(modifier = Modifier.width(8.dp))
                                Text("Esperando huella...", fontSize = 12.sp, color = textPrimary)
                            } else {
                                Row(
                                    verticalAlignment = Alignment.CenterVertically,
                                    horizontalArrangement = Arrangement.Center
                                ) {
                                    Icon(
                                        imageVector = Icons.Default.Fingerprint,
                                        contentDescription = "Huella",
                                        tint = LuminaEmerald,
                                        modifier = Modifier.size(22.dp)
                                    )
                                    Spacer(modifier = Modifier.width(10.dp))
                                    Column {
                                        Text(
                                            text = "Ingresar con Huella Dactilar",
                                            fontSize = 13.sp,
                                            fontWeight = FontWeight.Bold,
                                            color = textPrimary
                                        )
                                        Text(
                                            text = "Sensor biométrico nativo del teléfono",
                                            fontSize = 10.sp,
                                            color = textSecondary
                                        )
                                    }
                                }
                            }
                        }

                        // =================================================================
                        // 6. USUARIOS DESTACADOS EN LOGIN (MÁXIMO 2 USUARIOS ACTIVOS)
                        // =================================================================
                        val featuredUsers: List<PublicUserDto> = remember(top2Users, registeredAccounts) {
                            if (top2Users.isNotEmpty()) {
                                top2Users.take(2)
                            } else {
                                registeredAccounts.take(2).map { acc ->
                                    PublicUserDto(
                                        id = acc.accountNumber,
                                        username = acc.accountHolder.lowercase().replace(" ", "_"),
                                        fullName = acc.accountHolder,
                                        email = "${acc.accountHolder.lowercase().replace(" ", "")}@lumina.hn",
                                        phone = "",
                                        role = "CLIENTE",
                                        biometricRegistered = true,
                                        biometricCredentialId = "passkey-${acc.accountNumber}",
                                        registeredAt = acc.lastActiveTimestamp,
                                        lastActiveTimestamp = acc.lastActiveTimestamp,
                                        accountNumber = acc.accountNumber
                                    )
                                }
                            }
                        }

                        if (featuredUsers.isNotEmpty()) {
                            Spacer(modifier = Modifier.height(18.dp))
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                verticalAlignment = Alignment.CenterVertically,
                                horizontalArrangement = Arrangement.SpaceBetween
                            ) {
                                Column {
                                    Text(
                                        text = "USUARIOS DESTACADOS",
                                        fontSize = 11.sp,
                                        fontWeight = FontWeight.Bold,
                                        color = textSecondary,
                                        letterSpacing = 0.5.sp
                                    )
                                    Text(
                                        text = "Máximo 2 perfiles activos en pantalla",
                                        fontSize = 9.sp,
                                        color = textSecondary.copy(alpha = 0.8f)
                                    )
                                }
                                if (onClearAllAccounts != null) {
                                    Text(
                                        text = "Limpiar historial",
                                        fontSize = 10.sp,
                                        fontWeight = FontWeight.Bold,
                                        color = LuminaRose,
                                        modifier = Modifier
                                            .clip(RoundedCornerShape(4.dp))
                                            .clickable {
                                                onClearAllAccounts()
                                                Toast.makeText(context, "Historial de cuentas limpiado", Toast.LENGTH_SHORT).show()
                                            }
                                            .padding(horizontal = 4.dp, vertical = 2.dp)
                                    )
                                }
                            }
                            Spacer(modifier = Modifier.height(10.dp))

                            featuredUsers.forEach { user ->
                                val initials = user.fullName.split(" ")
                                    .filter { it.isNotBlank() }
                                    .take(2)
                                    .mapNotNull { it.firstOrNull()?.uppercase() }
                                    .joinToString("")
                                    .ifEmpty { "LB" }

                                Card(
                                    modifier = Modifier
                                        .fillMaxWidth()
                                        .padding(vertical = 4.dp)
                                        .clip(RoundedCornerShape(12.dp))
                                        .clickable(enabled = !isAuthenticatingWithPassword && !isBiometricPromptActive) {
                                            selectedUserForModal = user
                                            modalPasswordInput = ""
                                            modalErrorMessage = null
                                            modalAuthOption = 0
                                        }
                                        .testTag("featured_user_card_${user.username}"),
                                    shape = RoundedCornerShape(12.dp),
                                    colors = CardDefaults.cardColors(containerColor = inputBg),
                                    border = CardDefaults.outlinedCardBorder().copy(
                                        brush = Brush.linearGradient(listOf(borderColor, borderColor))
                                    )
                                ) {
                                    Row(
                                        modifier = Modifier
                                            .fillMaxWidth()
                                            .padding(12.dp),
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
                                                    .clip(CircleShape)
                                                    .background(Brush.linearGradient(listOf(LuminaBlue, LuminaEmerald))),
                                                contentAlignment = Alignment.Center
                                            ) {
                                                Text(
                                                    text = initials,
                                                    fontSize = 13.sp,
                                                    fontWeight = FontWeight.Bold,
                                                    color = Color.White
                                                )
                                            }
                                            Spacer(modifier = Modifier.width(10.dp))
                                            Column {
                                                Text(
                                                    text = user.fullName,
                                                    fontSize = 13.sp,
                                                    fontWeight = FontWeight.Bold,
                                                    color = textPrimary
                                                )
                                                Text(
                                                    text = "@${user.username} • ${user.accountNumber}",
                                                    fontSize = 10.sp,
                                                    color = textSecondary,
                                                    fontFamily = FontFamily.Monospace
                                                )
                                                Spacer(modifier = Modifier.height(2.dp))
                                                Row(verticalAlignment = Alignment.CenterVertically) {
                                                    Icon(
                                                        imageVector = if (user.biometricRegistered) Icons.Default.CheckCircle else Icons.Default.Fingerprint,
                                                        contentDescription = null,
                                                        tint = if (user.biometricRegistered) LuminaEmerald else LuminaGold,
                                                        modifier = Modifier.size(11.dp)
                                                    )
                                                    Spacer(modifier = Modifier.width(3.dp))
                                                    Text(
                                                        text = if (user.biometricRegistered) "Huella Vinculada" else "Tocar para ingresar",
                                                        fontSize = 9.sp,
                                                        color = if (user.biometricRegistered) LuminaEmerald else LuminaGold,
                                                        fontWeight = FontWeight.SemiBold
                                                    )
                                                }
                                            }
                                        }

                                        Row(verticalAlignment = Alignment.CenterVertically) {
                                            Text(
                                                text = "Opciones →",
                                                fontSize = 11.sp,
                                                fontWeight = FontWeight.Bold,
                                                color = LuminaBlue
                                            )
                                            if (onDeleteAccount != null) {
                                                IconButton(
                                                    onClick = {
                                                        onDeleteAccount(user.accountNumber)
                                                        Toast.makeText(context, "Cuenta eliminada", Toast.LENGTH_SHORT).show()
                                                    },
                                                    modifier = Modifier.size(28.dp)
                                                ) {
                                                    Icon(
                                                        Icons.Default.Delete,
                                                        contentDescription = "Eliminar cuenta",
                                                        tint = LuminaRose.copy(alpha = 0.7f),
                                                        modifier = Modifier.size(15.dp)
                                                    )
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }

                    // =====================================================================
                    // VISTA 1: CREAR CUENTA DIGITAL (APERTURA EN LÍNEA)
                    // =====================================================================
                    if (selectedTab == 1) {
                        Text(
                            text = "Apertura de Cuenta Digital",
                            fontSize = 15.sp,
                            fontWeight = FontWeight.Bold,
                            color = textPrimary
                        )
                        Text(
                            text = "Crea tu cuenta bancaria en Lempiras con acreditación inmediata",
                            fontSize = 11.sp,
                            color = textSecondary,
                            modifier = Modifier.padding(bottom = 12.dp)
                        )

                        // 1. SUGERENCIA DE NOMBRES DE USUARIO (3 opciones, máx 12 caracteres, solo letras y números, únicos)
                        val usernameSuggestions = remember(regFullName, allUsersPublic) {
                            if (regFullName.trim().length < 2) {
                                emptyList()
                            } else {
                                val clean = regFullName.trim()
                                    .lowercase()
                                    .replace("á", "a")
                                    .replace("é", "e")
                                    .replace("í", "i")
                                    .replace("ó", "o")
                                    .replace("ú", "u")
                                    .replace("ñ", "n")
                                    .replace(Regex("[^a-z0-9\\s]"), "")
                                val parts = clean.split(Regex("\\s+")).filter { it.isNotBlank() }
                                if (parts.isEmpty()) {
                                    emptyList()
                                } else {
                                    val existing = allUsersPublic.map { it.username.lowercase() }.toSet()
                                    val f = parts[0]
                                    val l = if (parts.size > 1) parts[1] else ""
                                    val year = "26" // Año actual abreviado (fácil de recordar y profesional)
                                    val raw = mutableListOf<String>()

                                    if (l.isNotBlank()) {
                                        val fInit = f.take(1)
                                        // Opción 1 (Ejemplo: klopez26)
                                        raw.add((fInit + l).take(10) + year)
                                        // Opción 2 (Ejemplo: kerenlopez)
                                        raw.add((f + l).take(12))
                                        // Opción 3 (Ejemplo: klopezdev)
                                        raw.add((fInit + l).take(9) + "dev")
                                    } else {
                                        raw.add((f.take(10) + year).take(12))
                                        raw.add((f.take(9) + "dev").take(12))
                                        raw.add((f.take(9) + "pro").take(12))
                                    }

                                    val res = mutableListOf<String>()
                                    val used = mutableSetOf<String>()
                                    val altSuffixes = listOf("26", "dev", "pro", "01", "77", "99", "hn", "24", "07", "504")

                                    for (cand in raw) {
                                        var s = cand.filter { it.isLetterOrDigit() }.take(12)
                                        var counter = 1
                                        while ((existing.contains(s) || used.contains(s)) && counter < altSuffixes.size) {
                                            val suf = altSuffixes[counter]
                                            val b = s.filter { it.isLetter() }.take(12 - suf.length)
                                            s = (b + suf).take(12)
                                            counter++
                                        }
                                        if (!used.contains(s)) {
                                            used.add(s)
                                            res.add(s)
                                        }
                                    }

                                    var fIdx = 0
                                    while (res.size < 3 && fIdx < altSuffixes.size) {
                                        val suf = altSuffixes[fIdx++]
                                        val c = (f.take(12 - suf.length) + suf).take(12)
                                        if (!existing.contains(c) && !used.contains(c)) {
                                            used.add(c)
                                            res.add(c)
                                        }
                                    }
                                    res.take(3)
                                }
                            }
                        }

                        // 3. AUTOCOMPLETADO DE CORREOS DEL DISPOSITIVO
                        val deviceEmailList = remember(allUsersPublic, registeredAccounts) {
                            val list = mutableListOf<String>()
                            // Correo registrado en este dispositivo
                            list.add("julissalopez169@gmail.com")
                            try {
                                val am = android.accounts.AccountManager.get(context)
                                for (acc in am.accounts) {
                                    if (acc.name.contains("@") && acc.name.contains(".")) {
                                        val e = acc.name.trim().lowercase()
                                        if (!list.contains(e)) list.add(e)
                                    }
                                }
                            } catch (_: Exception) {}
                            for (u in allUsersPublic) {
                                if (u.email.isNotBlank() && !list.contains(u.email.lowercase())) {
                                    list.add(u.email.lowercase())
                                }
                            }
                            list
                        }

                        val emailSuggestions = remember(regEmail, deviceEmailList) {
                            val query = regEmail.trim().lowercase()
                            val matches = mutableListOf<String>()
                            if (query.isNotEmpty()) {
                                // Correos guardados en el celular que coincidan
                                deviceEmailList.filter { it.startsWith(query) || it.contains(query) }.forEach {
                                    if (!matches.contains(it)) matches.add(it)
                                }
                                // Dominios habituales
                                val domains = listOf("@gmail.com", "@outlook.com", "@hotmail.com", "@yahoo.com")
                                if (!query.contains("@")) {
                                    domains.forEach { dom ->
                                        val full = query + dom
                                        if (!matches.contains(full)) matches.add(full)
                                    }
                                } else {
                                    val prefix = query.substringBefore("@")
                                    val domainPart = query.substringAfter("@")
                                    domains.filter { it.removePrefix("@").startsWith(domainPart) }.forEach { dom ->
                                        val full = prefix + dom
                                        if (!matches.contains(full)) matches.add(full)
                                    }
                                }
                            } else {
                                // Muestra opciones directas guardadas en el dispositivo
                                deviceEmailList.take(2).forEach { matches.add(it) }
                            }
                            matches.take(4)
                        }

                        // Campo Nombre Completo
                        Text("Nombre Completo", fontSize = 11.sp, fontWeight = FontWeight.SemiBold, color = textPrimary)
                        Spacer(modifier = Modifier.height(4.dp))
                        OutlinedTextField(
                            value = regFullName,
                            onValueChange = { regFullName = it },
                            placeholder = { Text("Ej: Keren Lopez", fontSize = 12.sp, color = textSecondary) },
                            singleLine = true,
                            modifier = Modifier.fillMaxWidth().testTag("reg_full_name"),
                            shape = RoundedCornerShape(10.dp)
                        )

                        // Muestra 3 sugerencias inmediatas de username al escribir el nombre
                        if (usernameSuggestions.isNotEmpty()) {
                            Spacer(modifier = Modifier.height(6.dp))
                            Row(
                                verticalAlignment = Alignment.CenterVertically,
                                horizontalArrangement = Arrangement.spacedBy(4.dp)
                            ) {
                                Icon(
                                    imageVector = Icons.Default.AutoAwesome,
                                    contentDescription = null,
                                    tint = LuminaEmerald,
                                    modifier = Modifier.size(13.dp)
                                )
                                Text(
                                    text = "Sugerencias de usuario (máx. 12 car.):",
                                    fontSize = 10.sp,
                                    fontWeight = FontWeight.Bold,
                                    color = LuminaEmerald
                                )
                            }
                            Spacer(modifier = Modifier.height(4.dp))
                            Row(
                                horizontalArrangement = Arrangement.spacedBy(6.dp),
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .horizontalScroll(rememberScrollState())
                            ) {
                                usernameSuggestions.forEach { suggestion ->
                                    SuggestionChip(
                                        onClick = { regUsername = suggestion },
                                        label = {
                                            Text(
                                                text = "@$suggestion",
                                                fontSize = 11.sp,
                                                fontWeight = FontWeight.Bold
                                            )
                                        },
                                        colors = SuggestionChipDefaults.suggestionChipColors(
                                            containerColor = if (regUsername == suggestion) LuminaEmerald.copy(alpha = 0.2f) else inputBg,
                                            labelColor = if (regUsername == suggestion) LuminaEmerald else textPrimary
                                        ),
                                        border = BorderStroke(
                                            width = 1.dp,
                                            color = if (regUsername == suggestion) LuminaEmerald else borderColor
                                        )
                                    )
                                }
                            }
                        }

                        Spacer(modifier = Modifier.height(10.dp))

                        // Campo Nombre de Usuario (máx. 12 car, solo letras y números)
                        Text("Nombre de Usuario", fontSize = 11.sp, fontWeight = FontWeight.SemiBold, color = textPrimary)
                        Spacer(modifier = Modifier.height(4.dp))
                        OutlinedTextField(
                            value = regUsername,
                            onValueChange = { input ->
                                regUsername = input.filter { it.isLetterOrDigit() }.take(12).lowercase()
                            },
                            placeholder = { Text("Ej: klopez26 (máx. 12 caracteres)", fontSize = 12.sp, color = textSecondary) },
                            singleLine = true,
                            supportingText = {
                                Text(
                                    text = "${regUsername.length}/12 caracteres • Solo letras y números",
                                    fontSize = 9.sp,
                                    color = textSecondary
                                )
                            },
                            modifier = Modifier.fillMaxWidth().testTag("reg_username"),
                            shape = RoundedCornerShape(10.dp)
                        )

                        // 3. AUTOCOMPLETADO DE USUARIO PREVIAMENTE REGISTRADO EN EL DISPOSITIVO (REGISTRO)
                        val regUserMatches = remember(regUsername, knownDeviceUsernames, allUsersPublic, registeredAccounts) {
                            val q = regUsername.trim().lowercase()
                            if (q.isEmpty()) emptyList()
                            else {
                                val list = mutableListOf<String>()
                                for (u in knownDeviceUsernames) {
                                    if (u.lowercase().startsWith(q) || u.lowercase().contains(q)) {
                                        if (!list.contains(u)) list.add(u)
                                    }
                                }
                                for (u in allUsersPublic) {
                                    if (u.username.lowercase().startsWith(q) || u.username.lowercase().contains(q)) {
                                        if (!list.contains(u.username)) list.add(u.username)
                                    }
                                }
                                for (acc in registeredAccounts) {
                                    val userFromHolder = acc.accountHolder.lowercase().replace(" ", "_")
                                    if (userFromHolder.startsWith(q) || userFromHolder.contains(q)) {
                                        if (!list.contains(userFromHolder)) list.add(userFromHolder)
                                    }
                                }
                                list.take(3)
                            }
                        }

                        if (regUserMatches.isNotEmpty()) {
                            Spacer(modifier = Modifier.height(4.dp))
                            Row(
                                verticalAlignment = Alignment.CenterVertically,
                                horizontalArrangement = Arrangement.spacedBy(4.dp)
                            ) {
                                Icon(
                                    imageVector = Icons.Default.PhoneAndroid,
                                    contentDescription = null,
                                    tint = LuminaBlue,
                                    modifier = Modifier.size(12.dp)
                                )
                                Text(
                                    text = "Autocompletar usuario previo en este celular:",
                                    fontSize = 9.sp,
                                    fontWeight = FontWeight.Bold,
                                    color = textSecondary
                                )
                            }
                            Spacer(modifier = Modifier.height(2.dp))
                            Row(
                                horizontalArrangement = Arrangement.spacedBy(6.dp),
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .horizontalScroll(rememberScrollState())
                            ) {
                                regUserMatches.forEach { match ->
                                    SuggestionChip(
                                        onClick = {
                                            regUsername = match
                                            Toast.makeText(context, "Cuenta existente: puede iniciar sesión directamente.", Toast.LENGTH_SHORT).show()
                                        },
                                        label = {
                                            Text(
                                                text = "@$match",
                                                fontSize = 11.sp,
                                                fontWeight = FontWeight.Bold,
                                                color = LuminaBlue
                                            )
                                        },
                                        icon = {
                                            Icon(
                                                Icons.Default.AccountCircle,
                                                contentDescription = null,
                                                tint = LuminaBlue,
                                                modifier = Modifier.size(12.dp)
                                            )
                                        },
                                        colors = SuggestionChipDefaults.suggestionChipColors(
                                            containerColor = LuminaBlue.copy(alpha = 0.12f)
                                        ),
                                        border = BorderStroke(width = 1.dp, color = LuminaBlue.copy(alpha = 0.5f))
                                    )
                                }
                            }
                        }

                        Spacer(modifier = Modifier.height(6.dp))

                        // Campo Correo Electrónico (Debe ser real o del dispositivo)
                        val isEmailFromDevice = deviceEmailList.any { it.equals(regEmail.trim(), ignoreCase = true) }
                        val isEmailFormatValid = regEmail.trim().isNotBlank() &&
                            android.util.Patterns.EMAIL_ADDRESS.matcher(regEmail.trim()).matches() &&
                            regEmail.trim().contains(".") &&
                            regEmail.trim().substringAfterLast(".").length >= 2

                        Row(
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.SpaceBetween,
                            modifier = Modifier.fillMaxWidth()
                        ) {
                            Text("Correo Electrónico (Real o de tu dispositivo)", fontSize = 11.sp, fontWeight = FontWeight.SemiBold, color = textPrimary)
                            if (regEmail.isNotBlank()) {
                                if (isEmailFromDevice || isEmailFormatValid) {
                                    Text(
                                        text = if (isEmailFromDevice) "✓ Del dispositivo" else "✓ Correo válido",
                                        fontSize = 10.sp,
                                        fontWeight = FontWeight.Bold,
                                        color = Color(0xFF10B981)
                                    )
                                } else {
                                    Text(
                                        text = "⚠ Correo inválido",
                                        fontSize = 10.sp,
                                        fontWeight = FontWeight.Bold,
                                        color = LuminaRose
                                    )
                                }
                            }
                        }
                        Spacer(modifier = Modifier.height(4.dp))
                        OutlinedTextField(
                            value = regEmail,
                            onValueChange = {
                                regEmail = it
                                emailValidationError = null
                            },
                            placeholder = { Text("Ej: tu.correo@gmail.com", fontSize = 12.sp, color = textSecondary) },
                            singleLine = true,
                            isError = emailValidationError != null || (regEmail.isNotBlank() && !isEmailFormatValid && !isEmailFromDevice),
                            modifier = Modifier.fillMaxWidth().testTag("reg_email"),
                            shape = RoundedCornerShape(10.dp)
                        )

                        if (emailValidationError != null) {
                            Spacer(modifier = Modifier.height(3.dp))
                            Text(
                                text = emailValidationError!!,
                                fontSize = 10.sp,
                                color = LuminaRose,
                                fontWeight = FontWeight.Medium
                            )
                        }

                        // Sugerencias y acceso rápido a correos guardados en el dispositivo
                        if (emailSuggestions.isNotEmpty() || deviceEmailList.isNotEmpty()) {
                            Spacer(modifier = Modifier.height(4.dp))
                            Row(
                                verticalAlignment = Alignment.CenterVertically,
                                horizontalArrangement = Arrangement.spacedBy(4.dp)
                            ) {
                                Icon(
                                    imageVector = Icons.Default.PhoneAndroid,
                                    contentDescription = null,
                                    tint = LuminaBlue,
                                    modifier = Modifier.size(12.dp)
                                )
                                Text(
                                    text = "Correos reales detectados en este dispositivo:",
                                    fontSize = 9.sp,
                                    fontWeight = FontWeight.Bold,
                                    color = textSecondary
                                )
                            }
                            Spacer(modifier = Modifier.height(3.dp))
                            Row(
                                horizontalArrangement = Arrangement.spacedBy(6.dp),
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .horizontalScroll(rememberScrollState())
                            ) {
                                val availableEmailList = (deviceEmailList + emailSuggestions).distinct()
                                availableEmailList.take(4).forEach { suggestion ->
                                    val isSelected = regEmail.trim().equals(suggestion, ignoreCase = true)
                                    SuggestionChip(
                                        onClick = {
                                            regEmail = suggestion
                                            emailValidationError = null
                                        },
                                        label = {
                                            Text(
                                                text = suggestion,
                                                fontSize = 10.sp,
                                                fontWeight = if (isSelected) FontWeight.Bold else FontWeight.Normal,
                                                color = if (isSelected) LuminaBlue else textPrimary
                                            )
                                        },
                                        icon = {
                                            Icon(
                                                if (isSelected) Icons.Default.CheckCircle else Icons.Default.Email,
                                                contentDescription = null,
                                                tint = if (isSelected) Color(0xFF10B981) else LuminaBlue,
                                                modifier = Modifier.size(12.dp)
                                            )
                                        },
                                        colors = SuggestionChipDefaults.suggestionChipColors(
                                            containerColor = if (isSelected) LuminaBlue.copy(alpha = 0.15f) else inputBg
                                        ),
                                        border = BorderStroke(
                                            width = 1.dp,
                                            color = if (isSelected) LuminaBlue else borderColor
                                        )
                                    )
                                }
                            }
                        }

                        Spacer(modifier = Modifier.height(10.dp))

                        // Campo Teléfono Celular
                        Text("Teléfono Celular", fontSize = 11.sp, fontWeight = FontWeight.SemiBold, color = textPrimary)
                        Spacer(modifier = Modifier.height(4.dp))
                        OutlinedTextField(
                            value = regPhone,
                            onValueChange = { regPhone = it },
                            placeholder = { Text("+504 9876-5432", fontSize = 12.sp, color = textSecondary) },
                            singleLine = true,
                            modifier = Modifier.fillMaxWidth().testTag("reg_phone"),
                            shape = RoundedCornerShape(10.dp)
                        )

                        Spacer(modifier = Modifier.height(10.dp))

                        // 2. Campo Contraseña y Validación de Seguridad Criptográfica
                        Text("Contraseña de Acceso", fontSize = 11.sp, fontWeight = FontWeight.SemiBold, color = textPrimary)
                        Spacer(modifier = Modifier.height(4.dp))
                        OutlinedTextField(
                            value = regPassword,
                            onValueChange = {
                                regPassword = it
                                if (passwordValidationError != null) {
                                    passwordValidationError = null
                                }
                            },
                            placeholder = { Text("Mínimo 6 caracteres (contraseña única)", fontSize = 12.sp, color = textSecondary) },
                            singleLine = true,
                            visualTransformation = if (regPasswordVisible) VisualTransformation.None else PasswordVisualTransformation(),
                            trailingIcon = {
                                IconButton(onClick = { regPasswordVisible = !regPasswordVisible }) {
                                    Icon(
                                        imageVector = if (regPasswordVisible) Icons.Default.VisibilityOff else Icons.Default.Visibility,
                                        contentDescription = "Mostrar contraseña",
                                        tint = textSecondary,
                                        modifier = Modifier.size(18.dp)
                                    )
                                }
                            },
                            isError = passwordValidationError != null,
                            modifier = Modifier.fillMaxWidth().testTag("reg_password"),
                            shape = RoundedCornerShape(10.dp)
                        )

                        if (passwordValidationError != null) {
                            Spacer(modifier = Modifier.height(4.dp))
                            Row(
                                verticalAlignment = Alignment.CenterVertically,
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .clip(RoundedCornerShape(8.dp))
                                    .background(LuminaRose.copy(alpha = 0.12f))
                                    .padding(horizontal = 8.dp, vertical = 6.dp)
                            ) {
                                Icon(
                                    imageVector = Icons.Default.Warning,
                                    contentDescription = "Error de contraseña",
                                    tint = LuminaRose,
                                    modifier = Modifier.size(15.dp)
                                )
                                Spacer(modifier = Modifier.width(6.dp))
                                Text(
                                    text = passwordValidationError!!,
                                    fontSize = 10.sp,
                                    color = LuminaRose,
                                    fontWeight = FontWeight.SemiBold
                                )
                            }
                        }

                        Spacer(modifier = Modifier.height(16.dp))

                        Button(
                            onClick = {
                                focusManager.clearFocus()
                                val cleanName = regFullName.trim()
                                val cleanUser = regUsername.trim()
                                val cleanEmail = regEmail.trim()
                                val cleanPass = regPassword.trim()

                                if (cleanName.isBlank() || cleanUser.isBlank()) {
                                    Toast.makeText(context, "Por favor completa nombre y usuario", Toast.LENGTH_SHORT).show()
                                    return@Button
                                }

                                val isEmailFromDev = deviceEmailList.any { it.equals(cleanEmail, ignoreCase = true) }
                                val isRealEmail = cleanEmail.isNotBlank() &&
                                    android.util.Patterns.EMAIL_ADDRESS.matcher(cleanEmail).matches() &&
                                    cleanEmail.contains("@") &&
                                    cleanEmail.substringAfter("@").contains(".") &&
                                    cleanEmail.substringAfterLast(".").length >= 2

                                if (!isRealEmail && !isEmailFromDev) {
                                    emailValidationError = "Ingresa un correo electrónico real (ejemplo@gmail.com) o de tu dispositivo"
                                    Toast.makeText(context, "El correo debe ser real o de tu dispositivo", Toast.LENGTH_LONG).show()
                                    return@Button
                                }

                                if (cleanPass.length < 6) {
                                    passwordValidationError = "La contraseña debe tener al menos 6 caracteres."
                                    Toast.makeText(context, "La contraseña debe tener al menos 6 caracteres.", Toast.LENGTH_SHORT).show()
                                    return@Button
                                }

                                // 4. NOTIFICACIÓN DE BASE DE DATOS VACÍA O CUENTA EXISTENTE ("Inicie sesión")
                                val isDatabaseEmpty = allUsersPublic.isEmpty() && registeredAccounts.isEmpty()
                                val accountAlreadyExists = allUsersPublic.any {
                                    it.username.equals(cleanUser, ignoreCase = true) ||
                                    (it.email.isNotBlank() && it.email.equals(cleanEmail, ignoreCase = true))
                                }

                                if (isDatabaseEmpty || accountAlreadyExists) {
                                    Toast.makeText(context, "Inicie sesión", Toast.LENGTH_SHORT).show()
                                    if (accountAlreadyExists) {
                                        usernameInput = cleanUser
                                        selectedTab = 0
                                        return@Button
                                    }
                                }

                                isRegistering = true
                                coroutineScope.launch {
                                    // 2. VALIDACIÓN DE CONTRASEÑA REPETIDA O USADA ANTERIORMENTE
                                    val isRepeated = onCheckPasswordRepeated?.invoke(cleanPass) ?: false
                                    if (isRepeated) {
                                        isRegistering = false
                                        passwordValidationError = "Esta contraseña ya ha sido utilizada anteriormente. Por seguridad, elija una contraseña única."
                                        Toast.makeText(
                                            context,
                                            "Esta contraseña ya ha sido utilizada anteriormente. Por seguridad, elija una contraseña única.",
                                            Toast.LENGTH_LONG
                                        ).show()
                                        return@launch
                                    }

                                    onRegisterAccount(
                                        cleanName,
                                        cleanUser,
                                        cleanEmail,
                                        regPhone.trim(),
                                        cleanPass
                                    ) { errMsg ->
                                        isRegistering = false
                                        passwordValidationError = errMsg
                                    }
                                }
                            },
                            enabled = !isRegistering,
                            colors = ButtonDefaults.buttonColors(containerColor = LuminaBlue),
                            shape = RoundedCornerShape(12.dp),
                            modifier = Modifier
                                .fillMaxWidth()
                                .height(46.dp)
                                .testTag("btn_submit_register")
                        ) {
                            if (isRegistering) {
                                CircularProgressIndicator(color = Color.White, modifier = Modifier.size(20.dp), strokeWidth = 2.dp)
                            } else {
                                Text("Abrir Cuenta Digital", fontSize = 13.sp, fontWeight = FontWeight.Bold, color = Color.White)
                            }
                        }
                    }
                }
            }

            // =========================================================================
            // MODAL DE AUTENTICACIÓN AL SELECCIONAR UN PERFIL DESTACADO (2 OPCIONES)
            // =========================================================================
            if (selectedUserForModal != null) {
                val user = selectedUserForModal!!
                val initials = user.fullName.split(" ")
                    .filter { it.isNotBlank() }
                    .take(2)
                    .mapNotNull { it.firstOrNull()?.uppercase() }
                    .joinToString("")
                    .ifEmpty { "LB" }

                Dialog(onDismissRequest = {
                    selectedUserForModal = null
                    modalPasswordInput = ""
                    modalErrorMessage = null
                    isAuthenticatingModal = false
                }) {
                    Surface(
                        shape = RoundedCornerShape(24.dp),
                        color = if (isDarkMode) Color(0xFF1E293B) else Color.White,
                        tonalElevation = 8.dp,
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(6.dp)
                    ) {
                        Column(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(18.dp)
                        ) {
                            // Header
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.SpaceBetween,
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Text(
                                    text = "Acceso a Banca Nova",
                                    fontSize = 15.sp,
                                    fontWeight = FontWeight.Bold,
                                    color = textPrimary
                                )
                                IconButton(
                                    onClick = {
                                        selectedUserForModal = null
                                        modalPasswordInput = ""
                                        modalErrorMessage = null
                                    },
                                    modifier = Modifier.size(28.dp)
                                ) {
                                    Icon(Icons.Default.Close, contentDescription = "Cerrar", tint = textSecondary, modifier = Modifier.size(18.dp))
                                }
                            }

                            Spacer(modifier = Modifier.height(12.dp))

                            // Tarjeta de Perfil
                            Card(
                                shape = RoundedCornerShape(14.dp),
                                colors = CardDefaults.cardColors(containerColor = if (isDarkMode) Color(0xFF0F172A) else Color(0xFFF1F5F9)),
                                modifier = Modifier.fillMaxWidth()
                            ) {
                                Row(
                                    modifier = Modifier
                                        .fillMaxWidth()
                                        .padding(12.dp),
                                    verticalAlignment = Alignment.CenterVertically
                                ) {
                                    Box(
                                        modifier = Modifier
                                            .size(46.dp)
                                            .clip(CircleShape)
                                            .background(Brush.linearGradient(listOf(LuminaBlue, LuminaEmerald))),
                                        contentAlignment = Alignment.Center
                                    ) {
                                        Text(
                                            text = initials,
                                            fontSize = 15.sp,
                                            fontWeight = FontWeight.Bold,
                                            color = Color.White
                                        )
                                    }
                                    Spacer(modifier = Modifier.width(10.dp))
                                    Column(modifier = Modifier.weight(1f)) {
                                        Text(
                                            text = user.fullName,
                                            fontSize = 14.sp,
                                            fontWeight = FontWeight.Bold,
                                            color = textPrimary
                                        )
                                        Text(
                                            text = "@${user.username} • ${user.accountNumber}",
                                            fontSize = 11.sp,
                                            color = textSecondary,
                                            fontFamily = FontFamily.Monospace
                                        )
                                        Spacer(modifier = Modifier.height(3.dp))
                                        Row(verticalAlignment = Alignment.CenterVertically) {
                                            Box(
                                                modifier = Modifier
                                                    .clip(RoundedCornerShape(6.dp))
                                                    .background(if (user.biometricRegistered) LuminaEmerald.copy(alpha = 0.15f) else LuminaGold.copy(alpha = 0.15f))
                                                    .padding(horizontal = 6.dp, vertical = 2.dp)
                                            ) {
                                                Row(verticalAlignment = Alignment.CenterVertically) {
                                                    Icon(
                                                        imageVector = if (user.biometricRegistered) Icons.Default.CheckCircle else Icons.Default.Fingerprint,
                                                        contentDescription = null,
                                                        tint = if (user.biometricRegistered) LuminaEmerald else LuminaGold,
                                                        modifier = Modifier.size(10.dp)
                                                    )
                                                    Spacer(modifier = Modifier.width(4.dp))
                                                    Text(
                                                        text = if (user.biometricRegistered) "Huella Vinculada" else "Sin Huella Registrada",
                                                        fontSize = 9.sp,
                                                        fontWeight = FontWeight.Bold,
                                                        color = if (user.biometricRegistered) LuminaEmerald else LuminaGold
                                                    )
                                                }
                                            }
                                        }
                                    }
                                }
                            }

                            Spacer(modifier = Modifier.height(14.dp))

                            // Pestañas / Selector de método: 0 = Contraseña, 1 = Biometría
                            TabRow(
                                selectedTabIndex = modalAuthOption,
                                containerColor = Color.Transparent,
                                contentColor = LuminaBlue,
                                indicator = { tabPositions ->
                                    TabRowDefaults.SecondaryIndicator(
                                        Modifier.tabIndicatorOffset(tabPositions[modalAuthOption]),
                                        color = LuminaBlue,
                                        height = 2.dp
                                    )
                                },
                                divider = { HorizontalDivider(color = borderColor) }
                            ) {
                                Tab(
                                    selected = modalAuthOption == 0,
                                    onClick = { modalAuthOption = 0; modalErrorMessage = null },
                                    text = {
                                        Row(verticalAlignment = Alignment.CenterVertically) {
                                            Icon(Icons.Default.Lock, contentDescription = null, modifier = Modifier.size(14.dp))
                                            Spacer(modifier = Modifier.width(6.dp))
                                            Text("a) Contraseña", fontSize = 12.sp, fontWeight = FontWeight.SemiBold)
                                        }
                                    }
                                )
                                Tab(
                                    selected = modalAuthOption == 1,
                                    onClick = { modalAuthOption = 1; modalErrorMessage = null },
                                    text = {
                                        Row(verticalAlignment = Alignment.CenterVertically) {
                                            Icon(Icons.Default.Fingerprint, contentDescription = null, modifier = Modifier.size(14.dp))
                                            Spacer(modifier = Modifier.width(6.dp))
                                            Text("b) Biometría", fontSize = 12.sp, fontWeight = FontWeight.SemiBold)
                                        }
                                    }
                                )
                            }

                            Spacer(modifier = Modifier.height(14.dp))

                            if (modalErrorMessage != null) {
                                Box(
                                    modifier = Modifier
                                        .fillMaxWidth()
                                        .clip(RoundedCornerShape(8.dp))
                                        .background(LuminaRose.copy(alpha = 0.12f))
                                        .border(1.dp, LuminaRose.copy(alpha = 0.4f), RoundedCornerShape(8.dp))
                                        .padding(horizontal = 10.dp, vertical = 8.dp)
                                ) {
                                    Row(verticalAlignment = Alignment.CenterVertically) {
                                        Icon(Icons.Default.Warning, contentDescription = null, tint = LuminaRose, modifier = Modifier.size(15.dp))
                                        Spacer(modifier = Modifier.width(6.dp))
                                        Text(text = modalErrorMessage!!, fontSize = 11.sp, color = LuminaRose, fontWeight = FontWeight.Medium)
                                    }
                                }
                                Spacer(modifier = Modifier.height(10.dp))
                            }

                            if (modalAuthOption == 0) {
                                // a) Ingreso mediante Contraseña (Validando hash en BD)
                                Text("Introduce tu contraseña registrada:", fontSize = 11.sp, color = textSecondary)
                                Spacer(modifier = Modifier.height(6.dp))
                                OutlinedTextField(
                                    value = modalPasswordInput,
                                    onValueChange = {
                                        modalPasswordInput = it
                                        modalErrorMessage = null
                                    },
                                    placeholder = { Text("••••••••••••", fontSize = 12.sp, color = textSecondary) },
                                    leadingIcon = {
                                        Icon(Icons.Default.Lock, contentDescription = null, tint = textSecondary, modifier = Modifier.size(18.dp))
                                    },
                                    visualTransformation = PasswordVisualTransformation(),
                                    keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Password, imeAction = ImeAction.Done),
                                    keyboardActions = KeyboardActions(onDone = {
                                        if (modalPasswordInput.isNotBlank()) {
                                            isAuthenticatingModal = true
                                            onLoginWithCredentials(user.username, modalPasswordInput)
                                            selectedUserForModal = null
                                        } else {
                                            modalErrorMessage = "Por favor ingresa tu contraseña."
                                        }
                                    }),
                                    singleLine = true,
                                    enabled = !isAuthenticatingModal,
                                    modifier = Modifier.fillMaxWidth().testTag("modal_input_password"),
                                    shape = RoundedCornerShape(12.dp),
                                    colors = OutlinedTextFieldDefaults.colors(
                                        focusedBorderColor = LuminaBlue,
                                        unfocusedBorderColor = borderColor,
                                        focusedContainerColor = inputBg,
                                        unfocusedContainerColor = inputBg
                                    )
                                )
                                Spacer(modifier = Modifier.height(14.dp))
                                Button(
                                    onClick = {
                                        if (modalPasswordInput.isNotBlank()) {
                                            isAuthenticatingModal = true
                                            onLoginWithCredentials(user.username, modalPasswordInput)
                                            selectedUserForModal = null
                                        } else {
                                            modalErrorMessage = "Por favor ingresa tu contraseña."
                                        }
                                    },
                                    enabled = !isAuthenticatingModal,
                                    colors = ButtonDefaults.buttonColors(containerColor = LuminaBlue),
                                    shape = RoundedCornerShape(12.dp),
                                    modifier = Modifier.fillMaxWidth().height(46.dp).testTag("btn_modal_login_pass")
                                ) {
                                    if (isAuthenticatingModal) {
                                        CircularProgressIndicator(color = Color.White, modifier = Modifier.size(18.dp), strokeWidth = 2.dp)
                                    } else {
                                        Text("Verificar Hash e Ingresar", fontSize = 13.sp, fontWeight = FontWeight.Bold, color = Color.White)
                                    }
                                }
                            } else {
                                // b) Ingreso mediante Huella Digital / Biometría
                                Text(
                                    text = "Autentícate con la huella digital registrada en tu celular:",
                                    fontSize = 11.sp,
                                    color = textSecondary
                                )
                                Spacer(modifier = Modifier.height(12.dp))
                                Button(
                                    onClick = {
                                        selectedUserForModal = null
                                        if (biometricStatus != BiometricStatus.AVAILABLE) {
                                            handleFallbackToPassword("Sensor biométrico no disponible en este dispositivo. Ingresa con contraseña.")
                                        } else {
                                            if (onBiometricForUser != null) {
                                                onBiometricForUser(user) { reason -> handleFallbackToPassword(reason) }
                                            } else {
                                                onBiometricClick(user.username) { reason -> handleFallbackToPassword(reason) }
                                            }
                                        }
                                    },
                                    colors = ButtonDefaults.buttonColors(containerColor = LuminaEmerald),
                                    shape = RoundedCornerShape(12.dp),
                                    modifier = Modifier.fillMaxWidth().height(46.dp).testTag("btn_modal_biometric_login")
                                ) {
                                    Icon(Icons.Default.Fingerprint, contentDescription = null, tint = Color.White, modifier = Modifier.size(18.dp))
                                    Spacer(modifier = Modifier.width(8.dp))
                                    Text("Ingresar con Huella Digital", fontSize = 13.sp, fontWeight = FontWeight.Bold, color = Color.White)
                                }

                                Spacer(modifier = Modifier.height(10.dp))

                                // Registro de Huella Digital vinculado a cuenta
                                OutlinedButton(
                                    onClick = {
                                        selectedUserForModal = null
                                        if (onRegisterBiometricForUser != null) {
                                            onRegisterBiometricForUser(user.id)
                                        } else {
                                            Toast.makeText(context, "Iniciando registro de credencial biométrica...", Toast.LENGTH_SHORT).show()
                                        }
                                    },
                                    shape = RoundedCornerShape(12.dp),
                                    modifier = Modifier.fillMaxWidth().height(42.dp).testTag("btn_modal_register_biometric")
                                ) {
                                    Icon(Icons.Default.Key, contentDescription = null, tint = LuminaBlue, modifier = Modifier.size(15.dp))
                                    Spacer(modifier = Modifier.width(6.dp))
                                    Text("Vincular Huella a esta Cuenta", fontSize = 11.sp, fontWeight = FontWeight.SemiBold, color = LuminaBlue)
                                }
                            }
                        }
                    }
                }
            }

            Spacer(modifier = Modifier.height(20.dp))

            // Footer institucional de seguridad
            Row(
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.Center
            ) {
                Icon(
                    imageVector = Icons.Default.Shield,
                    contentDescription = null,
                    tint = textSecondary,
                    modifier = Modifier.size(14.dp)
                )
                Spacer(modifier = Modifier.width(6.dp))
                Text(
                    text = "Autenticación segura respaldada por SAR Honduras",
                    fontSize = 11.sp,
                    color = textSecondary
                )
            }
        }
    }
}

