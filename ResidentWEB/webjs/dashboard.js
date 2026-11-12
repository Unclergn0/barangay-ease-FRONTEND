/* =========================================================
   BARANGAYEASE RESIDENT DASHBOARD
   Backend Integrated & Dynamic Data Sync
   JWT Authentication Fixed
   ========================================================= */

const API_BASE_URL = window.location.hostname === 'localhost' 
    ? 'http://localhost:8080' 
    : 'https://barangay-ease-backend.onrender.com';
const GEMINI_URL = `${API_BASE_URL}/api/ai/chat`;

/* =========================================================
   1. RESIDENT SESSION
   ========================================================= */

function readResidentSession() {
    const saved =
        localStorage.getItem("loggedInResident") ||
        sessionStorage.getItem("loggedInResident") ||
        localStorage.getItem("resident") ||
        sessionStorage.getItem("resident");

    if (!saved) return null;

    try {
        return JSON.parse(saved);
    } catch (error) {
        console.error("Invalid resident session:", error);
        return null;
    }
}

function getSavedToken() {
    return (
        localStorage.getItem("token") ||
        sessionStorage.getItem("token") ||
        ""
    );
}

const storedResidentSession = readResidentSession();

function normalizeResident(session) {
    if (!session || typeof session !== "object") return null;

    let data = session;

    if (session.resident && typeof session.resident === "object") {
        data = {
            ...session.resident,
            token:
                session.token ||
                session.resident.token ||
                getSavedToken()
        };

    } else if (session.data && typeof session.data === "object") {
        const nested = session.data.resident || session.data;

        data = {
            ...nested,
            token:
                session.token ||
                nested.token ||
                getSavedToken()
        };
    }

    return {
        ...data,

        firstName:
            data.firstName ||
            data.first_name ||
            data.firstname ||
            "",

        lastName:
            data.lastName ||
            data.last_name ||
            data.lastname ||
            "",

        email:
            data.email ||
            data.emailAddress ||
            "",

        barangay:
            data.barangay ||
            data.barangayName ||
            "",

        contactNumber:
            data.contactNumber ||
            data.contact_number ||
            data.mobileNumber ||
            "",

        houseStreet:
            data.houseStreet ||
            data.house_street ||
            data.address ||
            "",

        // IMPORTANT: Preserve the JWT token.
        token:
            data.token ||
            getSavedToken()
    };
}

let resident = normalizeResident(storedResidentSession);

if (!resident) {
    window.location.href = "login.html";
}

function resolveResidentId(session) {
    if (!session || typeof session !== "object") return null;

    const possibleIds = [
        session.residentId,
        session.residentID,
        session.resident_id,
        session.id,
        session.userId,
        session.user_id,
        session.ID
    ];

    const found = possibleIds.find(value =>
        value !== undefined &&
        value !== null &&
        String(value).trim() !== ""
    );

    if (found !== undefined) return found;

    const nestedObjects = [
        session.resident,
        session.user,
        session.profile,
        session.data,
        session.account
    ];

    for (const nested of nestedObjects) {
        const nestedId = resolveResidentId(nested);

        if (nestedId !== null) {
            return nestedId;
        }
    }

    return null;
}

const currentResidentId = resolveResidentId(resident);

function getCurrentResident() {
    return resident || null;
}

function getCurrentResidentId() {
    return currentResidentId;
}

/* =========================================================
   JWT AUTHENTICATION HEADERS
   ========================================================= */

function getResidentAuthHeaders(json = false) {
    const headers = {};

    const token =
        resident?.token ||
        getSavedToken();

    if (token) {
        headers["Authorization"] = `Bearer ${token}`;
    } else {
        console.error(
            "JWT token is missing. Please log out and log in again."
        );
    }

    if (json) {
        headers["Content-Type"] = "application/json";
    }

    return headers;
}

function residentHeaders(json = false) {
    return getResidentAuthHeaders(json);
}

/* =========================================================
   2. BARANGAY THEMES AND LOGOS
   ========================================================= */

const themes = {
    Alabang: {
        primary: "#0A369D",
        secondary: "#FF69B4"
    },

    "Ayala Alabang": {
        primary: "#003366",
        secondary: "#FFD700"
    },

    Bayanan: {
        primary: "#9ACD32",
        secondary: "#FFFFFF"
    },

    Buli: {
        primary: "#FF8800",
        secondary: "#265ee0"
    },

    Cupang: {
        primary: "#C1121F",
        secondary: "#0A369D"
    },

    Poblacion: {
        primary: "#FFD60A",
        secondary: "#0A369D"
    },

    Putatan: {
        primary: "#C1121F",
        secondary: "#FFFFFF"
    },

    Tunasan: {
        primary: "#FF8800",
        secondary: "#FFFFFF"
    },

    Sucat: {
        primary: "#0A369D",
        secondary: "#FFD60A"
    }
};

const logos = {
    Alabang: "weblogo/BRGY.ALABANG.png",
    "Ayala Alabang": "weblogo/BRGY.AYALA-ALABANG.jfif",
    Bayanan: "weblogo/BRGY.BAYANAN.png",
    Buli: "weblogo/BRGY.BULI.png",
    Cupang: "weblogo/BRGY.CUPANG.png",
    Poblacion: "weblogo/BRGY.POBLACION.png",
    Putatan: "weblogo/BRGY.PUTATAN.png",
    Sucat: "weblogo/BRGY.SUCAT.png",
    Tunasan: "weblogo/BRGY.TUNASAN.png"
};

function loadTheme() {
    if (!resident) return;

    document.documentElement.style.removeProperty("--primary");
    document.documentElement.style.removeProperty("--secondary");

    const barangayName = String(resident.barangay || "").trim();
    const theme = themes[barangayName];

    if (!theme) {
        console.error(`No theme configured for barangay: ${barangayName}`);
        return;
    }

    document.documentElement.style.setProperty(
        "--primary",
        theme.primary
    );

    document.documentElement.style.setProperty(
        "--secondary",
        theme.secondary
    );
}

function loadLogo() {
    if (!resident) return;

    const logoElement = document.getElementById("barangayLogo");
    const barangayName = document.getElementById("barangayName");

    if (logoElement && logos[resident.barangay]) {
        logoElement.src = logos[resident.barangay];
    }

    if (barangayName) {
        barangayName.textContent = resident.barangay || "";
    }
}

/* =========================================================
   3. GENERAL HELPERS
   ========================================================= */

function setText(id, value) {
    const element = document.getElementById(id);

    if (element) {
        element.textContent = value ?? "";
    }
}

function escapeResidentHtml(value) {
    return String(value ?? "").replace(/[&<>"']/g, character => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    }[character]));
}

/* =========================================================
   4. PROFILE INFORMATION / SETTINGS
   ========================================================= */

function loadProfile() {
    if (!resident) return;

    const firstName = resident.firstName || "";
    const lastName = resident.lastName || "";
    const email = resident.email || "";
    const barangay = resident.barangay || "";

    const fullName = `${firstName} ${lastName}`.trim();

    setText(
        "residentName",
        fullName.toUpperCase() || "RESIDENT"
    );

    setText(
        "lblFullName",
        fullName || "Name not available"
    );

    setText(
        "lblEmail",
        email || "Email not available"
    );

    setText(
        "lblBarangay",
        barangay || "Barangay not available"
    );

    const fields = {
        editProfileFirstName: firstName,
        editProfileLastName: lastName,
        editProfileEmail: email,
        editProfileBarangay: barangay,
        editProfileContact: resident.contactNumber || "",
        editProfileAddress: resident.houseStreet || ""
    };

    Object.entries(fields).forEach(([id, value]) => {
        const element = document.getElementById(id);

        if (element) {
            element.value = value;
        }
    });

    console.log("Resident profile loaded:", {
        ...resident,
        token: resident.token ? "[TOKEN PRESENT]" : "[NO TOKEN]"
    });
}

async function saveProfile(event) {
    event.preventDefault();

    if (!resident) {
        alert("Resident session not found. Please log in again.");
        return;
    }

    const payload = {
        firstName:
            document.getElementById("editProfileFirstName")?.value.trim() || "",

        lastName:
            document.getElementById("editProfileLastName")?.value.trim() || "",

        email:
            document.getElementById("editProfileEmail")?.value.trim() || "",

        contactNumber:
            document.getElementById("editProfileContact")?.value.trim() || "",

        houseStreet:
            document.getElementById("editProfileAddress")?.value.trim() || ""
    };

    if (!payload.firstName || !payload.lastName || !payload.email) {
        alert("Please complete your first name, last name, and email.");
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/api/resident/profile`, {
            method: "PUT",
            headers: residentHeaders(true),
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            throw new Error(
                await response.text() || `HTTP ${response.status}`
            );
        }

        let updatedData = {};

        try {
            updatedData = await response.json();
        } catch (_) {
            // Backend may return an empty response.
        }

        resident = normalizeResident({
            ...resident,
            ...payload,
            ...(updatedData && typeof updatedData === "object"
                ? updatedData
                : {})
        });

        const residentJson = JSON.stringify(resident);

        localStorage.setItem("loggedInResident", residentJson);
        localStorage.setItem("resident", residentJson);

        sessionStorage.setItem("loggedInResident", residentJson);
        sessionStorage.setItem("resident", residentJson);

        loadProfile();

        alert("Profile updated successfully!");
        showSection("settingsSection");

    } catch (error) {
        console.error("Profile Save Error:", error);
        alert(`Unable to update profile. ${error.message}`);
    }
}

async function updatePassword(event) {
    event.preventDefault();

    const currentPassword =
        document.getElementById("currentPassword")?.value || "";

    const newPassword =
        document.getElementById("newPassword")?.value || "";

    const confirmPassword =
        document.getElementById("confirmPassword")?.value || "";

    if (
        newPassword.length < 8 ||
        !/[A-Za-z]/.test(newPassword) ||
        !/\d/.test(newPassword)
    ) {
        alert(
            "New password must be at least 8 characters and include a letter and a number."
        );
        return;
    }

    if (newPassword !== confirmPassword) {
        alert("New passwords do not match.");
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/api/resident/password`, {
            method: "PUT",
            headers: residentHeaders(true),
            body: JSON.stringify({
                currentPassword,
                newPassword
            })
        });

        if (!response.ok) {
            throw new Error(
                await response.text() || `HTTP ${response.status}`
            );
        }

        event.target.reset();
        alert("Password updated successfully!");

    } catch (error) {
        console.error("Password Update Error:", error);
        alert(`Unable to update password. ${error.message}`);
    }
}

/* =========================================================
   5. PROFILE DROPDOWN AND LOGOUT
   ========================================================= */

function toggleProfileDropdown() {
    document.getElementById("profileDropdown")?.classList.toggle("hidden");
}

window.addEventListener("click", function (event) {
    const wrapper = document.querySelector(".topbar-profile-wrapper");
    const dropdown = document.getElementById("profileDropdown");

    if (wrapper && dropdown && !wrapper.contains(event.target)) {
        dropdown.classList.add("hidden");
    }
});

function logout() {
    if (!confirm("Are you sure you want to logout?")) return;

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

    keys.forEach(key => {
        localStorage.removeItem(key);
        sessionStorage.removeItem(key);
    });

    window.location.href = "login.html";
}

/* =========================================================
   6. SECTION NAVIGATION
   ========================================================= */

function showSection(sectionId) {
    document.querySelectorAll(".content-section").forEach(section => {
        section.classList.add("hidden");
    });

    const target = document.getElementById(sectionId);

    if (target) {
        target.classList.remove("hidden");
    }

    document.getElementById("profileDropdown")?.classList.add("hidden");

    if (sectionId === "notificationSection") {
        document.getElementById("notificationList")?.classList.remove("hidden");

        document.getElementById("notificationDetailView")?.classList.add("hidden");

        fetchUserNotifications();
    }

    if (sectionId === "transactionSection") {
        backToTransactions();
    }

    if (sectionId === "complaintHistorySection") {
        fetchResidentComplaintHistory();
    }
}

/* =========================================================
   7. SERVICE REQUIREMENTS
   ========================================================= */

const requirements = {
    "Barangay Clearance": [
        "Valid Government-issued ID",
        "Proof of residency",
        "Community Tax Certificate (Cedula)"
    ],

    "Certificate of Residency": [
        "Valid Government-issued ID",
        "Proof of Address / Residency"
    ],

    "Certificate of Indigency": [
        "Valid Government-issued ID",
        "Proof of Residency",
        "Declared Monthly Family Income"
    ],

    "First Time Job Seeker Certificate": [
        "Valid Government-issued ID or Student ID",
        "Proof of Residency",
        "Accomplished First-Time Job Seeker Oath Form (RA 11261)"
    ],

    "Barangay ID Application": [
        "Valid Government-issued ID or Student ID",
        "Proof of Residency (Utility Bill)",
        "1x1 or 2x2 ID Photo",
        "Emergency Contact Details"
    ],

    "Certificate of Good Moral Character": [
        "Valid Government-issued ID",
        "Barangay Clearance",
        "Purpose of Request"
    ],

    "Certificate of Single Status / Co-habitation": [
        "Valid Government-issued ID of both parties",
        "Joint Affidavit of Two Disinterested Persons",
        "Proof of Residency"
    ],

    "Barangay Guardianship Certificate": [
        "Valid Government-issued ID of Guardian",
        "Child's PSA Birth Certificate",
        "Barangay Endorsement / Affidavit"
    ],

    "Business Permit Clearance": [
        "Valid Government-issued ID",
        "Business Details (Name, Address, Nature)",
        "Existing Mayor's Permit or Application"
    ],

    "Business Permit Endorsement": [
        "Valid Government-issued ID",
        "Business Details",
        "Proof of Location (Contract of Lease or TCT)",
        "Locational / Sanitary Clearance"
    ]
};

function initializeRequirements() {
    const serviceType = document.getElementById("serviceType");

    if (!serviceType) return;

    updateServiceRequirements();

    serviceType.addEventListener(
        "change",
        updateServiceRequirements
    );
}

function updateServiceRequirements() {
    const serviceType = document.getElementById("serviceType");
    const list = document.getElementById("requirementsList");

    if (!serviceType || !list) return;

    list.innerHTML = "";

    const selected = requirements[serviceType.value];

    if (!selected) {
        const li = document.createElement("li");

        li.textContent = "Please select a service type above.";

        list.appendChild(li);
        return;
    }

    selected.forEach(item => {
        const li = document.createElement("li");

        li.textContent = item;

        list.appendChild(li);
    });
}

/* =========================================================
   8. SUBMIT SERVICE REQUEST
   ========================================================= */

async function submitServiceRequest(event) {
    event.preventDefault();

    if (!currentResidentId) {
        alert("Resident ID not found. Please log in again.");
        return;
    }

    const fileInput = document.getElementById("serviceFiles");
    
    // VALIDATION: Siguraduhing may na-upload na file
    if (!fileInput || !fileInput.files || fileInput.files.length === 0) {
        alert("Please upload at least one supporting document before submitting.");
        return;
    }

    const serviceType = document.getElementById("serviceType")?.value || "";
    const purpose = document.getElementById("servicePurpose")?.value || "";
    const pickupDate = document.getElementById("servicePickupDate")?.value || "";
    const pickupTime = document.getElementById("servicePickupTime")?.value || "";

    const formData = new FormData();
    formData.append("serviceType", serviceType);
    formData.append("purpose", purpose);
    formData.append("pickupDate", pickupDate);
    formData.append("pickupTime", pickupTime);
    formData.append("residentId", String(currentResidentId));

    Array.from(fileInput.files).forEach(file => {
        formData.append("files", file);
    });

    try {
        const response = await fetch(`${API_BASE_URL}/api/services/request`, {
            method: "POST",
            headers: getResidentAuthHeaders(),
            body: formData
        });

        if (!response.ok) {
            throw new Error(await response.text() || `HTTP ${response.status}`);
        }

        alert("Service request submitted successfully!");
        document.getElementById("serviceRequestForm")?.reset();
        updateServiceRequirements();
        showSection("transactionSection");

    } catch (error) {
        console.error("Service Request Error:", error);
        alert(`Error submitting request. ${error.message}`);
    }
}

/* =========================================================
   9. FETCH RESIDENT TRANSACTIONS
   ========================================================= */

async function fetchUserTransactions() {
    const container = document.getElementById("transactionListContainer");

    if (!container) return;

    if (!currentResidentId) {
        container.textContent =
            "Unable to identify your resident account. Please log in again.";

        console.error("Resident ID missing:", resident);
        return;
    }

    container.innerHTML = `
        <p style="text-align:center;color:#666;padding:20px;">
            Loading transactions from database...
        </p>
    `;

    try {
        const response = await fetch(
            `${API_BASE_URL}/api/services/transactions?residentId=${encodeURIComponent(currentResidentId)}`,
            {
                method: "GET",
                headers: getResidentAuthHeaders()
            }
        );

        if (!response.ok) {
            throw new Error(
                await response.text() || `HTTP ${response.status}`
            );
        }

        const transactions = await response.json();

        container.innerHTML = "";

        if (!Array.isArray(transactions) || transactions.length === 0) {
            container.innerHTML = `
                <p style="text-align:center;color:#666;padding:20px;font-style:italic;">
                    No active transactions found.
                </p>
            `;

            return;
        }

        transactions.forEach(tx => {
            const transactionId =
                tx.requestId ?? tx.id ?? tx.transactionId;

            const title =
                tx.requestType || tx.title || "Document Request";

            const status = tx.status || "Pending";

            const isApproved = ["approved", "completed", "ready for pickup"].includes(status.trim().toLowerCase());

            const card = document.createElement("div");
            card.className = "transaction-card";

            const header = document.createElement("div");
            header.className = "transaction-header";

            const infoGroup = document.createElement("div");
            infoGroup.className = "transaction-info-group";

            const icon = document.createElement("div");
            icon.className = "transaction-icon";
            icon.innerHTML = '<i class="fas fa-file-alt"></i>';

            const titleArea = document.createElement("div");
            titleArea.className = "transaction-title-area";

            const heading = document.createElement("h3");
            heading.textContent = title;

            const requestIdElement = document.createElement("div");
            requestIdElement.className = "transaction-subtitle";

            requestIdElement.textContent =
                `Request ID: #${transactionId ?? "N/A"}`;

            const metaTags = document.createElement("div");
            metaTags.className = "transaction-meta-tags";

            const dateTag = document.createElement("span");
            dateTag.textContent = `Date: ${tx.createdAt || "N/A"}`;

            const feeTag = document.createElement("span");
            feeTag.textContent = `Fee: ₱${tx.fee ?? "0.00"}`;

            metaTags.append(dateTag, feeTag);

            titleArea.append(
                heading,
                requestIdElement,
                metaTags
            );

            infoGroup.append(icon, titleArea);

            const statusBadge = document.createElement("div");

            statusBadge.className =
                `transaction-status-badge ${isApproved ? "approved" : "pending"}`;

            statusBadge.textContent = status;

            header.append(infoGroup, statusBadge);

            const details = document.createElement("div");
            details.className = "transaction-details-grid";

            const detailValues = [
                ["Purpose", tx.purpose || "N/A"],
                [
                    "Processing Type",
                    tx.processingType || "Walk-in Pickup / Scheduled"
                ],
                [
                    "Reference No.",
                    tx.referenceNo || `BRGY-MNT-${transactionId ?? "N/A"}`
                ]
            ];

            detailValues.forEach(([label, value]) => {
                const item = document.createElement("div");
                item.className = "detail-item";

                const labelElement = document.createElement("span");
                labelElement.className = "label";
                labelElement.textContent = label;

                const valueElement = document.createElement("span");
                valueElement.className = "value";
                valueElement.textContent = value;

                item.append(labelElement, valueElement);

                details.appendChild(item);
            });

            const actions = document.createElement("div");
            actions.className = "transaction-actions";

            const viewButton = document.createElement("button");

            viewButton.type = "button";
            viewButton.className = "btn-sm-action btn-view-details";

            viewButton.innerHTML =
                '<i class="fas fa-eye"></i> View & Replace Files';

            viewButton.addEventListener("click", () => {
                openTransactionDetail(
                    title,
                    transactionId,
                    status,
                    Array.isArray(tx.files) ? tx.files : [],
                    isApproved
                );
            });

            const cancelButton = document.createElement("button");

            cancelButton.type = "button";
            cancelButton.className = "btn-sm-action btn-cancel-action";

            cancelButton.innerHTML =
                '<i class="fas fa-times"></i> Cancel Request';

            cancelButton.addEventListener("click", () => {
                if (transactionId != null) {
                    cancelTransaction(transactionId);
                } else {
                    alert("This transaction has no valid request ID.");
                }
            });

            actions.append(viewButton, cancelButton);

            card.append(header, details, actions);

            container.appendChild(card);
        });

    } catch (error) {
        console.error("Fetch Transactions Error:", error);

        container.textContent =
            `Failed to load transactions: ${error.message}`;
    }
}

/* =========================================================
   10. CANCEL TRANSACTION
   ========================================================= */

async function cancelTransaction(transactionId) {
    if (!confirm("Are you sure you want to cancel this request?")) {
        return;
    }

    try {
        const response = await fetch(
            `${API_BASE_URL}/api/services/transactions/${encodeURIComponent(transactionId)}`,
            {
                method: "DELETE",
                headers: getResidentAuthHeaders()
            }
        );

        if (!response.ok) {
            throw new Error(
                await response.text() || `HTTP ${response.status}`
            );
        }

        alert("Transaction request cancelled successfully.");

        await fetchUserTransactions();

    } catch (error) {
        console.error("Cancel Transaction Error:", error);

        alert(`Failed to cancel the request. ${error.message}`);
    }
}

/* =========================================================
   11. TRANSACTION DETAILS AND FILE REPLACEMENT
   ========================================================= */

let currentTransaction = {
    title: "",
    id: "",
    status: "",
    files: [],
    isApproved: false
};

function openTransactionDetail(
    title,
    id,
    status,
    files,
    isApproved
) {
    const formattedFiles = (
        Array.isArray(files) ? files : []
    ).map(file => {
        if (typeof file === "string") {
            return {
                type: "Attachment",
                name: file
            };
        }

        return file;
    });

    currentTransaction = {
        title,
        id,
        status: status || "Pending",
        files: formattedFiles,
        isApproved: Boolean(isApproved)
    };

    document
        .getElementById("transactionListContainer")
        ?.classList.add("hidden");

    document
        .getElementById("transactionDetailView")
        ?.classList.remove("hidden");

    setText("detTransTitle", title);
    setText("detTransId", id);

    const badge = document.getElementById("detTransStatus");

    if (badge) {
        badge.textContent = currentTransaction.status;

        badge.className =
            "transaction-status-badge " +
            (
                currentTransaction.status.toLowerCase().includes("pending")
                    ? "pending"
                    : "approved"
            );
    }

    const instruction = document.getElementById("replaceInstruction");

    if (instruction) {
        instruction.textContent =
            currentTransaction.isApproved ||
            currentTransaction.status.toLowerCase().includes("approved")
                ? "This request has been approved. The documents cannot be changed."
                : "You can replace any of the documents below by selecting a new file and clicking Replace.";
    }

    renderSubmittedFiles();
}

function renderSubmittedFiles() {
    const container = document.getElementById("detSubmittedFilesList");

    if (!container) return;

    container.innerHTML = "";

    if (!currentTransaction.files.length) {
        container.textContent = "No document attached.";
        return;
    }

    const isDisabled =
        currentTransaction.isApproved ||
        currentTransaction.status.toLowerCase().includes("approved");

    currentTransaction.files.forEach((fileObj, index) => {
        const item = document.createElement("div");
        item.className = "submitted-file-item";

        const fileInfo = document.createElement("div");

        fileInfo.style.cssText =
            "display:flex;align-items:center;gap:10px;flex:1;min-width:200px;";

        const fileIcon = document.createElement("i");
        fileIcon.className = "fas fa-file-alt";

        const textContainer = document.createElement("div");

        const typeElement = document.createElement("strong");
        typeElement.textContent =
            `[${fileObj.type || "Attachment"}]`;

        const nameElement = document.createElement("span");
        nameElement.textContent =
            fileObj.name || "Unnamed file";

        textContainer.append(typeElement, nameElement);

        fileInfo.append(fileIcon, textContainer);

        item.appendChild(fileInfo);

        if (fileObj.fileId) {
            const downloadButton = document.createElement("button");
            downloadButton.type = "button";
            downloadButton.textContent = "Preview / Download";
            downloadButton.addEventListener("click", () => downloadResidentFile(`/api/services/files/${encodeURIComponent(fileObj.fileId)}`).catch(error => alert(error.message)));
            item.appendChild(downloadButton);
        }

        if (!isDisabled) {
            const controls = document.createElement("div");

            controls.style.cssText =
                "display:flex;align-items:center;gap:8px;";

            const fileInput = document.createElement("input");

            fileInput.type = "file";
            fileInput.id = `fileInput_${index}`;
            fileInput.accept = ".pdf,.jpg,.jpeg,.png";

            const replaceButton = document.createElement("button");

            replaceButton.type = "button";
            replaceButton.textContent = "Replace";

            replaceButton.addEventListener("click", () => {
                replaceSpecificFile(index);
            });

            controls.append(fileInput, replaceButton);

            item.appendChild(controls);

        } else {
            const approvedLabel = document.createElement("span");

            approvedLabel.textContent = "Approved";

            item.appendChild(approvedLabel);
        }

        container.appendChild(item);
    });
}

async function replaceSpecificFile(index) {
    if (
        currentTransaction.isApproved ||
        currentTransaction.status.toLowerCase().includes("approved")
    ) {
        alert(
            "The document cannot be changed because this request has already been approved."
        );

        return;
    }

    const fileInput = document.getElementById(`fileInput_${index}`);

    if (!fileInput || !fileInput.files.length) {
        alert("Please select a new file first.");
        return;
    }

    const newFile = fileInput.files[0];

    const docType =
        currentTransaction.files[index]?.type || "Attachment";

    const formData = new FormData();

    formData.append("file", newFile);
    formData.append("fileIndex", currentTransaction.files[index]?.fileIndex ?? index);
    formData.append("transactionId", currentTransaction.id);

    try {
        const response = await fetch(
            `${API_BASE_URL}/api/services/transactions/replace-file`,
            {
                method: "POST",
                headers: getResidentAuthHeaders(),
                body: formData
            }
        );

        if (!response.ok) {
            throw new Error(
                await response.text() || `HTTP ${response.status}`
            );
        }

        currentTransaction.files[index].name = newFile.name;
        currentTransaction.files[index].fileName = newFile.name;

        renderSubmittedFiles();

        alert(`Successfully replaced ${docType}.`);
        await fetchUserTransactions();

    } catch (error) {
        console.error("File Replacement Error:", error);

        alert(`Failed to update file. ${error.message}`);
    }
}

function backToTransactions() {
    document
        .getElementById("transactionListContainer")
        ?.classList.remove("hidden");

    document
        .getElementById("transactionDetailView")
        ?.classList.add("hidden");

    fetchUserTransactions();
}

/* =========================================================
   12. AI COMPLAINT CLASSIFICATION
   ========================================================= */

async function classifyComplaint() {
    const title =
        document.getElementById("complaintTitle")?.value.trim() || "";

    const description =
        document.getElementById("complaintDescription")?.value.trim() || "";

    const files =
        document.getElementById("complaintFiles")?.files;

    const result =
        document.getElementById("classificationResult");

    if (!description) {
        if (result) {
            result.textContent = "Please enter your complaint details.";
        }
        return;
    }

    if (!resident?.token && !getSavedToken()) {
        if (result) {
            result.textContent = "Your session expired. Please log in again.";
        }
        return;
    }

    if (result) {
        result.textContent = "Analyzing and submitting your complaint...";
    }

    const priority = "mild";

    try {
        const formData = new FormData();

        formData.append(
            "title",
            title || "Resident Complaint"
        );

        formData.append(
            "complaintDetails",
            description
        );

        formData.append(
            "classificationType",
            priority
        );

        if (files?.length) {
            Array.from(files).forEach(file => {
                formData.append("files", file);
            });
        }

        const response = await fetch(
            `${API_BASE_URL}/api/complaints`,
            {
                method: "POST",
                headers: getResidentAuthHeaders(),
                body: formData
            }
        );

        const responseText = await response.text();

        let data = {};

        try {
            data = responseText ? JSON.parse(responseText) : {};
        } catch {
            data = { message: responseText };
        }

        if (!response.ok) {
            throw new Error(
                data.message ||
                data.error ||
                `HTTP ${response.status}`
            );
        }

        if (result) {
            result.innerHTML = `
                <div class="warning-box">
                    <h3>COMPLAINT SUCCESSFULLY SUBMITTED</h3>

                    <p>
                        Complaint ID:
                        <strong>
                            ${escapeResidentHtml(
                                data.complaintId ?? data.id ?? "Submitted"
                            )}
                        </strong>
                    </p>

                    <p>
                        Priority:
                        <strong>
                            ${escapeResidentHtml(
                                data.classificationType || priority
                            )}
                        </strong>
                    </p>

                    <p>
                        Status:
                        <strong>
                            ${escapeResidentHtml(data.status || "Pending")}
                        </strong>
                    </p>

                    <p>
                        Your complaint has been submitted to your
                        barangay administration for review.
                    </p>

                    ${data.aiMessage ? `<p>${escapeResidentHtml(data.aiMessage)}</p>` : ""}
                </div>
            `;
        }

        document.getElementById("complaintForm")?.reset();

        await fetchResidentComplaintHistory();

    } catch (error) {
        console.error("Complaint Submission Error:", error);

        if (result) {
            result.textContent =
                `Unable to submit complaint: ${error.message}`;
        }
    }
}

/* =========================================================
   13. AI CHATBOT - BARANGAYEASE
   ========================================================= */

async function sendMessage() {

    const input = document.getElementById("chatInput");
    const messages = document.getElementById("chatMessages");

    if (!input || !messages) {
        console.error("AI Chat HTML elements not found.");
        return;
    }

    const question = input.value.trim();

    if (!question) return;

    const token = resident?.token || getSavedToken();

    if (!token) {
        alert("Your login session has expired. Please log in again.");
        window.location.href = "login.html";
        return;
    }

    const userMessage = document.createElement("div");
    userMessage.className = "user-message";
    userMessage.textContent = question;

    messages.appendChild(userMessage);
    input.value = "";

    const pending = document.createElement("div");
    pending.className = "ai-message";
    pending.textContent = "AI is thinking...";

    messages.appendChild(pending);
    messages.scrollTop = messages.scrollHeight;

    try {
        const response = await fetch(
            GEMINI_URL,
            {
                method: "POST",
                headers: getResidentAuthHeaders(true),
                body: JSON.stringify({
                    message: question
                })
            }
        );

        const data = await response.json().catch(() => ({}));

        if (!response.ok) {
            console.error("AI Chat HTTP Error:", {
                status: response.status,
                message: data.message
            });

            if (response.status === 401 || response.status === 403) {
                pending.textContent =
                    "Your session has expired. Please log in again.";
                return;
            }

            if (response.status === 429) {
                pending.textContent =
                    data.message ||
                    "You are sending messages too quickly. Please wait a moment and try again.";
                return;
            }

            if (response.status === 503) {
                pending.textContent =
                    "AI Chat is not configured on the server. Please contact the administrator.";
                return;
            }

            if (response.status === 502) {
                pending.textContent =
                    data.message ||
                    "The AI service is temporarily unavailable. Please try again later.";
                return;
            }

            throw new Error(
                data.message || `HTTP ${response.status}`
            );
        }

        const rawReply =
            data.reply ||
            data.message ||
            "Sorry, the AI assistant did not provide a response.";

        if (window.marked && typeof window.marked.parse === "function") {
            pending.innerHTML = window.marked.parse(rawReply);
        } else {
            pending.textContent = rawReply;
        }

    } catch (error) {
        console.error("AI Chat Error:", error);

        pending.textContent =
            "The AI assistant is temporarily unavailable. Please contact the barangay office.";
    }

    messages.scrollTop = messages.scrollHeight;
}

/* =========================================================
   14. NOTIFICATIONS
   ========================================================= */

async function fetchUserNotifications() {
    const container =
        document.getElementById("notificationList");

    if (!container) return;

    if (!currentResidentId) {
        container.textContent =
            "Resident account not found. Please log in again.";
        return;
    }

    container.textContent = "Loading notifications...";

    try {
        const response = await fetch(
            `${API_BASE_URL}/api/notifications`,
            {
                headers: getResidentAuthHeaders()
            }
        );

        if (!response.ok) {
            throw new Error(
                await response.text() || `HTTP ${response.status}`
            );
        }

        const items = await response.json();

        container.innerHTML = "";

        if (!Array.isArray(items) || items.length === 0) {
            container.textContent = "No notifications yet.";
            return;
        }

        items.forEach(item => {
            const card = document.createElement("div");
            card.className = "clickable-notif";

            const title = document.createElement("strong");
            title.textContent =
                item.title || "Barangay Update";

            const message = document.createElement("p");
            message.textContent =
                item.message || item.description || "";

            const state = document.createElement("small");
            state.textContent =
                item.isRead || item.read ? "Read" : "Unread";

            card.append(title, message, state);

            card.addEventListener("click", () => {
                viewNotificationDetail(
                    item.title || "Barangay Update",
                    item.message || item.description || ""
                );

                const id =
                    item.notificationId ?? item.id;

                if (id != null && !(item.isRead || item.read)) {
                    markNotificationRead(id);
                }
            });

            container.appendChild(card);
        });

    } catch (error) {
        console.error("Fetch Notifications Error:", error);

        container.textContent =
            `Unable to load notifications: ${error.message}`;
    }
}

async function markNotificationRead(id) {
    try {
        const response = await fetch(
            `${API_BASE_URL}/api/notifications/${encodeURIComponent(id)}/read`,
            {
                method: "PUT",
                headers: getResidentAuthHeaders()
            }
        );

        if (!response.ok) {
            throw new Error(
                await response.text() || `HTTP ${response.status}`
            );
        }

        await fetchUserNotifications();

    } catch (error) {
        console.error("Mark Notification Read Error:", error);
    }
}

function viewNotificationDetail(title, description) {
    document
        .getElementById("notificationList")
        ?.classList.add("hidden");

    document
        .getElementById("notificationDetailView")
        ?.classList.remove("hidden");

    setText("detailTitle", title);
    setText("detailDescription", description);
}

function backToNotifications() {
    document
        .getElementById("notificationList")
        ?.classList.remove("hidden");

    document
        .getElementById("notificationDetailView")
        ?.classList.add("hidden");

    fetchUserNotifications();
}

async function downloadResidentFile(path) {
    const response = await fetch(`${API_BASE_URL}${path}`, {
        headers: getResidentAuthHeaders()
    });
    if (!response.ok) throw new Error(`Unable to open attachment (${response.status}).`);
    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    if (["application/pdf", "image/jpeg", "image/png"].includes(blob.type)) {
        window.open(url, "_blank", "noopener");
        setTimeout(() => URL.revokeObjectURL(url), 60000);
    } else {
        const link = document.createElement("a");
        link.href = url;
        link.download = "attachment";
        document.body.appendChild(link);
        link.click();
        link.remove();
        setTimeout(() => URL.revokeObjectURL(url), 1000);
    }
}

async function replaceComplaintAttachment(complaintId, fileId, input) {
    if (!input?.files?.length) {
        alert("Please select a replacement file.");
        return;
    }
    const data = new FormData();
    data.append("fileId", fileId);
    data.append("file", input.files[0]);
    try {
        const response = await fetch(`${API_BASE_URL}/api/complaints/${encodeURIComponent(complaintId)}/files/replace`, {
            method: "POST",
            headers: getResidentAuthHeaders(),
            body: data
        });
        if (!response.ok) throw new Error(await response.text() || `HTTP ${response.status}`);
        alert("Complaint attachment replaced successfully.");
        await fetchResidentComplaintHistory();
    } catch (error) {
        console.error("Complaint attachment replacement failed:", error);
        alert(`Unable to replace attachment: ${error.message}`);
    }
}

/* =========================================================
   15. COMPLAINT HISTORY
   ========================================================= */

async function fetchResidentComplaintHistory() {
    const container =
        document.getElementById("complaintHistoryList");

    if (!container) return;

    if (!currentResidentId) {
        container.textContent =
            "Please log in again to view your complaint history.";
        return;
    }

    container.textContent = "Loading complaint history...";

    try {
        const response = await fetch(
            `${API_BASE_URL}/api/complaints/resident/${encodeURIComponent(currentResidentId)}`,
            {
                headers: getResidentAuthHeaders()
            }
        );

        if (!response.ok) {
            throw new Error(
                await response.text() || `HTTP ${response.status}`
            );
        }

        const rows = await response.json();

        container.innerHTML = "";

        if (!Array.isArray(rows) || rows.length === 0) {
            container.textContent =
                "You have not submitted any complaints yet.";

            return;
        }

        rows.forEach(row => {
            const card = document.createElement("article");
            card.className = "transaction-card";

            const title = document.createElement("h3");
            title.textContent =
                row.title || "Barangay Complaint";

            const details = document.createElement("p");
            details.textContent =
                row.complaintDetails || row.description || "";

            const classification = document.createElement("p");
            classification.textContent =
                `Classification: ${row.classificationType || "Pending"}`;

            const status = document.createElement("p");
            status.textContent =
                `Status: ${row.status || "Pending"}`;

            const date = document.createElement("small");
            date.textContent =
                row.createdAt || row.dateSubmitted || "";

            card.append(title, details, classification, status, date);

            const attachments = Array.isArray(row.files) ? row.files : [];
            if (attachments.length) {
                const fileHeading = document.createElement("strong");
                fileHeading.textContent = "Submitted evidence:";
                card.appendChild(fileHeading);
                attachments.forEach((file) => {
                    const fileRow = document.createElement("div");
                    fileRow.className = "submitted-file-item";
                    const fileName = document.createElement("span");
                    fileName.textContent = file.name || file.fileName || "Attachment";
                    fileRow.appendChild(fileName);

                    if (file.fileId) {
                        const download = document.createElement("button");
                        download.type = "button";
                        download.textContent = "Preview / Download";
                        download.addEventListener("click", () => downloadResidentFile(`/api/complaints/files/${encodeURIComponent(file.fileId)}`).catch(e => alert(e.message)));
                        fileRow.appendChild(download);
                    }

                    const closed = ["resolved", "closed", "completed"].includes(String(row.status || "").toLowerCase());
                    if (file.fileId && !closed) {
                        const input = document.createElement("input");
                        input.type = "file";
                        input.accept = ".pdf,.jpg,.jpeg,.png";
                        const replace = document.createElement("button");
                        replace.type = "button";
                        replace.textContent = "Replace";
                        replace.addEventListener("click", () => replaceComplaintAttachment(row.complaintId, file.fileId, input));
                        fileRow.append(input, replace);
                    }
                    card.appendChild(fileRow);
                });
            } else {
                const noFiles = document.createElement("p");
                noFiles.textContent = "No evidence file attached.";
                card.appendChild(noFiles);
            }

            container.appendChild(card);
        });

    } catch (error) {
        console.error("Complaint History Error:", error);

        container.textContent =
            `Unable to load complaint history: ${error.message}`;
    }
}

/* =========================================================
   16. BARANGAY INQUIRY
   ========================================================= */

async function submitBarangayInquiry(event) {
    event.preventDefault();

    const subject =
        document.getElementById("inquirySubject")?.value.trim() || "";

    const message =
        document.getElementById("inquiryMessage")?.value.trim() || "";

    if (!subject || !message || !currentResidentId) {
        alert(
            "Please complete the form and sign in again if needed."
        );
        return;
    }

    try {
        const response = await fetch(
            `${API_BASE_URL}/api/resident/inquiries`,
            {
                method: "POST",
                headers: residentHeaders(true),
                body: JSON.stringify({
                    residentId: currentResidentId,
                    subject,
                    message,
                    barangay: resident.barangay
                })
            }
        );

        if (!response.ok) {
            throw new Error(
                await response.text() || `HTTP ${response.status}`
            );
        }

        event.target.reset();

        alert("Your inquiry was sent to the barangay office.");

    } catch (error) {
        console.error("Inquiry Error:", error);

        alert(`Unable to send inquiry: ${error.message}`);
    }
}

/* =========================================================
   17. RESIDENT FEEDBACK
   ========================================================= */

async function submitResidentFeedback(event) {
    event.preventDefault();

    const rating = Number(
        document.getElementById("feedbackRating")?.value
    );

    const comment =
        document.getElementById("feedbackComment")?.value.trim() || "";

    if (!rating || !currentResidentId) {
        alert(
            "Please select a rating and sign in again if needed."
        );
        return;
    }

    try {
        const response = await fetch(
            `${API_BASE_URL}/api/feedback`,
            {
                method: "POST",
                headers: residentHeaders(true),
                body: JSON.stringify({
                    residentId: currentResidentId,
                    rating,
                    comment,
                    barangay: resident.barangay
                })
            }
        );

        if (!response.ok) {
            throw new Error(
                await response.text() || `HTTP ${response.status}`
            );
        }

        event.target.reset();

        alert("Thank you for your feedback!");

    } catch (error) {
        console.error("Feedback Error:", error);

        alert(`Unable to submit feedback: ${error.message}`);
    }
}

/* =========================================================
   18. INITIALIZE DASHBOARD
   ========================================================= */

document.addEventListener("DOMContentLoaded", () => {
    if (!resident) {
        window.location.href = "login.html";
        return;
    }

    console.log("Logged-in resident:", {
        ...resident,
        token: resident.token ? "[TOKEN PRESENT]" : "[NO TOKEN]"
    });

    console.log("Current resident ID:", currentResidentId);

    console.log(
        "JWT authentication:",
        resident.token ? "TOKEN FOUND" : "TOKEN MISSING"
    );

    loadTheme();
    loadLogo();
    loadProfile();

    showSection("serviceSection");

    initializeRequirements();

    fetchUserTransactions();
    fetchUserNotifications();

    const wrapper =
        document.querySelector(".topbar-profile-wrapper");

    wrapper?.addEventListener("click", event => {
        if (event.target.closest("a")) {
            event.stopPropagation();
        }
    });
});