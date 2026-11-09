/* BarangayEase API configuration. Set window.BE_API_BASE_URL before this file
   in production (for example: https://api.example.gov.ph/api). */
(function (global) {
  const configured = global.BE_API_BASE_URL;
  const fallback = `${global.location.protocol}//${global.location.hostname}:8080/api`;
  global.BE_API_BASE_URL = String(configured || fallback).replace(/\/+$/, "");
})(window);
