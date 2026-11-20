
/* ==========================================
   BARANGAYEASE ADMIN LOGIN
========================================== */

document.addEventListener("DOMContentLoaded", () => {

    const form = document.getElementById("loginForm");
    const loginBtn = document.getElementById("loginBtn");

    const emailInput = document.getElementById("email");
    const passwordInput = document.getElementById("password");

    // ==========================================
    // BACKEND CONFIGURATION
    // ==========================================

    const BACKEND_BASE =
        window.location.hostname === "localhost" ||
        window.location.hostname === "127.0.0.1"

            ? "http://localhost:8080"

            : "https://barangay-ease-backend.onrender.com";

    const API_URL = `${BACKEND_BASE}/api/admins/login`;

    if (!form) {
        console.error("Admin login form not found.");
        return;
    }

    // ==========================================
    // ADMIN LOGIN
    // ==========================================

    form.addEventListener("submit", async (event) => {

        event.preventDefault();

        const email = emailInput?.value.trim();
        const password = passwordInput?.value;

        if (!email || !password) {
            alert("Please enter your email and password.");
            return;
        }

        try {

            // DISABLE LOGIN BUTTON
            if (loginBtn) {
                loginBtn.disabled = true;
                loginBtn.innerHTML =
                    '<i class="fa-solid fa-spinner fa-spin"></i> Logging in...';
            }

            const response = await fetch(API_URL, {

                method: "POST",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify({
                    email: email,
                    password: password
                })

            });

            // HANDLE SERVER RESPONSE
            let data;

            try {
                data = await response.json();
            } catch {
                throw new Error("Invalid response from server.");
            }

            if (!response.ok) {
                throw new Error(
                    data.message || "Invalid email or password."
                );
            }

            // ==========================================
            // VALIDATE LOGIN RESPONSE
            // ==========================================

            if (!data.token || !data.barangay || !data.barangayId) {
                throw new Error(
                    "Incomplete admin login information from server."
                );
            }

            // ==========================================
            // CREATE ADMIN SESSION
            // ==========================================

            const adminSession = {

                token: data.token,

                adminId: data.adminId,

                fullname:
                    data.fullname ||
                    data.username ||
                    "",

                username:
                    data.username ||
                    data.fullname ||
                    "",

                email:
                    data.email ||
                    email,

                barangay: data.barangay,

                barangayId: data.barangayId,

                role: data.role || ""

            };

            // ==========================================
            // SAVE ADMIN SESSION
            // ==========================================

            localStorage.setItem(
                "loggedAdmin",
                JSON.stringify(adminSession)
            );

            localStorage.setItem("token", data.token);

            localStorage.setItem("role", "ADMIN");

            localStorage.setItem(
                "adminRole",
                adminSession.role
            );

            localStorage.setItem(
                "username",
                adminSession.username
            );

            localStorage.setItem(
                "email",
                adminSession.email
            );

            localStorage.setItem(
                "barangay",
                adminSession.barangay
            );

            localStorage.setItem(
                "barangayId",
                String(adminSession.barangayId)
            );

            localStorage.setItem(
                "adminId",
                String(adminSession.adminId)
            );

            // ==========================================
            // SUCCESS
            // ==========================================

            alert("Login successful!");

            window.location.href = "BarangayAdmin.html";

        } catch (error) {

            console.error("Admin login error:", error);

            alert(
                error.message ||
                "Unable to connect to the server."
            );

        } finally {

            // RESTORE LOGIN BUTTON
            if (loginBtn) {

                loginBtn.disabled = false;

                loginBtn.innerHTML =
                    '<i class="fa-solid fa-right-to-bracket"></i> Login';

            }

        }

    });

    // ==========================================
    // SHOW / HIDE PASSWORD
    // ==========================================

    document.querySelectorAll(".toggle-password").forEach(icon => {

        const togglePassword = () => {

            const targetId = icon.dataset.target || "password";

            const input = document.getElementById(targetId);

            if (!input) return;

            const isPassword = input.type === "password";

            input.type = isPassword ? "text" : "password";

            icon.classList.toggle("fa-eye", !isPassword);

            icon.classList.toggle("fa-eye-slash", isPassword);

            icon.setAttribute(
                "aria-label",
                isPassword ? "Hide password" : "Show password"
            );

        };

        icon.addEventListener("click", togglePassword);

        icon.addEventListener("keydown", event => {

            if (event.key === "Enter" || event.key === " ") {

                event.preventDefault();

                togglePassword();

            }

        });

    });

});
