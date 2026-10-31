package com.example.security

import android.content.Context
import android.content.SharedPreferences
import android.os.Build
import androidx.biometric.BiometricManager
import androidx.biometric.BiometricPrompt
import androidx.core.content.ContextCompat
import androidx.fragment.app.FragmentActivity

enum class BiometricStatus {
    AVAILABLE,
    NOT_ENROLLED,
    NO_HARDWARE,
    HW_UNAVAILABLE,
    SECURITY_UPDATE_REQUIRED,
    UNSUPPORTED
}

class BiometricHelper(private val context: Context) {

    private val prefs: SharedPreferences =
        context.getSharedPreferences("lumina_security_prefs", Context.MODE_PRIVATE)

    companion object {
        const val PREF_BIOMETRIC_ENABLED = "pref_biometric_enabled"
        const val PREF_BIOMETRIC_TRANSFERS = "pref_biometric_transfers"
        const val PREF_SECURITY_PIN = "pref_security_pin"
        const val PREF_DARK_MODE = "pref_dark_mode"
        const val DEFAULT_PIN = "1234"
    }

    var isDarkMode: Boolean
        get() = prefs.getBoolean(PREF_DARK_MODE, true)
        set(value) = prefs.edit().putBoolean(PREF_DARK_MODE, value).apply()

    var isBiometricEnabled: Boolean
        get() = prefs.getBoolean(PREF_BIOMETRIC_ENABLED, true)
        set(value) = prefs.edit().putBoolean(PREF_BIOMETRIC_ENABLED, value).apply()

    var isBiometricForTransfersRequired: Boolean
        get() = prefs.getBoolean(PREF_BIOMETRIC_TRANSFERS, true)
        set(value) = prefs.edit().putBoolean(PREF_BIOMETRIC_TRANSFERS, value).apply()

    var securityPin: String
        get() = prefs.getString(PREF_SECURITY_PIN, DEFAULT_PIN) ?: DEFAULT_PIN
        set(value) = prefs.edit().putString(PREF_SECURITY_PIN, value).apply()

    fun checkBiometricStatus(): BiometricStatus {
        val biometricManager = BiometricManager.from(context)
        val authenticators = BiometricManager.Authenticators.BIOMETRIC_STRONG or BiometricManager.Authenticators.BIOMETRIC_WEAK

        return when (biometricManager.canAuthenticate(authenticators)) {
            BiometricManager.BIOMETRIC_SUCCESS -> BiometricStatus.AVAILABLE
            BiometricManager.BIOMETRIC_ERROR_NONE_ENROLLED -> BiometricStatus.NOT_ENROLLED
            BiometricManager.BIOMETRIC_ERROR_NO_HARDWARE -> BiometricStatus.NO_HARDWARE
            BiometricManager.BIOMETRIC_ERROR_HW_UNAVAILABLE -> BiometricStatus.HW_UNAVAILABLE
            BiometricManager.BIOMETRIC_ERROR_SECURITY_UPDATE_REQUIRED -> BiometricStatus.SECURITY_UPDATE_REQUIRED
            else -> BiometricStatus.UNSUPPORTED
        }
    }

    private var isPromptActive = false

    /**
     * Autenticación estricta con la huella ya registrada en el celular mediante BiometricPrompt nativo.
     * Si el usuario cancela, presiona "Ingresar con contraseña", o no tiene huellas,
     * se redirige fluidamente mediante [onFallbackToPassword].
     */
    fun promptBiometric(
        activity: FragmentActivity,
        title: String = "Lumina Banca",
        subtitle: String = "Confirma tu huella registrada en el celular",
        negativeButtonText: String = "Ingresar con contraseña",
        onSuccess: () -> Unit,
        onFallbackToPassword: (reason: String) -> Unit,
        onError: (errorCode: Int, errString: String) -> Unit,
        onFailed: () -> Unit = {}
    ) {
        if (isPromptActive) {
            // Evitar múltiples solicitudes concurrentes del diálogo biométrico nativo
            return
        }

        val status = checkBiometricStatus()
        if (status != BiometricStatus.AVAILABLE) {
            val message = when (status) {
                BiometricStatus.NOT_ENROLLED -> "Tu celular no tiene huellas dactilares registradas en los ajustes del sistema. Por favor ingresa con tu contraseña."
                BiometricStatus.NO_HARDWARE -> "Este celular no posee sensor de huella dactilar. Por favor ingresa con tu contraseña."
                BiometricStatus.HW_UNAVAILABLE -> "Sensor biométrico ocupado o no disponible. Ingresa con tu contraseña."
                else -> "Biometría no disponible en este dispositivo. Ingresa con tu contraseña."
            }
            onFallbackToPassword(message)
            return
        }

        isPromptActive = true
        val executor = ContextCompat.getMainExecutor(activity)
        val callback = object : BiometricPrompt.AuthenticationCallback() {
            override fun onAuthenticationSucceeded(result: BiometricPrompt.AuthenticationResult) {
                super.onAuthenticationSucceeded(result)
                isPromptActive = false
                onSuccess()
            }

            override fun onAuthenticationError(errorCode: Int, errString: CharSequence) {
                super.onAuthenticationError(errorCode, errString)
                isPromptActive = false
                when (errorCode) {
                    BiometricPrompt.ERROR_NEGATIVE_BUTTON -> {
                        // El usuario seleccionó explícitamente "Ingresar con contraseña"
                        onFallbackToPassword("Ingresa tu contraseña para acceder a Banca en Línea.")
                    }
                    BiometricPrompt.ERROR_USER_CANCELED, BiometricPrompt.ERROR_CANCELED -> {
                        // Diálogo cancelado por el usuario o por el sistema
                        onFallbackToPassword("Autenticación con huella cancelada. Puedes ingresar con tu contraseña.")
                    }
                    BiometricPrompt.ERROR_LOCKOUT, BiometricPrompt.ERROR_LOCKOUT_PERMANENT -> {
                        // Bloqueo temporal o permanente del lector por demasiados intentos fallidos
                        onFallbackToPassword("Sensor de huellas bloqueado por seguridad. Ingresa tu contraseña.")
                    }
                    BiometricPrompt.ERROR_NO_BIOMETRICS -> {
                        onFallbackToPassword("No hay huellas registradas en el sistema operativo. Ingresa con tu contraseña.")
                    }
                    BiometricPrompt.ERROR_TIMEOUT -> {
                        onFallbackToPassword("Tiempo de espera del lector agotado. Ingresa con tu contraseña.")
                    }
                    else -> {
                        onError(errorCode, errString.toString())
                    }
                }
            }

            override fun onAuthenticationFailed() {
                super.onAuthenticationFailed()
                // Huella leída pero no coincide con ninguna registrada en el dispositivo
                onFailed()
            }
        }

        try {
            val promptInfo = BiometricPrompt.PromptInfo.Builder()
                .setTitle(title)
                .setSubtitle(subtitle)
                .setNegativeButtonText(negativeButtonText)
                .setAllowedAuthenticators(BiometricManager.Authenticators.BIOMETRIC_STRONG or BiometricManager.Authenticators.BIOMETRIC_WEAK)
                .setConfirmationRequired(false)
                .build()

            val biometricPrompt = BiometricPrompt(activity, executor, callback)
            biometricPrompt.authenticate(promptInfo)
        } catch (e: Exception) {
            isPromptActive = false
            onFallbackToPassword("No fue posible abrir el sensor biométrico del teléfono. Ingresa con tu contraseña.")
        }
    }

    fun verifyPin(inputPin: String): Boolean {
        return inputPin == securityPin
    }
}
