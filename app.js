// ====================================
// PWA Cámara - Script Principal
// ====================================

// Variables globales
let stream = null;
let videoElement = null;
let canvasElement = null;
let statusElement = null;

// Elementos del DOM
const openCameraBtn = document.getElementById('openCamera');
const takePhotoBtn = document.getElementById('takePhoto');
const closeCameraBtn = document.getElementById('closeCamera');
const cameraContainer = document.getElementById('cameraContainer');

// Inicialización cuando el DOM está listo
document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 PWA Cámara iniciada');
    
    // Asignar elementos
    videoElement = document.getElementById('video');
    canvasElement = document.getElementById('canvas');
    statusElement = document.getElementById('status');
    
    // Registrar Service Worker
    registerServiceWorker();
    
    // Event Listeners
    openCameraBtn.addEventListener('click', openCamera);
    takePhotoBtn.addEventListener('click', takePhoto);
    closeCameraBtn.addEventListener('click', closeCamera);
});

/**
 * Registra el Service Worker para funcionalidad PWA
 */
async function registerServiceWorker() {
    if ('serviceWorker' in navigator) {
        try {
            const registration = await navigator.serviceWorker.register('sw.js');
            console.log('✅ Service Worker registrado:', registration);
            showStatus('PWA lista para instalar', 'success');
        } catch (error) {
            console.error('❌ Error al registrar Service Worker:', error);
            showStatus('Error al configurar PWA', 'error');
        }
    } else {
        console.warn('⚠️ Service Worker no soportado en este navegador');
    }
}

/**
 * Abre la cámara del dispositivo
 * Solicita permisos y muestra el streaming de video
 */
async function openCamera() {
    try {
        console.log('📷 Intentando abrir la cámara...');
        showStatus('Solicitando acceso a la cámara...', 'info');
        
        // Verificar soporte de getUserMedia
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            throw new Error('Tu navegador no soporta acceso a la cámara');
        }
        
        // Configuración para solicitar video
        // facingMode: 'environment' usa la cámara trasera en móviles
        const constraints = {
            video: {
                facingMode: 'environment', // Usa 'user' para cámara frontal
                width: { ideal: 1280 },
                height: { ideal: 720 }
            },
            audio: false
        };
        
        // Solicitar acceso a la cámara
        stream = await navigator.mediaDevices.getUserMedia(constraints);
        
        // Asignar el stream al elemento video
        videoElement.srcObject = stream;
        
        // Mostrar el contenedor de la cámara
        cameraContainer.classList.add('active');
        
        // Ocultar el botón de abrir cámara
        openCameraBtn.style.display = 'none';
        
        // Ocultar canvas si está visible
        canvasElement.classList.remove('show');
        
        console.log('✅ Cámara abierta exitosamente');
        showStatus('Cámara activa - Lista para capturar', 'success');
        
    } catch (error) {
        console.error('❌ Error al abrir la cámara:', error);
        
        let errorMessage = 'Error al acceder a la cámara';
        
        // Mensajes de error específicos
        if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
            errorMessage = 'Permiso denegado. Por favor, permite el acceso a la cámara.';
        } else if (error.name === 'NotFoundError') {
            errorMessage = 'No se encontró ninguna cámara en el dispositivo.';
        } else if (error.name === 'NotReadableError') {
            errorMessage = 'La cámara está siendo usada por otra aplicación.';
        }
        
        showStatus(errorMessage, 'error');
    }
}

/**
 * Captura una foto del video stream
 * Dibuja la imagen en el canvas y la convierte a Base64
 */
function takePhoto() {
    try {
        console.log('📸 Capturando foto...');
        
        if (!stream) {
            throw new Error('No hay stream de cámara activo');
        }
        
        // Obtener dimensiones del video
        const videoWidth = videoElement.videoWidth;
        const videoHeight = videoElement.videoHeight;
        
        console.log(`📐 Dimensiones del video: ${videoWidth}x${videoHeight}`);
        
        // Configurar canvas con las dimensiones del video
        canvasElement.width = videoWidth;
        canvasElement.height = videoHeight;
        
        // Obtener contexto 2D del canvas
        const context = canvasElement.getContext('2d');
        
        // Dibujar el frame actual del video en el canvas
        context.drawImage(videoElement, 0, 0, videoWidth, videoHeight);
        
        // Mostrar el canvas con la foto
        canvasElement.classList.add('show');
        
        // Convertir canvas a Base64 (formato PNG)
        const photoBase64 = canvasElement.toDataURL('image/png');
        
        // Imprimir en consola
        console.log('✅ Foto capturada exitosamente');
        console.log('📊 Tamaño del Base64:', photoBase64.length, 'caracteres');
        console.log('🖼️ Base64 de la imagen:', photoBase64.substring(0, 100) + '...');
        
        // También podemos obtener la imagen como Blob
        canvasElement.toBlob((blob) => {
            console.log('💾 Blob de la imagen:', blob);
            console.log('📦 Tamaño del Blob:', blob.size, 'bytes');
            console.log('📄 Tipo del Blob:', blob.type);
            
            // Opcional: Crear URL para descargar
            const url = URL.createObjectURL(blob);
            console.log('🔗 URL temporal del Blob:', url);
        }, 'image/png');
        
        showStatus('¡Foto capturada! Revisa la consola para ver el Base64', 'success');
        
        // Opcional: Cerrar la cámara después de capturar
        // closeCamera();
        
    } catch (error) {
        console.error('❌ Error al capturar foto:', error);
        showStatus('Error al capturar la foto', 'error');
    }
}

/**
 * Cierra la cámara y libera los recursos
 */
function closeCamera() {
    try {
        console.log('🔒 Cerrando cámara...');
        
        // Detener todos los tracks del stream
        if (stream) {
            stream.getTracks().forEach(track => {
                track.stop();
                console.log('⏹️ Track detenido:', track.kind);
            });
            stream = null;
        }
        
        // Limpiar el video
        if (videoElement) {
            videoElement.srcObject = null;
        }
        
        // Ocultar el contenedor de la cámara
        cameraContainer.classList.remove('active');
        
        // Mostrar el botón de abrir cámara
        openCameraBtn.style.display = 'inline-block';
        
        console.log('✅ Cámara cerrada exitosamente');
        showStatus('Cámara cerrada', 'info');
        
    } catch (error) {
        console.error('❌ Error al cerrar la cámara:', error);
        showStatus('Error al cerrar la cámara', 'error');
    }
}

/**
 * Muestra un mensaje de estado en la UI
 * @param {string} message - Mensaje a mostrar
 * @param {string} type - Tipo de mensaje: 'success', 'error', 'info'
 */
function showStatus(message, type = 'info') {
    if (!statusElement) return;
    
    statusElement.textContent = message;
    statusElement.className = `status ${type}`;
    statusElement.classList.remove('hidden');
    
    // Auto-ocultar después de 5 segundos
    setTimeout(() => {
        statusElement.classList.add('hidden');
    }, 5000);
}

// Limpiar recursos cuando se cierra la página
window.addEventListener('beforeunload', () => {
    if (stream) {
        closeCamera();
    }
});

console.log('✨ App.js cargado correctamente');
