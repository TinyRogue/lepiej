const PORTFOLIO_TRACK_ITEM_DESCRIPTIONS = [
  '',
  { company: '', service: '' },
  { company: 'Bandi', service: 'Fotografia produktowa' },
  { company: 'Make Me Bio', service: 'UGC' },
  { company: 'Pawłowska Podology', service: 'Social Media' },
  { company: 'Loca', service: 'Fotografia produktowa' },
  { company: 'Indigo', service: 'UGC' },
  { company: 'Pedibehr', service: 'UGC' },
  { company: 'Bandi', service: 'UGC' },
  { company: 'Loca', service: 'UGC' },
  { company: 'LEPIEJ.', service: 'Social Media' },
  { company: '', service: '' },
];

document.addEventListener('DOMContentLoaded', function () {
  const portfolioTrack = document.querySelector('.portfolio-track');
  const portfolioItems = document.querySelectorAll('.portfolio-track li');
  const portfolioItemDescriptionContainer = document.querySelector('.portfolio-item-description');

  if (!portfolioTrack || portfolioItems.length === 0) return;

  function updateItemOpacity() {
    const trackRect = portfolioTrack.getBoundingClientRect();
    const trackWidth = trackRect.width;
    const trackCenter = trackWidth / 2;

    portfolioItems.forEach((item, index) => {
      const itemRect = item.getBoundingClientRect();
      const trackRectLeft = trackRect.left;
      const itemCenter = itemRect.left + itemRect.width / 2 - trackRectLeft;
      const distanceFromCenter = Math.abs(itemCenter - trackCenter);
      const centerThreshold = itemRect.width * 0.3;
      const adjacentThreshold = itemRect.width * 0.7;

      item.classList.remove('adjacent-item');
      item.classList.remove('center-item');
      const contentEl = item.children[0];
      if (distanceFromCenter < centerThreshold) {
        item.classList.add('center-item');
        portfolioItemDescriptionContainer.children[0].textContent = PORTFOLIO_TRACK_ITEM_DESCRIPTIONS[index + 1].company ?? '';
        portfolioItemDescriptionContainer.children[1].textContent = PORTFOLIO_TRACK_ITEM_DESCRIPTIONS[index + 1].service ?? '';
        if (contentEl.tagName === 'VIDEO') {
          contentEl.play();
        }
      } else if (distanceFromCenter < adjacentThreshold) {
        item.classList.add('adjacent-item');
      } else {
        item.classList.remove('adjacent-item');
        item.classList.remove('center-item');
        if (contentEl.tagName === 'VIDEO') {
          contentEl.pause();
          contentEl.currentTime = 0;
        }
      }
    });
  }

  portfolioTrack.addEventListener('scroll', updateItemOpacity);

  function handleScrollButtons() {
    const scrollButtons = document.querySelectorAll('[data-scroll-button]');

    scrollButtons.forEach(button => {
      button.addEventListener('click', function (e) {
        e.preventDefault();

        const direction = this.dataset.scrollButton;
        const itemWidth = portfolioItems[0].offsetWidth;
        const overlapAmount = itemWidth * 0.2;
        const scrollDistance = itemWidth - overlapAmount;

        if (direction === 'left') {
          portfolioTrack.scrollBy({ left: -scrollDistance, behavior: 'smooth' });
        } else if (direction === 'right') {
          portfolioTrack.scrollBy({ left: scrollDistance, behavior: 'smooth' });
        }
      });
    });
  }

  handleScrollButtons();
  updateItemOpacity();
  window.addEventListener('resize', updateItemOpacity);
});