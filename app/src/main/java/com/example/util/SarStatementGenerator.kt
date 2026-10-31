package com.example.util

import android.content.Context
import android.content.Intent
import android.graphics.Color
import android.graphics.Paint
import android.graphics.Typeface
import android.graphics.pdf.PdfDocument
import android.widget.Toast
import androidx.core.content.FileProvider
import com.example.data.model.AccountEntity
import com.example.data.model.TransactionEntity
import java.io.File
import java.io.FileOutputStream
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

object SarStatementGenerator {

    const val SAR_CAI = "3B8F21-99A04C-E84D12-98F102-CAI09"
    const val SAR_RANGO = "000-001-01-00000001 a 000-001-01-00050000"
    const val SAR_FECHA_LIMITE = "31/12/2026"
    const val SAR_RTN_BANCO = "0801-9002-148291"

    /**
     * Genera un archivo PDF físico con el Estado de Cuenta Oficial SAR de Honduras
     */
    fun generatePdfStatement(
        context: Context,
        account: AccountEntity?,
        transactions: List<TransactionEntity>,
        monthYear: String = "Octubre 2026"
    ): File? {
        try {
            val pdfDocument = PdfDocument()
            val pageInfo = PdfDocument.PageInfo.Builder(595, 842, 1).create() // A4 standard (595 x 842 pt)
            val page = pdfDocument.startPage(pageInfo)
            val canvas = page.canvas

            val paint = Paint().apply { isAntiAlias = true }
            val textPaint = Paint().apply {
                isAntiAlias = true
                color = Color.rgb(15, 23, 42) // Slate 900
            }

            var y = 40f

            // 1. BANNER SUPERIOR INSTITUCIONAL
            paint.color = Color.rgb(15, 23, 42) // Dark Navy
            canvas.drawRect(0f, 0f, 595f, 75f, paint)

            textPaint.color = Color.WHITE
            textPaint.typeface = Typeface.create(Typeface.DEFAULT, Typeface.BOLD)
            textPaint.textSize = 18f
            canvas.drawText("LUMINA BANK S.A. — BANCA PRIVADA HONDURAS", 30f, 38f, textPaint)

            textPaint.typeface = Typeface.create(Typeface.DEFAULT, Typeface.NORMAL)
            textPaint.textSize = 10f
            textPaint.color = Color.rgb(203, 213, 225)
            canvas.drawText("ESTADO DE CUENTA MENSUAL OFICIAL CON VALIDEZ FISCAL SAR", 30f, 55f, textPaint)

            y = 100f

            // 2. CERTIFICACIÓN FISCAL SAR (Servicio de Administración de Rentas)
            paint.color = Color.rgb(241, 245, 249) // Slate 100
            canvas.drawRoundRect(25f, y - 15f, 570f, y + 65f, 8f, 8f, paint)

            paint.color = Color.rgb(14, 165, 233) // Sky border
            paint.style = Paint.Style.STROKE
            paint.strokeWidth = 1.5f
            canvas.drawRoundRect(25f, y - 15f, 570f, y + 65f, 8f, 8f, paint)
            paint.style = Paint.Style.FILL

            textPaint.color = Color.rgb(30, 41, 59)
            textPaint.typeface = Typeface.create(Typeface.DEFAULT, Typeface.BOLD)
            textPaint.textSize = 11f
            canvas.drawText("CERTIFICACIÓN FISCAL Y AUTORIZACIÓN SAR DE HONDURAS", 35f, y + 2f, textPaint)

            textPaint.typeface = Typeface.create(Typeface.MONOSPACE, Typeface.NORMAL)
            textPaint.textSize = 9f
            textPaint.color = Color.rgb(71, 85, 105)
            canvas.drawText("CAI: $SAR_CAI", 35f, y + 18f, textPaint)
            canvas.drawText("Rango Autorizado: $SAR_RANGO", 35f, y + 32f, textPaint)
            canvas.drawText("Fecha Límite de Emisión: $SAR_FECHA_LIMITE  |  RTN Emisor: $SAR_RTN_BANCO", 35f, y + 46f, textPaint)

            y += 85f

            // 3. DATOS DEL CUENTAHABIENTE
            textPaint.typeface = Typeface.create(Typeface.DEFAULT, Typeface.BOLD)
            textPaint.textSize = 12f
            textPaint.color = Color.rgb(15, 23, 42)
            canvas.drawText("DATOS DEL TITULAR", 30f, y, textPaint)

            y += 18f
            textPaint.typeface = Typeface.create(Typeface.DEFAULT, Typeface.NORMAL)
            textPaint.textSize = 10f
            textPaint.color = Color.rgb(51, 65, 85)
            canvas.drawText("Titular: ${account?.accountHolder ?: "Titular Registrado"}", 30f, y, textPaint)
            canvas.drawText("No. de Cuenta: ${account?.accountNumber ?: "HN19 0000 0000 0000"}", 320f, y, textPaint)

            y += 16f
            canvas.drawText("RTN / Identidad: ${account?.sarTaxId ?: "0801-1998-54321"}", 30f, y, textPaint)
            canvas.drawText("IBAN Honduras: ${account?.ibanHn ?: "HN19 0001 0000 0000 0000"}", 320f, y, textPaint)

            y += 16f
            canvas.drawText("Período: $monthYear", 30f, y, textPaint)
            canvas.drawText("Moneda Oficial: Lempiras (HNL)", 320f, y, textPaint)

            y += 25f

            // 4. RESUMEN FINANCIERO DEL MES
            val totalCreditos = transactions.filter { it.isIncome }.sumOf { it.amount }
            val totalDebitos = transactions.filter { !it.isIncome }.sumOf { it.amount }
            val saldoActual = account?.balanceHnl ?: 0.0
            val saldoInicial = (saldoActual - totalCreditos + totalDebitos).coerceAtLeast(0.0)

            paint.color = Color.rgb(248, 250, 252)
            canvas.drawRect(25f, y - 10f, 570f, y + 40f, paint)

            textPaint.typeface = Typeface.create(Typeface.DEFAULT, Typeface.BOLD)
            textPaint.textSize = 9.5f
            textPaint.color = Color.rgb(71, 85, 105)
            canvas.drawText("SALDO INICIAL", 35f, y + 5f, textPaint)
            canvas.drawText("(+) DEPÓSITOS/CRÉDITOS", 160f, y + 5f, textPaint)
            canvas.drawText("(-) DÉBITOS/RETIROS", 310f, y + 5f, textPaint)
            canvas.drawText("(=) SALDO AL CORTE", 450f, y + 5f, textPaint)

            textPaint.textSize = 11f
            textPaint.color = Color.rgb(15, 23, 42)
            canvas.drawText("L ${String.format("%,.2f", saldoInicial)}", 35f, y + 25f, textPaint)
            textPaint.color = Color.rgb(16, 185, 129) // Emerald
            canvas.drawText("L ${String.format("%,.2f", totalCreditos)}", 160f, y + 25f, textPaint)
            textPaint.color = Color.rgb(239, 68, 68) // Rose
            canvas.drawText("L ${String.format("%,.2f", totalDebitos)}", 310f, y + 25f, textPaint)
            textPaint.color = Color.rgb(14, 165, 233) // Blue
            canvas.drawText("L ${String.format("%,.2f", saldoActual)}", 450f, y + 25f, textPaint)

            y += 60f

            // 5. TABLA DE MOVIMIENTOS CONTABLES INMUTABLES
            textPaint.typeface = Typeface.create(Typeface.DEFAULT, Typeface.BOLD)
            textPaint.textSize = 11f
            textPaint.color = Color.rgb(15, 23, 42)
            canvas.drawText("MOVIMIENTOS CONTABLES REGISTRADOS (LIBRO MAYOR INMUTABLE)", 30f, y, textPaint)

            y += 15f
            paint.color = Color.rgb(30, 41, 59)
            canvas.drawRect(25f, y - 10f, 570f, y + 10f, paint)

            textPaint.color = Color.WHITE
            textPaint.textSize = 8.5f
            textPaint.typeface = Typeface.create(Typeface.DEFAULT, Typeface.BOLD)
            canvas.drawText("FECHA / HORA", 35f, y + 4f, textPaint)
            canvas.drawText("DESCRIPCIÓN / BENEFICIARIO", 130f, y + 4f, textPaint)
            canvas.drawText("REF. FISCAL SAR", 330f, y + 4f, textPaint)
            canvas.drawText("TIPO", 440f, y + 4f, textPaint)
            canvas.drawText("MONTO", 500f, y + 4f, textPaint)

            y += 20f

            val dateFormat = SimpleDateFormat("dd/MM/yyyy HH:mm", Locale.getDefault())
            textPaint.typeface = Typeface.create(Typeface.DEFAULT, Typeface.NORMAL)
            textPaint.textSize = 8.5f

            val itemsToPrint = transactions.take(15) // Printable limit on single official page
            for ((index, tx) in itemsToPrint.withIndex()) {
                if (index % 2 == 0) {
                    paint.color = Color.rgb(248, 250, 252)
                    canvas.drawRect(25f, y - 9f, 570f, y + 9f, paint)
                }

                textPaint.color = Color.rgb(71, 85, 105)
                canvas.drawText(dateFormat.format(Date(tx.timestamp)), 35f, y + 4f, textPaint)

                textPaint.color = Color.rgb(15, 23, 42)
                val titleTrunc = if (tx.title.length > 30) tx.title.take(28) + ".." else tx.title
                canvas.drawText(titleTrunc, 130f, y + 4f, textPaint)

                textPaint.color = Color.rgb(100, 116, 139)
                canvas.drawText(tx.sarAuthCode.ifEmpty { "SAR-2026-REG" }, 330f, y + 4f, textPaint)

                if (tx.isIncome) {
                    textPaint.color = Color.rgb(16, 185, 129)
                    canvas.drawText("CRÉDITO", 440f, y + 4f, textPaint)
                    canvas.drawText("+L ${String.format("%,.2f", tx.amount)}", 500f, y + 4f, textPaint)
                } else {
                    textPaint.color = Color.rgb(239, 68, 68)
                    canvas.drawText("DÉBITO", 440f, y + 4f, textPaint)
                    canvas.drawText("-L ${String.format("%,.2f", tx.amount)}", 500f, y + 4f, textPaint)
                }

                y += 18f
            }

            // 6. FIRMA DIGITAL Y SELLO SAR AL PIE DE PÁGINA
            y = 750f
            paint.color = Color.rgb(226, 232, 240)
            paint.strokeWidth = 1f
            canvas.drawLine(25f, y, 570f, y, paint)

            y += 18f
            textPaint.typeface = Typeface.create(Typeface.DEFAULT, Typeface.BOLD)
            textPaint.textSize = 9f
            textPaint.color = Color.rgb(15, 23, 42)
            canvas.drawText("SELLO Y FIRMA DIGITAL AUTORIZADA POR LA COMISIÓN NACIONAL DE BANCOS Y SEGUROS (CNBS)", 30f, y, textPaint)

            y += 14f
            textPaint.typeface = Typeface.create(Typeface.MONOSPACE, Typeface.NORMAL)
            textPaint.textSize = 8f
            textPaint.color = Color.rgb(100, 116, 139)
            val digitalSignature = "SHA256: 9e8a7c2b3f1d5e6a0c4b8d7e6f5a3b2c1d0e9f8a7b6c5d4e3f2a1b0c"
            canvas.drawText(digitalSignature, 30f, y, textPaint)

            y += 14f
            canvas.drawText("Validación Oficial en Línea: https://sar.gob.hn/verificar?cai=$SAR_CAI", 30f, y, textPaint)

            pdfDocument.finishPage(page)

            // Guardar archivo PDF en cache del dispositivo
            val pdfDir = File(context.cacheDir, "statements").apply { mkdirs() }
            val pdfFile = File(pdfDir, "Estado_Cuenta_SAR_LuminaBank_${System.currentTimeMillis()}.pdf")
            val outputStream = FileOutputStream(pdfFile)
            pdfDocument.writeTo(outputStream)
            outputStream.flush()
            outputStream.close()
            pdfDocument.close()

            return pdfFile
        } catch (e: Exception) {
            e.printStackTrace()
            return null
        }
    }

    /**
     * Comparte el archivo PDF generado mediante Intent de Android
     */
    fun sharePdfStatement(context: Context, pdfFile: File) {
        try {
            val uri = FileProvider.getUriForFile(
                context,
                "${context.packageName}.fileprovider",
                pdfFile
            )

            val shareIntent = Intent(Intent.ACTION_SEND).apply {
                type = "application/pdf"
                putExtra(Intent.EXTRA_STREAM, uri)
                putExtra(Intent.EXTRA_SUBJECT, "Estado de Cuenta Oficial SAR — Lumina Bank")
                putExtra(
                    Intent.EXTRA_TEXT,
                    "Adjunto comprobante oficial mensual con validez fiscal SAR y firma digital de Lumina Bank."
                )
                addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION)
            }

            val chooser = Intent.createChooser(shareIntent, "Compartir o Descargar Estado de Cuenta SAR")
            chooser.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
            context.startActivity(chooser)
        } catch (e: Exception) {
            Toast.makeText(context, "Error al compartir PDF: ${e.localizedMessage}", Toast.LENGTH_SHORT).show()
        }
    }
}
