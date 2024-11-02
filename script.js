const API_KEY = 'AIzaSyCa362tZsWj38073XyGaMTmKC0YKc-W0I8';
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${API_KEY}`;

let qrcode = null;
let countdownInterval = null;
let stream = null;

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

        // Enviar la imagen original a Gemini
        processImage(canvas);
    } catch (err) {
        console.error('Error al capturar la imagen:', err);
        alert('Error al capturar la imagen. Por favor, intenta de nuevo.');
        setTimeout(resetCamera, 5000);
    }
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
                displayQR(barcode);
                setTimeout(resetCamera, 30000);
            } else {
                alert('No se detectó ningún código de barras válido en la imagen');
                setTimeout(resetCamera, 5000);
            }
        } else {
            alert('No se pudo analizar la imagen');
            setTimeout(resetCamera, 5000);
        }

    } catch (error) {
        console.error('Error al procesar la imagen:', error);
        alert('Error al procesar la imagen. Por favor, intenta de nuevo.');
        setTimeout(resetCamera, 5000);
    }
}

function displayQR(text) {
    document.getElementById('qrcode').innerHTML = '';
    qrcode = new QRCode(document.getElementById('qrcode'), {
        text: text,
        width: 200,
        height: 200,
        colorDark: "#000000",
        colorLight: "#FFFFFF",
        correctLevel: QRCode.CorrectLevel.H
    });

    document.getElementById('qr-text').textContent = text;
}

function resetCamera() {
    const camera = document.getElementById('camera');
    const capturedImage = document.getElementById('captured-image');

    capturedImage.style.display = 'none';
    camera.style.display = 'block';

    stream = null;
    startCamera();
}

async function startCamera() {
    try {
        stream = await navigator.mediaDevices.getUserMedia({ 
            video: { 
                facingMode: 'environment',
                width: { ideal: 1280 },
                height: { ideal: 720 }
            } 
        });
        camera.srcObject = stream;
        camera.play();
    } catch (err) {
        console.error('Error al acceder a la cámara:', err);
        alert('Error al acceder a la cámara. Verifica los permisos.');
    }
}

startCamera();
