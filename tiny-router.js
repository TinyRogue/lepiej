const routes = new Map([
  ['/about-me', 'subpages/about-me.html'],
]);

const cache = new Map();
const routerOutlet = document.querySelector('#router-outlet');
const parser = new DOMParser();
const reinitCallbacks = [];

const addReinitCallback = (callback) => {
  reinitCallbacks.push(callback);
};

window.addReinitCallback = addReinitCallback;

const runReinitCallbacks = () => {
  reinitCallbacks.forEach(callback => {
    try {
      callback();
    } catch (error) {
      console.error('Error in reinit callback:', error);
    }
  });
};

const fetchTemplate = async (path) => {
  if (cache.has(path)) {
    return cache.get(path);
  }
  const response = await fetch(routes.get(path));
  const template = await response.text();
  cache.set(path, template);
  return template;
};

const route = async (path, push = true) => {
  if (path.startsWith('#')) {
    return;
  }

  const routePath = routes.has(path) ? path : '/';

  if (routePath === '/') {
    const template = await fetchTemplate(routePath);
    routerOutlet.innerHTML = template;
  } else {
    const template = await fetchTemplate(routePath);
    const doc = parser.parseFromString(template, 'text/html');
    routerOutlet.innerHTML = '';
    routerOutlet.appendChild(doc.body.firstChild);
  }

  runReinitCallbacks();
  window.scrollTo({
    top: 0,
    left: 0,
    behavior: 'instant'
  });

  if (push) {
    window.history.pushState({}, '', path);
  }
};

function prefetchFromDataLink(e) {
  if (e.target.matches("[data-link]")) {
    const path = e.target.getAttribute("href");
    if (routes.has(path)) {
      fetchTemplate(path);
    }
  }
}

document.addEventListener('DOMContentLoaded', async () => {
  cache.set('/', routerOutlet.innerHTML);

  if (window.location.pathname !== '/') {
    route(window.location.pathname, false);
  }
});

document.addEventListener('mouseover', prefetchFromDataLink);
document.addEventListener('focusin', prefetchFromDataLink);
window.addEventListener('popstate', () => {
  if (window.location.hash === '' || window.location.pathname !== '/') {
    route(window.location.pathname, false);
  }
});

document.addEventListener("click", (e) => {
  if (e.target.matches("[data-link]")) {
    e.preventDefault();
    route(e.target.getAttribute("href"));
  }
});
