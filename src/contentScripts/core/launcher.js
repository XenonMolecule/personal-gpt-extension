// launcher.js (Content Script)
// Use browser or fallback to chrome if not defined
const _browser = (typeof browser !== 'undefined') ? browser : chrome;

console.log("Launcher script running...");

function injectPageScript() {
  const script = document.createElement("script");
  script.src = _browser.runtime.getURL("dist/contentScripts/injected.js");
  script.onload = function () {
    console.log("Injected script loaded into the page context.");
    this.remove();
  };
  (document.head || document.documentElement).appendChild(script);
}

// If desired, you can do some checks before injecting
if (location.href.includes("chatgpt.com")) {
  injectPageScript();
} else {
  console.log("Not on ChatGPT domain, skipping injection.");
}