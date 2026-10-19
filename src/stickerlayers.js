((editor) => {
  editor.stickerpreviews = new Map();
  editor.stickerhighimages = new Map();

  const setlayerposition = (layer, item) => {
    layer.style.left = `${item.x}%`;
    layer.style.top = `${item.y}%`;
    layer.style.width = `${item.size}%`;
    layer.style.aspectRatio = String(Number(item.sticker.images?.aspect_ratio) || 1);
    layer.style.transform = `translate(-50%, -50%) rotate(${item.rotation}deg)`;
  };

  editor.renderlayers = () => {
    const state = editor.state;
    const artlayers = document.querySelector(".stickerartlayers");
    const layers = document.querySelector(".stickerlayers");
    if (!artlayers || !layers) return;
    const activekeys = new Set(state.stickers.map((item) => item.key));
    for (const key of editor.stickerpreviews.keys()) {
      if (!activekeys.has(key)) editor.stickerpreviews.delete(key);
    }
    for (const key of editor.stickerhighimages.keys()) {
      if (!activekeys.has(key)) editor.stickerhighimages.delete(key);
    }
    artlayers.replaceChildren();
    layers.replaceChildren();
    for (const item of state.stickers) {
      const art = editor.createelement("div", "stickerart");
      const layer = editor.createelement("div", "stickerlayer");
      const selected = item.key === state.selectedsticker;
      const previewurl = editor.imageurl(item.sticker, "preview") || editor.imageurl(item.sticker, "original");
      const originalurl = editor.imageurl(item.sticker, "original") || previewurl;

      art.dataset.key = item.key;
      art.setAttribute("aria-hidden", "true");
      layer.dataset.key = item.key;
      layer.setAttribute("aria-label", item.sticker.display_name);
      layer.classList.toggle("selected", selected);

      setlayerposition(art, item);
      setlayerposition(layer, item);

      art.style.setProperty("--stickerrotation", `${item.rotation}deg`);
      if (previewurl) {
        let preview = editor.stickerpreviews.get(item.key);
        if (preview && !preview.dataset.imageurl) preview.dataset.imageurl = preview.currentSrc || preview.src;
        if (!preview || preview.dataset.imageurl !== previewurl) {
          preview = editor.makeimage(previewurl, "stickerimage stickerquality stickerpreview", item.sticker.display_name, true);
          preview.dataset.imageurl = previewurl;
          editor.stickerpreviews.set(item.key, preview);
        }
        preview.className = "stickerimage stickerquality stickerpreview";
        preview.alt = item.sticker.display_name || "";
        preview.loading = "eager";
        let fullready = false;
        let outlineready = false;
        const updateoutline = (image) => {
          if (outlineready) return;
          editor.setstickeroutline(layer, image);
          outlineready = true;
        };
        preview.onload = () => {
          if (!fullready) updateoutline(preview);
        };
        preview.onerror = () => {
          if (editor.stickerpreviews.get(item.key) === preview) editor.stickerpreviews.delete(item.key);
        };
        art.append(preview);
        updateoutline(preview);
        if (originalurl && originalurl !== previewurl) {
          let full = editor.stickerhighimages.get(item.key);
          if (full && full.dataset.imageurl !== originalurl) full = null;
          if (!full) {
            full = editor.makeimage(originalurl, "stickerimage stickerquality stickerhigh", item.sticker.display_name, true);
            full.dataset.imageurl = originalurl;
            editor.stickerhighimages.set(item.key, full);
          }
          full.classList.add("stickerimage", "stickerquality", "stickerhigh");
          const reveal = async () => {
            if (!full.complete || !full.naturalWidth) return;
            if (full.dataset.decoded !== "true" && full.decode) {
              if (full.dataset.decoding === "true") return;
              full.dataset.decoding = "true";
              try {
                await full.decode();
              } catch {
                delete full.dataset.decoding;
                return;
              }
              delete full.dataset.decoding;
              full.dataset.decoded = "true";
            }
            if (!full.isConnected) return;
            fullready = true;
            updateoutline(full);
            full.classList.add("ready");
          };
          full.onload = reveal;
          full.onerror = () => {
            if (editor.stickerhighimages.get(item.key) === full) editor.stickerhighimages.delete(item.key);
            full.remove();
          };
          art.append(full);
          reveal();
        } else {
          editor.stickerhighimages.delete(item.key);
        }
      }

      const handles = [
        {name: "topleft", icon: "icontrash", label: "Delete sticker"},
        {name: "topright", icon: "iconrotate", label: "Rotate sticker"},
        {name: "bottomleft", icon: "iconcheck", label: "Confirm sticker"},
        {name: "bottomright", icon: "iconresize", label: "Resize sticker"}
      ];

      for (const handle of handles) {
        const control = editor.createelement("button", `stickerhandle stickerhandle${handle.name}`);
        control.type = "button";
        control.dataset.handle = handle.name;
        control.setAttribute("aria-label", `${handle.label}: ${item.sticker.display_name}`);
        control.append(editor.makeicon(handle.icon));
        layer.append(control);
      }
      artlayers.append(art);
      layers.append(layer);
    }
  };
})(window.photoeditor);
