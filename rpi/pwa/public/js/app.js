//if ("serviceWorker" in navigator) {
//  window.addEventListener("load", function () {
//    navigator.serviceWorker
//      .register("/chess.serviceWorker.js")
//      .then((res) => console.log("service worker registered"))
//      .catch((err) => console.log("service worker not registered", err));
//  });
//}
const registerServiceWorker = async () => {
  if ('serviceWorker' in navigator) {
    try {
      const registration = await navigator.serviceWorker.register(
        '/chess.serviceWorker.js',
        {
          scope: '/',
        }
      );
      if (registration.installing) {
        console.log('Service worker installing');
      } else if (registration.waiting) {
        console.log('Service worker installed');
      } else if (registration.active) {
        console.log('Service worker active');
      }
    } catch (error) {
      console.error(`Registration failed with ${error}`);
    }
  }
};

registerServiceWorker();
