/* Shared BarangayEase API configuration. */
(function (global) {
  "use strict";
  const hostname = global.location.hostname;
  const isLocal = hostname === "localhost" || hostname === "127.0.0.1";
  const fallback = isLocal
    ? "http://localhost:8080/api"
    : "https://barangay-ease-backend.onrender.com/api";
  global.BE_API_BASE_URL = String(global.BE_API_BASE_URL || fallback).replace(/\/+$/, "");
})(window);
