
/* ==========================================
   BARANGAYEASE RESIDENT LOGIN
========================================== */

/* ==========================================
   BACKEND CONFIGURATION
========================================== */

const API_AUTH_URL = window.BE_API_BASE_URL || "http://localhost:8080/api";

/* ==========================================
   BARANGAY DASHBOARD MAPPING
========================================== */

const BARANGAY_DASHBOARDS = {
    "Alabang": "Resident.html",
    "Ayala Alabang": "Resident.html",
    "Bayanan": "Resident.html",
    "Buli": "Resident.html",
    "Cupang": "Resident.html",
    "Poblacion": "Resident.html",
    "Putatan": "Resident.html",
    "Sucat": "Resident.html",
    "Tunasan": "Resident.html"
};

/* ==========================================
   ELEMENTS
========================================== */

const loginForm = document.getElementById("loginForm");
const loginMessage = document.getElementById("loginMessage");

/* ==========================================
   PASSWORD TOGGLE
========================================== */

document.querySelectorAll(".toggle-password").forEach((icon) => {
    icon.addEventListener("click", function () {
        const targetId = this.getAttribute("data-target");
        const targetInput = document.getElementById(targetId);

        if (!targetInput) return;

        if (targetInput.type === "password") {
            targetInput.type = "text";
            this.classList.remove("fa-eye");
            this.classList.add("fa-eye-slash");
        } else {
            targetInput.type = "password";
            this.classList.remove("fa-eye-slash");
            this.classList.add("fa-eye");
        }
    });
});

/* ==========================================
   LOGIN MESSAGE
========================================== */

function showLoginMessage(message, type = "error") {
    if (!loginMessage) return;

    loginMessage.textContent = message;
    loginMessage.className = "auth-message " + type;
    loginMessage.style.display = message ? "block" : "none";
    loginMessage.style.padding = "10px 14px";
    loginMessage.style.borderRadius = "8px";
    loginMessage.style.fontSize = "14px";
    loginMessage.style.marginBottom = "15px";

    if (type === "error") {
        loginMessage.style.backgroundColor = "#f8d7da";
        loginMessage.style.color = "#721c24";
        loginMessage.style.border = "1px solid #f5c6cb";
    } else {
        loginMessage.style.backgroundColor = "#d4edda";
        loginMessage.style.color = "#155724";
        loginMessage.style.border = "1px solid #c3e6cb";
    }
}

/* ==========================================
   RESET LOGIN BUTTON
========================================== */

function resetButton(button) {
    if (!button) return;

    button.disabled = false;
    button.innerHTML = "Login";
}

/* ==========================================
   BARANGAY DASHBOARD
========================================== */

function getBarangayDashboard(barangay) {
    return BARANGAY_DASHBOARDS[barangay] || "Resident.html";
}

/* ==========================================
   RESPONSE OBJECT EXTRACTION
========================================== */

function getResponseObject(data) {
    if (!data || typeof data !== "object") {
        return {};
    }

    const possibleObjects = [
        data.resident,
        data.user,
        data.data?.resident,
        data.data?.user,
        data.data,
        data.result,
        data
    ];

    return possibleObjects.find(
        item => item && typeof item === "object" && !Array.isArray(item)
    ) || {};
}

/* ==========================================
   RESIDENT ID EXTRACTION
========================================== */

function getResidentId(data) {
    if (!data || typeof data !== "object") {
        return null;
    }

    const possibleObjects = [
        data,
        data.resident,
        data.user,
        data.data,
        data.data?.resident,
        data.data?.user,
        data.result
    ];

    const possibleKeys = [
        "residentID",
        "residentId",
        "resident_id",
        "id",
        "ID"
    ];

    for (const source of possibleObjects) {
        if (!source || typeof source !== "object") continue;

        for (const key of possibleKeys) {
            const value = source[key];

            if (
                value !== undefined &&
                value !== null &&
                String(value).trim() !== ""
            ) {
                return value;
            }
        }
    }

    return null;
}

/* ==========================================
   JWT TOKEN EXTRACTION
========================================== */

function getAuthToken(data) {
    if (!data || typeof data !== "object") {
        return "";
    }

    const possibleObjects = [
        data,
        data.auth,
        data.authentication,
        data.data,
        data.data?.auth,
        data.user,
        data.resident,
        data.result
    ];

    const tokenKeys = [
        "token",
        "accessToken",
        "access_token",
        "jwt"
    ];

    for (const source of possibleObjects) {
        if (!source || typeof source !== "object") continue;

        for (const key of tokenKeys) {
            const value = source[key];

            if (typeof value === "string" && value.trim()) {
                return value.trim().replace(/^Bearer\s+/i, "");
            }
        }
    }

    return "";
}

/* ==========================================
   RESIDENT BARANGAY EXTRACTION
========================================== */

function getResidentBarangay(data) {
    const possibleObjects = [
        data,
        data?.resident,
        data?.user,
        data?.data,
        data?.data?.resident,
        data?.data?.user,
        data?.result
    ];

    for (const source of possibleObjects) {
        if (!source || typeof source !== "object") continue;

        const barangay =
            source.barangay ||
            source.barangayName ||
            source.barangay_name;

        if (typeof barangay === "string" && barangay.trim()) {
            return barangay.trim();
        }
    }

    return "";
}

/* ==========================================
   RESIDENT NAME EXTRACTION
========================================== */

function getResidentName(data, fieldNames) {
    const possibleObjects = [
        data,
        data?.resident,
        data?.user,
        data?.data,
        data?.data?.resident,
        data?.data?.user,
        data?.result
    ];

    for (const source of possibleObjects) {
        if (!source || typeof source !== "object") continue;

        for (const field of fieldNames) {
            const value = source[field];

            if (typeof value === "string" && value.trim()) {
                return value.trim();
            }
        }
    }

    return "";
}

/* ==========================================
   CLEAR OLD LOGIN SESSION
========================================== */

function clearOldLoginSession() {
    const keys = [
        "loggedInResident",
        "resident",
        "residentID",
        "residentId",
        "isLoggedIn",
        "userRole",
        "barangay",
        "token"
    ];

    keys.forEach((key) => {
        localStorage.removeItem(key);
        sessionStorage.removeItem(key);
    });
}

/* ==========================================
   SAVE RESIDENT SESSION
========================================== */

function saveResidentSession(resident) {
    const residentJson = JSON.stringify(resident);

    try {
        // Save to localStorage.
        localStorage.setItem("loggedInResident", residentJson);
        localStorage.setItem("resident", residentJson);
        localStorage.setItem("residentID", String(resident.residentID));
        localStorage.setItem("residentId", String(resident.residentID));
        localStorage.setItem("isLoggedIn", "true");
        localStorage.setItem("userRole", resident.role);
        localStorage.setItem("barangay", resident.barangay);
        localStorage.setItem("token", resident.token);

        // Save to sessionStorage for compatibility
        // with existing dashboard scripts.
        sessionStorage.setItem("loggedInResident", residentJson);
        sessionStorage.setItem("resident", residentJson);
        sessionStorage.setItem("residentID", String(resident.residentID));
        sessionStorage.setItem("residentId", String(resident.residentID));
        sessionStorage.setItem("isLoggedIn", "true");
        sessionStorage.setItem("userRole", resident.role);
        sessionStorage.setItem("barangay", resident.barangay);
        sessionStorage.setItem("token", resident.token);

        return true;

    } catch (error) {
        console.error("Session Storage Error:", error);
        return false;
    }
}

/* ==========================================
   PROCESS SUCCESSFUL LOGIN
========================================== */

function processSuccessfulLogin(data) {
    const residentData = getResponseObject(data);

    const residentId = getResidentId(data);
    const token = getAuthToken(data);

    const residentBarangay = getResidentBarangay(data);

    const firstName = getResidentName(data, [
        "firstName",
        "first_name",
        "firstname"
    ]);

    const lastName = getResidentName(data, [
        "lastName",
        "last_name",
        "lastname"
    ]);

    const email =
        residentData.email ||
        data.email ||
        document.getElementById("email")?.value.trim() ||
        "";

    const role =
        residentData.role ||
        data.role ||
        "RESIDENT";

    /* --------------------------------------
       VALIDATE RESIDENT ID
    -------------------------------------- */

    if (residentId === null) {
        console.error("Resident ID is missing.");

        showLoginMessage(
            "Login response is missing the Resident ID. Please check your backend login response.",
            "error"
        );

        return false;
    }

    /* --------------------------------------
       VALIDATE JWT TOKEN
    -------------------------------------- */

    if (!token) {
        console.error("JWT token is missing.");

        showLoginMessage(
            "Login succeeded but the authentication token is missing. Please check your backend login response.",
            "error"
        );

        return false;
    }

    /* --------------------------------------
       VALIDATE BARANGAY
    -------------------------------------- */

    if (!residentBarangay) {
        console.error("Resident barangay is missing.");

        showLoginMessage(
            "Your barangay information is missing. Please check your resident account.",
            "error"
        );

        return false;
    }

    /* --------------------------------------
       CREATE RESIDENT SESSION
    -------------------------------------- */

    const resident = {
        residentID: residentId,
        residentId: residentId,
        id: residentId,

        firstName: firstName,
        lastName: lastName,
        email: email,

        barangay: residentBarangay,
        role: role,

        token: token
    };

    /* --------------------------------------
       SAVE SESSION
    -------------------------------------- */

    clearOldLoginSession();

    const saved = saveResidentSession(resident);

    if (!saved) {
        showLoginMessage(
            "Unable to save your login session. Please check your browser settings.",
            "error"
        );

        return false;
    }

    /* --------------------------------------
       LOGIN SUCCESS
    -------------------------------------- */

    console.log("Resident login successful:", {
        residentID: residentId,
        barangay: residentBarangay,
        role: role,
        hasToken: Boolean(token)
    });

    showLoginMessage(
        "Login successful! Redirecting...",
        "success"
    );

    const residentDashboard =
        getBarangayDashboard(residentBarangay);

    setTimeout(() => {
        window.location.href = residentDashboard;
    }, 800);

    return true;
}

/* ==========================================
   LOGIN SUBMIT
========================================== */

if (loginForm) {
    loginForm.addEventListener("submit", async function (event) {
        event.preventDefault();

        const emailInput = document.getElementById("email");
        const passwordInput = document.getElementById("password");

        const email = emailInput
            ? emailInput.value.trim()
            : "";

        const password = passwordInput
            ? passwordInput.value
            : "";

        /* --------------------------------------
           VALIDATE INPUTS
        -------------------------------------- */

        if (!email || !password) {
            showLoginMessage(
                "Please fill in all fields.",
                "error"
            );

            return;
        }

        /* --------------------------------------
           LOGIN BUTTON
        -------------------------------------- */

        const loginButton =
            loginForm.querySelector(".auth-action-btn") ||
            loginForm.querySelector(".btn-register");

        if (loginButton) {
            loginButton.disabled = true;

            loginButton.innerHTML =
                '<i class="fa-solid fa-spinner fa-spin"></i> Logging in...';
        }

        showLoginMessage("", "error");

        /* --------------------------------------
           SEND LOGIN REQUEST
        -------------------------------------- */

        try {
            const response = await fetch(
                `${API_AUTH_URL}/auth/login`,
                {
                    method: "POST",

                    headers: {
                        "Content-Type": "application/json",
                        "Accept": "application/json"
                    },

                    body: JSON.stringify({
                        email: email,
                        password: password
                    })
                }
            );

            const responseText = await response.text();

            let data = {};

            try {
                data = responseText
                    ? JSON.parse(responseText)
                    : {};
            } catch {
                data = {
                    message: responseText
                };
            }

            /* ----------------------------------
               HANDLE BACKEND ERRORS
            ---------------------------------- */

            if (!response.ok) {
                const errorMessage =
                    typeof data === "string"
                        ? data
                        : data.message ||
                          data.error ||
                          "Invalid email or password.";

                throw new Error(errorMessage);
            }

            /* ----------------------------------
               PROCESS LOGIN RESPONSE
            ---------------------------------- */

            const success = processSuccessfulLogin(data);

            if (!success) {
                resetButton(loginButton);
            }

        } catch (error) {
            console.error("Login Error:", error);

            showLoginMessage(
                error.message ||
                "Unable to connect to the backend. Please try again.",
                "error"
            );

            resetButton(loginButton);
        }
    });
}
