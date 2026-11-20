
/* ==========================================
   BARANGAYEASE API CONFIGURATION
========================================== */

(function (global) {
    "use strict";

    const LOCAL_API =
        "http://localhost:8080/api";

    const PRODUCTION_API =
        "https://barangay-ease-backend.onrender.com/api";

    // Check whether the frontend is running locally.
    const hostname = global.location.hostname;

    const isLocal =
        hostname === "localhost" ||
        hostname === "127.0.0.1";

    // Explicit configuration takes priority.
    const configured = global.BE_API_BASE_URL;

    global.BE_API_BASE_URL = String(
        configured || (isLocal ? LOCAL_API : PRODUCTION_API)
    ).replace(/\/+$/, "");

    console.info(
        "[BarangayEase] Backend API:",
        global.BE_API_BASE_URL
    );

})(window);
