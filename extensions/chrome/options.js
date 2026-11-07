import {
  connect,
  displayAddress,
  getSavedAddresses,
  getTastebaseOrigins,
  parseAddresses,
} from "./connection.js";

const form = document.getElementById("setup-form");
const input = document.getElementById("setup-address");
const backupInput = document.getElementById("setup-backup-address");
const error = document.getElementById("setup-error");
const connected = document.getElementById("connected");

function showConnected([primary, backup]) {
  document.getElementById("connected-address").textContent =
    displayAddress(primary);
  document.getElementById("connected-backup").hidden = !backup;
  document.getElementById("connected-backup-address").textContent = backup
    ? displayAddress(backup)
    : "";
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
  const next = parseAddresses(input.value, backupInput.value);
  if (!next) {
    error.textContent = "That doesn't look like a web address.";
    error.hidden = false;
    return;
  }
  error.hidden = true;
  connect(next.primary, next.backup).then((granted) => {
    if (granted) {
      showConnected([next.primary, next.backup]);
      return;
    }
    error.textContent =
      "Chrome needs your permission to open Tastebase at those addresses.";
    error.hidden = false;
  });
});

document.getElementById("change-address").addEventListener("click", showForm);

const [origins, saved] = await Promise.all([
  getTastebaseOrigins(),
  getSavedAddresses(),
]);
input.value = displayAddress(saved.primary);
backupInput.value = displayAddress(saved.backup);
if (origins.length > 0) {
  showConnected(origins);
} else {
  showForm();
}
