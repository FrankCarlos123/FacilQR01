const API_KEY = 'AIzaSyCa362tZsWj38073XyGaMTmKC0YKc-W0I8';
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${API_KEY}`;

let qrcode = null;
let countdownInterval = null;
let stream = null;

async function startCamera() {
    try {
        const camera = document.getElementById('camera');
        const capturedImage = document.getElementById('captured-image');
        
        capturedImage.style.display = 'none';
        camera.style.display = 'block';

        stream = await navigator.mediaDevices.getUserMedia({ 
            video: { 
                facingMode: 'environment',
                width: { ideal: 1280 },
                height: { ideal: 720 }
            } 
        });
        camera.srcObject = stream;
        camera.play();

        const cameraBtn = document.querySelector('.camera-btn');
        cameraBtn.textContent = 'Capturar';
        cameraBtn.onclick = captureImage;
    } catch (err) {
        console.error('Error al acceder a la cámara:', err);
        alert('Error al acceder a la cámara. Verifica los permisos.');
    }
}

async function captureImage() {
    try {
        const camera = document.getElementById('camera');
        const capturedImage = document.getElementById('captured-image');

        // Capturar la imagen en color sin procesar
        const canvas = document.createElement('canvas');
        canvas.width = camera.videoWidth;
        canvas.height = camera.videoHeight;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(camera, 0, 0);

        // Guardar la imagen en color
        capturedImage.src = canvas.toDataURL('image/jpeg', 1.0);
        capturedImage.style.display = 'block';
        camera.style.display = 'none';

        // Detener la cámara
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
        }

        // Restaurar el botón
        const cameraBtn = document.querySelector('.camera-btn');
        cameraBtn.textContent = 'Tomar Otra Foto';
        cameraBtn.onclick = startCamera;

        // Enviar la imagen original a Gemini
        processImage(canvas);
    } catch (err) {
        console.error('Error al capturar la imagen:', err);
        alert('Error al capturar la imagen. Por favor, intenta de nuevo.');
    }
}

// El resto del código sigue igual...
