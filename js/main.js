(function () {
  const navToggle = document.querySelector(".nav-toggle");
  const primaryNav = document.querySelector(".primary-nav");
  const searchForm = document.getElementById("listing-search");
  const searchFeedback = document.getElementById("search-feedback");
  const listingsGrid = document.querySelector(".listings__grid");
  const listingCards = Array.from(document.querySelectorAll(".listing-card"));
  const listingsEmpty = document.getElementById("listings-empty");
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
      const location = String(data.get("location") || "");
      const type = String(data.get("type") || "");
      const minPrice = Number(data.get("minPrice") || 0);
      const maxPrice = Number(data.get("maxPrice") || 0);
      const beds = Number(data.get("beds") || 0);
      const baths = Number(data.get("baths") || 0);

      if (minPrice && maxPrice && minPrice > maxPrice) {
        searchFeedback.textContent = "Minimum price cannot exceed maximum price.";
        return;
      }

      const matchingCards = listingCards.filter(function (card) {
        const price = Number(card.dataset.price);
        return (!location || card.dataset.location === location) &&
          (!type || card.dataset.type === type) &&
          (!minPrice || price >= minPrice) &&
          (!maxPrice || price <= maxPrice) &&
          Number(card.dataset.beds) >= beds &&
          Number(card.dataset.baths) >= baths;
      });

      const sortBy = String(data.get("sortBy") || "newest");
      matchingCards.sort(function (first, second) {
        if (sortBy === "oldest") return first.dataset.date.localeCompare(second.dataset.date);
        if (sortBy === "price-ascending") return Number(first.dataset.price) - Number(second.dataset.price);
        if (sortBy === "price-descending") return Number(second.dataset.price) - Number(first.dataset.price);
        return second.dataset.date.localeCompare(first.dataset.date);
      });

      matchingCards.forEach(function (card) {
        card.hidden = false;
        listingsGrid.appendChild(card);
      });
      listingCards.filter(function (card) {
        return !matchingCards.includes(card);
      }).forEach(function (card) {
        card.hidden = true;
      });

      const resultCount = matchingCards.length;
      searchFeedback.textContent =
        "Showing " + resultCount + " illustrative sample " +
        (resultCount === 1 ? "listing" : "listings") +
        ". This is not live availability.";
      listingsEmpty.hidden = resultCount > 0;
      document.getElementById("listings").scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }

  if (contactForm && contactFeedback) {
    const nameInput = contactForm.elements.namedItem("name");
    const emailInput = contactForm.elements.namedItem("email");
    const messageInput = contactForm.elements.namedItem("message");

    contactForm.addEventListener("submit", function (event) {
      event.preventDefault();
      const data = new FormData(contactForm);
      const name = String(data.get("name") || "").trim();
      const email = String(data.get("email") || "").trim();
      const message = String(data.get("message") || "").trim();

      [nameInput, emailInput, messageInput].forEach(function (input) {
        input.removeAttribute("aria-invalid");
      });

      if (!name) {
        nameInput.setAttribute("aria-invalid", "true");
        contactFeedback.textContent = "Please enter your name.";
        nameInput.focus();
        return;
      }

      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        emailInput.setAttribute("aria-invalid", "true");
        contactFeedback.textContent = email ? "Please enter a valid email address." : "Please enter your email address.";
        emailInput.focus();
        return;
      }

      if (!message) {
        messageInput.setAttribute("aria-invalid", "true");
        contactFeedback.textContent = "Please enter a message.";
        messageInput.focus();
        return;
      }

      contactFeedback.textContent =
        "Thanks, " + name + ". Your message has not been sent because this preview has no messaging service. Please call (206) 919-6886.";
    });
  }
})();
