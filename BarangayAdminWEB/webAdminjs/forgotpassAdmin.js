document.addEventListener("DOMContentLoaded", function () {
    const getElement = (id) => document.getElementById(id);
    const forgotForm = getElement("forgotForm");

    if (!forgotForm) {
        console.error("Forgot password form not found.");
        return;
    }

    // ==========================================
    // DYNAMIC BACKEND URL DETECTION
    // ==========================================
    const API_BASE = (window.BE_API_BASE_URL || 'https://barangay-ease-backend.onrender.com/api').replace(/\/+$/, '');

    const API_URL = `${API_BASE}/admins/update-password`;

    // ==========================================
    // SHOW / HIDE PASSWORD AND SECURITY PIN
    // ==========================================
    document.querySelectorAll(".toggle-password").forEach(icon => {
        icon.addEventListener("click", () => {
            const targetId = icon.getAttribute("data-target");
            const targetInput = getElement(targetId);

            if (!targetInput) return;

            const isPassword = targetInput.type === "password";
            targetInput.type = isPassword ? "text" : "password";

            // Palitan ang icon (Eye open / Eye slash)
            icon.classList.toggle("fa-eye", !isPassword);
            icon.classList.toggle("fa-eye-slash", isPassword);
        });
    });

    // ==========================================
    // FORM SUBMISSION (RESET PASSWORD)
    // ==========================================
    forgotForm.addEventListener("submit", async function (e) {
        e.preventDefault();

        const email = getElement("email")?.value.trim() || "";
        const securityPin = getElement("securityPin")?.value.trim() || "";
        const newPassword = getElement("newPassword")?.value || "";
        const confirmPassword = getElement("confirmPassword")?.value || "";

        // Validations
        if (!email) { 
            alert("Please enter your email."); 
            getElement("email")?.focus();
            return; 
        }
        if (!/^\d{6}$/.test(securityPin)) { 
            alert("Enter your exact 6-digit security PIN."); 
            getElement("securityPin")?.focus();
            return; 
        }
        if (newPassword.length < 8) { 
            alert("Password must be at least 8 characters."); 
            getElement("newPassword")?.focus();
            return; 
        }
        if (newPassword !== confirmPassword) {
            alert("Passwords do not match.");
            getElement("confirmPassword")?.focus();
            return;
        }

        try {
            const response = await fetch(API_URL, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    "Accept": "application/json"
                },
                body: JSON.stringify({ email, securityPin, newPassword })
            });

            const responseText = await response.text();
            let data = {};
            try {
                data = responseText ? JSON.parse(responseText) : {};
            } catch {
                data = { message: responseText };
            }

            if (!response.ok) {
                alert(data.message || data.error || `Failed to reset password. HTTP ${response.status}`);
                return;
            }

            alert("Password reset successfully! Redirecting to login...");
            window.location.href = "loginAdmin.html";

        } catch (err) {
            console.error("Error resetting password:", err);
            alert("Unable to connect to the server. Please check your backend.");
        }
    });
});