
document.addEventListener("DOMContentLoaded", () => {

    const form = document.getElementById("registerForm");

    if (!form) {
        console.error("Registration form not found: registerForm");
        return;
    }

    const registerBtn = form.querySelector('[type="submit"]');

    // =====================================
    // API CONFIGURATION
    // =====================================

    const API_BASE = (
        window.BE_API_BASE_URL ||
        "https://barangay-ease-backend.onrender.com/api"
    ).replace(/\/+$/, "");

    const API_URL = `${API_BASE}/residents/register`;

    // =====================================
    // GET INPUT VALUE
    // =====================================

    const getValue = (id) => {
        const element = document.getElementById(id);
        return element ? element.value.trim() : "";
    };

    // =====================================
    // MOBILE NUMBER INPUT
    // Numbers only, maximum 11 digits
    // =====================================

    const contactNumberInput = document.getElementById("contactNumber");

    if (contactNumberInput) {

        contactNumberInput.addEventListener("input", () => {

            contactNumberInput.value = contactNumberInput.value
                .replace(/\D/g, "")
                .slice(0, 11);

        });

    }

    // =====================================
    // TERMS AND CONDITIONS MODAL
    // =====================================

    const openTerms = document.getElementById("openTerms");
    const closeTerms = document.getElementById("closeTerms");
    const termsModal = document.getElementById("termsModal");

    function setTermsModalOpen(isOpen) {

        if (!termsModal) return;

        termsModal.style.display = isOpen ? "flex" : "none";
        termsModal.classList.toggle("show", isOpen);
        termsModal.classList.toggle("active", isOpen);

    }

    if (openTerms && termsModal) {

        openTerms.addEventListener("click", (event) => {

            event.preventDefault();
            event.stopPropagation();

            setTermsModalOpen(true);

        });

    }

    if (closeTerms && termsModal) {

        closeTerms.addEventListener("click", () => {
            setTermsModalOpen(false);
        });

    }

    window.addEventListener("click", (event) => {

        if (event.target === termsModal) {
            setTermsModalOpen(false);
        }

    });

    document.addEventListener("keydown", (event) => {

        if (event.key === "Escape" && termsModal) {
            setTermsModalOpen(false);
        }

    });

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

        if (!passwordInput) return;

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

        // =====================================
        // GET FORM VALUES
        // =====================================

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

        // =====================================
        // REQUIRED FIELDS VALIDATION
        // =====================================

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

        // =====================================
        // MOBILE NUMBER VALIDATION
        // Must start with 09 and contain 11 digits
        // =====================================

        if (!/^09\d{9}$/.test(contactNumber)) {

            alert(
                "Mobile number must start with 09 and contain exactly 11 digits."
            );

            if (contactNumberInput) {
                contactNumberInput.focus();
            }

            return;

        }

        // =====================================
        // PASSWORD VALIDATION
        // =====================================

        if (
            password.length < 8 ||
            !/[A-Za-z]/.test(password) ||
            !/[0-9]/.test(password)
        ) {

            alert(
                "Password must be at least 8 characters and contain a letter and a number."
            );

            if (passwordInput) {
                passwordInput.focus();
            }

            return;

        }

        // =====================================
        // SECURITY PIN VALIDATION (6 DIGITS ONLY)
        // =====================================

        if (!/^\d{6}$/.test(securityPin)) {

            alert("Security PIN must contain exactly 6 digits.");

            const securityPinInput = document.getElementById("securityPin");

            if (securityPinInput) {
                securityPinInput.focus();
            }

            return;

        }

        // =====================================
        // CONFIRM PASSWORD VALIDATION
        // =====================================

        if (password !== confirmPassword) {

            alert("Passwords do not match.");

            const confirmPasswordInput =
                document.getElementById("confirmPassword");

            if (confirmPasswordInput) {
                confirmPasswordInput.focus();
            }

            return;

        }

        // =====================================
        // TERMS AND CONDITIONS VALIDATION
        // =====================================

        if (!terms || !terms.checked) {

            alert("Please accept the Terms and Conditions.");
            return;

        }

        // =====================================
        // RESIDENT REGISTRATION PAYLOAD
        // =====================================

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

        // =====================================
        // SEND REGISTRATION REQUEST
        // =====================================

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

            // =====================================
            // REGISTRATION SUCCESS
            // =====================================

            alert(data.message || "Registration successful!");

            form.reset();

            updatePasswordRequirements();

            window.location.href = "login.html";

        } catch (error) {

            // =====================================
            // REGISTRATION ERROR
            // =====================================

            console.error("Resident registration error:", error);

            alert(
                error.message || "Unable to connect to the server."
            );

        } finally {

            // =====================================
            // RESTORE REGISTER BUTTON
            // =====================================

            if (registerBtn) {

                registerBtn.disabled = false;
                registerBtn.textContent = "Register Account";

            }

        }

    });

});
