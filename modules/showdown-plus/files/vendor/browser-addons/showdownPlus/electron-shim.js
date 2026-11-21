// Only the Firefox APIs used by Showdown+ are adapted. No page gets a Node API.
(() => {
  if (globalThis.browser) return;
  const call = (target, name, ...args) => new Promise((resolve, reject) => {
    target[name](...args, result => {
      const error = chrome.runtime.lastError;
      if (error) reject(new Error(error.message)); else resolve(result);
    });
  });
  globalThis.browser = {
    runtime: {
      getURL: file => chrome.runtime.getURL(file),
      sendMessage: message => call(chrome.runtime, 'sendMessage', message),
      onMessage: {addListener: listener => chrome.runtime.onMessage.addListener((message, sender, reply) => {
        try {
          const result = listener(message, sender);
          if (result && typeof result.then === 'function') {
            result.then(reply, error => { console.error('Showdown+ message:', error); reply(null); });
            return true;
          }
          if (result !== undefined) reply(result);
        } catch (error) { console.error('Showdown+ message:', error); reply(null); }
        return false;
      })},
    },
    storage: {
      local: {
        get: keys => call(chrome.storage.local, 'get', keys),
        set: values => call(chrome.storage.local, 'set', values),
      },
      onChanged: chrome.storage.onChanged,
    },
  };
})();
