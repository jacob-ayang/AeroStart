
let callbackCount = 0;

// Store and manage AbortController
const abortControllers = new Map<string, AbortController>();

export const fetchSuggestions = (engine: string, query: string): Promise<string[]> => {
  return new Promise((resolve, reject) => {
    if (!query || !query.trim()) {
      resolve([]);
      return;
    }

    // Bilibili uses fetch API (via Vite proxy)
    if (engine === 'Bilibili') {
      const encodedQuery = encodeURIComponent(query);
      const url = `/bilibili?term=${encodedQuery}`;

      // Cancel previous request
      const requestKey = `${engine}-${query}`;
      if (abortControllers.has(requestKey)) {
        abortControllers.get(requestKey)?.abort();
      }

      // Create new AbortController
      const controller = new AbortController();
      abortControllers.set(requestKey, controller);

      fetch(url, { signal: controller.signal })
        .then(response => response.json())
        .then(data => {
          // Clean up AbortController
          abortControllers.delete(requestKey);

          try {
            // Bilibili return format: {code: 0, result: {tag: [{value: "suggestion text"}, ...]}}
            if (data.code === 0 && data.result && data.result.tag) {
              const suggestions = data.result.tag.map((item: any) => item.value);
              resolve(suggestions);
            } else {
              resolve([]);
            }
          } catch (e) {
            resolve([]);
          }
        })
        .catch((error) => {
          // Clean up AbortController
          abortControllers.delete(requestKey);

          // If request was cancelled, do nothing
          if (error.name === 'AbortError') {
            return;
          }
          resolve([]);
        });
      return;
    }

    // Other search engines use JSONP
    const callbackName = `jsonp_cb_${Date.now()}_${callbackCount++}`;
    const script = document.createElement('script');
    let timeoutId: any;

    const cleanup = () => {
      if ((window as any)[callbackName]) delete (window as any)[callbackName];
      if (document.body.contains(script)) document.body.removeChild(script);
      if (timeoutId) clearTimeout(timeoutId);
    };

    timeoutId = setTimeout(() => {
      cleanup();
      // Resolve empty on timeout to avoid breaking UI
      resolve([]);
    }, 3000);

    (window as any)[callbackName] = (data: any) => {
      cleanup();
      try {
        if (engine === 'Google') {
          // Google (client=youtube) returns ["query", ["sug1", "sug2"], ...]
          resolve(data[1].map((item: any) => Array.isArray(item) ? item[0] : item));
        } else if (engine === 'Baidu') {
          // Baidu returns {q: "query", s: ["sug1", "sug2"]}
          resolve(data.s);
        } else if (engine === 'Bing') {
          // Bing returns ["query", ["sug1", "sug2"]]
          resolve(data[1].map((item: any) => item));
        } else if (engine === 'DuckDuckGo') {
          // DDG returns [{phrase: "sug1"}, ...]
          resolve(data.map((item: any) => item.phrase));
        } else {
          resolve([]);
        }
      } catch (e) {
        resolve([]);
      }
    };

    let url = '';
    const encodedQuery = encodeURIComponent(query);

    if (engine === 'Google') {
      // client=youtube supports JSONP
      url = `https://suggestqueries.google.com/complete/search?client=youtube&q=${encodedQuery}&jsonp=${callbackName}`;
    } else if (engine === 'Baidu') {
      url = `https://sp0.baidu.com/5a1Fazu8AA54nxGko9WTAnF6hhy/su?wd=${encodedQuery}&cb=${callbackName}`;
    } else if (engine === 'Bing') {
      url = `https://api.bing.com/osjson.aspx?query=${encodedQuery}&JsonType=callback&JsonCallback=${callbackName}`;
    } else if (engine === 'DuckDuckGo') {
      url = `https://duckduckgo.com/ac/?q=${encodedQuery}&callback=${callbackName}&type=list`;
    } else {
      // Unsupported engine
      cleanup();
      resolve([]);
      return;
    }

    script.src = url;
    script.onerror = () => {
      cleanup();
      resolve([]);
    };
    document.body.appendChild(script);
  });
};