package com.example.ui.theme

import android.os.Build
import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.material3.dynamicDarkColorScheme
import androidx.compose.material3.dynamicLightColorScheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext

private val DarkColorScheme = darkColorScheme(
    primary = LuminaBlue,
    onPrimary = Color.White,
    primaryContainer = LuminaBlueDark,
    onPrimaryContainer = Color.White,
    secondary = LuminaGold,
    onSecondary = Color.Black,
    secondaryContainer = Color(0xFF452200),
    onSecondaryContainer = LuminaGoldLight,
    tertiary = LuminaEmerald,
    onTertiary = Color.White,
    background = LuminaNavyDark,
    onBackground = TextPrimaryDark,
    surface = LuminaNavy,
    onSurface = TextPrimaryDark,
    surfaceVariant = LuminaCardDark,
    onSurfaceVariant = TextSecondaryDark,
    outline = Color(0xFF334155),
    outlineVariant = Color(0xFF1E293B),
    error = LuminaRose,
    onError = Color.White
)

private val LightColorScheme = lightColorScheme(
    primary = LuminaBlue,
    onPrimary = Color.White,
    primaryContainer = Color(0xFFD6E4FF),
    onPrimaryContainer = LuminaBlueDark,
    secondary = LuminaGold,
    onSecondary = Color.Black,
    secondaryContainer = Color(0xFFFEF3C7),
    onSecondaryContainer = Color(0xFF78350F),
    tertiary = LuminaEmerald,
    onTertiary = Color.White,
    background = LuminaBgLight,
    onBackground = TextPrimaryLight,
    surface = LuminaSurfaceLight,
    onSurface = TextPrimaryLight,
    surfaceVariant = Color(0xFFF1F5F9),
    onSurfaceVariant = TextSecondaryLight,
    outline = Color(0xFFCBD5E1),
    outlineVariant = Color(0xFFE2E8F0),
    error = LuminaRose,
    onError = Color.White
)

@Composable
fun LuminaTheme(
    darkTheme: Boolean = true, // Default to sleek executive dark mode for fintech luxury
    dynamicColor: Boolean = false,
    content: @Composable () -> Unit
) {
    val colorScheme = when {
        dynamicColor && Build.VERSION.SDK_INT >= Build.VERSION_CODES.S -> {
            val context = LocalContext.current
            if (darkTheme) dynamicDarkColorScheme(context) else dynamicLightColorScheme(context)
        }
        darkTheme -> DarkColorScheme
        else -> LightColorScheme
    }

    MaterialTheme(
        colorScheme = colorScheme,
        typography = Typography,
        content = content
    )
}
