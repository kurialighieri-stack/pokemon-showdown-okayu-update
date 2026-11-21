const listReady = phdLoadList();
const localReady = browser.storage.local.get(["localSourceOn", "localSourceUrl"]).then((stored) => phdSetLocal(phdLocalFrom(stored)), () => {});
browser.storage.onChanged.addListener((changes) => {
  if (!changes.localSourceOn && !changes.localSourceUrl) return;
  localReady.then(() => browser.storage.local.get(["localSourceOn", "localSourceUrl"])).then((stored) => phdSetLocal(phdLocalFrom(stored)));
});

const PATCH_RETRY_MS = 2000;
const patchTasks = new Map();
let patchSaving = Promise.resolve();

const isStaleMessage = (message) =>
  message && message.type === "phd-stale" &&
  /^[a-z0-9-]+$/.test(message.name) && /^[1-9]\/\d{4}_[a-z0-9-]+$/.test(message.dir) &&
  /^[0-9a-f]{8}$/.test(message.tag) && /^[0-9a-f]{0,8}$/.test(message.base);

function storeOverwrite(name, base, entry) {
  patchSaving = patchSaving.catch(() => {}).then(async () => {
    const stored = await browser.storage.local.get(PHD_OVERWRITE);
    const overwrite = stored[PHD_OVERWRITE] || {};
    overwrite[name] = { ...entry, base };
    await browser.storage.local.set({ [PHD_OVERWRITE]: overwrite });
  });
  return patchSaving;
}

function syncOverwrites(message) {
  patchSaving = patchSaving.catch(() => {}).then(async () => {
    const stored = await browser.storage.local.get(PHD_OVERWRITE);
    const overwrite = stored[PHD_OVERWRITE] || {};
    for (const name of message.dropped) delete overwrite[name];
    for (const name of Object.keys(message.added)) if (!(name in overwrite)) overwrite[name] = message.added[name];
    await browser.storage.local.set({ [PHD_OVERWRITE]: overwrite });
  });
  return patchSaving;
}

const isSyncMessage = (message) =>
  message && message.type === "phd-sync" && Array.isArray(message.dropped) &&
  message.added && typeof message.added === "object";

function fetchAndStorePatch(message) {
  const key = `${message.name}:${message.tag}`;
  if (!patchTasks.has(key)) {
    const task = localReady.then(() => phdFetchPlacement(message.dir, message.tag))
      .then(async (entry) => {
        if (entry) await storeOverwrite(message.name, message.base, entry).catch(() => {});
        return entry;
      })
      .catch(() => null);
    patchTasks.set(key, task);
    task.then((entry) => { if (!entry) setTimeout(() => patchTasks.delete(key), PATCH_RETRY_MS); });
  }
  return patchTasks.get(key);
}

browser.runtime.onMessage.addListener((message) => {
  if (isStaleMessage(message)) return fetchAndStorePatch(message);
  if (isSyncMessage(message)) return syncOverwrites(message).then(() => true, () => false);
  return undefined;
});


// Request redirects and settings windows are handled by Pro’s main process.
