// Identifiants en clair (délibéré)
const ALLOWED_LOGIN = "akakatsuki";
const ALLOWED_PASSWORD = "jaimelesmineurs";

// clé de session
const SESSION_KEY = "intranet_auth_ok_v1";

// éléments du modal
const modal = document.getElementById("loginModal");
const modalUser = document.getElementById("modalUser");
const modalPwd = document.getElementById("modalPwd");
const modalSubmit = document.getElementById("modalSubmit");
const modalCancel = document.getElementById("modalCancel");
const modalMsg = document.getElementById("modalMsg");
const logoutBtn = document.getElementById("logoutBtn");

// fonctions de session
function isAuthenticated() {
    return sessionStorage.getItem(SESSION_KEY) === "1";
}
function setAuthenticated() {
    sessionStorage.setItem(SESSION_KEY, "1");
}
function clearAuthenticated() {
    sessionStorage.removeItem(SESSION_KEY);
}

// afficher/cacher modal
function showModal() {
    modal.setAttribute("aria-hidden", "false");
    // bloquer le scroll du body
    document.body.style.overflow = "hidden";
    // focus
    setTimeout(() => modalUser.focus(), 50);
}
function hideModal() {
    modal.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
}

// initialisation à l'ouverture
window.addEventListener("load", () => {
    // si user authentifié -> cacher modal, afficher logout
    if (isAuthenticated()) {
        hideModal();
        logoutBtn.style.display = "inline-block";
    } else {
        showModal();
        logoutBtn.style.display = "none";
    }
    // charger notes locales si présentes
    const saved = localStorage.getItem("notes");
    if (saved) document.getElementById("sharedNotes").value = saved;
});

// login
modalSubmit.addEventListener("click", tryLogin);
function tryLogin() {
    modalMsg.textContent = "";
    const user = (modalUser.value || "").trim();
    const pw = modalPwd.value || "";

    if (user === ALLOWED_LOGIN && pw === ALLOWED_PASSWORD) {
        setAuthenticated();
        hideModal();
        logoutBtn.style.display = "inline-block";
        // vider inputs pour la prochaine session
        modalUser.value = "";
        modalPwd.value = "";
        modalMsg.textContent = "";
    } else {
        modalMsg.textContent = "Identifiant ou mot de passe incorrect.";
    }
}

// annuler (optionnel) -> reste sur la page mais modal reste visible.
// Ici on cache message d'erreur et vide les champs.
modalCancel.addEventListener("click", () => {
    modalMsg.textContent = "";
    modalUser.value = "";
    modalPwd.value = "";
    modalUser.focus();
});

// Enter pour soumettre
[modalUser, modalPwd].forEach(el => {
    el.addEventListener("keydown", (e) => {
        if (e.key === "Enter") tryLogin();
    });
});

// logout
logoutBtn.addEventListener("click", () => {
    clearAuthenticated();
    logoutBtn.style.display = "none";
    showModal();
});

// sauvegarde locale des notes (existant)
function saveNotes() {
    const content = document.getElementById("sharedNotes").value;
    localStorage.setItem("notes", content);
    alert("Notes sauvegardées localement ✅");
}

// rendre saveNotes accessible globalement (utilisé depuis index.html inline)
window.saveNotes = saveNotes;
