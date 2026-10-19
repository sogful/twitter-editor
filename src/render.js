((editor) => {
  editor.createelement = (tag, classname, text) => {
    const element = document.createElement(tag);
    if (classname) element.className = classname;
    if (text !== undefined) element.textContent = text;
    return element;
  };

  editor.makeicon = (classname) => editor.createelement("span", `icon ${classname}`);

  editor.makeimage = (url, classname, alt) => {
    if (!url) return null;
    const image = document.createElement("img");
    image.className = classname;
    image.src = url;
    image.alt = alt || "";
    image.draggable = false;
    return image;
  };

  /*//////////////////////////////////////////////////////////////////////*/

  editor.renderpreview = () => {
    const state = editor.state;
    const canvas = document.querySelector(".photocanvas");
    const box = document.querySelector(".canvasbox");
    if (!state.source || !canvas || !box) return;
    const cropdata = editor.cropimage(state.source, state.crop, state.rotation, state.cropzoom, state.cropx, state.cropy);
    const width = Math.max(1, Math.round(cropdata.cropwidth));
    const height = Math.max(1, Math.round(cropdata.cropheight));
    canvas.width = width;
    canvas.height = height;
    canvas.style.filter = editor.filtercss(state.selectedfilter, state.intensity, state.enhanced);
    const context = canvas.getContext("2d");
    context.drawImage(
      cropdata.rotated,
      cropdata.left,
      cropdata.top,
      cropdata.cropwidth,
      cropdata.cropheight,
      0,
      0,
      width,
      height
    );
    const ratio = width / height;
    const boxwidth = Math.min(window.innerWidth * 0.94, window.innerHeight * 0.76 * ratio, 900);
    const boxheight = boxwidth / ratio;
    box.style.width = `${boxwidth}px`;
    box.style.height = `${boxheight}px`;
    box.style.aspectRatio = String(ratio);
  };

  /*//////////////////////////////////////////////////////////////////////*/

  editor.renderfilters = () => {
    const state = editor.state;
    const strip = document.querySelector(".filterstrip");
    if (!strip) return;
    strip.replaceChildren();
    for (const preset of editor.filters) {
      const button = editor.createelement("button", "filtertile button");
      const preview = editor.createelement("span", "filterpreview");
      const image = editor.makeimage(state.photo.local, "filterimage", "");
      const name = editor.createelement("span", "filtername", preset.name);
      button.type = "button";
      button.setAttribute("aria-label", preset.name);
      button.setAttribute("aria-pressed", String(preset.name === state.selectedfilter));
      button.classList.toggle("selected", preset.name === state.selectedfilter);
      preview.append(image);
      image.style.filter = editor.filtercss(preset.name, preset.initial, state.enhanced);
      button.append(preview, name);
      button.addEventListener("click", () => editor.setfilter(preset.name));
      strip.append(button);
    }
  };

  /*//////////////////////////////////////////////////////////////////////*/

  editor.rendercategories = () => {
    const state = editor.state;
    const strip = document.querySelector(".categorystrip");
    if (!strip) return;
    strip.replaceChildren();
    const featured = state.catalog?.featured_sections?.[0];
    const fire = editor.allstickers(state.catalog).find((item) => item.display_name === "Fire");
    const categories = [
      {id: "featured", name: featured?.display_name || "Top picks", url: featured?.icon_image?.url || editor.imageurl(fire, "size_1x"), icon: "iconsticker"},
      {id: "recent", name: "Recent", icon: "iconhistory"},
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
      button.title = item.name;
      button.setAttribute("aria-label", item.name);
      button.setAttribute("aria-pressed", String(state.category === item.id));
      button.classList.toggle("selected", state.category === item.id);
      button.append(image || editor.makeicon(item.icon), label);
      button.addEventListener("click", () => {
        state.category = item.id;
        state.selectedgroup = null;
        editor.renderstickers();
      });
      strip.append(button);
    }
  };

  /*//////////////////////////////////////////////////////////////////////*/

  editor.createstickerbutton = (sticker, selected, action) => {
    const button = editor.createelement("button", "stickerchoice button");
    const image = editor.makeimage(editor.imageurl(sticker, "size_1x"), "stickerthumb", sticker.display_name);
    button.type = "button";
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
    strip.replaceChildren();
    const variants = state.selectedgroup?.variant_stickers || [];
    strip.classList.toggle("off", !variants.length);
    if (!variants.length) return;
    const current = state.stickers.find((item) => item.key === state.selectedsticker);
    const stickers = [state.selectedgroup.sticker, ...variants];
    for (const sticker of stickers) {
      strip.append(
        editor.createstickerbutton(sticker, current?.sticker.id === sticker.id, () => editor.replacesticker(sticker))
      );
    }
  };

  editor.rendergallery = () => {
    const state = editor.state;
    const gallery = document.querySelector(".stickergallery");
    const notice = document.querySelector(".stickerstate");
    if (!gallery || !notice) return;
    gallery.replaceChildren();
    const items = editor.stickeritems();
    gallery.classList.toggle("off", state.catalogstate !== "ready" || !items.length);
    notice.classList.toggle("off", state.catalogstate === "ready" && items.length > 0);
    if (state.catalogstate === "loading") notice.textContent = "Loading stickers";
    else if (state.catalogstate === "error") notice.textContent = "Sticker catalog unavailable";
    else if (state.category === "recent") notice.textContent = "Stickers you add will appear here";
    else notice.textContent = "No stickers available";
    const selected = state.stickers.find((item) => item.key === state.selectedsticker);
    for (const item of items) {
      const sticker = item.sticker;
      if (!sticker) continue;
      const button = editor.createstickerbutton(sticker, selected?.sticker.id === sticker.id, () => editor.chooseitem(item));
      gallery.append(button);
    }
  };

  editor.renderstickers = () => {
    editor.rendercategories();
    editor.rendervariants();
    editor.rendergallery();
  };

  /*//////////////////////////////////////////////////////////////////////*/

  editor.renderlayers = () => {
    const state = editor.state;
    const layers = document.querySelector(".stickerlayers");
    if (!layers) return;
    layers.replaceChildren();
    for (const item of state.stickers) {
      const layer = editor.createelement("div", "stickerlayer");
      const image = editor.makeimage(editor.imageurl(item.sticker, "size_3x"), "stickerimage", item.sticker.display_name);
      layer.dataset.key = item.key;
      layer.classList.toggle("selected", item.key === state.selectedsticker);
      layer.style.left = `${item.x}%`;
      layer.style.top = `${item.y}%`;
      layer.style.width = `${item.size}%`;
      layer.style.transform = `translate(-50%, -50%) rotate(${item.rotation}deg)`;
      layer.append(image);
      layers.append(layer);
    }
  };

  editor.renderselection = () => {
    const state = editor.state;
    const selected = state.stickers.find((item) => item.key === state.selectedsticker);
    const bar = document.querySelector(".selectionbar");
    if (!bar) return;
    bar.classList.toggle("off", !selected);
    if (!selected) return;
    document.querySelector(".selectionname").textContent = selected.sticker.display_name;
    document.querySelector(".stickersize").value = selected.size;
  };

  /*//////////////////////////////////////////////////////////////////////*/

  editor.render = () => {
    const state = editor.state;
    const root = editor.root;
    root.classList.toggle("filtermode", state.tool === "filters");
    root.classList.toggle("cropmode", state.tool === "crop");
    root.classList.toggle("stickermode", state.tool === "sticker");
    root.classList.toggle("dragging", state.dragover);
    document.querySelector(".title").textContent = state.tool === "filters"
      ? "Select a filter"
      : state.tool === "crop"
        ? "Move and scale"
        : state.tool === "sticker"
          ? "Select a sticker"
          : "Edit photo";
    document.querySelector(".toolclose").classList.toggle("off", !state.tool);
    document.querySelector(".donebutton").textContent = state.busy
      ? "Saving"
      : state.tool === "filters"
        ? "Save"
        : state.tool === "crop"
          ? "Apply"
          : "Done";
    document.querySelector(".donebutton").disabled = state.busy;
    document.querySelector(".filterpanel").classList.toggle("off", state.tool !== "filters");
    document.querySelector(".croppanel").classList.toggle("off", state.tool !== "crop");
    document.querySelector(".stickerpanel").classList.toggle("off", state.tool !== "sticker");
    document.querySelector(".cropguide").classList.toggle("off", state.tool !== "crop");
    document.querySelector(".dropnotice").classList.toggle("off", !state.dragover);
    document.querySelector(".footer").classList.toggle("off", state.tool === "crop" || state.tool === "sticker");
    for (const button of document.querySelectorAll(".toolbutton")) {
      const active = button.dataset.tool === "enhance" ? state.enhanced : button.dataset.tool === state.tool;
      button.classList.toggle("active", active);
      button.setAttribute("aria-pressed", String(active));
    }
    for (const button of document.querySelectorAll(".cropchoice")) {
      const selected = button.dataset.crop === state.crop;
      button.classList.toggle("selected", selected);
      button.setAttribute("aria-pressed", String(selected));
    }
    document.querySelector(".intensity").value = state.intensity;
    document.querySelector(".intensityvalue").textContent = String(state.intensity);
    document.querySelector(".toast").textContent = state.message;
    document.querySelector(".toast").classList.toggle("off", !state.message);
    editor.renderpreview();
    editor.renderfilters();
    editor.renderstickers();
    editor.renderlayers();
    editor.renderselection();
  };
})(window.photoeditor);
