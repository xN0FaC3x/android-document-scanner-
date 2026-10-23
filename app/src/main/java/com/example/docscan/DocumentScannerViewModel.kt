package com.example.docscan

import android.net.Uri
import androidx.lifecycle.ViewModel
import com.google.mlkit.vision.documentscanner.GmsDocumentScanningResult
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import java.text.SimpleDateFormat
import java.util.*

data class ScannedDocumentItem(
    val id: String = UUID.randomUUID().toString(),
    val title: String,
    val pageCount: Int,
    val pageUris: List<Uri>,
    val pageRotations: List<Float> = emptyList(),
    val pdfUri: Uri?,
    val formattedDate: String
)

class DocumentScannerViewModel : ViewModel() {

    private val _scannedDocuments = MutableStateFlow<List<ScannedDocumentItem>>(emptyList())
    val scannedDocuments: StateFlow<List<ScannedDocumentItem>> = _scannedDocuments.asStateFlow()

    fun onScanSuccess(result: GmsDocumentScanningResult) {
        val dateFormat = SimpleDateFormat("MMM d, yyyy h:mm a", Locale.getDefault())
        val currentDate = dateFormat.format(Date())

        val pdf = result.pdf
        val pages = result.pages ?: emptyList()
        val pageUris = pages.map { it.imageUri }

        val newDoc = ScannedDocumentItem(
            title = "Document ${_scannedDocuments.value.size + 1}",
            pageCount = pdf?.pageCount ?: pages.size,
            pageUris = pageUris,
            pageRotations = List(pageUris.size) { 0f },
            pdfUri = pdf?.uri,
            formattedDate = currentDate
        )

        _scannedDocuments.value = listOf(newDoc) + _scannedDocuments.value
    }

    fun rotatePage(documentId: String, pageIndex: Int, deltaDegrees: Float) {
        _scannedDocuments.value = _scannedDocuments.value.map { doc ->
            if (doc.id == documentId && pageIndex in doc.pageRotations.indices) {
                val updatedRotations = doc.pageRotations.toMutableList()
                val newAngle = (updatedRotations[pageIndex] + deltaDegrees) % 360f
                updatedRotations[pageIndex] = if (newAngle < 0) newAngle + 360f else newAngle
                doc.copy(pageRotations = updatedRotations)
            } else {
                doc
            }
        }
    }
}
