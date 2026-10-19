((editor) => {
  const emptyindex = {all: [], lookup: new Map(), categories: new Map()};

  editor.getstoredrecent = () => {
    try {
      const value = JSON.parse(localStorage.getItem("recentstickers") || "[]");
      return Array.isArray(value) ? value : [];
    } catch {
      return [];
    }
  };

  /*//////////////////////////////////////////////////////////////////////*/

  editor.stickerindexes = new WeakMap();
  editor.stickerindex = (catalog) => {
    if (!catalog || typeof catalog !== "object") return emptyindex;
    let index = editor.stickerindexes.get(catalog);
    if (index) return index;
    const all = [];
    const lookup = new Map();
    const categories = new Map();
    const add = (sticker) => {
      if (!sticker || lookup.has(String(sticker.id))) return;
      lookup.set(String(sticker.id), sticker);
      all.push(sticker);
    };
    for (const category of catalog.categories || []) {
      categories.set(String(category.id), category);
      for (const item of category.items || []) {
        add(item.sticker);
        for (const variant of item.variant_stickers || []) add(variant);
      }
    }
    for (const section of catalog.featured_sections || []) {
      for (const item of section.items || []) {
        add(item.sticker);
        for (const variant of item.variant_stickers || []) add(variant);
      }
    }
    index = {all, lookup, categories};
    editor.stickerindexes.set(catalog, index);
    return index;
  };

  editor.allstickers = (catalog) => editor.stickerindex(catalog).all;

  /*//////////////////////////////////////////////////////////////////////*/

  editor.imageurl = (sticker, size) => {
    const images = sticker?.images;
    if (size === "preview") {
      return images?.size_1x?.url || images?.svg?.url || images?.size_2x?.url || images?.size_3x?.url || images?.raw?.url || "";
    }
    if (size === "original") {
      return images?.svg?.url || images?.raw?.url || images?.size_4x?.url || images?.size_3x?.url || images?.size_2x?.url || images?.size_1x?.url || "";
    }
    return images?.[size]?.url || images?.svg?.url || images?.raw?.url || images?.size_3x?.url || "";
  };

  editor.recentcache = {catalog: null, ids: null, items: []};
  editor.recentitems = (ids, catalog) => {
    const cache = editor.recentcache;
    if (cache.catalog === catalog && cache.ids === ids) return cache.items;
    const lookup = editor.stickerindex(catalog).lookup;
    cache.catalog = catalog;
    cache.ids = ids;
    cache.items = ids.map((id) => lookup.get(String(id))).filter(Boolean).map((sticker) => ({sticker}));
    return cache.items;
  };

  /*//////////////////////////////////////////////////////////////////////*/

  editor.stickeritems = () => {
    const state = editor.state;
    if (state.category === "featured") return state.catalog?.featured_sections?.[0]?.items || [];
    if (state.category === "recent") return editor.recentitems(state.recent, state.catalog);
    return editor.stickerindex(state.catalog).categories.get(state.category)?.items || [];
  };
})(window.photoeditor);
