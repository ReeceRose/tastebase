import {
  connect,
  displayAddress,
  getSavedAddress,
  getTastebaseOrigin,
  toOrigin,
} from "./connection.js";

const form = document.getElementById("setup-form");
const input = document.getElementById("setup-address");
const error = document.getElementById("setup-error");
const connected = document.getElementById("connected");

function showConnected(origin) {
  document.getElementById("connected-address").textContent =
    displayAddress(origin);
  form.hidden = true;
  connected.hidden = false;
}

function showForm() {
  connected.hidden = true;
  form.hidden = false;
  input.focus();
}

form.addEventListener("submit", (event) => {
  event.preventDefault();
  const origin = toOrigin(input.value);
  if (!origin) {
    error.textContent = "That doesn't look like a web address.";
    error.hidden = false;
    return;
  }
  error.hidden = true;
  connect(origin).then((granted) => {
    if (granted) {
      showConnected(origin);
      return;
    }
    error.textContent =
      "Chrome needs your permission to open Tastebase at that address.";
    error.hidden = false;
  });
});

document.getElementById("change-address").addEventListener("click", showForm);

const [origin, saved] = await Promise.all([
  getTastebaseOrigin(),
  getSavedAddress(),
]);
input.value = displayAddress(saved);
if (origin) {
  showConnected(origin);
} else {
  showForm();
}
