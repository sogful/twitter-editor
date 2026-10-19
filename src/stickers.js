((editor) => {
  editor.getstoredrecent = () => {
    try {
      const value = JSON.parse(localStorage.getItem("recentstickers") || "[]");
      return Array.isArray(value) ? value : [];
    } catch {
      return [];
    }
  };

  /*//////////////////////////////////////////////////////////////////////*/

  editor.allstickers = (catalog) => {
    const result = [];
    const seen = new Set();
    const add = (sticker) => {
      if (!sticker || seen.has(String(sticker.id))) return;
      seen.add(String(sticker.id));
      result.push(sticker);
    };
    for (const category of catalog?.categories || []) {
      for (const item of category.items || []) {
        add(item.sticker);
        for (const variant of item.variant_stickers || []) add(variant);
      }
    }
    for (const section of catalog?.featured_sections || []) {
      for (const item of section.items || []) {
        add(item.sticker);
        for (const variant of item.variant_stickers || []) add(variant);
      }
    }
    return result;
  };

  /*//////////////////////////////////////////////////////////////////////*/

  editor.imageurl = (sticker, size) => {
    const images = sticker?.images;
    return images?.svg?.url || images?.[size]?.url || images?.size_3x?.url || images?.raw?.url || "";
  };

  editor.recentitems = (ids, stickers) => {
    const lookup = new Map(stickers.map((sticker) => [String(sticker.id), sticker]));
    return ids.map((id) => lookup.get(String(id))).filter(Boolean).map((sticker) => ({sticker}));
  };

  /*//////////////////////////////////////////////////////////////////////*/

  editor.stickeritems = () => {
    const state = editor.state;
    const stickers = editor.allstickers(state.catalog);
    if (state.category === "featured") return state.catalog?.featured_sections?.[0]?.items || [];
    if (state.category === "recent") return editor.recentitems(state.recent, stickers);
    return state.catalog?.categories?.find((item) => String(item.id) === state.category)?.items || [];
  };
})(window.photoeditor);
