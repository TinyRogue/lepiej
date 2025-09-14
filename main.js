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
      carouselTrack.scrollBy({
        left: -portfolioSlides[0].clientWidth / 2,
        behavior: 'smooth'
      });
    }
  };

  nextSlide = () => {
    if (carouselTrack && portfolioSlides.length > 0) {
      carouselTrack.scrollBy({
        left: portfolioSlides[0].clientWidth / 2,
        behavior: 'smooth'
      });
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
    const swipeMargin = Math.abs(deltaX) > 30;
    if (!swipeMargin) {
      return;
    }

    if (deltaX > 0) {
      previousSlide();
    } else {
      nextSlide();
    }
  };

  if (carousel) {
    carousel.addEventListener('touchstart', handleTouchStart);
    carousel.addEventListener('touchend', handleTouchEnd);
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

document.addEventListener('DOMContentLoaded', () => {
  initializeMainFunctionality();

  if (typeof addReinitCallback === 'function') {
    addReinitCallback(initializeMainFunctionality);
  }
});
