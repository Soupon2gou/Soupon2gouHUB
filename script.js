const body = document.body;
const themeToggle = document.querySelector("[data-theme-toggle]");
const copyButton = document.querySelector("[data-copy-link]");
const profilePanel = document.querySelector(".profile-panel");
const toast = document.querySelector("[data-toast]");
const year = document.querySelector("[data-year]");

const storage = {
  get(key) {
    try {
      return window.localStorage.getItem(key);
    } catch {
      return null;
    }
  },
  set(key, value) {
    try {
      window.localStorage.setItem(key, value);
    } catch {
      // Some local preview contexts block storage. The UI should still work.
    }
  },
};

const showToast = (message) => {
  if (!toast) {
    return;
  }

  toast.textContent = message;
  toast.classList.add("show");
  window.setTimeout(() => toast.classList.remove("show"), 1700);
};

const storedTheme = storage.get("soupon-theme") ?? "dark";

if (storedTheme === "dark") {
  body.classList.add("dark");
}

themeToggle?.setAttribute("aria-pressed", String(body.classList.contains("dark")));

if (year) {
  year.textContent = new Date().getFullYear();
}

const typewriterTargets = document.querySelectorAll(
  ".eyebrow, .bio, .status-row span, .section-heading p, .section-heading h2, .feature-card strong, .feature-card small, .hub-link strong, .hub-link small"
);

const shouldReduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

if (!shouldReduceMotion) {
  typewriterTargets.forEach((element, index) => {
    const fullText = element.textContent.trim();

    if (!fullText) {
      return;
    }

    const height = element.getBoundingClientRect().height;
    element.dataset.fullText = fullText;
    element.style.minHeight = `${height}px`;
    element.textContent = "";
    element.classList.add("typewriter-ready");

    window.setTimeout(() => {
      let cursor = 0;
      const letters = Array.from(fullText);
      element.classList.add("typewriter-active");

      const typeNext = () => {
        element.textContent += letters[cursor];
        cursor += 1;

        if (cursor < letters.length) {
          window.setTimeout(typeNext, 24 + Math.random() * 24);
          return;
        }

        element.classList.remove("typewriter-active");
      };

      typeNext();
    }, 140 + index * 70);
  });
}

themeToggle?.addEventListener("click", () => {
  body.classList.toggle("dark");
  const isDark = body.classList.contains("dark");
  storage.set("soupon-theme", isDark ? "dark" : "light");
  themeToggle.setAttribute("aria-pressed", String(isDark));
});

const copyText = async (text) => {
  if (navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      // Fall back to the older selection API below.
    }
  }

  const input = document.createElement("textarea");
  input.value = text;
  input.setAttribute("readonly", "");
  input.style.position = "fixed";
  input.style.left = "-9999px";
  input.style.top = "0";
  document.body.append(input);
  input.focus();
  input.select();
  input.setSelectionRange(0, input.value.length);

  try {
    return document.execCommand("copy");
  } catch {
    return false;
  } finally {
    input.remove();
  }
};

copyButton?.addEventListener("click", async () => {
  const copied = await copyText(window.location.href);
  showToast(copied ? "URLをコピーしました" : "コピーできませんでした");
});

if (profilePanel) {
  let animationFrame = 0;
  const savedGraphicX = Number(storage.get("soupon-graphic-x"));
  const warmColor = [198, 91, 52];
  const coolColor = [26, 166, 151];

  const setGraphicPosition = (x, isActive = false) => {
    const clampedX = Math.min(Math.max(x, 0), 1);
    const rgb = warmColor.map((channel, index) => {
      return Math.round(channel + (coolColor[index] - channel) * clampedX);
    });

    profilePanel.style.setProperty("--spot-x", `${(clampedX * 100).toFixed(1)}%`);
    profilePanel.style.setProperty("--cursor-rgb", rgb.join(", "));
    profilePanel.style.setProperty("--warm-opacity", `${(0.46 - clampedX * 0.36).toFixed(2)}`);
    profilePanel.style.setProperty("--cool-opacity", `${(0.1 + clampedX * 0.54).toFixed(2)}`);
    profilePanel.style.setProperty("--glow-opacity", isActive ? "0.58" : "0.46");
  };

  if (Number.isFinite(savedGraphicX)) {
    setGraphicPosition(savedGraphicX);
  }

  const updateGraphic = (event) => {
    window.cancelAnimationFrame(animationFrame);
    animationFrame = window.requestAnimationFrame(() => {
      const rect = profilePanel.getBoundingClientRect();
      const x = Math.min(Math.max((event.clientX - rect.left) / rect.width, 0), 1);

      setGraphicPosition(x, true);
      storage.set("soupon-graphic-x", String(x));
    });
  };

  profilePanel.addEventListener("pointermove", updateGraphic);
}
