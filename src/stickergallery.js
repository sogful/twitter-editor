((editor) => {
  const empty = Symbol();
  const firepaths = [
    {fill: "#F4900C", d: "M35 19c0-2.062-.367-4.039-1.04-5.868-.46 5.389-3.333 8.157-6.335 6.868-2.812-1.208-.917-5.917-.777-8.164.236-3.809-.012-8.169-6.931-11.794 2.875 5.5.333 8.917-2.333 9.125-2.958.231-5.667-2.542-4.667-7.042-3.238 2.386-3.332 6.402-2.333 9 1.042 2.708-.042 4.958-2.583 5.208-2.84.28-4.418-3.041-2.963-8.333C2.52 10.965 1 14.805 1 19c0 9.389 7.611 17 17 17s17-7.611 17-17z"},
    {fill: "#FFCC4D", d: "M28.394 23.999c.148 3.084-2.561 4.293-4.019 3.709-2.106-.843-1.541-2.291-2.083-5.291s-2.625-5.083-5.708-6c2.25 6.333-1.247 8.667-3.08 9.084-1.872.426-3.753-.001-3.968-4.007C7.352 23.668 6 26.676 6 30c0 .368.023.73.055 1.09C9.125 34.124 13.342 36 18 36s8.875-1.876 11.945-4.91c.032-.36.055-.722.055-1.09 0-2.187-.584-4.236-1.606-6.001z"}
  ];
  let categorycatalog = empty;
  let variantgroup = empty;
  let gallerycategory = empty;
  let galleryitems = null;
  let galleryframe = 0;
  let galleryobserver = null;
  let galleryrange = {first: -1, last: -1, columns: 0, cell: 0, rowgap: 0};

  editor.makefireicon = () => {
    const icon = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    icon.classList.add("categoryicon");
    icon.setAttribute("viewBox", "0 0 36 36");
    icon.setAttribute("aria-hidden", "true");
    for (const source of firepaths) {
      const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
      path.setAttribute("fill", source.fill);
      path.setAttribute("d", source.d);
      icon.append(path);
    }
    return icon;
  };

  editor.rendercategories = () => {
    const state = editor.state;
    const strip = document.querySelector(".categorystrip");
    if (!strip) return;
    if (categorycatalog !== state.catalog) {
      strip.replaceChildren();
      const featured = state.catalog?.featured_sections?.[0];
      const categories = [
        {id: "recent", name: "Recent", icon: "iconhistory"},
        {id: "featured", name: featured?.display_name || "Top picks", fire: true, icon: "iconsticker"},
        ...(state.catalog?.categories || []).map((item) => ({
          id: String(item.id),
          name: item.display_name,
          url: item.icon_image?.url,
          icon: "iconsticker"
        }))
      ];
      for (const item of categories) {
        const button = editor.createelement("button", "categorybutton button");
        const image = item.fire ? editor.makefireicon() : item.url ? editor.makeimage(item.url, "categoryicon", "") : null;
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
