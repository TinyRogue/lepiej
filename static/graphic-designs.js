function initializeGraphicDesignsGallery() {
  const gallery = document.querySelector(".graphic-designs-projects-gallery");
  if (!gallery) return;
  const galleryItems = gallery.querySelectorAll(
    ".graphic-designs-projects-gallery-item",
  );
  if (galleryItems.length === 0) return;

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("in-view");
        } else {
          entry.target.classList.remove("in-view");
        }
      });
    },
    {
      root: gallery,
      threshold: 0.5,
    },
  );

  galleryItems.forEach((item) => {
    observer.observe(item);
  });

  if (typeof cleanupFunctions !== "undefined") {
    cleanupFunctions.push(() => {
      observer.disconnect();
    });
  }
}

initializeGraphicDesignsGallery();
