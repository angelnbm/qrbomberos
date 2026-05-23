const statusEl = document.getElementById("status");
const startBtn = document.getElementById("startBtn");
const stopBtn = document.getElementById("stopBtn");
const cardName = document.getElementById("cardName");
const cardBlood = document.getElementById("cardBlood");
const cardAllergy = document.getElementById("cardAllergy");
const cardPhone = document.getElementById("cardPhone");
const qrForm = document.getElementById("qrForm");
const clearBtn = document.getElementById("clearBtn");
const inputName = document.getElementById("inputName");
const inputBlood = document.getElementById("inputBlood");
const inputAllergy = document.getElementById("inputAllergy");
const inputPhone = document.getElementById("inputPhone");
const qrOutput = document.getElementById("qrOutput");
const qrPayload = document.getElementById("qrPayload");

const readerId = "reader";
let html5QrCode;
let isScanning = false;
let qrCodeInstance;

const resetCards = () => {
  cardName.textContent = "-";
  cardBlood.textContent = "-";
  cardAllergy.textContent = "-";
  cardPhone.textContent = "-";
};

const setStatus = (message, isError = false) => {
  statusEl.textContent = message;
  statusEl.classList.toggle("status--error", isError);
};

const parsePayload = (text) => {
  const parts = text.split("|").map((part) => part.trim());
  if (parts.length !== 4 || parts.some((part) => part.length === 0)) {
    return null;
  }
  return {
    name: parts[0],
    blood: parts[1],
    allergy: parts[2],
    phone: parts[3],
  };
};

const updateCards = (data) => {
  cardName.textContent = data.name;
  cardBlood.textContent = data.blood;
  cardAllergy.textContent = data.allergy;
  cardPhone.textContent = data.phone;
};

const buildPayload = () => {
  return [
    inputName.value.trim(),
    inputBlood.value.trim(),
    inputAllergy.value.trim(),
    inputPhone.value.trim(),
  ].join("|");
};

const resetGenerator = () => {
  qrOutput.innerHTML = "";
  qrPayload.textContent = "-";
  if (qrCodeInstance) {
    qrCodeInstance.clear();
    qrCodeInstance = null;
  }
};

const onScanSuccess = (decodedText) => {
  const data = parsePayload(decodedText);
  if (!data) {
    setStatus("QR invalido. Usa el formato Nombre|Grupo|Alergias|Telefono", true);
    resetCards();
    return;
  }

  updateCards(data);
  setStatus("Ficha cargada correctamente.");
};

const startScanner = async () => {
  if (isScanning) {
    return;
  }

  try {
    setStatus("Inicializando camara...");
    if (!html5QrCode) {
      html5QrCode = new Html5Qrcode(readerId);
    }

    // Inicializa la camara trasera si esta disponible
    await html5QrCode.start(
      { facingMode: "environment" },
      {
        fps: 10,
        qrbox: { width: 240, height: 240 },
        aspectRatio: 1.0,
      },
      onScanSuccess
    );

    isScanning = true;
    startBtn.disabled = true;
    stopBtn.disabled = false;
    setStatus("Escaneando...");
  } catch (error) {
    setStatus("No se pudo acceder a la camara. Revisa permisos.", true);
  }
};

const stopScanner = async () => {
  if (!html5QrCode || !isScanning) {
    return;
  }

  try {
    await html5QrCode.stop();
    await html5QrCode.clear();
  } finally {
    isScanning = false;
    startBtn.disabled = false;
    stopBtn.disabled = true;
    setStatus("Escaner detenido.");
  }
};

startBtn.addEventListener("click", startScanner);
stopBtn.addEventListener("click", stopScanner);

const handleGenerate = () => {
  const payload = buildPayload();
  if (payload.split("|").some((part) => part.length === 0)) {
    setStatus("Completa todos los campos antes de generar.", true);
    return;
  }

  resetGenerator();
  qrCodeInstance = new QRCode(qrOutput, {
    text: payload,
    width: 220,
    height: 220,
    colorDark: "#000000",
    colorLight: "#ffffff",
    correctLevel: QRCode.CorrectLevel.M,
  });
  qrPayload.textContent = payload;
  setStatus("QR generado. Puedes imprimirlo.");
};

qrForm.addEventListener("submit", (event) => {
  event.preventDefault();
  handleGenerate();
});

document.getElementById("generateBtn").addEventListener("click", handleGenerate);

clearBtn.addEventListener("click", () => {
  qrForm.reset();
  resetGenerator();
  setStatus("Formulario limpio.");
});

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    // Registra el Service Worker para habilitar el modo offline
    navigator.serviceWorker.register("sw.js").catch(() => {
      setStatus("No se pudo registrar el modo offline.", true);
    });
  });
}
