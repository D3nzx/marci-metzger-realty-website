(function () {
  const navToggle = document.querySelector(".nav-toggle");
  const primaryNav = document.querySelector(".primary-nav");
  const searchForm = document.getElementById("listing-search");
  const searchFeedback = document.getElementById("search-feedback");
  const contactForm = document.getElementById("contact-form");
  const contactFeedback = document.getElementById("contact-feedback");
  const cookieNotice = document.getElementById("cookie-notice");
  const cookieAccept = document.getElementById("cookie-accept");
  const yearEl = document.getElementById("year");
  const cookiePreferenceKey = "marci-cookie-preference";

  if (yearEl) {
    yearEl.textContent = String(new Date().getFullYear());
  }

  if (cookieNotice && cookieAccept) {
    let preferenceSaved = false;

    try {
      preferenceSaved = window.localStorage.getItem(cookiePreferenceKey) === "accepted";
    } catch {
      preferenceSaved = false;
    }

    cookieNotice.hidden = preferenceSaved;
    cookieAccept.addEventListener("click", function () {
      try {
        window.localStorage.setItem(cookiePreferenceKey, "accepted");
      } catch {}
      cookieNotice.hidden = true;
    });
  }

  function closeNav() {
    if (!navToggle || !primaryNav) return;
    primaryNav.classList.remove("is-active");
    navToggle.classList.remove("is-active");
    navToggle.setAttribute("aria-expanded", "false");
    navToggle.setAttribute("aria-label", "Open menu");
  }

  if (navToggle && primaryNav) {
    navToggle.addEventListener("click", function () {
      const isOpen = primaryNav.classList.toggle("is-active");
      navToggle.classList.toggle("is-active", isOpen);
      navToggle.setAttribute("aria-expanded", String(isOpen));
      navToggle.setAttribute("aria-label", isOpen ? "Close menu" : "Open menu");
    });

    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape") closeNav();
    });

    window.addEventListener("resize", function () {
      if (window.innerWidth > 1024) closeNav();
    });

    primaryNav.querySelectorAll("a").forEach(function (link) {
      link.addEventListener("click", closeNav);
    });
  }

  document.querySelectorAll('a[href^="#"]').forEach(function (anchor) {
    anchor.addEventListener("click", function (event) {
      const id = anchor.getAttribute("href");
      if (!id || id === "#") return;
      const target = document.querySelector(id);
      if (!target) return;
      event.preventDefault();
      target.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  });

  if (searchForm && searchFeedback) {
    searchForm.addEventListener("submit", function (event) {
      event.preventDefault();
      const data = new FormData(searchForm);
      const location = data.get("location");
      const maxPrice = Number(data.get("maxPrice") || 0);
      const minPrice = Number(data.get("minPrice") || 0);

      if (!location) {
        searchFeedback.textContent = "Please choose a location to begin your search.";
        return;
      }

      if (minPrice && maxPrice && minPrice > maxPrice) {
        searchFeedback.textContent = "Minimum price cannot exceed maximum price.";
        return;
      }

      const type = data.get("type") || "any type";
      const sortOptions = {
        newest: "newest",
        oldest: "oldest",
        "price-ascending": "price, low to high",
        "price-descending": "price, high to low"
      };
      const sortBy = sortOptions[data.get("sortBy")] || "newest";
      const locationLabel = String(location)
        .replace(/-/g, " ")
        .replace(/\b\w/g, function (char) {
          return char.toUpperCase();
        });
      searchFeedback.textContent =
        "Demo search ready for " +
        locationLabel +
        " (" +
        type +
        "), sorted by " +
        sortBy +
        ". Live listing results are not connected in this preview.";
      searchForm.reset();
    });
  }

  if (contactForm && contactFeedback) {
    contactForm.addEventListener("submit", function (event) {
      event.preventDefault();
      const data = new FormData(contactForm);
      const name = String(data.get("name") || "").trim();
      const email = String(data.get("email") || "").trim();

      if (!name || !email) {
        contactFeedback.textContent = "Please complete name and email.";
        return;
      }

      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        contactFeedback.textContent = "Please enter a valid email address.";
        return;
      }

      contactFeedback.textContent =
        "Demo form validated for " +
        name +
        ". This preview does not send email. Please call (206) 919-6886 to contact the office.";
      contactForm.reset();
    });
  }
})();
