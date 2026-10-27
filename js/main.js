(function () {
  const navToggle = document.querySelector(".nav-toggle");
  const primaryNav = document.querySelector(".primary-nav");
  const searchForm = document.getElementById("listing-search");
  const searchFeedback = document.getElementById("search-feedback");
  const validationToast = document.getElementById("validation-toast");
  const listingsGrid = document.getElementById("carouselTrack");
  const listingCards = Array.from(document.querySelectorAll(".listing-card"));
  const galleryIndicators = document.getElementById("gallery-indicators");
  const galleryLightbox = document.getElementById("gallery-lightbox");
  const galleryLightboxImage = document.getElementById("gallery-lightbox-image");
  const galleryLightboxClose = document.getElementById("gallery-lightbox-close");
  const galleryLightboxPrevious = document.getElementById("gallery-lightbox-prev");
  const galleryLightboxNext = document.getElementById("gallery-lightbox-next");
  const listingsEmpty = document.getElementById("listings-empty");
  const listingsReset = document.getElementById("listings-reset");
  const contactForm = document.getElementById("contact-form");
  const messageModal = document.getElementById("message-modal");
  const messageModalClose = document.getElementById("message-modal-close");
  const messageModalReset = document.getElementById("message-modal-reset");
  const cookieNotice = document.getElementById("cookie-notice");
  const cookieAccept = document.getElementById("cookie-accept");
  const yearEl = document.getElementById("year");
  const cookiePreferenceKey = "marci-cookie-preference";
  let toastTimer;
  let toastTransitionTimer;
  let activeToastField = null;

  function hideValidationToast() {
    if (!validationToast || validationToast.hidden) return;

    window.clearTimeout(toastTimer);
    validationToast.classList.remove("is-visible");
    activeToastField = null;
    toastTransitionTimer = window.setTimeout(function () {
      validationToast.hidden = true;
    }, 250);
  }

  function showValidationToast(message, fieldName) {
    if (!validationToast) return;

    window.clearTimeout(toastTimer);
    window.clearTimeout(toastTransitionTimer);
    validationToast.textContent = message;
    validationToast.hidden = false;
    validationToast.classList.remove("is-visible");
    activeToastField = fieldName || null;

    window.requestAnimationFrame(function () {
      validationToast.classList.add("is-visible");
    });

    toastTimer = window.setTimeout(hideValidationToast, 5000);
  }

  function setFieldInvalid(input, invalid) {
    if (invalid) {
      input.setAttribute("aria-invalid", "true");
    } else {
      input.removeAttribute("aria-invalid");
    }
  }

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

    galleryLightboxImage.src = sourceImage.dataset.full || sourceImage.currentSrc || sourceImage.src;
    galleryLightboxImage.alt = sourceImage.alt;
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

  function parsePrice(value) {
    const trimmedValue = String(value || "").trim();
    if (!trimmedValue) return null;

    const normalizedValue = trimmedValue.replace(/[$,\s]/g, "");
    if (!/^\d+(?:\.\d{1,2})?$/.test(normalizedValue)) return Number.NaN;
    return Number(normalizedValue);
  }

  if (searchForm && searchFeedback) {
    const minPriceInput = searchForm.elements.namedItem("minPrice");
    const maxPriceInput = searchForm.elements.namedItem("maxPrice");
    let priceRangeInvalid = false;

    function clearSearchErrors() {
      setFieldInvalid(minPriceInput, false);
      setFieldInvalid(maxPriceInput, false);
      priceRangeInvalid = false;
    }

    function clearSearchPriceError(event) {
      if (event.target.name === "minPrice") {
        setFieldInvalid(minPriceInput, false);
        if (priceRangeInvalid) {
          setFieldInvalid(maxPriceInput, false);
          priceRangeInvalid = false;
        }
        if (activeToastField === "minPrice" || activeToastField === "maxPrice") {
          hideValidationToast();
        }
      } else if (event.target.name === "maxPrice") {
        setFieldInvalid(maxPriceInput, false);
        priceRangeInvalid = false;
        if (activeToastField === "maxPrice") {
          hideValidationToast();
        }
      }

      searchFeedback.textContent = "";
      searchFeedback.classList.remove("is-success");
    }

    searchForm.addEventListener("input", clearSearchPriceError);
    searchForm.addEventListener("change", function (event) {
      if (event.target.matches("select")) {
        searchFeedback.textContent = "";
        searchFeedback.classList.remove("is-success");
      }
      clearSearchPriceError(event);
    });

    searchForm.addEventListener("submit", function (event) {
      event.preventDefault();
      const data = new FormData(searchForm);
      const location = String(data.get("location") || "");
      const type = String(data.get("type") || "");
      const minPrice = parsePrice(data.get("minPrice"));
      const maxPrice = parsePrice(data.get("maxPrice"));
      const beds = Number(data.get("beds") || 0);
      const baths = Number(data.get("baths") || 0);
      const hasFilters = Boolean(
        location || type || minPrice !== null || maxPrice !== null || beds || baths
      );

      clearSearchErrors();
      searchFeedback.textContent = "";
      searchFeedback.classList.remove("is-success");

      const errors = {};
      if (Number.isNaN(minPrice)) {
        errors.minPrice = "Please enter a valid minimum price.";
      }
      if (Number.isNaN(maxPrice)) {
        errors.maxPrice = "Please enter a valid maximum price.";
      }
      if (minPrice !== null && maxPrice !== null && minPrice > maxPrice) {
        errors.maxPrice = "Maximum price must be at least the minimum price.";
        priceRangeInvalid = true;
      }

      if (errors.minPrice || errors.maxPrice) {
        setFieldInvalid(minPriceInput, Boolean(errors.minPrice));
        setFieldInvalid(maxPriceInput, Boolean(errors.maxPrice));
        const firstInvalidField = errors.minPrice ? "minPrice" : "maxPrice";
        const firstInvalidInput = errors.minPrice ? minPriceInput : maxPriceInput;
        showValidationToast(errors[firstInvalidField], firstInvalidField);
        firstInvalidInput.focus();
        return;
      }

      const matchingCards = listingCards.filter(function (card) {
        const price = Number(card.dataset.price);
        return (!location || card.dataset.location === location) &&
          (!type || card.dataset.type === type) &&
          (minPrice === null || price >= minPrice) &&
          (maxPrice === null || price <= maxPrice) &&
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
      searchFeedback.textContent = hasFilters && resultCount > 0
        ? "Showing " + resultCount + " illustrative sample " +
          (resultCount === 1 ? "listing" : "listings") +
          ". This is not live availability."
        : "";
      listingsEmpty.hidden = resultCount > 0;
      document.getElementById("listings").scrollIntoView({ behavior: "smooth", block: "start" });
    });

    if (listingsReset) {
      listingsReset.addEventListener("click", function () {
        searchForm.reset();
        searchForm.requestSubmit();
      });
    }
  }

  if (contactForm && messageModal) {
    const fields = {
      name: {
        input: contactForm.elements.namedItem("name")
      },
      email: {
        input: contactForm.elements.namedItem("email")
      },
      message: {
        input: contactForm.elements.namedItem("message")
      }
    };

    function clearContactFieldError(event) {
      const field = fields[event.target.name];
      if (!field) return;

      setFieldInvalid(field.input, false);
      if (activeToastField === event.target.name) {
        hideValidationToast();
      }
    }

    contactForm.addEventListener("input", clearContactFieldError);
    contactForm.addEventListener("change", clearContactFieldError);

    contactForm.addEventListener("submit", function (event) {
      event.preventDefault();
      const data = new FormData(contactForm);
      const name = String(data.get("name") || "").trim();
      const email = String(data.get("email") || "").trim();
      const message = String(data.get("message") || "").trim();
      const errors = {};

      if (!name) {
        errors.name = "Please enter your name.";
      }
      if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        errors.email = email ? "Please enter a valid email address." : "Please enter your email address.";
      }
      if (!message) {
        errors.message = "Please enter a message.";
      }

      Object.keys(fields).forEach(function (fieldName) {
        setFieldInvalid(fields[fieldName].input, Boolean(errors[fieldName]));
      });

      const firstInvalidField = Object.keys(fields).find(function (fieldName) {
        return errors[fieldName];
      });
      if (firstInvalidField) {
        showValidationToast(errors[firstInvalidField], firstInvalidField);
        fields[firstInvalidField].input.focus();
        return;
      }

      hideValidationToast();
      messageModal.showModal();
    });

    if (messageModalClose) {
      messageModalClose.addEventListener("click", function () {
        messageModal.close();
      });
    }

    if (messageModalReset) {
      messageModalReset.addEventListener("click", function () {
        contactForm.reset();
        clearContactFieldError({ target: { name: "name" } });
        clearContactFieldError({ target: { name: "email" } });
        clearContactFieldError({ target: { name: "message" } });
        messageModal.close();
        fields.name.input.focus();
      });
    }
  }
})();
