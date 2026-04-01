function dedupeByUrl(items = []) {
  const seen = new Set();
  return items.filter((item) => {
    const url = String(item?.url || "").trim();
    if (!url || seen.has(url)) return false;
    seen.add(url);
    return true;
  });
}

function trimText(text = "", max = 280) {
  const value = String(text || "").replace(/\s+/g, " ").trim();
  if (!value) return "";
  return value.length > max ? `${value.slice(0, max)}...` : value;
}

async function fetchJsonWithTimeout(url, options = {}, timeoutMs = 8000) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    if (!response.ok) return null;
    return await response.json();
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

async function searchBySerper(query, maxResults) {
  const key = import.meta.env.VITE_SERPER_API_KEY;
  if (!key) return [];

  const data = await fetchJsonWithTimeout("https://google.serper.dev/search", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-API-KEY": key,
    },
    body: JSON.stringify({
      q: query,
      num: maxResults,
    }),
  });

  const organic = Array.isArray(data?.organic) ? data.organic : [];
  return organic.slice(0, maxResults).map((item) => ({
    title: trimText(item?.title, 120),
    url: item?.link || "",
    snippet: trimText(item?.snippet, 320),
    source: "serper",
  }));
}

async function searchByDuckDuckGo(query, maxResults) {
  const url = `https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json&no_redirect=1&no_html=1`;
  const data = await fetchJsonWithTimeout(url);
  if (!data) return [];

  const results = [];
  if (data.AbstractURL || data.AbstractText) {
    results.push({
      title: trimText(data.Heading || query, 120),
      url: data.AbstractURL || "",
      snippet: trimText(data.AbstractText, 320),
      source: "duckduckgo",
    });
  }

  const related = Array.isArray(data.RelatedTopics) ? data.RelatedTopics : [];
  for (const item of related) {
    if (results.length >= maxResults) break;
    if (item?.FirstURL || item?.Text) {
      results.push({
        title: trimText(item?.Text || query, 120),
        url: item?.FirstURL || "",
        snippet: trimText(item?.Text, 320),
        source: "duckduckgo",
      });
      continue;
    }
    const topics = Array.isArray(item?.Topics) ? item.Topics : [];
    for (const topic of topics) {
      if (results.length >= maxResults) break;
      results.push({
        title: trimText(topic?.Text || query, 120),
        url: topic?.FirstURL || "",
        snippet: trimText(topic?.Text, 320),
        source: "duckduckgo",
      });
    }
  }

  return results.slice(0, maxResults);
}

async function searchByWikipedia(query, maxResults) {
  const url = `https://en.wikipedia.org/w/api.php?action=opensearch&search=${encodeURIComponent(query)}&limit=${maxResults}&namespace=0&format=json&origin=*`;
  const data = await fetchJsonWithTimeout(url);
  if (!Array.isArray(data) || data.length < 4) return [];

  const titles = Array.isArray(data[1]) ? data[1] : [];
  const snippets = Array.isArray(data[2]) ? data[2] : [];
  const links = Array.isArray(data[3]) ? data[3] : [];

  const results = [];
  for (let i = 0; i < titles.length && results.length < maxResults; i += 1) {
    results.push({
      title: trimText(titles[i], 120),
      url: links[i] || "",
      snippet: trimText(snippets[i], 320),
      source: "wikipedia",
    });
  }
  return results;
}

export async function searchWeb(query, { maxResults = 5 } = {}) {
  const q = String(query || "").trim();
  if (!q) return [];

  const serperResults = await searchBySerper(q, maxResults);
  if (serperResults.length > 0) {
    return dedupeByUrl(serperResults).slice(0, maxResults);
  }

  const [ddgResults, wikiResults] = await Promise.all([
    searchByDuckDuckGo(q, maxResults),
    searchByWikipedia(q, maxResults),
  ]);

  return dedupeByUrl([...ddgResults, ...wikiResults]).slice(0, maxResults);
}

export function buildWebSearchSystemPrompt(query, results = []) {
  const now = new Date().toISOString();
  const lines = results.map(
    (item, index) =>
      `${index + 1}. ${item.title || "Untitled"}\nURL: ${item.url}\n摘要: ${item.snippet || "N/A"}`,
  );

  return [
    "你可以参考以下联网搜索结果来回答用户问题。",
    "要求：",
    "1) 优先使用下面给出的来源，不要编造来源。",
    "2) 如果信息不足，明确说明不确定。",
    "3) 回答末尾附“参考来源”小节，列出你实际使用的 URL。",
    "",
    `检索时间(UTC): ${now}`,
    `用户问题: ${query}`,
    "",
    "搜索结果：",
    lines.length > 0 ? lines.join("\n\n") : "（未检索到可用结果）",
  ].join("\n");
}
