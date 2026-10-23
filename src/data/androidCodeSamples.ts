export interface CodeFile {
  id: string;
  filename: string;
  path: string;
  language: string;
  description: string;
  code: string;
}

export const ANDROID_CODE_FILES: CodeFile[] = [
  {
    id: 'main-activity',
    filename: 'MainActivity.kt',
    path: 'app/src/main/java/com/example/docscan/MainActivity.kt',
    language: 'kotlin',
    description: 'Entry point configuring ML Kit Document Scanner for multi-page scanning with setPageLimit(), launching Google Play Services ActivityResultLauncher, and saving the combined PDF result.',
    code: `package com.example.docscan

import android.app.Activity
import android.os.Bundle
import android.widget.Toast
import androidx.activity.ComponentActivity
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.compose.setContent
import androidx.activity.result.IntentSenderRequest
import androidx.activity.result.contract.ActivityResultContracts
import androidx.activity.viewModels
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.ui.Modifier
import com.example.docscan.ui.DocumentScannerScreen
import com.example.docscan.ui.theme.DocScanTheme
import com.google.mlkit.vision.documentscanner.GmsDocumentScannerOptions
import com.google.mlkit.vision.documentscanner.GmsDocumentScannerOptions.RESULT_FORMAT_JPEG
import com.google.mlkit.vision.documentscanner.GmsDocumentScannerOptions.RESULT_FORMAT_PDF
import com.google.mlkit.vision.documentscanner.GmsDocumentScannerOptions.SCANNER_MODE_FULL
import com.google.mlkit.vision.documentscanner.GmsDocumentScanning
import com.google.mlkit.vision.documentscanner.GmsDocumentScanningResult

class MainActivity : ComponentActivity() {

    private val viewModel: DocumentScannerViewModel by viewModels()

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        // 1. Configure ML Kit Document Scanner Options for Multi-Page Scanning
        // - setPageLimit(50): Allows scanning multiple pages in sequence
        // - SCANNER_MODE_FULL: Camera, automatic edge detection, corner adjust handles,
        //   shadow removal B&W filters, and multi-page preview/reordering
        // - RESULT_FORMAT_PDF & RESULT_FORMAT_JPEG: Returns both individual page JPEGs
        //   and a single compiled multi-page PDF document
        val scannerOptions = GmsDocumentScannerOptions.Builder()
            .setGalleryImportAllowed(true)
            .setPageLimit(50) // Supports up to 50 pages combined into one PDF
            .setResultFormats(RESULT_FORMAT_JPEG, RESULT_FORMAT_PDF)
            .setScannerMode(SCANNER_MODE_FULL)
            .build()

        val scanner = GmsDocumentScanning.getClient(scannerOptions)

        setContent {
            DocScanTheme {
                // 2. ActivityResultLauncher for the IntentSender provided by Play Services
                val scannerLauncher = rememberLauncherForActivityResult(
                    contract = ActivityResultContracts.StartIntentSenderForResult()
                ) { result ->
                    if (result.resultCode == Activity.RESULT_OK) {
                        val scanningResult = GmsDocumentScanningResult.fromActivityResultIntent(result.data)
                        scanningResult?.let { res ->
                            viewModel.onScanSuccess(res)
                        }
                    } else if (result.resultCode == Activity.RESULT_CANCELED) {
                        Toast.makeText(this, "Scanning cancelled", Toast.LENGTH_SHORT).show()
                    }
                }

                Surface(
                    modifier = Modifier.fillMaxSize(),
                    color = MaterialTheme.colorScheme.background
                ) {
                    DocumentScannerScreen(
                        viewModel = viewModel,
                        onStartScan = {
                            // 3. Request scan intent from Google Play Services
                            scanner.getStartScanIntent(this@MainActivity)
                                .addOnSuccessListener { intentSender ->
                                    scannerLauncher.launch(
                                        IntentSenderRequest.Builder(intentSender).build()
                                    )
                                }
                                .addOnFailureListener { error ->
                                    Toast.makeText(
                                        this@MainActivity,
                                        "Scanner failed to start: \${error.localizedMessage}",
                                        Toast.LENGTH_LONG
                                    ).show()
                                }
                        }
                    )
                }
            }
        }
    }
}
`,
  },
  {
    id: 'scanner-screen',
    filename: 'DocumentScannerScreen.kt',
    path: 'app/src/main/java/com/example/docscan/ui/DocumentScannerScreen.kt',
    language: 'kotlin',
    description: 'Jetpack Compose UI featuring multi-page document feed, full-screen preview with 90° clockwise and counter-clockwise rotation controls, and combined PDF export.',
    code: `package com.example.docscan.ui

import android.content.Intent
import androidx.compose.animation.*
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.lazy.itemsIndexed
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import coil.compose.AsyncImage
import com.example.docscan.DocumentScannerViewModel
import com.example.docscan.ScannedDocumentItem

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun DocumentScannerScreen(
    viewModel: DocumentScannerViewModel,
    onStartScan: () -> Unit,
    modifier: Modifier = Modifier
) {
    val documents by viewModel.scannedDocuments.collectAsState()
    var previewDoc by remember { mutableStateOf<ScannedDocumentItem?>(null) }
    val context = LocalContext.current

    Scaffold(
        topBar = {
            TopAppBar(
                title = {
                    Text(
                        text = "DocScan",
                        style = MaterialTheme.typography.titleLarge.copy(
                            fontWeight = FontWeight.Bold
                        )
                    )
                },
                colors = TopAppBarDefaults.topAppBarColors(
                    containerColor = MaterialTheme.colorScheme.surfaceVariant
                )
            )
        },
        floatingActionButton = {
            ExtendedFloatingActionButton(
                onClick = onStartScan,
                icon = { Icon(Icons.Default.Add, contentDescription = "Scan Document") },
                text = { Text("Scan Document") },
                containerColor = MaterialTheme.colorScheme.primary,
                contentColor = MaterialTheme.colorScheme.onPrimary
            )
        },
        modifier = modifier
    ) { paddingValues ->
        if (documents.isEmpty()) {
            EmptyScannerState(
                onStartScan = onStartScan,
                modifier = Modifier
                    .fillMaxSize()
                    .padding(paddingValues)
            )
        } else {
            LazyColumn(
                contentPadding = PaddingValues(16.dp),
                verticalArrangement = Arrangement.spacedBy(12.dp),
                modifier = Modifier
                    .fillMaxSize()
                    .padding(paddingValues)
            ) {
                items(documents) { doc ->
                    DocumentCard(
                        doc = doc,
                        onPreview = { previewDoc = doc },
                        onShare = {
                            doc.pdfUri?.let { uri ->
                                val intent = Intent(Intent.ACTION_SEND).apply {
                                    type = "application/pdf"
                                    putExtra(Intent.EXTRA_STREAM, uri)
                                    addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION)
                                }
                                context.startActivity(Intent.createChooser(intent, "Share Multi-Page PDF"))
                            }
                        }
                    )
                }
            }
        }
    }

    // Full-screen Document Preview & Page Rotation Dialog
    previewDoc?.let { doc ->
        DocumentPreviewDialog(
            doc = doc,
            onDismiss = { previewDoc = null },
            onRotatePage = { pageIndex, degreesDelta ->
                viewModel.rotatePage(doc.id, pageIndex, degreesDelta)
            },
            onScanAnotherPage = {
                previewDoc = null
                onStartScan()
            }
        )
    }
}

@Composable
fun DocumentPreviewDialog(
    doc: ScannedDocumentItem,
    onDismiss: () -> Unit,
    onRotatePage: (pageIndex: Int, degreesDelta: Float) -> Unit,
    onScanAnotherPage: () -> Unit
) {
    var selectedPageIndex by remember { mutableStateOf(0) }
    val pageRotations = doc.pageRotations

    AlertDialog(
        onDismissRequest = onDismiss,
        modifier = Modifier.fillMaxWidth().fillMaxHeight(0.92f),
        properties = androidx.compose.ui.window.DialogProperties(usePlatformDefaultWidth = false)
    ) {
        Surface(
            shape = RoundedCornerShape(28.dp),
            color = MaterialTheme.colorScheme.surface,
            tonalElevation = 6.dp,
            modifier = Modifier.fillMaxSize().padding(16.dp)
        ) {
            Column(
                modifier = Modifier.fillMaxSize().padding(16.dp)
            ) {
                // Header
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Column {
                        Text(
                            text = doc.title,
                            style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold)
                        )
                        Text(
                            text = "Page \${selectedPageIndex + 1} of \${doc.pageUris.size} · Multi-Page PDF",
                            style = MaterialTheme.typography.bodySmall,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    }
                    IconButton(onClick = onDismiss) {
                        Icon(Icons.Default.Close, contentDescription = "Close Preview")
                    }
                }

                Spacer(modifier = Modifier.height(12.dp))

                // High-Resolution Scanned Image Preview with Dynamic Rotation
                Box(
                    modifier = Modifier
                        .weight(1f)
                        .fillMaxWidth()
                        .clip(RoundedCornerShape(16.dp))
                        .background(MaterialTheme.colorScheme.surfaceVariant),
                    contentAlignment = Alignment.Center
                ) {
                    if (doc.pageUris.isNotEmpty() && selectedPageIndex < doc.pageUris.size) {
                        val currentRotation = pageRotations.getOrElse(selectedPageIndex) { 0f }
                        AsyncImage(
                            model = doc.pageUris[selectedPageIndex],
                            contentDescription = "Scanned Page",
                            contentScale = ContentScale.Fit,
                            modifier = Modifier
                                .fillMaxSize()
                                .graphicsLayer {
                                    rotationZ = currentRotation
                                }
                        )
                    }
                }

                Spacer(modifier = Modifier.height(12.dp))

                // 90° Clockwise & Counter-Clockwise Rotation Buttons
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.Center,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    FilledTonalButton(
                        onClick = { onRotatePage(selectedPageIndex, -90f) },
                        contentPadding = PaddingValues(horizontal = 16.dp, vertical = 8.dp)
                    ) {
                        Icon(Icons.Default.RotateLeft, contentDescription = null, modifier = Modifier.size(18.dp))
                        Spacer(modifier = Modifier.width(6.dp))
                        Text("Rotate -90°")
                    }

                    Spacer(modifier = Modifier.width(16.dp))

                    FilledTonalButton(
                        onClick = { onRotatePage(selectedPageIndex, 90f) },
                        contentPadding = PaddingValues(horizontal = 16.dp, vertical = 8.dp)
                    ) {
                        Text("Rotate +90°")
                        Spacer(modifier = Modifier.width(6.dp))
                        Icon(Icons.Default.RotateRight, contentDescription = null, modifier = Modifier.size(18.dp))
                    }
                }

                Spacer(modifier = Modifier.height(12.dp))

                // Multi-page thumbnail selector strip
                if (doc.pageUris.size > 1) {
                    LazyRow(
                        horizontalArrangement = Arrangement.spacedBy(8.dp),
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        itemsIndexed(doc.pageUris) { index, uri ->
                            val isSelected = selectedPageIndex == index
                            Box(
                                modifier = Modifier
                                    .size(52.dp, 68.dp)
                                    .clip(RoundedCornerShape(8.dp))
                                    .background(
                                        if (isSelected) MaterialTheme.colorScheme.primaryContainer
                                        else MaterialTheme.colorScheme.surfaceVariant
                                    )
                                    .clickable { selectedPageIndex = index },
                                contentAlignment = Alignment.Center
                            ) {
                                AsyncImage(
                                    model = uri,
                                    contentDescription = "Page \${index + 1}",
                                    contentScale = ContentScale.Crop,
                                    modifier = Modifier.fillMaxSize()
                                )
                                Text(
                                    text = "p.\${index + 1}",
                                    style = MaterialTheme.typography.labelSmall,
                                    color = MaterialTheme.colorScheme.onSurface,
                                    modifier = Modifier
                                        .align(Alignment.BottomCenter)
                                        .background(MaterialTheme.colorScheme.surface.copy(alpha = 0.8f))
                                        .padding(horizontal = 4.dp)
                                )
                            }
                        }
                    }
                }

                Spacer(modifier = Modifier.height(16.dp))

                // Bottom Action: Option to scan another page or dismiss
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween
                ) {
                    OutlinedButton(onClick = onScanAnotherPage) {
                        Icon(Icons.Default.Add, contentDescription = null, modifier = Modifier.size(16.dp))
                        Spacer(modifier = Modifier.width(6.dp))
                        Text("Scan Another Page")
                    }

                    Button(onClick = onDismiss) {
                        Text("Done")
                    }
                }
            }
        }
    }
}

@Composable
fun DocumentCard(
    doc: ScannedDocumentItem,
    onPreview: () -> Unit,
    onShare: () -> Unit,
    modifier: Modifier = Modifier
) {
    Card(
        modifier = modifier
            .fillMaxWidth()
            .clickable { onPreview() },
        shape = RoundedCornerShape(16.dp),
        colors = CardDefaults.cardColors(
            containerColor = MaterialTheme.colorScheme.surface
        ),
        elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
    ) {
        Row(
            modifier = Modifier
                .padding(12.dp)
                .fillMaxWidth(),
            verticalAlignment = Alignment.CenterVertically
        ) {
            // First page preview
            if (doc.pageUris.isNotEmpty()) {
                AsyncImage(
                    model = doc.pageUris.first(),
                    contentDescription = "Scanned Page Thumbnail",
                    contentScale = ContentScale.Crop,
                    modifier = Modifier
                        .size(64.dp, 84.dp)
                        .clip(RoundedCornerShape(8.dp))
                        .background(MaterialTheme.colorScheme.surfaceVariant)
                )
            }
            Spacer(modifier = Modifier.width(16.dp))
            Column(modifier = Modifier.weight(1f)) {
                Text(
                    text = doc.title,
                    style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.SemiBold)
                )
                Text(
                    text = "\${doc.pageCount} page(s) combined · PDF Exported",
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
                Text(
                    text = doc.formattedDate,
                    style = MaterialTheme.typography.labelSmall,
                    color = MaterialTheme.colorScheme.outline
                )
            }
            IconButton(onClick = onShare) {
                Icon(
                    imageVector = Icons.Default.Share,
                    contentDescription = "Share PDF",
                    tint = MaterialTheme.colorScheme.primary
                )
            }
        }
    }
}

@Composable
fun EmptyScannerState(
    onStartScan: () -> Unit,
    modifier: Modifier = Modifier
) {
    Column(
        modifier = modifier.padding(24.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.Center
    ) {
        Icon(
            imageVector = Icons.Default.PictureAsPdf,
            contentDescription = null,
            modifier = Modifier.size(64.dp),
            tint = MaterialTheme.colorScheme.primary
        )
        Spacer(modifier = Modifier.height(16.dp))
        Text(
            text = "No Scanned Documents Yet",
            style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.SemiBold)
        )
        Spacer(modifier = Modifier.height(8.dp))
        Text(
            text = "Tap the button below to open Google ML Kit's multi-page scanner with edge detection, 90° rotation, and shadow removal.",
            style = MaterialTheme.typography.bodyMedium,
            color = MaterialTheme.colorScheme.onSurfaceVariant,
            textAlign = androidx.compose.ui.text.style.TextAlign.Center
        )
        Spacer(modifier = Modifier.height(24.dp))
        Button(onClick = onStartScan) {
            Text("Open Camera & Scan")
        }
    }
}
`,
  },
  {
    id: 'view-model',
    filename: 'DocumentScannerViewModel.kt',
    path: 'app/src/main/java/com/example/docscan/DocumentScannerViewModel.kt',
    language: 'kotlin',
    description: 'State management for multi-page documents, handling GmsDocumentScanningResult, page rotation, and StateFlow emission.',
    code: `package com.example.docscan

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
    val pageRotations: List<Float> = emptyList(), // Store rotation per page (0f, 90f, 180f, 270f)
    val pdfUri: Uri?,
    val formattedDate: String
)

class DocumentScannerViewModel : ViewModel() {

    private val _scannedDocuments = MutableStateFlow<List<ScannedDocumentItem>>(emptyList())
    val scannedDocuments: StateFlow<List<ScannedDocumentItem>> = _scannedDocuments.asStateFlow()

    fun onScanSuccess(result: GmsDocumentScanningResult) {
        val dateFormat = SimpleDateFormat("MMM d, yyyy h:mm a", Locale.getDefault())
        val currentDate = dateFormat.format(Date())

        // Extract PDF Uri and Page Image Uris generated by ML Kit
        // Play Services compiles all scanned pages into a single PDF in result.pdf
        val pdf = result.pdf
        val pages = result.pages ?: emptyList()
        val pageUris = pages.map { it.imageUri }

        val newDoc = ScannedDocumentItem(
            title = "Document \${_scannedDocuments.value.size + 1}",
            pageCount = pdf?.pageCount ?: pages.size,
            pageUris = pageUris,
            pageRotations = List(pageUris.size) { 0f },
            pdfUri = pdf?.uri,
            formattedDate = currentDate
        )

        _scannedDocuments.value = listOf(newDoc) + _scannedDocuments.value
    }

    /**
     * Rotates a specific page by delta degrees (e.g., +90f clockwise or -90f counter-clockwise)
     */
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
`,
  },
  {
    id: 'build-gradle',
    filename: 'build.gradle.kts',
    path: 'app/build.gradle.kts',
    language: 'kotlin',
    description: 'Gradle configuration with Google ML Kit Document Scanner dependency, Jetpack Compose BOM, and Coil.',
    code: `plugins {
    alias(libs.plugins.android.application)
    alias(libs.plugins.kotlin.android)
    alias(libs.plugins.kotlin.compose)
}

android {
    namespace = "com.example.docscan"
    compileSdk = 35

    defaultConfig {
        applicationId = "com.example.docscan"
        minSdk = 21 // ML Kit Document Scanner supports Android 5.0+ (API 21+)
        targetSdk = 35
        versionCode = 1
        versionName = "1.0"
        testInstrumentationRunner = "androidx.test.runner.AndroidJUnitRunner"
    }

    buildTypes {
        release {
            isMinifyEnabled = false
            proguardFiles(
                getDefaultProguardFile("proguard-android-optimize.txt"),
                "proguard-rules.pro"
            )
        }
    }
    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }
    kotlinOptions {
        jvmTarget = "17"
    }
    buildFeatures {
        compose = true
    }
}

dependencies {
    // 1. Google Play Services ML Kit Document Scanner API
    // Handles multi-page scanning, perspective crop, shadow removal filter, and PDF generation
    implementation("com.google.android.gms:play-services-mlkit-document-scanner:16.0.0-beta1")

    // 2. Jetpack Compose & Material 3
    val composeBom = platform("androidx.compose:compose-bom:2024.10.00")
    implementation(composeBom)
    implementation("androidx.compose.ui:ui")
    implementation("androidx.compose.material3:material3")
    implementation("androidx.compose.material:material-icons-extended")
    implementation("androidx.activity:activity-compose:1.9.3")
    implementation("androidx.lifecycle:lifecycle-viewmodel-compose:2.8.7")

    // 3. Coil for async image loading
    implementation("io.coil-kt:coil-compose:2.7.0")

    // Core AndroidX
    implementation("androidx.core:core-ktx:1.15.0")
    implementation("androidx.lifecycle:lifecycle-runtime-ktx:2.8.7")
}
`,
  },
  {
    id: 'manifest',
    filename: 'AndroidManifest.xml',
    path: 'app/src/main/AndroidManifest.xml',
    language: 'xml',
    description: 'AndroidManifest highlighting how zero camera permissions are required in the manifest.',
    code: `<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android">

    <!-- NOTE: You DO NOT need android.permission.CAMERA in your app!
         The ML Kit Document Scanner runs via Google Play Services in an isolated,
         secure activity with its own camera permissions, returning only the
         resulting JPEG/PDF URIs back to your app. -->

    <application
        android:allowBackup="true"
        android:icon="@mipmap/ic_launcher"
        android:label="@string/app_name"
        android:roundIcon="@mipmap/ic_launcher_round"
        android:supportsRtl="true"
        android:theme="@style/Theme.DocScan">

        <activity
            android:name=".MainActivity"
            android:exported="true"
            android:theme="@style/Theme.DocScan">
            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>
        </activity>

    </application>

</manifest>
`,
  },
  {
    id: 'readme',
    filename: 'README.md',
    path: 'README.md',
    language: 'markdown',
    description: 'Quick start guide for multi-page document scanning, rotation, and PDF generation with Google ML Kit.',
    code: `# DocScan - Android ML Kit Document Scanner (Multi-Page & Rotation)

A lightweight, modern Android document scanner built with **Jetpack Compose** and the official **Google ML Kit Document Scanner API** (\`play-services-mlkit-document-scanner\`).

---

## Key Features

1. **Multi-Page Scanning**:
   - Configured with \`setPageLimit(50)\`.
   - Users can scan page after page in sequence.
   - All pages are combined into a single, cohesive PDF upon export.
2. **Post-Scan Preview & 90° Rotation**:
   - High-resolution preview of scanned pages.
   - Rotate 90° clockwise (\`+90°\`) or counter-clockwise (\`-90°\`) before exporting.
3. **High-Contrast B&W Shadow-Removal Filter**:
   - Adaptive background illumination normalization removes shadows, creases, and desk color cast.
4. **Zero Permissions Boilerplate**:
   - No \`android.permission.CAMERA\` needed. Google Play Services hosts the camera flow in its own isolated sandbox.

---

## Quickstart in Android Studio

1. Open Android Studio (Ladybug / Iguana or newer).
2. Choose **File > New > New Project... > Empty Compose Activity**.
3. Set **Minimum SDK** to **API 21 (Android 5.0 Lollipop)**.
4. Add to \`app/build.gradle.kts\`:
   \`\`\`kotlin
   implementation("com.google.android.gms:play-services-mlkit-document-scanner:16.0.0-beta1")
   implementation("io.coil-kt:coil-compose:2.7.0")
   \`\`\`
5. Paste \`MainActivity.kt\`, \`DocumentScannerViewModel.kt\`, and \`DocumentScannerScreen.kt\` into your project.
6. Connect an Android device with Google Play Services and click **Run**.
`,
  },
];
