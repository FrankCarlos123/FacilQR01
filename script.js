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

        const cameraBtn = document.querySelector('.camera-btn');
        cameraBtn.textContent = 'Capturar';
        cameraBtn.onclick = captureImage;
    } catch (err) {
        console.error('Error al acceder a la cámara:', err);
        alert('Error al acceder a la cámara. Verifica los permisos.');
    }
}

async function captureImage() {
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
}

async function processImage(canvas) {
    try {
        const imageBase64 = canvas.toDataURL('image/jpeg');
        console.log("Procesando imagen con Gemini AI...");

        const prompt = {
            "contents": [{
                "parts": [{
                    "text": "Encuentra los códigos de barras en la imagen y devuelve solo los números, sin texto adicional."
                }, {
                    "inline_data": {
                        "mime_type": "image/jpeg",
                        "data": imageBase64.split(',')[1]
                    }
                }]
            }]
        };

        const response = await fetch(GEMINI_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(prompt)
        });

        const result = await response.json();
        console.log("Respuesta de Gemini:", result);

        if (result.candidates && result.candidates[0]) {
            const text = result.candidates[0].content.parts[0].text;
            console.log("Texto detectado:", text);

            const barcodeRegex = /Códigos de barras:\s*(\d+)/;
            const match = text.match(barcodeRegex);

            if (match && match[1]) {
                const barcode = match[1];
                document.getElementById('text').value = barcode;
                generateQR();
            } else {
                alert('No se detectó ningún código de barras válido en la imagen');
            }
        } else {
            alert('No se pudo analizar la imagen');
        }

    } catch (error) {
        console.error('Error al procesar la imagen:', error);
        alert('Error al procesar la imagen. Por favor, intenta de nuevo.');
    }
}

function generateQR() {
    const text = document.getElementById('text').value;
    if (!text) return;

    document.getElementById('qrcode').innerHTML = '';
    if (countdownInterval) {
        clearInterval(countdownInterval);
    }
    
    qrcode = new QRCode(document.getElementById('qrcode'), {
        text: text,
        width: 200,
        height: 200,
        colorDark: "#000000",
        colorLight: "#FFFFFF",
        correctLevel: QRCode.CorrectLevel.H
    });

    document.getElementById('qr-text').textContent = text;
    startCountdown();
}

function startCountdown() {
    let count = 10;
    const countdownElement = document.getElementById('countdown');
    countdownElement.textContent = `Limpieza automática en ${count} segundos`;

    countdownInterval = setInterval(() => {
        count--;
        countdownElement.textContent = `Limpieza automática en ${count} segundos`;
        
        if (count <= 0) {
            clearInterval(countdownInterval);
            clearAll();
        }
    }, 1000);
}

function clearAll() {
    const inputElement = document.getElementById('text');
    inputElement.value = '';
    inputElement.focus();
    
    document.getElementById('qrcode').innerHTML = '';
    document.getElementById('qr-text').textContent = '';
    document.getElementById('countdown').textContent = '';
    document.getElementById('captured-image').style.display = 'none';
    
    qrcode = null;

    if (countdownInterval) {
        clearInterval(countdownInterval);
        countdownInterval = null;
    }
}

document.getElementById('text').addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
        generateQR();
    }
});
