import { writable } from "svelte/store";

export const isMobile = writable(window.innerWidth < 768);

function handleResize() {
    isMobile.set(window.innerWidth < 768);
}

window.addEventListener("resize", handleResize);

export function cleanup() {
    window.removeEventListener("resize", handleResize);
}