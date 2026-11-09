/* ==========================================
   BACKEND CONFIG
========================================== */

const API_URL = window.BE_API_BASE_URL || "http://localhost:8080/api";

/* ==========================================
   ELEMENTS
========================================== */

const forgotPasswordForm = document.getElementById("forgotPasswordForm");
const forgotMessage = document.getElementById("forgotMessage");
const securityPinInput = document.getElementById("securityPin");

/* ==========================================
   SHOW / HIDE PASSWORD TOGGLE LOGIC
========================================== */

document.querySelectorAll(".toggle-password").forEach((icon) => {
    icon.addEventListener("click", function () {
        const targetId = this.getAttribute("data-target");
        const targetInput = document.getElementById(targetId);

        if (targetInput) {
            if (targetInput.type === "password") {
                targetInput.type = "text";
                this.classList.remove("fa-eye");
                this.classList.add("fa-eye-slash");
            } else {
                targetInput.type = "password";
                this.classList.remove("fa-eye-slash");
                this.classList.add("fa-eye");
            }
        }
    });
});

/* ==========================================
   SECURITY PIN NUMBERS-ONLY CLEANSER
========================================== */

if (securityPinInput) {
    securityPinInput.addEventListener("input", function() {
        this.value = this.value.replace(/\D/g, "").substring(0, 6);
    });
}

function showMessage(message, type) {
    if (!forgotMessage) return;
    forgotMessage.textContent = message;
    forgotMessage.className = "auth-message " + type;
}

function validatePassword(password) {
    const passwordPattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
    return passwordPattern.test(password);
}

if (forgotPasswordForm) {
    forgotPasswordForm.addEventListener("submit", async function(event) {
        event.preventDefault();

        const email = document.getElementById("email").value.trim();
        const securityPin = document.getElementById("securityPin").value.trim();
        const newPassword = document.getElementById("newPassword").value;
        const confirmPassword = document.getElementById("confirmPassword").value;

        if (!email || !securityPin || !newPassword || !confirmPassword) {
            showMessage("Please fill in all fields.", "error");
            return;
        }

        const pinRegex = /^\d{6}$/;
        if (!pinRegex.test(securityPin)) {
            showMessage("Security PIN must be exactly 6 digits.", "error");
            return;
        }

        if (!validatePassword(newPassword)) {
            showMessage("Password must be at least 8 characters and contain uppercase, lowercase, and a number.", "error");
            return;
        }

        if (newPassword !== confirmPassword) {
            showMessage("Passwords do not match.", "error");
            return;
        }

        const button = forgotPasswordForm.querySelector(".auth-action-btn");
        if (button) {
            button.disabled = true;
            button.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Updating...';
        }

        try {
            const response = await fetch(`${API_URL}/residents/forgot-password`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, securityPin, newPassword })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || "Unable to reset password.");
            }

            showMessage(data.message || "Password reset successfully. Redirecting...", "success");

            document.getElementById("forgotPasswordForm").reset();

            setTimeout(function() {
                window.location.href = "login.html";
            }, 2000);

        } catch (error) {
            console.error("Forgot Password Error:", error);
            showMessage(error.message || "Server error. Please try again.", "error");

            if (button) {
                button.disabled = false;
                button.innerHTML = 'Reset Password';
            }
        }
    });
}