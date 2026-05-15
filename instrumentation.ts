import { patchBrokenNodeLocalStorage } from "./patch-localstorage.mjs";

export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    patchBrokenNodeLocalStorage();
  }
}
