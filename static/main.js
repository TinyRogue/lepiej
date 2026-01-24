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

let cleanupFunctions = [];

function initializeMainFunctionality() {
  cleanupFunctions.forEach(cleanup => cleanup());
  cleanupFunctions = [];
  initializeCommonElements();
  initializePageSpecificElements();
}

function initializeCommonElements() {
  const hamburger = document.querySelector('.hamburger');
  const overlay = document.querySelector('.fullscreen-overlay');
  const body = document.body;
  const mobileNavLinks = document.querySelectorAll('.mobile-nav a');

  if (hamburger && overlay) {
    const handleHamburgerClick = () => {
      toggleMenu();
    };
    hamburger.addEventListener('click', handleHamburgerClick);
    cleanupFunctions.push(() => hamburger.removeEventListener('click', handleHamburgerClick));
  }

  mobileNavLinks.forEach(link => {
    const handleMobileNavClick = () => {
      if (overlay && overlay.classList.contains('is-active')) {
        toggleMenu();
      }
    };
    link.addEventListener('click', handleMobileNavClick);
    cleanupFunctions.push(() => link.removeEventListener('click', handleMobileNavClick));
  });

  const handleKeydown = (e) => {
    if (e.key === 'Escape' && overlay && overlay.classList.contains('is-active')) {
      toggleMenu();
    }
  };
  document.addEventListener('keydown', handleKeydown);
  cleanupFunctions.push(() => document.removeEventListener('keydown', handleKeydown));

  function toggleMenu() {
    const isExpanded = hamburger.getAttribute('aria-expanded') === 'true';
    const isOpening = !isExpanded;

    hamburger.classList.toggle('is-active');

    if (isOpening) {
      overlay.classList.add('is-active');
      body.classList.add('no-scroll');
      hamburger.setAttribute('aria-expanded', true);

      mobileNavLinks.forEach((link, index) => {
        link.classList.remove('slide-down-fade-out');
        link.classList.remove('slide-up-fade-in');
        setTimeout(() => {
          link.classList.add('slide-up-fade-in');
        }, 100 * index + 200);
      });
    } else {
      hamburger.setAttribute('aria-expanded', false);
      mobileNavLinks.forEach((link, index) => {
        setTimeout(() => {
          link.classList.add('slide-down-fade-out');
        }, 100 * (mobileNavLinks.length - 1 - index));
      });

      setTimeout(() => {
        overlay.classList.remove('is-active');
        body.classList.remove('no-scroll');
      }, 100 * mobileNavLinks.length + 300);
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
}

function initializeWritingAnimation() {
  const writingElement = document.getElementById('writing-animation');
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
  const services = document.querySelectorAll('.service-item');
  if (services.length === 0) return;
  const observer = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('fade-in');
        observer.unobserve(entry.target);
      }
    });
  }, {
    threshold: 0.25
  });

  services.forEach(element => {
    observer.observe(element);
  });
}

function initializePortfolioCarousel() {
  const portfolioSlides = document.querySelectorAll('.slide');
  if (portfolioSlides.length === 0) return;

  previousSlide = () => {
    if (carouselTrack && portfolioSlides.length > 0) {
      const currentSlide = carouselTrack.querySelector('.slide.middle');
      if (currentSlide && currentSlide.previousElementSibling) {
        currentSlide.previousElementSibling.scrollIntoView({
          behavior: 'smooth',
          block: 'nearest',
          inline: 'center'
        });
      } else {
        carouselTrack.scrollBy({
          left: -portfolioSlides[0].clientWidth,
          behavior: 'smooth'
        });
      }
    }
  };

  nextSlide = () => {
    if (carouselTrack && portfolioSlides.length > 0) {
      const currentSlide = carouselTrack.querySelector('.slide.middle');
      if (currentSlide && currentSlide.nextElementSibling) {
        currentSlide.nextElementSibling.scrollIntoView({
          behavior: 'smooth',
          block: 'nearest',
          inline: 'center'
        });
      } else {
        carouselTrack.scrollBy({
          left: portfolioSlides[0].clientWidth,
          behavior: 'smooth'
        });
      }
    }
  };

  let startX = 0;
  const carousel = document.querySelector('.carousel');
  const carouselTrack = document.querySelector('.carousel-track');
  const slideCaption = document.querySelector('.slide-caption');
  const firstSlide = document.querySelector('.slide');

  if (slideCaption && firstSlide) {
    const companyNameEl = slideCaption.querySelector('#company-name');
    const serviceDescEl = slideCaption.querySelector('#service-description');
    const figcaption = firstSlide.querySelector('figcaption');

    if (companyNameEl && figcaption) {
      const companyP = figcaption.querySelector('p');
      if (companyP) companyNameEl.textContent = companyP.textContent;
    }
    if (serviceDescEl && figcaption) {
      const serviceP = figcaption.querySelector('p:last-child');
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

    if (!CSS.supports('scroll-snap-type', 'x mandatory') && swipeMargin) {
      e.preventDefault();

      if (deltaX > 0) {
        previousSlide();
      } else {
        nextSlide();
      }
    }
  };

  if (carousel && !CSS.supports('scroll-snap-type', 'x mandatory')) {
    carousel.addEventListener('touchstart', handleTouchStart, { passive: true });
    carousel.addEventListener('touchend', handleTouchEnd, { passive: false });
    cleanupFunctions.push(() => {
      carousel.removeEventListener('touchstart', handleTouchStart);
      carousel.removeEventListener('touchend', handleTouchEnd);
    });
  }

  const handleCarouselScroll = () => {
    if (!carouselTrack || !slideCaption) return;

    const trackRect = carouselTrack.getBoundingClientRect();
    const trackWidth = trackRect.width;
    const trackCenter = trackWidth / 2;

    for (const item of portfolioSlides) {
      const itemRect = item.getBoundingClientRect();
      const trackRectLeft = trackRect.left;
      const itemCenter = itemRect.left + itemRect.width / 2 - trackRectLeft;
      const distanceFromCenter = Math.abs(itemCenter - trackCenter);
      const centerThreshold = itemRect.width * 0.5;

      item.classList.remove('middle');
      if (distanceFromCenter < centerThreshold) {
        item.classList.add('middle');
        const companyNameEl = slideCaption.querySelector('#company-name');
        const serviceDescEl = slideCaption.querySelector('#service-description');
        const figcaption = item.querySelector('figcaption');

        if (companyNameEl && figcaption) {
          companyNameEl.textContent = figcaption.querySelector('p').textContent;
        }
        if (serviceDescEl && figcaption) {
          serviceDescEl.textContent = figcaption.querySelector('p:last-child').textContent;
        }
        if (item.firstElementChild && item.firstElementChild.tagName === 'VIDEO') {
          item.firstElementChild.play();
        }
      }
    }
  };

  if (carouselTrack) {
    carouselTrack.addEventListener("scroll", handleCarouselScroll);
    cleanupFunctions.push(() => carouselTrack.removeEventListener("scroll", handleCarouselScroll));

    // Ensure first slide is initially centered
    setTimeout(() => {
      const firstSlide = carouselTrack.querySelector('.slide');
      if (firstSlide && !carouselTrack.querySelector('.slide.middle')) {
        firstSlide.scrollIntoView({
          behavior: 'auto',
          block: 'nearest',
          inline: 'center'
        });
        handleCarouselScroll();
      }
    }, 100);
  }
}

function initializeContactForm() {
  const contactForm = document.getElementById('contact-form');
  if (!contactForm) return;
  const handleContactSubmit = (e) => {
    e.preventDefault();

    const titleInput = document.getElementById('form-title');
    const contentInput = document.getElementById('form-content');

    const title = titleInput?.value.trim();
    const content = contentInput?.value.trim();

    if (title && content) {
      const emailSubject = encodeURIComponent(title);
      const emailBody = encodeURIComponent(content);
      const mailtoUrl = `mailto:lepiejagencja@gmail.com?subject=${emailSubject}&body=${emailBody}`;
      window.open(mailtoUrl, '_blank');
      titleInput.value = '';
      contentInput.value = '';
    }
  };

  contactForm.addEventListener('submit', handleContactSubmit);
  cleanupFunctions.push(() => contactForm.removeEventListener('submit', handleContactSubmit));
}

function initializeVideos() {
  const videos = document.querySelectorAll('video');

  videos.forEach(video => {
    if (!video.hasAttribute('muted')) {
      video.muted = true;
    }

    const videoObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const video = entry.target;

          if (video.dataset.src && !video.src) {
            video.src = video.dataset.src;
            video.load();
          }

          if (video.hasAttribute('autoplay') || video.hasAttribute('data-autoplay')) {
            video.play().catch(error => {
              console.log('Video autoplay failed:', error);
            });
          }

          videoObserver.unobserve(video);
        }
      });
    }, {
      threshold: 0.25
    });

    videoObserver.observe(video);
  });
}

function readMoreUgcSlideClick() {
  const figcaptions = document.querySelectorAll('.slide figcaption');
  const isExpanded = figcaptions[0].classList.contains('expanded');

  if (isExpanded) {
    figcaptions.forEach(figcaption => figcaption.classList.remove('expanded'));
  } else {
    figcaptions.forEach(figcaption => figcaption.classList.add('expanded'));
  }
}

function initializeUgcCarousel() {
  const container = document.querySelector('.ugc-collab');
  if (!container) return;

  const carousel = container.querySelector('.carousel');
  const carouselTrack = container.querySelector('.carousel-track');
  const ugcSlides = container.querySelectorAll('.slide');
  const nameEl = container.querySelector('#ugc-company-name');
  const descEl = container.querySelector('#ugc-collab-desc');
  const soundToggleBtn = container.querySelector('#ugc-sound-toggle');
  const soundToggleBtnMobile = container.querySelector('#ugc-sound-toggle-mobile');
  const soundToggleText = soundToggleBtn?.querySelector('.sound-toggle-text');

  if (!carouselTrack || ugcSlides.length === 0) return;

  let currentUnmutedVideo = null;
  let isSoundEnabled = false;
  let scrollTimeout = null;
  let isScrolling = false;
  let wasPlayingBeforeLeaving = false;

  previousSlide = () => {
    if (carouselTrack && ugcSlides.length > 0) {
      const currentSlide = carouselTrack.querySelector('.slide.middle');
      if (currentSlide && currentSlide.previousElementSibling) {
        currentSlide.previousElementSibling.scrollIntoView({
          behavior: 'smooth',
          block: 'nearest',
          inline: 'center'
        });
      } else {
        carouselTrack.scrollBy({
          left: -ugcSlides[0].clientWidth,
          behavior: 'smooth'
        });
      }
    }
  };

  nextSlide = () => {
    if (carouselTrack && ugcSlides.length > 0) {
      const currentSlide = carouselTrack.querySelector('.slide.middle');
      if (currentSlide && currentSlide.nextElementSibling) {
        currentSlide.nextElementSibling.scrollIntoView({
          behavior: 'smooth',
          block: 'nearest',
          inline: 'center'
        });
      } else {
        carouselTrack.scrollBy({
          left: ugcSlides[0].clientWidth,
          behavior: 'smooth'
        });
      }
    }
  };

  const muteAllVideos = () => {
    ugcSlides.forEach(slide => {
      const video = slide.querySelector('video');
      if (video) {
        video.muted = true;
      }
    });
    currentUnmutedVideo = null;
  };

  const toggleSound = () => {
    const middleSlide = carouselTrack.querySelector('.slide.middle');
    const video = middleSlide?.querySelector('video');

    if (!video) return;

    isSoundEnabled = !isSoundEnabled;

    if (isSoundEnabled) {
      muteAllVideos();
      video.muted = false;
      currentUnmutedVideo = video;
      soundToggleBtn?.classList.add('sound-active');
      soundToggleBtnMobile?.classList.add('sound-active');
      if (soundToggleText) {
        soundToggleText.textContent = 'Wyłącz dźwięk';
      }
      video.play().catch(error => {
        console.log('Video play failed:', error);
      });
      wasPlayingBeforeLeaving = false;
    } else {
      muteAllVideos();
      soundToggleBtn?.classList.remove('sound-active');
      soundToggleBtnMobile?.classList.remove('sound-active');
      if (soundToggleText) {
        soundToggleText.textContent = 'Włącz dźwięk';
      }
      wasPlayingBeforeLeaving = false;
    }
  };

  const updateTextFrom = (slide) => {
    const figcaption = slide.querySelector('figcaption');
    if (!figcaption) return;

    const companyP = figcaption.querySelector('p:nth-of-type(1)');
    const descP = figcaption.querySelector('p:nth-of-type(2)');

    if (nameEl && companyP) {
      nameEl.textContent = companyP.textContent;
    }
    if (descEl && descP) {
      descEl.textContent = descP.textContent;
    }

    // Start playing video immediately
    const video = slide.querySelector('video');
    if (video && video.play) {
      video.play().catch(error => {
        console.log('Video autoplay failed:', error);
      });
    }
  };

  const updateSoundFrom = (slide) => {
    const video = slide.querySelector('video');
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

      item.classList.remove('middle');
      if (distanceFromCenter < centerThreshold) {
        item.classList.add('middle');

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

    if (!CSS.supports('scroll-snap-type', 'x mandatory') && swipeMargin) {
      e.preventDefault();
      if (deltaX > 0) {
        previousSlide();
      } else {
        nextSlide();
      }
    }
  };

  if (carousel && !CSS.supports('scroll-snap-type', 'x mandatory')) {
    carousel.addEventListener('touchstart', handleTouchStart, { passive: true });
    carousel.addEventListener('touchend', handleTouchEnd, { passive: false });
    cleanupFunctions.push(() => {
      carousel.removeEventListener('touchstart', handleTouchStart);
      carousel.removeEventListener('touchend', handleTouchEnd);
    });
  }

  carouselTrack.addEventListener('scroll', handleCarouselScroll);
  cleanupFunctions.push(() => {
    carouselTrack.removeEventListener('scroll', handleCarouselScroll);
    if (scrollTimeout) {
      clearTimeout(scrollTimeout);
    }
  });

  if (soundToggleBtn) {
    soundToggleBtn.addEventListener('click', toggleSound);
    cleanupFunctions.push(() => soundToggleBtn.removeEventListener('click', toggleSound));
  }

  if (soundToggleBtnMobile) {
    soundToggleBtnMobile.addEventListener('click', toggleSound);
    cleanupFunctions.push(() => soundToggleBtnMobile.removeEventListener('click', toggleSound));
  }

  const sectionObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) {
        if (isSoundEnabled) {
          wasPlayingBeforeLeaving = true;
          muteAllVideos();
        }
      } else {
        if (wasPlayingBeforeLeaving && isSoundEnabled) {
          const middleSlide = carouselTrack.querySelector('.slide.middle');
          if (middleSlide) {
            const video = middleSlide.querySelector('video');
            if (video) {
              video.muted = false;
              currentUnmutedVideo = video;
              video.play().catch(error => {
                console.log('Video play failed:', error);
              });
            }
          }
        }
      }
    });
  }, {
    threshold: 0.1,
    rootMargin: '-10% 0px -10% 0px'
  });

  sectionObserver.observe(container);
  cleanupFunctions.push(() => sectionObserver.disconnect());

  setTimeout(() => {
    const middleSlide = carouselTrack.querySelector('.slide.middle');
    const firstSlide = carouselTrack.querySelector('.slide');

    if (middleSlide) {
      updateInfoFrom(middleSlide);
    } else if (firstSlide) {
      firstSlide.scrollIntoView({
        behavior: 'auto',
        block: 'nearest',
        inline: 'center'
      });
      handleCarouselScroll();
    }
  }, 100);
}

function initializeInfiniteLogoCarousel() {
  const carouselTrack = document.querySelector('.infinite-carousel-track');
  if (!carouselTrack) return;
  let speedFactor = 1.5;

  const originalItems = document.querySelectorAll('.infinite-carousel-item:not(.clone)');
  if (originalItems.length === 0) return;

  const existingClones = document.querySelectorAll('.infinite-carousel-item.clone');
  existingClones.forEach(clone => clone.remove());

  carouselTrack.innerHTML = '';
  const marquee = document.createElement('div');
  marquee.className = 'logo-marquee';
  carouselTrack.appendChild(marquee);

  const createItems = () => {
    const viewportWidth = window.innerWidth;
    const itemWidth = 150;
    const itemsPerSet = originalItems.length;
    const totalItemWidth = itemWidth * itemsPerSet;
    const setsNeeded = Math.ceil((viewportWidth * 3) / totalItemWidth);
    for (let i = 0; i < setsNeeded; i++) {
      originalItems.forEach(item => {
        const clone = item.cloneNode(true);
        if (i > 0) clone.classList.add('clone');
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
    marquee.style.transform = 'translateX(0)';
    void marquee.offsetWidth;
  };

  setTimeout(updateAnimation, 100);

  const handleResize = throttle(() => {
    createItems();
    updateAnimation();
  }, 250);

  window.addEventListener('resize', handleResize);
  cleanupFunctions.push(() => window.removeEventListener('resize', handleResize));
}

// Event delegation for data-action attributes
function setupActionHandlers() {
  document.addEventListener('click', (e) => {
    const action = e.target.closest('[data-action]')?.getAttribute('data-action');
    if (!action) return;

    switch (action) {
      case 'previous-slide':
        e.preventDefault();
        if (typeof previousSlide === 'function') {
          previousSlide();
        }
        break;
      case 'next-slide':
        e.preventDefault();
        if (typeof nextSlide === 'function') {
          nextSlide();
        }
        break;
      case 'read-more-ugc':
        e.preventDefault();
        if (typeof readMoreUgcSlideClick === 'function') {
          readMoreUgcSlideClick();
        }
        break;
    }
  });

  // Handle keyboard events for read-more-ugc (accessibility)
  document.addEventListener('keydown', (e) => {
    const target = e.target;
    if (target.matches('[data-action="read-more-ugc"]') && (e.key === 'Enter' || e.key === ' ')) {
      e.preventDefault();
      if (typeof readMoreUgcSlideClick === 'function') {
        readMoreUgcSlideClick();
      }
    }
  });
}

document.addEventListener('DOMContentLoaded', () => {
  initializeMainFunctionality();
  setupActionHandlers();
});