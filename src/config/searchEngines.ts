/**
 * Search Engine Configuration
 * Centralized management of API endpoints, parameters, and response parsing for all search engines
 */

export type SearchEngineType = 'Google' | 'Baidu' | 'Bing' | 'DuckDuckGo' | 'Bilibili' | 'Yandex';

export type RequestMethod = 'jsonp' | 'fetch';

export interface SearchEngineConfig {
  /** Engine name */
  name: SearchEngineType;
  /** Request method */
  method: RequestMethod;
  /** API endpoint URL template ({query} will be replaced with search term, {callback} with callback function name) */
  urlTemplate?: string;
  /** Local proxy path (for fetch method) */
  proxyPath?: string;
  /** Response data parser */
  parseResponse: (data: any) => string[];
}

/**
 * Search engine configuration list
 */
export const searchEngineConfigs: Record<SearchEngineType, SearchEngineConfig> = {
  Google: {
    name: 'Google',
    method: 'jsonp',
    urlTemplate: 'https://suggestqueries.google.com/complete/search?client=youtube&q={query}&jsonp={callback}',
    parseResponse: (data: any) => {
      // Google (client=youtube) returns: ["query", ["sug1", "sug2"], ...]
      return data[1].map((item: any) => Array.isArray(item) ? item[0] : item);
    }
  },

  Baidu: {
    name: 'Baidu',
    method: 'jsonp',
    urlTemplate: 'https://sp0.baidu.com/5a1Fazu8AA54nxGko9WTAnF6hhy/su?wd={query}&cb={callback}',
    parseResponse: (data: any) => {
      // Baidu returns: {q: "query", s: ["sug1", "sug2"]}
      return data.s;
    }
  },

  Bing: {
    name: 'Bing',
    method: 'jsonp',
    urlTemplate: 'https://api.bing.com/osjson.aspx?query={query}&JsonType=callback&JsonCallback={callback}',
    parseResponse: (data: any) => {
      // Bing returns: ["query", ["sug1", "sug2"]]
      return data[1].map((item: any) => item);
    }
  },

  DuckDuckGo: {
    name: 'DuckDuckGo',
    method: 'jsonp',
    urlTemplate: 'https://duckduckgo.com/ac/?q={query}&callback={callback}&type=list',
    parseResponse: (data: any) => {
      // DuckDuckGo returns: [{phrase: "sug1"}, ...]
      return data.map((item: any) => item.phrase);
    }
  },

  Bilibili: {
    name: 'Bilibili',
    method: 'jsonp',
    urlTemplate: 'https://s.search.bilibili.com/main/suggest?term={query}&func={callback}',
    parseResponse: (data: any) => {
      // Bilibili returns: {code: 0, result: {tag: [{value: "suggestion text"}, ...]}}
      if (data.code === 0 && data.result && data.result.tag) {
        return data.result.tag.map((item: any) => item.value);
      }
      return [];
    }
  },

  Yandex: {
    name: 'Yandex',
    method: 'jsonp',
    urlTemplate: 'https://yandex.com/suggest/suggest-ya.cgi?part={query}&uil=en&v=3&callback={callback}',
    parseResponse: (data: any) => {
      // Yandex returns: [query, [suggestions]]
      if (Array.isArray(data) && data.length > 1 && Array.isArray(data[1])) {
        return data[1].map((item: any) => {
          // Items can be strings or objects with a 'text' property
          return typeof item === 'string' ? item : item.text || '';
        }).filter((item: string) => item.length > 0);
      }
      return [];
    }
  }
};

/**
 * Get search engine configuration
 */
export const getSearchEngineConfig = (engine: SearchEngineType): SearchEngineConfig | undefined => {
  return searchEngineConfigs[engine];
};

/**
 * Build JSONP URL
 */
export const buildJsonpUrl = (config: SearchEngineConfig, query: string, callbackName: string): string => {
  if (!config.urlTemplate) {
    throw new Error(`Engine ${config.name} does not have a URL template`);
  }
  return config.urlTemplate
    .replace('{query}', encodeURIComponent(query))
    .replace('{callback}', callbackName);
};

/**
 * Build Fetch URL
 */
export const buildFetchUrl = (config: SearchEngineConfig, query: string): string => {
  if (!config.proxyPath) {
    throw new Error(`Engine ${config.name} does not have a proxy path`);
  }
  return `${config.proxyPath}?term=${encodeURIComponent(query)}`;
};
