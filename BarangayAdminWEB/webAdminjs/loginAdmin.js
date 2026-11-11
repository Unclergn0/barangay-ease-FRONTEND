/* ==========================================
   BARANGAYEASE ADMIN LOGIN
========================================== */

document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("loginForm");
    const loginBtn = document.getElementById("loginBtn");

    // Dynamic Hostname Detection para sa Admin Login
    const BACKEND_BASE = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
        ? 'http://localhost:8080'
        : 'https://barangay-ease-backend.onrender.com';

    const API_URL = `${BACKEND_BASE}/api/admins/login`;

    if (!form) {
        console.error("Admin login form not found.");
        return;
    }

    form.addEventListener("submit", async (event) => {
        event.preventDefault();

        const email = document.getElementById("email")?.value.trim();
        const password = document.getElementById("password")?.value;

        if (!email || !password) {
            alert("Please enter your email and password.");
            return;
        }

        try {
            if (loginBtn) {
                loginBtn.disabled = true;
                loginBtn.textContent = "Logging in...";
            }

            const response = await fetch(API_URL, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ email, password })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || "Invalid email or password.");
            }

            if (!data.token || !data.barangay || !data.barangayId) {
                throw new Error("Incomplete admin login information from server.");
            }

            const adminSession = {
                token: data.token,
                adminId: data.adminId,
                fullname: data.fullname || data.username || "",
                username: data.username || data.fullname || "",
                email: data.email || email,
                barangay: data.barangay,
                barangayId: data.barangayId,
                role: data.role || ""
            };

            localStorage.setItem("loggedAdmin", JSON.stringify(adminSession));

            localStorage.setItem("token", data.token);
            localStorage.setItem("role", "ADMIN");
            localStorage.setItem("adminRole", adminSession.role);
            localStorage.setItem("username", adminSession.username);
            localStorage.setItem("email", adminSession.email);
            localStorage.setItem("barangay", adminSession.barangay);
            localStorage.setItem("barangayId", String(adminSession.barangayId));
            localStorage.setItem("adminId", String(adminSession.adminId));

            alert("Login successful!");

            window.location.href = "BarangayAdmin.html";

        } catch (error) {
            console.error("Admin login error:", error);
            alert(error.message || "Unable to connect to the server.");
        } finally {
            if (loginBtn) {
                loginBtn.disabled = false;
                loginBtn.textContent = "Login";
            }
        }
    });

    // Show / hide password
    document.querySelectorAll(".toggle-password").forEach(icon => {
        icon.addEventListener("click", () => {
            const input = document.getElementById("password");
            if (!input) return;

            const isPassword = input.type === "password";
            input.type = isPassword ? "text" : "password";

            icon.classList.toggle("fa-eye");
            icon.classList.toggle("fa-eye-slash");
        });
    });
});