document.addEventListener('DOMContentLoaded', function () {
  const contactForm = document.getElementById('contact-form');

  contactForm.addEventListener('submit', function (e) {
    e.preventDefault();

    const title = document.getElementById('form-title').value;
    const content = document.getElementById('form-content').value;

    const mailto = `mailto:lepiejagencja@gmail.com?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(content)}`;

    window.open(mailto, '_blank');
  });
});