function throttle(fn, delay) {
  let timer = null;

  return (...args) => {
    if (timer === null) {
      fn(...args);
      timer = setTimeout(() => {
        timer = null;
      }, delay);
    }
  };
}

function playVideoSafe(video) {
  if (!video?.play) return;
  video.play().catch((error) => {
    console.log("Video autoplay failed:", error);
  });
}

function isSlideMediaReady(slide) {
  const video = slide.querySelector("video");
  if (video) return video.readyState >= 2;
  const img = slide.querySelector("img");
  if (img) return img.complete && img.naturalWidth > 0;
  return true;
}

function updateSlideLoadingState(slide) {
  slide.classList.toggle("is-loading", !isSlideMediaReady(slide));
}

function watchSlideMedia(slide) {
  if (slide.dataset.loadWatch === "1") return;
  slide.dataset.loadWatch = "1";

  const onUpdate = () => updateSlideLoadingState(slide);

  const video = slide.querySelector("video");
  if (video) {
    ["loadeddata", "canplay", "playing", "error"].forEach((eventName) => {
      video.addEventListener(eventName, onUpdate);
    });
  }

  const img = slide.querySelector("img");
  if (img) {
    ["load", "error"].forEach((eventName) => {
      img.addEventListener(eventName, onUpdate);
    });
  }

  onUpdate();
}

function initializeCarouselSlideLoading(slides) {
  slides.forEach((slide) => watchSlideMedia(slide));
}

// Warm media around the centered slide so peeks (±1) and the next swipe (±2)
// are ready even on slow connections. Videos outside the window are paused.
function syncCarouselMedia(slides, middleSlide, radius = 2) {
  const list = Array.from(slides);
  const middleIndex = list.indexOf(middleSlide);
  if (middleIndex < 0) return;

  list.forEach((slide, index) => {
    const distance = Math.abs(index - middleIndex);
    const inWindow = distance <= radius;

    watchSlideMedia(slide);

    if (inWindow) {
      slide.querySelectorAll("img").forEach((img) => {
        if (img.loading === "lazy") img.loading = "eager";
        if (!img.complete) {
          const src = img.currentSrc || img.src;
          if (src) new Image().src = src;
        }
        updateSlideLoadingState(slide);
      });
    }

    const video = slide.querySelector("video");
    if (!video) return;

    if (inWindow) {
      if (video.preload === "none") video.preload = "auto";
      playVideoSafe(video);
      updateSlideLoadingState(slide);
    } else if (!video.paused) {
      video.pause();
    }
  });
}

let cleanupFunctions = [];

function initializeMainFunctionality() {
  cleanupFunctions.forEach((cleanup) => cleanup());
  cleanupFunctions = [];
  initializeCommonElements();
  initializePageSpecificElements();
}

function initializeCommonElements() {
  const hamburger = document.querySelector(".hamburger");
  const overlay = document.querySelector(".fullscreen-overlay");
  const body = document.body;
  const mobileNavLinks = document.querySelectorAll(".mobile-nav a");

  if (hamburger && overlay) {
    const handleHamburgerClick = () => {
      toggleMenu();
    };
    hamburger.addEventListener("click", handleHamburgerClick);
    cleanupFunctions.push(() =>
      hamburger.removeEventListener("click", handleHamburgerClick),
    );
  }

  mobileNavLinks.forEach((link) => {
    const handleMobileNavClick = () => {
      if (overlay && overlay.classList.contains("is-active")) {
        toggleMenu();
      }
    };
    link.addEventListener("click", handleMobileNavClick);
    cleanupFunctions.push(() =>
      link.removeEventListener("click", handleMobileNavClick),
    );
  });

  const handleKeydown = (e) => {
    if (
      e.key === "Escape" &&
      overlay &&
      overlay.classList.contains("is-active")
    ) {
      toggleMenu();
    }
  };
  document.addEventListener("keydown", handleKeydown);
  cleanupFunctions.push(() =>
    document.removeEventListener("keydown", handleKeydown),
  );

  initializePageShortcuts();

  function toggleMenu() {
    const isExpanded = hamburger.getAttribute("aria-expanded") === "true";
    const isOpening = !isExpanded;

    hamburger.classList.toggle("is-active");

    if (isOpening) {
      overlay.classList.add("is-active");
      body.classList.add("no-scroll");
      hamburger.setAttribute("aria-expanded", true);

      mobileNavLinks.forEach((link, index) => {
        link.classList.remove("slide-down-fade-out");
        link.classList.remove("slide-up-fade-in");
        setTimeout(
          () => {
            link.classList.add("slide-up-fade-in");
          },
          100 * index + 200,
        );
      });
    } else {
      hamburger.setAttribute("aria-expanded", false);
      mobileNavLinks.forEach((link, index) => {
        setTimeout(
          () => {
            link.classList.add("slide-down-fade-out");
          },
          100 * (mobileNavLinks.length - 1 - index),
        );
      });

      setTimeout(
        () => {
          overlay.classList.remove("is-active");
          body.classList.remove("no-scroll");
        },
        100 * mobileNavLinks.length + 300,
      );
    }
  }
}

function initializePageSpecificElements() {
  initializeWritingAnimation();
  initializePortfolioCarousel();
  initializeServicesSection();
  initializeContactForm();
  initializeVideos();
  initializeInfiniteLogoCarousel();
  initializeUgcCarousel();
  initializeCollabPhotosCarousel();
  initializeScrollReveal();
}

function initializePageShortcuts() {
  const shortcuts = document.querySelector(".page-shortcuts");
  const contact = document.getElementById("contact");
  if (!shortcuts) return;

  let contactInView = false;

  const rectsOverlap = (a, b) =>
    !(
      a.right < b.left ||
      a.left > b.right ||
      a.bottom < b.top ||
      a.top > b.bottom
    );

  const updateCarouselClearance = () => {
    const corner = {
      left: window.innerWidth - 120,
      right: window.innerWidth,
      top: window.innerHeight - 140,
      bottom: window.innerHeight,
    };
    const controls = document.querySelectorAll(
      ".carousel-controls, .sound-toggle-btn-mobile",
    );
    let raise = false;
    controls.forEach((el) => {
      if (getComputedStyle(el).display === "none") return;
      const rect = el.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return;
      if (rectsOverlap(corner, rect)) raise = true;
    });
    shortcuts.classList.toggle("is-raised", raise);
  };

  const updateVisibility = () => {
    const pastHero = window.scrollY > window.innerHeight * 0.6;
    shortcuts.classList.toggle("is-visible", pastHero && !contactInView);
    if (pastHero && !contactInView) {
      updateCarouselClearance();
    } else {
      shortcuts.classList.remove("is-raised");
    }
  };

  if (contact && "IntersectionObserver" in window) {
    const observer = new IntersectionObserver(
      ([entry]) => {
        contactInView = entry.isIntersecting;
        updateVisibility();
      },
      { threshold: 0.15 },
    );
    observer.observe(contact);
    cleanupFunctions.push(() => observer.disconnect());
  }

  const handleScroll = throttle(updateVisibility, 100);
  window.addEventListener("scroll", handleScroll, { passive: true });
  window.addEventListener("resize", handleScroll);
  cleanupFunctions.push(() => {
    window.removeEventListener("scroll", handleScroll);
    window.removeEventListener("resize", handleScroll);
  });

  updateVisibility();
}

const REVEAL_SELECTORS = [
  ".meet-me-image",
  ".meet-me-content",
  ".about-me-more-bg",
  ".about-me-main-photo",
  ".meet-me .secondary > p",
  ".meet-me .secondary > .button-cta",
  ".portfolio-title-container",
  ".portfolio .carousel",
  ".testimonials-title",
  ".testimonial",
  ".collaborations",
  ".footer-left",
  ".footer-right",
  ".social-media-offers > h2",
  ".social-media-offer-row",
  ".social-media-phones > h2",
  ".phone-showcase-item",
  ".social-media-split-panel",
  ".social-media-split-photo",
  ".ugc-collab > h2",
  ".collab-wrapper",
  ".collab-photos",
  ".collaboration-photo-collage",
  ".collaboration-plan-content",
  ".who-is-this-girl-image",
  ".who-is-this-girl-content",
  ".expansion",
  ".photos-grid > div",
  ".graphics-designs-services .side-image",
  ".graphics-designs-services-content",
].join(", ");
const REVEAL_STAGGER_MS = 90;
const REVEAL_MAX_STAGGER_STEPS = 4;

function initializeScrollReveal() {
  if (!("IntersectionObserver" in window)) return;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  const viewportHeight = window.innerHeight;
  const targets = Array.from(
    document.querySelectorAll(REVEAL_SELECTORS),
  ).filter((element) => element.getBoundingClientRect().top >= viewportHeight);
  if (targets.length === 0) return;

  const resetElement = (element) => {
    element.classList.remove("reveal", "is-revealed");
    element.style.removeProperty("--reveal-delay");
    element.removeEventListener("animationend", handleAnimationEnd);
  };

  function handleAnimationEnd(event) {
    if (event.target !== event.currentTarget) return;
    if (event.animationName !== "reveal") return;
    resetElement(event.currentTarget);
  }

  const observer = new IntersectionObserver(
    (entries) => {
      let step = 0;
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const element = entry.target;
        const delay =
          Math.min(step, REVEAL_MAX_STAGGER_STEPS) * REVEAL_STAGGER_MS;
        element.style.setProperty("--reveal-delay", `${delay}ms`);
        element.classList.add("is-revealed");
        observer.unobserve(element);
        step++;
      });
    },
    { rootMargin: "0px 0px -10% 0px" },
  );

  targets.forEach((element) => {
    element.classList.add("reveal");
    element.addEventListener("animationend", handleAnimationEnd);
    observer.observe(element);
  });

  cleanupFunctions.push(() => {
    observer.disconnect();
    targets.forEach(resetElement);
  });
}

const COLLAB_SLIDE_MS = 5000;

function initializeCollabPhotosCarousel() {
  const wrapper = document.querySelector(".collab-photos-carousel-wrapper");
  if (!wrapper) return;

  const radios = Array.from(wrapper.querySelectorAll('input[name="slide"]'));
  const labels = Array.from(
    wrapper.querySelectorAll(".collab-photos-dots label"),
  );
  if (radios.length === 0) return;

  const prefersReducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)",
  );
  let timerId = null;

  function clearTimer() {
    if (timerId !== null) {
      clearTimeout(timerId);
      timerId = null;
    }
  }

  function restartProgress() {
    labels.forEach((label) => label.classList.remove("is-progressing"));
    if (prefersReducedMotion.matches) return;

    const checked = radios.find((radio) => radio.checked);
    if (!checked) return;
    const activeLabel = wrapper.querySelector(
      `.collab-photos-dots label[for="${checked.id}"]`,
    );
    if (!activeLabel) return;

    // Force a reflow so the fill animation restarts from empty.
    void activeLabel.offsetWidth;
    activeLabel.classList.add("is-progressing");
  }

  function advance() {
    const currentIndex = radios.findIndex((radio) => radio.checked);
    const nextIndex = (Math.max(currentIndex, 0) + 1) % radios.length;
    radios[nextIndex].checked = true;
    // Programmatic checks do not fire "change"; sync progress + timer explicitly.
    restartProgress();
    scheduleNext();
  }

  function scheduleNext() {
    clearTimer();
    if (prefersReducedMotion.matches) return;
    timerId = setTimeout(advance, COLLAB_SLIDE_MS);
  }

  function onSlideChange() {
    restartProgress();
    scheduleNext();
  }

  function onDotClick(event) {
    const label = event.currentTarget;
    const targetId = label.getAttribute("for");
    const radio = radios.find((input) => input.id === targetId);
    if (radio?.checked) {
      restartProgress();
      scheduleNext();
    }
  }

  radios.forEach((radio) => {
    radio.addEventListener("change", onSlideChange);
  });
  labels.forEach((label) => {
    label.addEventListener("click", onDotClick);
  });

  const onMotionPreferenceChange = () => {
    if (prefersReducedMotion.matches) {
      clearTimer();
      labels.forEach((label) => label.classList.remove("is-progressing"));
    } else {
      restartProgress();
      scheduleNext();
    }
  };
  prefersReducedMotion.addEventListener("change", onMotionPreferenceChange);

  cleanupFunctions.push(() => {
    clearTimer();
    labels.forEach((label) => {
      label.classList.remove("is-progressing");
      label.removeEventListener("click", onDotClick);
    });
    radios.forEach((radio) => {
      radio.removeEventListener("change", onSlideChange);
    });
    prefersReducedMotion.removeEventListener(
      "change",
      onMotionPreferenceChange,
    );
  });

  restartProgress();
  scheduleNext();
}

function initializeWritingAnimation() {
  const writingElement = document.getElementById("writing-animation");
  if (!writingElement) return;
  const words = ["Kreatywne Treści", "UGC", "Nagrania", "Grafiki"];
  let wordIndex = 0;
  let letterIndex = 0;
  let isDeleting = false;

  function type() {
    const currentWord = words[wordIndex];
    if (isDeleting) {
      writingElement.textContent = currentWord.substring(0, letterIndex - 1);
      letterIndex--;
      if (letterIndex === 0) {
        isDeleting = false;
        wordIndex = (wordIndex + 1) % words.length;
      }
    } else {
      writingElement.textContent = currentWord.substring(0, letterIndex + 1);
      letterIndex++;
      if (letterIndex === currentWord.length) {
        isDeleting = true;
        setTimeout(type, 3000);
        return;
      }
    }
    setTimeout(type, isDeleting ? 50 : 150);
  }

  type();
}

function initializeServicesSection() {
  const services = document.querySelectorAll(".service-item");
  if (services.length === 0) return;
  const observer = new IntersectionObserver(
    (entries, observer) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("fade-in");
          observer.unobserve(entry.target);
        }
      });
    },
    {
      threshold: 0.25,
    },
  );

  services.forEach((element) => {
    observer.observe(element);
  });
}

function initializePortfolioCarousel() {
  const slideCaption = document.querySelector(".slide-caption");
  const carousel = document.querySelector(".carousel");
  if (!slideCaption || !carousel || carousel.closest(".ugc-collab")) return;

  const carouselTrack = carousel.querySelector(".carousel-track");
  const portfolioSlides = carousel.querySelectorAll(".slide");
  if (!carouselTrack || portfolioSlides.length === 0) return;

  initializeCarouselSlideLoading(portfolioSlides);

  previousSlide = () => {
    if (carouselTrack && portfolioSlides.length > 0) {
      const currentSlide = carouselTrack.querySelector(".slide.middle");
      if (currentSlide && currentSlide.previousElementSibling) {
        currentSlide.previousElementSibling.scrollIntoView({
          behavior: "smooth",
          block: "nearest",
          inline: "center",
        });
      } else {
        carouselTrack.scrollBy({
          left: -portfolioSlides[0].clientWidth,
          behavior: "smooth",
        });
      }
    }
  };

  nextSlide = () => {
    if (carouselTrack && portfolioSlides.length > 0) {
      const currentSlide = carouselTrack.querySelector(".slide.middle");
      if (currentSlide && currentSlide.nextElementSibling) {
        currentSlide.nextElementSibling.scrollIntoView({
          behavior: "smooth",
          block: "nearest",
          inline: "center",
        });
      } else {
        carouselTrack.scrollBy({
          left: portfolioSlides[0].clientWidth,
          behavior: "smooth",
        });
      }
    }
  };

  let startX = 0;
  const firstSlide = carousel.querySelector(".slide");

  if (firstSlide) {
    const companyNameEl = slideCaption.querySelector("#company-name");
    const serviceDescEl = slideCaption.querySelector("#service-description");
    const figcaption = firstSlide.querySelector("figcaption");

    if (companyNameEl && figcaption) {
      const companyP = figcaption.querySelector("p");
      if (companyP) companyNameEl.textContent = companyP.textContent;
    }
    if (serviceDescEl && figcaption) {
      const serviceP = figcaption.querySelector("p:last-child");
      if (serviceP) serviceDescEl.textContent = serviceP.textContent;
    }
  }
  const handleTouchStart = (e) => {
    startX = e.touches[0].clientX;
  };

  const handleTouchEnd = (e) => {
    const endX = e.changedTouches[0].clientX;
    const deltaX = endX - startX;
    const swipeMargin = Math.abs(deltaX) > 50;

    if (!CSS.supports("scroll-snap-type", "x mandatory") && swipeMargin) {
      e.preventDefault();

      if (deltaX > 0) {
        previousSlide();
      } else {
        nextSlide();
      }
    }
  };

  if (!CSS.supports("scroll-snap-type", "x mandatory")) {
    carousel.addEventListener("touchstart", handleTouchStart, {
      passive: true,
    });
    carousel.addEventListener("touchend", handleTouchEnd, { passive: false });
    cleanupFunctions.push(() => {
      carousel.removeEventListener("touchstart", handleTouchStart);
      carousel.removeEventListener("touchend", handleTouchEnd);
    });
  }

  const handleCarouselScroll = () => {
    const trackRect = carouselTrack.getBoundingClientRect();
    const trackWidth = trackRect.width;
    const trackCenter = trackWidth / 2;

    for (const item of portfolioSlides) {
      const itemRect = item.getBoundingClientRect();
      const trackRectLeft = trackRect.left;
      const itemCenter = itemRect.left + itemRect.width / 2 - trackRectLeft;
      const distanceFromCenter = Math.abs(itemCenter - trackCenter);
      const centerThreshold = itemRect.width * 0.5;

      item.classList.remove("middle");
      if (distanceFromCenter < centerThreshold) {
        item.classList.add("middle");
        const companyNameEl = slideCaption.querySelector("#company-name");
        const serviceDescEl = slideCaption.querySelector(
          "#service-description",
        );
        const figcaption = item.querySelector("figcaption");

        if (companyNameEl && figcaption) {
          companyNameEl.textContent = figcaption.querySelector("p").textContent;
        }
        if (serviceDescEl && figcaption) {
          serviceDescEl.textContent =
            figcaption.querySelector("p:last-child").textContent;
        }
        syncCarouselMedia(portfolioSlides, item, 2);
      }
    }
  };

  carouselTrack.addEventListener("scroll", handleCarouselScroll);
  cleanupFunctions.push(() =>
    carouselTrack.removeEventListener("scroll", handleCarouselScroll),
  );

  setTimeout(() => {
    const middleSlide =
      carouselTrack.querySelector(".slide.middle") ||
      carouselTrack.querySelector(".slide");
    if (!middleSlide) return;

    if (!middleSlide.classList.contains("middle")) {
      middleSlide.scrollIntoView({
        behavior: "auto",
        block: "nearest",
        inline: "center",
      });
    }
    handleCarouselScroll();
    syncCarouselMedia(portfolioSlides, middleSlide, 2);
  }, 100);
}

function initializeContactForm() {
  const contactForm = document.getElementById("contact-form");
  if (!contactForm) return;

  const statusEl = contactForm.querySelector(".contact-form-status");
  const submitBtn = contactForm.querySelector('button[type="submit"]');
  const defaultBtnText = submitBtn?.textContent ?? "Wyślij wiadomość";
  const fallbackEmail = "lepiejagencja@gmail.com";

  const showStatus = (type, message, withMailto = false) => {
    if (!statusEl) return;
    statusEl.hidden = false;
    statusEl.classList.remove("is-success", "is-error");
    statusEl.classList.add(type === "success" ? "is-success" : "is-error");
    statusEl.replaceChildren();

    if (withMailto) {
      statusEl.append(document.createTextNode("Coś poszło nie tak. Napisz bezpośrednio: "));
      const link = document.createElement("a");
      link.href = `mailto:${fallbackEmail}`;
      link.textContent = fallbackEmail;
      statusEl.append(link);
      return;
    }

    statusEl.append(document.createTextNode(message));
  };

  const setLoading = (isLoading) => {
    contactForm.setAttribute("aria-busy", isLoading ? "true" : "false");
    if (!submitBtn) return;
    submitBtn.disabled = isLoading;
    submitBtn.textContent = isLoading ? "Wysyłanie..." : defaultBtnText;
  };

  const handleContactSubmit = async (e) => {
    e.preventDefault();

    const honeypot = contactForm.querySelector('input[name="botcheck"]');
    if (honeypot?.checked) {
      showStatus("success", "Dzięki! Odpiszę w 24h.");
      contactForm.reset();
      return;
    }

    const accessKey = contactForm.querySelector('input[name="access_key"]')?.value?.trim();
    if (!accessKey) {
      showStatus("error", "", true);
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("https://api.web3forms.com/submit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(Object.fromEntries(new FormData(contactForm))),
      });

      const json = await response.json().catch(() => ({}));

      if (response.ok && json.success) {
        showStatus("success", "Dzięki! Odpiszę w 24h.");
        contactForm.reset();
      } else {
        showStatus("error", "", true);
      }
    } catch {
      showStatus("error", "", true);
    } finally {
      setLoading(false);
    }
  };

  contactForm.addEventListener("submit", handleContactSubmit);
  cleanupFunctions.push(() =>
    contactForm.removeEventListener("submit", handleContactSubmit),
  );
}

function initializeVideos() {
  const videos = document.querySelectorAll("video");

  videos.forEach((video) => {
    if (!video.hasAttribute("muted")) {
      video.muted = true;
    }

    const videoObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const video = entry.target;

            if (video.dataset.src && !video.src) {
              video.src = video.dataset.src;
              video.load();
            }

            if (
              video.hasAttribute("autoplay") ||
              video.hasAttribute("data-autoplay")
            ) {
              video.play().catch((error) => {
                console.log("Video autoplay failed:", error);
              });
            }

            videoObserver.unobserve(video);
          }
        });
      },
      {
        threshold: 0.25,
      },
    );

    videoObserver.observe(video);
  });
}

function readMoreUgcSlideClick() {
  const figcaptions = document.querySelectorAll(".slide figcaption");
  const isExpanded = figcaptions[0].classList.contains("expanded");

  if (isExpanded) {
    figcaptions.forEach((figcaption) =>
      figcaption.classList.remove("expanded"),
    );
  } else {
    figcaptions.forEach((figcaption) => figcaption.classList.add("expanded"));
  }
}

function initializeUgcCarousel() {
  const container = document.querySelector(".ugc-collab");
  if (!container) return;

  const carousel = container.querySelector(".carousel");
  const carouselTrack = container.querySelector(".carousel-track");
  const ugcSlides = container.querySelectorAll(".slide");
  const nameEl = container.querySelector("#ugc-company-name");
  const descEl = container.querySelector("#ugc-collab-desc");
  const soundToggleBtn = container.querySelector("#ugc-sound-toggle");
  const soundToggleBtnMobile = container.querySelector(
    "#ugc-sound-toggle-mobile",
  );
  const soundToggleText = soundToggleBtn?.querySelector(".sound-toggle-text");

  if (!carouselTrack || ugcSlides.length === 0) return;

  initializeCarouselSlideLoading(ugcSlides);

  let currentUnmutedVideo = null;
  let isSoundEnabled = false;
  let scrollTimeout = null;
  let isScrolling = false;
  let wasPlayingBeforeLeaving = false;

  previousSlide = () => {
    if (carouselTrack && ugcSlides.length > 0) {
      const currentSlide = carouselTrack.querySelector(".slide.middle");
      if (currentSlide && currentSlide.previousElementSibling) {
        currentSlide.previousElementSibling.scrollIntoView({
          behavior: "smooth",
          block: "nearest",
          inline: "center",
        });
      } else {
        carouselTrack.scrollBy({
          left: -ugcSlides[0].clientWidth,
          behavior: "smooth",
        });
      }
    }
  };

  nextSlide = () => {
    if (carouselTrack && ugcSlides.length > 0) {
      const currentSlide = carouselTrack.querySelector(".slide.middle");
      if (currentSlide && currentSlide.nextElementSibling) {
        currentSlide.nextElementSibling.scrollIntoView({
          behavior: "smooth",
          block: "nearest",
          inline: "center",
        });
      } else {
        carouselTrack.scrollBy({
          left: ugcSlides[0].clientWidth,
          behavior: "smooth",
        });
      }
    }
  };

  const muteAllVideos = () => {
    ugcSlides.forEach((slide) => {
      const video = slide.querySelector("video");
      if (video) {
        video.muted = true;
      }
    });
    currentUnmutedVideo = null;
  };

  const toggleSound = () => {
    const middleSlide = carouselTrack.querySelector(".slide.middle");
    const video = middleSlide?.querySelector("video");

    if (!video) return;

    isSoundEnabled = !isSoundEnabled;

    if (isSoundEnabled) {
      muteAllVideos();
      video.muted = false;
      currentUnmutedVideo = video;
      soundToggleBtn?.classList.add("sound-active");
      soundToggleBtnMobile?.classList.add("sound-active");
      if (soundToggleText) {
        soundToggleText.textContent = "Wyłącz dźwięk";
      }
      video.play().catch((error) => {
        console.log("Video play failed:", error);
      });
      wasPlayingBeforeLeaving = false;
    } else {
      muteAllVideos();
      soundToggleBtn?.classList.remove("sound-active");
      soundToggleBtnMobile?.classList.remove("sound-active");
      if (soundToggleText) {
        soundToggleText.textContent = "Włącz dźwięk";
      }
      wasPlayingBeforeLeaving = false;
    }
  };

  const updateTextFrom = (slide) => {
    const figcaption = slide.querySelector("figcaption");
    if (!figcaption) return;

    const companyP = figcaption.querySelector("p:nth-of-type(1)");
    const descP = figcaption.querySelector("p:nth-of-type(2)");

    if (nameEl && companyP) {
      nameEl.textContent = companyP.textContent;
    }
    if (descEl && descP) {
      descEl.textContent = descP.textContent;
    }

    syncCarouselMedia(ugcSlides, slide, 2);
  };

  const updateSoundFrom = (slide) => {
    const video = slide.querySelector("video");
    if (video && isSoundEnabled && !isScrolling) {
      muteAllVideos();
      video.muted = false;
      currentUnmutedVideo = video;
    }
  };

  const updateInfoFrom = (slide) => {
    updateTextFrom(slide);
    updateSoundFrom(slide);
  };

  const handleCarouselScroll = () => {
    if (!carouselTrack) return;

    // Detect scroll start - mute sound during scrolling
    if (!isScrolling && isSoundEnabled) {
      isScrolling = true;
      muteAllVideos();
    }

    // Clear previous timeout
    if (scrollTimeout) {
      clearTimeout(scrollTimeout);
    }

    const trackRect = carouselTrack.getBoundingClientRect();
    const trackWidth = trackRect.width;
    const trackCenter = trackWidth / 2;

    for (const item of ugcSlides) {
      const itemRect = item.getBoundingClientRect();
      const trackRectLeft = trackRect.left;
      const itemCenter = itemRect.left + itemRect.width / 2 - trackRectLeft;
      const distanceFromCenter = Math.abs(itemCenter - trackCenter);
      const centerThreshold = itemRect.width * 0.5;

      item.classList.remove("middle");
      if (distanceFromCenter < centerThreshold) {
        item.classList.add("middle");

        // Update text immediately
        updateTextFrom(item);

        // Set timeout to detect when scrolling stops and update sound
        scrollTimeout = setTimeout(() => {
          isScrolling = false;
          updateSoundFrom(item);
        }, 50);
      }
    }
  };

  let startX = 0;
  const handleTouchStart = (e) => {
    startX = e.touches[0].clientX;
  };

  const handleTouchEnd = (e) => {
    const endX = e.changedTouches[0].clientX;
    const deltaX = endX - startX;
    const swipeMargin = Math.abs(deltaX) > 50;

    if (!CSS.supports("scroll-snap-type", "x mandatory") && swipeMargin) {
      e.preventDefault();
      if (deltaX > 0) {
        previousSlide();
      } else {
        nextSlide();
      }
    }
  };

  if (carousel && !CSS.supports("scroll-snap-type", "x mandatory")) {
    carousel.addEventListener("touchstart", handleTouchStart, {
      passive: true,
    });
    carousel.addEventListener("touchend", handleTouchEnd, { passive: false });
    cleanupFunctions.push(() => {
      carousel.removeEventListener("touchstart", handleTouchStart);
      carousel.removeEventListener("touchend", handleTouchEnd);
    });
  }

  carouselTrack.addEventListener("scroll", handleCarouselScroll);
  cleanupFunctions.push(() => {
    carouselTrack.removeEventListener("scroll", handleCarouselScroll);
    if (scrollTimeout) {
      clearTimeout(scrollTimeout);
    }
  });

  if (soundToggleBtn) {
    soundToggleBtn.addEventListener("click", toggleSound);
    cleanupFunctions.push(() =>
      soundToggleBtn.removeEventListener("click", toggleSound),
    );
  }

  if (soundToggleBtnMobile) {
    soundToggleBtnMobile.addEventListener("click", toggleSound);
    cleanupFunctions.push(() =>
      soundToggleBtnMobile.removeEventListener("click", toggleSound),
    );
  }

  const sectionObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) {
          if (isSoundEnabled) {
            wasPlayingBeforeLeaving = true;
            muteAllVideos();
          }
        } else {
          if (wasPlayingBeforeLeaving && isSoundEnabled) {
            const middleSlide = carouselTrack.querySelector(".slide.middle");
            if (middleSlide) {
              const video = middleSlide.querySelector("video");
              if (video) {
                video.muted = false;
                currentUnmutedVideo = video;
                video.play().catch((error) => {
                  console.log("Video play failed:", error);
                });
              }
            }
          }
        }
      });
    },
    {
      threshold: 0.1,
      rootMargin: "-10% 0px -10% 0px",
    },
  );

  sectionObserver.observe(container);
  cleanupFunctions.push(() => sectionObserver.disconnect());

  setTimeout(() => {
    const middleSlide = carouselTrack.querySelector(".slide.middle");
    const firstSlide = carouselTrack.querySelector(".slide");

    if (middleSlide) {
      updateInfoFrom(middleSlide);
    } else if (firstSlide) {
      firstSlide.scrollIntoView({
        behavior: "auto",
        block: "nearest",
        inline: "center",
      });
      handleCarouselScroll();
    }
  }, 100);
}

function initializeInfiniteLogoCarousel() {
  const carouselTrack = document.querySelector(".infinite-carousel-track");
  if (!carouselTrack) return;
  let speedFactor = 1.5;

  const originalItems = document.querySelectorAll(
    ".infinite-carousel-item:not(.clone)",
  );
  if (originalItems.length === 0) return;

  const existingClones = document.querySelectorAll(
    ".infinite-carousel-item.clone",
  );
  existingClones.forEach((clone) => clone.remove());

  carouselTrack.innerHTML = "";
  const marquee = document.createElement("div");
  marquee.className = "logo-marquee";
  carouselTrack.appendChild(marquee);

  const createItems = () => {
    const viewportWidth = window.innerWidth;
    const itemWidth = 150;
    const itemsPerSet = originalItems.length;
    const totalItemWidth = itemWidth * itemsPerSet;
    const setsNeeded = Math.ceil((viewportWidth * 3) / totalItemWidth);
    for (let i = 0; i < setsNeeded; i++) {
      originalItems.forEach((item) => {
        const clone = item.cloneNode(true);
        if (i > 0) clone.classList.add("clone");
        marquee.appendChild(clone);
      });
    }
  };

  createItems();

  const updateAnimation = () => {
    const marqueeWidth = marquee.scrollWidth;
    const basePixelsPerSecond = 80;
    const pixelsPerSecond = basePixelsPerSecond * speedFactor;
    const animationDuration = marqueeWidth / pixelsPerSecond;
    marquee.style.animationDuration = `${Math.max(3, animationDuration)}s`;
    marquee.style.transform = "translateX(0)";
    void marquee.offsetWidth;
  };

  setTimeout(updateAnimation, 100);

  const handleResize = throttle(() => {
    createItems();
    updateAnimation();
  }, 250);

  window.addEventListener("resize", handleResize);
  cleanupFunctions.push(() =>
    window.removeEventListener("resize", handleResize),
  );
}

// Event delegation for data-action attributes
function setupActionHandlers() {
  document.addEventListener("click", (e) => {
    const action = e.target
      .closest("[data-action]")
      ?.getAttribute("data-action");
    if (!action) return;

    switch (action) {
      case "previous-slide":
        e.preventDefault();
        if (typeof previousSlide === "function") {
          previousSlide();
        }
        break;
      case "next-slide":
        e.preventDefault();
        if (typeof nextSlide === "function") {
          nextSlide();
        }
        break;
      case "read-more-ugc":
        e.preventDefault();
        if (typeof readMoreUgcSlideClick === "function") {
          readMoreUgcSlideClick();
        }
        break;
    }
  });

  // Handle keyboard events for read-more-ugc (accessibility)
  document.addEventListener("keydown", (e) => {
    const target = e.target;
    if (
      target.matches('[data-action="read-more-ugc"]') &&
      (e.key === "Enter" || e.key === " ")
    ) {
      e.preventDefault();
      if (typeof readMoreUgcSlideClick === "function") {
        readMoreUgcSlideClick();
      }
    }
  });
}

document.addEventListener("DOMContentLoaded", () => {
  initializeMainFunctionality();
  setupActionHandlers();
});
