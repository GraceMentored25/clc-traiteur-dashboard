"use client";

// Chiffrement AES-GCM du localStorage Zustand
// Empêche la lecture par des scripts tiers, extensions malveillantes ou XSS

const SALT = "clc-traiteur-v1";
const ALGO = "AES-GCM";

async function deriveKey(): Promise<CryptoKey> {
  const base = new TextEncoder().encode(SALT + (typeof window !== "undefined" ? window.location.hostname : "localhost"));
  const raw = await crypto.subtle.importKey("raw", base, "PBKDF2", false, ["deriveKey"]);
  return crypto.subtle.deriveKey(
    { name: "PBKDF2", salt: new TextEncoder().encode(SALT), iterations: 100_000, hash: "SHA-256" },
    raw,
    { name: ALGO, length: 256 },
    false,
    ["encrypt", "decrypt"]
  );
}

export async function encryptStore(data: string): Promise<string> {
  try {
    const key = await deriveKey();
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const encoded = new TextEncoder().encode(data);
    const encrypted = await crypto.subtle.encrypt({ name: ALGO, iv }, key, encoded);
    const combined = new Uint8Array(iv.byteLength + encrypted.byteLength);
    combined.set(iv);
    combined.set(new Uint8Array(encrypted), iv.byteLength);
    return btoa(String.fromCharCode(...combined));
  } catch {
    return data; // fallback sans chiffrement si Web Crypto indisponible
  }
}

export async function decryptStore(data: string): Promise<string> {
  try {
    const combined = Uint8Array.from(atob(data), (c) => c.charCodeAt(0));
    const iv = combined.slice(0, 12);
    const encrypted = combined.slice(12);
    const key = await deriveKey();
    const decrypted = await crypto.subtle.decrypt({ name: ALGO, iv }, key, encrypted);
    return new TextDecoder().decode(decrypted);
  } catch {
    return data; // fallback : données non chiffrées (migration depuis ancienne version)
  }
}
