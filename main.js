let previousSlide = () => { };
let nextSlide = () => { };


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

document.addEventListener('DOMContentLoaded', () => {
  const hamburger = document.querySelector('.hamburger');
  const overlay = document.querySelector('.fullscreen-overlay');
  const body = document.body;
  const mobileNavLinks = document.querySelectorAll('.mobile-nav a');

  if (hamburger && overlay) {
    hamburger.addEventListener('click', () => {
      toggleMenu();
    });
  }

  mobileNavLinks.forEach(link => {
    link.addEventListener('click', () => {
      if (overlay.classList.contains('is-active')) {
        toggleMenu();
      }
    });
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && overlay.classList.contains('is-active')) {
      toggleMenu();
    }
  });

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

  const writingElement = document.getElementById('writing-animation');
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

  const services = document.querySelectorAll('.service-item');
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

  const portfolioSlides = document.querySelectorAll('.slide');

  previousSlide = () => {
    carouselTrack.scrollBy({
      left: -portfolioSlides[0].clientWidth / 2,
      behavior: 'smooth'
    });
  };

  nextSlide = () => {
    carouselTrack.scrollBy({
      left: portfolioSlides[0].clientWidth / 2,
      behavior: 'smooth'
    });
  };

  let startX = 0;
  const carousel = document.querySelector('.carousel');
  const carouselTrack = document.querySelector('.carousel-track');
  const slideCaption = document.querySelector('.slide-caption');
  const firstSlide = document.querySelectorAll('.slide')[0];
  slideCaption.querySelector('#company-name').textContent = firstSlide.querySelector('figcaption').querySelector('p').textContent;
  slideCaption.querySelector('#service-description').textContent = firstSlide.querySelector('figcaption').querySelector('p:last-child').textContent;
  carousel.addEventListener('touchstart', (e) => {
    startX = e.touches[0].clientX;
  });

  carousel.addEventListener('touchend', (e) => {
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
  });

  carouselTrack.addEventListener("scroll", () => {
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
        slideCaption.querySelector('#company-name').textContent = item.querySelector('figcaption').querySelector('p').textContent;
        slideCaption.querySelector('#service-description').textContent = item.querySelector('figcaption').querySelector('p:last-child').textContent;
        if (item.firstElementChild.tagName === 'VIDEO') {
          item.firstElementChild.play();
        }
      }
    }
  });
});
