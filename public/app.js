
const form = document.getElementById("registrationForm");
const stepOne = document.getElementById("stepOne");
const stepTwo = document.getElementById("stepTwo");
const message = document.getElementById("registrationMessage");
const loadingView = document.getElementById("loadingView");

const email = document.getElementById("email");
const surname = document.getElementById("surname");
const phone = document.getElementById("phone");
const consent = document.getElementById("consent");

const continueButton = document.getElementById("continueButton");
const backButton = document.getElementById("backButton");
const submitButton = document.getElementById("submitButton");

continueButton.addEventListener("click", () => {
  message.textContent = "";

  if (!email.reportValidity()) return;
  if (!surname.reportValidity()) return;

  stepOne.hidden = true;
  stepTwo.hidden = false;

  phone.focus();
});

backButton.addEventListener("click", () => {
  message.textContent = "";
  stepTwo.hidden = true;
  stepOne.hidden = false;
});

phone.addEventListener("input", () => {
  phone.value = phone.value.replace(/[^\d.-]/g, "").slice(0, 14);
});

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  message.textContent = "";

  const emailValue = email.value.trim();
  const surnameValue = surname.value.trim();
  const phoneNumber = phone.value.replace(/\D/g, "");

  if (!phone.reportValidity()) return;

  if (phoneNumber.length < 10 || phoneNumber.length > 13) {
    message.textContent = "Confira o CPF informado.";
    return;
  }

  if (!consent.checked) {
    message.textContent = "É necessário autorizar o armazenamento dos dados.";
    return;
  }

  submitButton.disabled = true;
  submitButton.textContent = "ENVIANDO...";

// Mostrar carregamento por pelo menos 10 segundos
const loadingStartedAt = Date.now();

stepTwo.hidden = true;
loadingView.hidden = false;

  try {
    const response = await fetch("/api/registrations", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        email: emailValue,
        surname: surnameValue,
        phone: phoneNumber,
        consent: true
      })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Não foi possível realizar o cadastro.");
    }

   // Completar os 10 segundos de carregamento
const elapsed = Date.now() - loadingStartedAt;
const remaining = Math.max(0, 10000 - elapsed);

await new Promise(resolve => setTimeout(resolve, remaining));

loadingView.hidden = true;
form.hidden = true;

document.getElementById("successView").hidden = false;

  } catch (error) {
    loadingView.hidden = true;
    stepTwo.hidden = false;

    message.textContent = error.message === "Failed to fetch"
      ? "Não foi possível conectar ao servidor."
      : error.message;

  } finally {
    submitButton.disabled = false;
    submitButton.textContent = "FINALIZAR CADASTRO";
  }
});

// Permitir números, ponto e hífen no telefone
const phoneField = document.getElementById("phone");

if (phoneField) {
  phoneField.addEventListener("input", () => {
    phoneField.value = phoneField.value
      .replace(/[^\d.-]/g, "")
      .slice(0, 15);
  });
}
const surnameField = document.getElementById("surname");
const surnameWarning = document.getElementById("surnameWarning");

if (surnameField && surnameWarning) {
  surnameField.addEventListener("focus", () => {
    surnameWarning.hidden = false;
  });

  surnameField.addEventListener("blur", () => {
    surnameWarning.hidden = true;
  });
}