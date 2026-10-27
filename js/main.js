(function () {
  const navToggle = document.querySelector(".nav-toggle");
  const primaryNav = document.querySelector(".primary-nav");
  const searchForm = document.getElementById("listing-search");
  const searchFeedback = document.getElementById("search-feedback");
  const listingsGrid = document.getElementById("carouselTrack");
  const listingCards = Array.from(document.querySelectorAll(".listing-card"));
  const galleryIndicators = document.getElementById("gallery-indicators");
  const galleryLightbox = document.getElementById("gallery-lightbox");
  const galleryLightboxImage = document.getElementById("gallery-lightbox-image");
  const galleryLightboxCaption = document.getElementById("gallery-lightbox-caption");
  const galleryLightboxCounter = document.getElementById("gallery-lightbox-counter");
  const galleryLightboxClose = document.getElementById("gallery-lightbox-close");
  const galleryLightboxPrevious = document.getElementById("gallery-lightbox-prev");
  const galleryLightboxNext = document.getElementById("gallery-lightbox-next");
  const listingsEmpty = document.getElementById("listings-empty");
  const viewAllListings = document.getElementById("view-all-listings");
  const contactForm = document.getElementById("contact-form");
  const contactFeedback = document.getElementById("contact-feedback");
  const cookieNotice = document.getElementById("cookie-notice");
  const cookieAccept = document.getElementById("cookie-accept");
  const yearEl = document.getElementById("year");
  const cookiePreferenceKey = "marci-cookie-preference";

  if (yearEl) {
    yearEl.textContent = String(new Date().getFullYear());
  }

  const officeStatus = document.getElementById("live-office-status");

  function updateOfficeStatus() {
    if (!officeStatus) return;

    const timeParts = new Intl.DateTimeFormat("en-US", {
      timeZone: "America/Los_Angeles",
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23"
    }).formatToParts(new Date());
    const currentHour = Number(timeParts.find(function (part) {
      return part.type === "hour";
    }).value);
    const isOpen = currentHour >= 8 && currentHour < 19;
    const nextStatus = isOpen ? "open" : "closed";

    if (officeStatus.dataset.status === nextStatus) return;

    const badge = document.createElement("span");
    badge.className = "status-badge status-badge--" + nextStatus;

    if (isOpen) {
      const pulseDot = document.createElement("span");
      pulseDot.className = "pulse-dot";
      pulseDot.setAttribute("aria-hidden", "true");
      badge.append(pulseDot, document.createTextNode("Open Now · Closes at 7:00 PM"));
    } else {
      badge.textContent = "Closed Now · Opens tomorrow at 8:00 AM";
    }

    officeStatus.dataset.status = nextStatus;
    officeStatus.replaceChildren(badge);
  }

  if (officeStatus) {
    updateOfficeStatus();
    window.setInterval(updateOfficeStatus, 60_000);
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

  function getVisibleGalleryCards() {
    return listingsGrid
      ? Array.from(listingsGrid.querySelectorAll(".listing-card:not([hidden])"))
      : [];
  }

  function getGalleryPageSize(cards) {
    if (!listingsGrid || !cards.length) return 1;
    const cardWidth = cards[0].getBoundingClientRect().width;
    const gap = Number.parseFloat(window.getComputedStyle(listingsGrid).gap) || 0;
    return Math.max(1, Math.round(listingsGrid.clientWidth / (cardWidth + gap)));
  }

  function updateGalleryIndicators() {
    if (!listingsGrid || !galleryIndicators) return;

    const cards = getVisibleGalleryCards();
    const pageSize = getGalleryPageSize(cards);
    const pageCount = Math.ceil(cards.length / pageSize);

    if (galleryIndicators.children.length !== pageCount) {
      galleryIndicators.replaceChildren();
      for (let pageIndex = 0; pageIndex < pageCount; pageIndex += 1) {
        const indicator = document.createElement("button");
        indicator.className = "gallery-indicator";
        indicator.type = "button";
        indicator.dataset.page = String(pageIndex);
        indicator.setAttribute("aria-label", "Go to gallery page " + (pageIndex + 1));
        galleryIndicators.appendChild(indicator);
      }
    }

    const firstCard = cards[0];
    const stride = firstCard
      ? firstCard.getBoundingClientRect().width + (Number.parseFloat(window.getComputedStyle(listingsGrid).gap) || 0)
      : 1;
    const activePage = Math.min(pageCount - 1, Math.round(listingsGrid.scrollLeft / (stride * pageSize)));

    Array.from(galleryIndicators.children).forEach(function (indicator, index) {
      indicator.setAttribute("aria-current", String(index === activePage));
    });
  }

  function goToGalleryPage(pageIndex) {
    const cards = getVisibleGalleryCards();
    const pageSize = getGalleryPageSize(cards);
    const card = cards[pageIndex * pageSize];
    if (!card || !listingsGrid) return;

    const trackLeft = listingsGrid.getBoundingClientRect().left;
    const cardLeft = card.getBoundingClientRect().left - trackLeft + listingsGrid.scrollLeft;
    listingsGrid.scrollTo({ left: cardLeft, behavior: "smooth" });
  }

  let galleryDrag = null;
  let suppressGalleryClick = false;

  if (listingsGrid) {
    if ("IntersectionObserver" in window) {
      listingsGrid.classList.add("is-caption-aware");
      const captionObserver = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          entry.target.classList.toggle(
            "is-caption-visible",
            entry.isIntersecting && entry.intersectionRatio >= 0.8
          );
        });
      }, {
        root: listingsGrid,
        threshold: [0, 0.8, 1]
      });

      listingCards.forEach(function (card) {
        captionObserver.observe(card);
      });
    } else {
      listingCards.forEach(function (card) {
        card.classList.add("is-caption-visible");
      });
    }

    listingsGrid.addEventListener("scroll", function () {
      window.requestAnimationFrame(updateGalleryIndicators);
    }, { passive: true });

    listingsGrid.addEventListener("pointerdown", function (event) {
      if (event.pointerType !== "mouse" || event.button !== 0) return;
      galleryDrag = {
        pointerId: event.pointerId,
        startX: event.clientX,
        startScrollLeft: listingsGrid.scrollLeft,
        moved: false
      };
      listingsGrid.setPointerCapture(event.pointerId);
    });

    listingsGrid.addEventListener("pointermove", function (event) {
      if (!galleryDrag || galleryDrag.pointerId !== event.pointerId) return;
      const deltaX = event.clientX - galleryDrag.startX;
      if (Math.abs(deltaX) > 5) {
        galleryDrag.moved = true;
        listingsGrid.classList.add("is-dragging");
        event.preventDefault();
      }
      if (galleryDrag.moved) listingsGrid.scrollLeft = galleryDrag.startScrollLeft - deltaX;
    });

    function finishGalleryDrag(event) {
      if (!galleryDrag || galleryDrag.pointerId !== event.pointerId) return;
      const didMove = galleryDrag.moved;
      galleryDrag = null;
      listingsGrid.classList.remove("is-dragging");
      if (didMove) {
        suppressGalleryClick = true;
        window.setTimeout(function () { suppressGalleryClick = false; }, 0);
      }
    }

    listingsGrid.addEventListener("pointerup", finishGalleryDrag);
    listingsGrid.addEventListener("pointercancel", finishGalleryDrag);

    listingsGrid.addEventListener("click", function (event) {
      if (suppressGalleryClick) {
        event.preventDefault();
        event.stopPropagation();
        suppressGalleryClick = false;
        return;
      }
      const trigger = event.target.closest(".gallery-card__trigger");
      const card = trigger && trigger.closest(".listing-card");
      if (card) openGalleryLightbox(card, trigger);
    });
  }

  if (galleryIndicators) {
    galleryIndicators.addEventListener("click", function (event) {
      const indicator = event.target.closest(".gallery-indicator");
      if (indicator) goToGalleryPage(Number(indicator.dataset.page));
    });
  }

  let visibleGalleryCards = [];
  let currentGalleryIndex = 0;
  let galleryTriggerToRestore = null;

  function renderGalleryLightbox() {
    const card = visibleGalleryCards[currentGalleryIndex];
    if (!card || !galleryLightboxImage) return;

    const sourceImage = card.querySelector("img");
    const caption = Array.from(card.querySelectorAll(".listing-card__title, .listing-card__description"))
      .map(function (item) { return item.textContent.trim(); })
      .join(" · ");

    galleryLightboxImage.src = sourceImage.dataset.full || sourceImage.currentSrc || sourceImage.src;
    galleryLightboxImage.alt = sourceImage.alt;
    galleryLightboxCaption.textContent = caption;
    galleryLightboxCounter.textContent = (currentGalleryIndex + 1) + " / " + visibleGalleryCards.length;
    galleryLightboxPrevious.disabled = visibleGalleryCards.length < 2;
    galleryLightboxNext.disabled = visibleGalleryCards.length < 2;
  }

  function openGalleryLightbox(card, trigger) {
    if (!galleryLightbox || !galleryLightboxImage) return;

    visibleGalleryCards = Array.from(listingsGrid.querySelectorAll(".listing-card:not([hidden])"));
    currentGalleryIndex = visibleGalleryCards.indexOf(card);
    if (currentGalleryIndex < 0) return;

    galleryTriggerToRestore = trigger;
    renderGalleryLightbox();
    galleryLightbox.showModal();
    galleryLightboxClose.focus();
  }

  function moveLightbox(direction) {
    if (!visibleGalleryCards.length) return;
    currentGalleryIndex = (currentGalleryIndex + direction + visibleGalleryCards.length) % visibleGalleryCards.length;
    renderGalleryLightbox();
  }

  if (galleryLightbox) {
    const lightboxStage = galleryLightbox.querySelector(".gallery-lightbox__stage");
    let lightboxTouchStart = null;

    galleryLightbox.addEventListener("click", function (event) {
      if (event.target === galleryLightbox) galleryLightbox.close();
    });
    galleryLightbox.addEventListener("close", function () {
      if (galleryTriggerToRestore) galleryTriggerToRestore.focus();
      galleryTriggerToRestore = null;
    });
    document.addEventListener("keydown", function (event) {
      if (!galleryLightbox.open) return;
      if (event.key === "Escape") {
        event.preventDefault();
        galleryLightbox.close();
        return;
      }
      if (event.key === "ArrowLeft") moveLightbox(-1);
      if (event.key === "ArrowRight") moveLightbox(1);
    });

    if (lightboxStage) {
      lightboxStage.addEventListener("touchstart", function (event) {
        const touch = event.changedTouches[0];
        lightboxTouchStart = { x: touch.clientX, y: touch.clientY };
      }, { passive: true });

      lightboxStage.addEventListener("touchend", function (event) {
        if (!lightboxTouchStart) return;
        const touch = event.changedTouches[0];
        const deltaX = touch.clientX - lightboxTouchStart.x;
        const deltaY = touch.clientY - lightboxTouchStart.y;
        if (Math.abs(deltaX) > 45 && Math.abs(deltaX) > Math.abs(deltaY)) {
          moveLightbox(deltaX < 0 ? 1 : -1);
        }
        lightboxTouchStart = null;
      }, { passive: true });
    }
  }

  if (galleryLightboxClose) {
    galleryLightboxClose.addEventListener("click", function () {
      galleryLightbox.close();
    });
  }

  if (galleryLightboxPrevious) {
    galleryLightboxPrevious.addEventListener("click", function () {
      moveLightbox(-1);
    });
  }

  if (galleryLightboxNext) {
    galleryLightboxNext.addEventListener("click", function () {
      moveLightbox(1);
    });
  }

  window.addEventListener("resize", updateGalleryIndicators);
  updateGalleryIndicators();

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
      const hasFilters = Boolean(location || type || minPrice || maxPrice || beds || baths);

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
      listingsGrid.scrollTo({ left: 0, behavior: "smooth" });
      updateGalleryIndicators();

      const resultCount = matchingCards.length;
      searchFeedback.textContent = hasFilters
        ? "Showing " + resultCount + " illustrative sample " +
          (resultCount === 1 ? "listing" : "listings") +
          ". This is not live availability."
        : "";
      listingsEmpty.hidden = resultCount > 0;
      document.getElementById("listings").scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }

  if (viewAllListings && searchForm && searchFeedback && listingsGrid && listingsEmpty) {
    viewAllListings.addEventListener("click", function () {
      searchForm.reset();
      listingCards.forEach(function (card) {
        card.hidden = false;
        listingsGrid.appendChild(card);
      });
      listingsGrid.scrollTo({ left: 0, behavior: "smooth" });
      updateGalleryIndicators();
      listingsEmpty.hidden = true;
      searchFeedback.textContent = "";
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
