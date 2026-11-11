document.addEventListener("DOMContentLoaded", () => {

    // ==========================================
    // ELEMENTS
    // ==========================================

    const getElement = (id) => document.getElementById(id);

    const form = getElement("adminRegisterForm");
    const registerBtn = getElement("registerBtn");

    // DITO ANG PAGBABAGO: Dynamic hostname detection para sa Netlify at Localhost
    const BACKEND_BASE = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
        ? 'http://localhost:8080'
        : 'https://barangay-ease-backend.onrender.com';

    const API_URL = `${BACKEND_BASE}/api/admins/register`;

    if (!form || !registerBtn) {
        console.error("Registration form or button not found.");
        return;
    }

    const securityPinInput = getElement("security_pin");
    const passwordInput = getElement("password");
    const confirmPasswordInput = getElement("confirmPassword");

    if (!securityPinInput || !passwordInput || !confirmPasswordInput) {
        console.error("Required registration inputs were not found.");
        return;
    }

    // ==========================================
    // SHOW / HIDE PASSWORD AND SECURITY PIN
    // ==========================================

    document.querySelectorAll(".toggle-password").forEach(icon => {

        icon.addEventListener("click", () => {

            const target = getElement(icon.dataset.target);

            if (!target) return;

            const show = target.type === "password";

            target.type = show ? "text" : "password";

            icon.classList.toggle("fa-eye", !show);
            icon.classList.toggle("fa-eye-slash", show);

        });

    });

    // ==========================================
    // SECURITY PIN VALIDATION
    // ==========================================

    function validateSecurityPin() {

        const securityPin = securityPinInput.value.trim();

        const isValid = /^\d{6}$/.test(securityPin);

        securityPinInput.setCustomValidity(
            isValid ? "" : "Security PIN must contain exactly 6 digits."
        );

        return isValid;
    }

    securityPinInput.addEventListener("input", () => {

        securityPinInput.value = securityPinInput.value
            .replace(/\D/g, "")
            .slice(0, 6);

        validateSecurityPin();

    });

    // ==========================================
    // PASSWORD REQUIREMENTS
    // ==========================================

    function validatePassword() {

        const password = passwordInput.value;

        const checks = {
            lengthCheck: password.length >= 8,
            letterCheck: /[a-zA-Z]/.test(password),
            numberCheck: /\d/.test(password)
        };

        Object.entries(checks).forEach(([id, passed]) => {

            const element = getElement(id);

            if (!element) return;

            const originalText = element.dataset.originalText ||
                element.textContent.trim();

            element.dataset.originalText = originalText;

            element.innerHTML = passed
                ? '<i class="fa-solid fa-circle-check" style="color:green"></i> ' + originalText
                : '<i class="fa-solid fa-circle-xmark" style="color:red"></i> ' + originalText;

        });

        return Object.values(checks).every(Boolean);
    }

    passwordInput.addEventListener("input", validatePassword);

    // ==========================================
    // TERMS AND CONDITIONS MODAL
    // ==========================================

    const termsModal = getElement("termsModal");
    const openTerms = getElement("openTerms");
    const closeTerms = getElement("closeTerms");

    if (openTerms && termsModal) {

        openTerms.addEventListener("click", (e) => {

            e.preventDefault();

            termsModal.classList.remove("hidden");

        });

    }

    if (closeTerms && termsModal) {

        closeTerms.addEventListener("click", () => {

            termsModal.classList.add("hidden");

        });

    }

    window.addEventListener("click", (e) => {

        if (e.target === termsModal) {
            termsModal.classList.add("hidden");
        }

    });

    // ==========================================
    // ADMIN REGISTRATION
    // ==========================================

    form.addEventListener("submit", async (e) => {

        e.preventDefault();

        // ======================================
        // GET FORM VALUES
        // ======================================

        const fullName = getElement("fullName")?.value.trim() || "";
        const email = getElement("email")?.value.trim() || "";
        const barangay = getElement("barangay")?.value || "";
        const role = getElement("role")?.value || "";
        const securityPin = securityPinInput.value.trim();
        const password = passwordInput.value;
        const confirmPassword = confirmPasswordInput.value;

        // ======================================
        // REQUIRED FIELDS
        // ======================================

        if (
            !fullName ||
            !email ||
            !barangay ||
            !role ||
            !securityPin ||
            !password ||
            !confirmPassword
        ) {

            alert("Please complete all required fields.");
            return;

        }

        // ======================================
        // VALIDATE FULL NAME
        // ======================================

        if (fullName.length < 3) {

            alert("Full name must contain at least 3 characters.");
            getElement("fullName")?.focus();
            return;

        }

        // ======================================
        // VALIDATE EMAIL
        // ======================================

        const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if (!emailPattern.test(email)) {

            alert("Please enter a valid email address.");
            getElement("email")?.focus();
            return;

        }

        // ======================================
        // VALIDATE ALLOWED BARANGAYS
        // ======================================

        const allowedBarangays = [
            "Alabang",
            "Ayala Alabang",
            "Bayanan",
            "Buli",
            "Cupang",
            "Poblacion",
            "Putatan",
            "Sucat",
            "Tunasan"
        ];

        if (!allowedBarangays.includes(barangay)) {

            alert("Please select a valid barangay.");
            getElement("barangay")?.focus();
            return;

        }

        // ======================================
        // VALIDATE ALLOWED ROLES
        // ======================================

        const allowedRoles = [
            "Barangay Captain",
            "Barangay Staff",
            "Barangay Secretary"
        ];

        if (!allowedRoles.includes(role)) {

            alert("Invalid role. Please select a valid role.");
            getElement("role")?.focus();
            return;

        }

        // ======================================
        // VALIDATE SECURITY PIN
        // ======================================

        if (!validateSecurityPin()) {

            alert("Security PIN must contain exactly 6 digits.");
            securityPinInput.focus();
            return;

        }

        // ======================================
        // VALIDATE PASSWORD
        // ======================================

        if (!validatePassword()) {

            alert("Please follow all password requirements.");
            passwordInput.focus();
            return;

        }

        // ======================================
        // CONFIRM PASSWORD
        // ======================================

        if (password !== confirmPassword) {

            alert("Passwords do not match!");
            confirmPasswordInput.focus();
            return;

        }

        // ======================================
        // VALIDATE TERMS
        // ======================================

        const termsCheckbox = getElement("terms");

        if (!termsCheckbox || !termsCheckbox.checked) {

            alert("Please accept the Terms and Conditions.");
            return;

        }

        // ======================================
        // REGISTRATION PAYLOAD
        // ======================================

        const payload = {
            fullname: fullName,
            email: email,
            barangay: barangay,
            role: role,
            securityPin: securityPin,
            password: password
        };

        console.log("Sending admin registration request...", {
            fullname: fullName,
            email: email,
            barangay: barangay,
            role: role
        });

        // ======================================
        // SEND REQUEST TO BACKEND
        // ======================================

        try {

            registerBtn.disabled = true;

            registerBtn.innerHTML =
                '<i class="fa-solid fa-spinner fa-spin"></i> Registering...';

            const response = await fetch(API_URL, {

                method: "POST",

                headers: {
                    "Content-Type": "application/json",
                    "Accept": "application/json"
                },

                body: JSON.stringify(payload)

            });

            // ==================================
            // READ SERVER RESPONSE
            // ==================================

            const responseText = await response.text();

            let data = {};

            try {

                data = responseText ? JSON.parse(responseText) : {};

            } catch {

                data = { message: responseText };

            }

            // ==================================
            // HANDLE BACKEND ERRORS
            // ==================================

            if (!response.ok) {

                console.error("Registration error:", {
                    status: response.status,
                    data: data
                });

                alert(
                    data.message ||
                    data.error ||
                    `Registration failed. HTTP ${response.status}`
                );

                return;

            }

            // ==================================
            // REGISTRATION SUCCESS
            // ==================================

            alert("Admin account successfully registered!");

            window.location.href = "loginAdmin.html";

        } catch (error) {

            console.error("Registration error:", error);

            alert(
                "Unable to connect to the server. Please check your backend."
            );

        } finally {

            registerBtn.disabled = false;

            registerBtn.innerHTML =
                '<i class="fa-solid fa-user-plus"></i> Create Admin Account';

        }

    });

});