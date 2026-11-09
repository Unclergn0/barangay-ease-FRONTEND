document.addEventListener("DOMContentLoaded", function () {
    const forgotForm = document.getElementById("forgotForm");

    if (forgotForm) {
        forgotForm.addEventListener("submit", async function (e) {
            e.preventDefault();

            const email = document.getElementById("email").value.trim();
            const securityPin = document.getElementById("securityPin")?.value.trim() || "";
            const newPassword = document.getElementById("newPassword").value;
            const confirmPassword = document.getElementById("confirmPassword").value;

            if (!/^\d{6}$/.test(securityPin)) { alert("Enter your 6-digit security PIN."); return; }
            if (newPassword.length < 8) { alert("Password must be at least 8 characters."); return; }
            if (newPassword !== confirmPassword) {
                alert("Passwords do not match.");
                return;
            }

            try {
                const response = await fetch(`${window.BE_API_BASE_URL || "http://localhost:8080/api"}/admins/update-password`, {
                    method: "PUT",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({ email, securityPin, newPassword })
                });

                const data = await response.json();

                if (response.ok) {
                    alert("Password reset successfully! Redirecting to login...");
                    window.location.href = "loginAdmin.html";
                } else {
                    alert(data.message || "Failed to reset password.");
                }
            } catch (err) {
                console.error("Error resetting password:", err);
                alert("Network error. Please try again.");
            }
        });
    }
});