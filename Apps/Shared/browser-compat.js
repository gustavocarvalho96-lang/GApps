(function (root) {
  "use strict";

  var nativeRandomUUID = root.crypto && typeof root.crypto.randomUUID === "function"
    ? root.crypto.randomUUID.bind(root.crypto)
    : null;
  var nativeStructuredClone = typeof root.structuredClone === "function"
    ? root.structuredClone.bind(root)
    : null;
  var nativeTimeout = root.AbortSignal && typeof root.AbortSignal.timeout === "function"
    ? root.AbortSignal.timeout.bind(root.AbortSignal)
    : null;

  function fallbackClone(value) {
    if (value === undefined) return undefined;
    return JSON.parse(JSON.stringify(value));
  }

  function clone(value) {
    if (nativeStructuredClone) return nativeStructuredClone(value);
    return fallbackClone(value);
  }

  function randomUUID() {
    if (nativeRandomUUID) return nativeRandomUUID();
    var bytes = new Uint8Array(16);
    if (root.crypto && typeof root.crypto.getRandomValues === "function") {
      root.crypto.getRandomValues(bytes);
    } else {
      for (var i = 0; i < bytes.length; i += 1) bytes[i] = Math.floor(Math.random() * 256);
    }
    bytes[6] = (bytes[6] & 15) | 64;
    bytes[8] = (bytes[8] & 63) | 128;
    return Array.prototype.map.call(bytes, function (byte) {
      return byte.toString(16).padStart(2, "0");
    }).join("").replace(/^(........)(....)(....)(....)(............)$/, "$1-$2-$3-$4-$5");
  }

  function timeoutSignal(milliseconds) {
    if (nativeTimeout) return nativeTimeout(milliseconds);
    if (!root.AbortController) return undefined;
    var controller = new root.AbortController();
    root.setTimeout(function () {
      var reason;
      try {
        reason = new root.DOMException("Tempo limite excedido.", "TimeoutError");
      } catch (error) {
        reason = new Error("Tempo limite excedido.");
        reason.name = "TimeoutError";
      }
      controller.abort(reason);
    }, milliseconds);
    return controller.signal;
  }

  function legacyCopy(text) {
    return new Promise(function (resolve, reject) {
      try {
        var area = root.document.createElement("textarea");
        area.value = String(text || "");
        area.setAttribute("readonly", "");
        area.style.position = "fixed";
        area.style.left = "-9999px";
        area.style.opacity = "0";
        root.document.body.appendChild(area);
        area.focus();
        area.select();
        var copied = root.document.execCommand("copy");
        root.document.body.removeChild(area);
        if (!copied) throw new Error("copy failed");
        resolve();
      } catch (error) {
        reject(error);
      }
    });
  }

  function copyText(text) {
    if (root.navigator && root.navigator.clipboard && root.navigator.clipboard.writeText) {
      return root.navigator.clipboard.writeText(String(text || "")).catch(function () {
        return legacyCopy(text);
      });
    }
    return legacyCopy(text);
  }

  function storageGet(storageName, key) {
    try {
      return root[storageName].getItem(key);
    } catch (error) {
      return null;
    }
  }

  function storageSet(storageName, key, value) {
    try {
      root[storageName].setItem(key, value);
      return true;
    } catch (error) {
      return false;
    }
  }

  function storageRemove(storageName, key) {
    try {
      root[storageName].removeItem(key);
    } catch (error) {}
  }

  var compat = {
    clone: clone,
    copyText: copyText,
    randomUUID: randomUUID,
    storageGet: storageGet,
    storageRemove: storageRemove,
    storageSet: storageSet,
    timeoutSignal: timeoutSignal
  };
  root.GAppsCompat = compat;

  if (typeof root.structuredClone !== "function") root.structuredClone = fallbackClone;
  if (root.crypto && typeof root.crypto.randomUUID !== "function") {
    root.crypto.randomUUID = randomUUID;
  }
  if (root.AbortSignal && typeof root.AbortSignal.timeout !== "function") {
    root.AbortSignal.timeout = timeoutSignal;
  }
})(window);
