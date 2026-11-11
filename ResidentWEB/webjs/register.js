document.addEventListener("DOMContentLoaded", () => {

    const form = document.getElementById("registerForm");

    if (!form) {
        console.error("Registration form not found: registerForm");
        return;
    }

    const registerBtn = form.querySelector('[type="submit"]');

    // DITO ANG PAGBABAGO: Dynamic hostname detection para sa Netlify at Localhost
    const BACKEND_BASE = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
        ? 'http://localhost:8080'
        : 'https://barangay-ease-backend.onrender.com';

    const API_URL = `${BACKEND_BASE}/api/residents/register`;

    // Get input value
    const getValue = (id) => {
        const element = document.getElementById(id);
        return element ? element.value.trim() : "";
    };

    // =====================================
    // SHOW / HIDE PASSWORD AND SECURITY PIN
    // =====================================

    const toggleIcons = document.querySelectorAll(".toggle-password");

    function togglePasswordVisibility(icon) {

        const targetId = icon.dataset.target;
        const input = document.getElementById(targetId);

        if (!input) {
            console.error("Password input not found:", targetId);
            return;
        }

        if (input.type === "password") {

            input.type = "text";

            icon.classList.remove("fa-eye");
            icon.classList.add("fa-eye-slash");

            icon.setAttribute("aria-label", "Hide password");
            icon.setAttribute("title", "Hide password");

        } else {

            input.type = "password";

            icon.classList.remove("fa-eye-slash");
            icon.classList.add("fa-eye");

            icon.setAttribute("aria-label", "Show password");
            icon.setAttribute("title", "Show password");

        }
    }

    toggleIcons.forEach((icon) => {

        icon.addEventListener("click", () => {
            togglePasswordVisibility(icon);
        });

        // Allow Enter and Space keyboard controls
        icon.addEventListener("keydown", (event) => {

            if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                togglePasswordVisibility(icon);
            }

        });

    });

    // =====================================
    // PASSWORD REQUIREMENTS
    // =====================================

    const passwordInput = document.getElementById("password");

    function updatePasswordRequirements() {

        const password = passwordInput.value;

        const hasLength = password.length >= 8;
        const hasLetter = /[A-Za-z]/.test(password);
        const hasNumber = /[0-9]/.test(password);

        updateRequirement("lengthCheck", hasLength);
        updateRequirement("letterCheck", hasLetter);
        updateRequirement("numberCheck", hasNumber);
    }

    function updateRequirement(elementId, isValid) {

        const element = document.getElementById(elementId);

        if (!element) return;

        const icon = element.querySelector("i");

        if (isValid) {

            element.style.color = "green";

            if (icon) {
                icon.className = "fa-solid fa-circle-check";
            }

        } else {

            element.style.color = "red";

            if (icon) {
                icon.className = "fa-solid fa-circle-xmark";
            }

        }
    }

    if (passwordInput) {
        passwordInput.addEventListener(
            "input",
            updatePasswordRequirements
        );
    }

    // =====================================
    // REGISTRATION FORM
    // =====================================

    form.addEventListener("submit", async (event) => {

        event.preventDefault();

        const firstName = getValue("firstName");
        const middleName = getValue("middleName");
        const lastName = getValue("lastName");
        const contactNumber = getValue("contactNumber");
        const houseStreet = getValue("houseStreet");
        const barangay = getValue("barangay");
        const email = getValue("email").toLowerCase();
        const securityPin = getValue("securityPin");
        const password = getValue("password");
        const confirmPassword = getValue("confirmPassword");

        const terms = document.getElementById("terms");

        // Required fields
        if (
            !firstName ||
            !lastName ||
            !contactNumber ||
            !houseStreet ||
            !barangay ||
            !email ||
            !securityPin ||
            !password ||
            !confirmPassword
        ) {
            alert("Please complete all required fields.");
            return;
        }

        // Password validation
        if (
            password.length < 8 ||
            !/[A-Za-z]/.test(password) ||
            !/[0-9]/.test(password)
        ) {
            alert(
                "Password must be at least 8 characters and contain a letter and a number."
            );
            passwordInput.focus();
            return;
        }

        // Security PIN validation
        if (!/^\d{6}$/.test(securityPin)) {
            alert("Security PIN must contain exactly 6 digits.");

            document.getElementById("securityPin").focus();
            return;
        }

        // Confirm password validation
        if (password !== confirmPassword) {
            alert("Passwords do not match.");

            document.getElementById("confirmPassword").focus();
            return;
        }

        // Terms validation
        if (!terms || !terms.checked) {
            alert("Please accept the Terms and Conditions.");
            return;
        }

        // Resident registration payload
        const payload = {
            firstName,
            middleName,
            lastName,
            contactNumber,
            houseStreet,
            barangay,
            email,
            securityPin,
            password
        };

        try {

            if (registerBtn) {
                registerBtn.disabled = true;
                registerBtn.textContent = "Registering...";
            }

            const response = await fetch(API_URL, {

                method: "POST",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify(payload)

            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    data.message || "Registration failed."
                );
            }

            alert(data.message || "Registration successful!");

            form.reset();

            updatePasswordRequirements();

            window.location.href = "login.html";

        } catch (error) {

            console.error("Resident registration error:", error);

            alert(
                error.message || "Unable to connect to the server."
            );

        } finally {

            if (registerBtn) {
                registerBtn.disabled = false;
                registerBtn.textContent = "Register Account";
            }

        }

    });

});
