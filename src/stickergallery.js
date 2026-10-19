((editor) => {
  const empty = Symbol();
  let categorycatalog = empty;
  let variantgroup = empty;
  let gallerycategory = empty;
  let galleryitems = null;
  let galleryframe = 0;
  let galleryobserver = null;
  let galleryrange = {first: -1, last: -1, columns: 0, cell: 0, rowgap: 0};

  editor.rendercategories = () => {
    const state = editor.state;
    const strip = document.querySelector(".categorystrip");
    if (!strip) return;
    if (categorycatalog !== state.catalog) {
      strip.replaceChildren();
      const featured = state.catalog?.featured_sections?.[0];
      const fire = editor.stickerindex(state.catalog).fire;
      const categories = [
        {id: "recent", name: "Recent", icon: "iconhistory"},
        {id: "featured", name: featured?.display_name || "Top picks", url: featured?.icon_image?.url || editor.imageurl(fire, "preview"), icon: "iconsticker"},
        ...(state.catalog?.categories || []).map((item) => ({
          id: String(item.id),
          name: item.display_name,
          url: item.icon_image?.url,
          icon: "iconsticker"
        }))
      ];
      for (const item of categories) {
        const button = editor.createelement("button", "categorybutton button");
        const image = item.url ? editor.makeimage(item.url, "categoryicon", "") : null;
        const label = editor.createelement("span", "categorylabel", item.name);
        button.type = "button";
        button.dataset.category = item.id;
        button.title = item.name;
        button.setAttribute("aria-label", item.name);
        button.append(image || editor.makeicon(item.icon), label);
        button.addEventListener("click", () => {
          state.category = item.id;
          state.selectedgroup = null;
          editor.renderstickers();
        });
        strip.append(button);
      }
      categorycatalog = state.catalog;
    }
    for (const button of strip.querySelectorAll(".categorybutton")) {
      const selected = button.dataset.category === state.category;
      button.classList.toggle("selected", selected);
      button.setAttribute("aria-pressed", String(selected));
    }
  };

  /*//////////////////////////////////////////////////////////////////////*/

  editor.createstickerbutton = (sticker, selected, action) => {
    const button = editor.createelement("button", "stickerchoice button");
    const image = editor.makeimage(editor.imageurl(sticker, "preview"), "stickerthumb", sticker.display_name);
    button.type = "button";
    button.dataset.stickerid = String(sticker.id);
    button.title = sticker.display_name;
    button.setAttribute("aria-label", sticker.display_name);
    button.setAttribute("aria-pressed", String(selected));
    button.classList.toggle("selected", selected);
    if (image) button.append(image);
    button.addEventListener("click", action);
    return button;
  };

  editor.rendervariants = () => {
    const state = editor.state;
    const strip = document.querySelector(".variantstrip");
    if (!strip) return;
    const group = state.selectedgroup;
    if (variantgroup !== group) {
      strip.replaceChildren();
      const variants = group?.variant_stickers || [];
      strip.classList.toggle("off", !variants.length);
      if (variants.length) {
        for (const sticker of [group.sticker, ...variants]) {
          strip.append(
            editor.createstickerbutton(sticker, false, () => editor.replacesticker(sticker))
          );
        }
      }
      variantgroup = group;
    }
    const current = state.stickers.find((item) => item.key === state.selectedsticker);
    for (const button of strip.querySelectorAll(".stickerchoice")) {
      const selected = String(current?.sticker.id) === button.dataset.stickerid;
      button.classList.toggle("selected", selected);
      button.setAttribute("aria-pressed", String(selected));
    }
  };

  /*//////////////////////////////////////////////////////////////////////*/

  editor.bindgallery = (gallery) => {
    if (gallery.dataset.bound === "true") return;
    gallery.dataset.bound = "true";
    const schedule = () => {
      if (galleryframe) return;
      galleryframe = requestAnimationFrame(() => {
        galleryframe = 0;
        editor.updategallery();
      });
    };
    gallery.addEventListener("scroll", schedule, {passive: true});
    window.addEventListener("resize", schedule, {passive: true});
    if (window.ResizeObserver) {
      galleryobserver = new ResizeObserver(schedule);
      galleryobserver.observe(gallery);
    }
  };

  editor.updategalleryselection = (gallery) => {
    const selected = editor.state.stickers.find((item) => item.key === editor.state.selectedsticker);
    const selectedid = String(selected?.sticker.id);
    for (const button of gallery.querySelectorAll(".stickerchoice")) {
      const active = button.dataset.stickerid === selectedid;
      button.classList.toggle("selected", active);
      button.setAttribute("aria-pressed", String(active));
    }
  };

  editor.updategallery = () => {
    const gallery = document.querySelector(".stickergallery");
    if (!gallery || document.querySelector(".stickerpanel").classList.contains("off")) return;
    const items = galleryitems || [];
    const style = getComputedStyle(gallery);
    const template = style.gridTemplateColumns;
    const columns = Math.max(1, template === "none" ? 5 : template.split(" ").length);
    const width = gallery.clientWidth || Math.max(1, window.innerWidth - 24);
    const padding = parseFloat(style.paddingLeft) + parseFloat(style.paddingRight);
    const columnGap = parseFloat(style.columnGap) || 0;
    const rowgap = parseFloat(style.rowGap) || 0;
    const cell = Math.max(1, (width - padding - (columns - 1) * columnGap) / columns);
    const rowstep = cell + rowgap;
    const rows = Math.ceil(items.length / columns);
    const height = gallery.clientHeight || Math.min(window.innerHeight, 500);
    const first = Math.max(0, Math.floor(gallery.scrollTop / rowstep) - 4);
    const last = Math.min(rows, Math.ceil((gallery.scrollTop + height) / rowstep) + 4);
    if (galleryrange.first === first && galleryrange.last === last && galleryrange.columns === columns && Math.abs(galleryrange.cell - cell) < 0.5 && galleryrange.rowgap === rowgap) {
      editor.updategalleryselection(gallery);
      return;
    }
    galleryrange = {first, last, columns, cell, rowgap};
    const fragment = document.createDocumentFragment();
    const spacer = (count) => {
      if (!count) return;
      const element = editor.createelement("div", "galleryspace");
      element.setAttribute("aria-hidden", "true");
      element.style.height = `${Math.max(0, count * rowstep - rowgap)}px`;
      fragment.append(element);
    };
    spacer(first);
    const start = first * columns;
    const end = Math.min(items.length, last * columns);
    for (let index = start; index < end; index += 1) {
      const item = items[index];
      if (!item?.sticker) continue;
      const sticker = item.sticker;
      const button = editor.createstickerbutton(sticker, false, () => editor.chooseitem(item));
      fragment.append(button);
    }
    spacer(rows - last);
    gallery.replaceChildren(fragment);
    editor.updategalleryselection(gallery);
  };

  /*//////////////////////////////////////////////////////////////////////*/

  editor.rendergallery = () => {
    const state = editor.state;
    const gallery = document.querySelector(".stickergallery");
    const notice = document.querySelector(".stickerstate");
    if (!gallery || !notice) return;
    const items = editor.stickeritems();
    const changed = gallerycategory !== state.category || galleryitems !== items;
    if (changed) {
      if (gallerycategory !== state.category) gallery.scrollTop = 0;
      gallerycategory = state.category;
      galleryitems = items;
      galleryrange = {first: -1, last: -1, columns: 0, cell: 0, rowgap: 0};
    }
    gallery.classList.toggle("off", state.catalogstate !== "ready" || !items.length);
    notice.classList.toggle("off", state.catalogstate === "ready" && items.length > 0);
    if (state.catalogstate === "loading") notice.textContent = "Loading stickers";
    else if (state.catalogstate === "error") notice.textContent = "Sticker catalog unavailable";
    else if (state.category === "recent") notice.textContent = "Stickers you add will appear here";
    else notice.textContent = "No stickers available";
    if (document.querySelector(".stickerpanel").classList.contains("off")) return;
    editor.bindgallery(gallery);
    editor.updategallery();
  };

  editor.renderstickers = () => {
    editor.rendercategories();
    editor.rendervariants();
    editor.rendergallery();
  };
})(window.photoeditor);
