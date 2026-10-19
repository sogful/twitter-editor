((editor) => {
  editor.stickerpreviews = new Map();

  const setlayerposition = (layer, item) => {
    layer.style.left = `${item.x}%`;
    layer.style.top = `${item.y}%`;
    layer.style.width = `${item.size}%`;
    layer.style.aspectRatio = String(Number(item.sticker.images?.aspect_ratio) || 1);
    layer.style.transform = `translate(-50%, -50%) rotate(${item.rotation}deg)`;
  };

  const setlayerratio = (layer, art, image) => {
    if (!image.naturalWidth || !image.naturalHeight) return;
    const ratio = image.naturalWidth / image.naturalHeight;
    layer.style.aspectRatio = String(ratio);
    art.style.aspectRatio = String(ratio);
  };

  editor.renderlayers = () => {
    const state = editor.state;
    const artlayers = document.querySelector(".stickerartlayers");
    const layers = document.querySelector(".stickerlayers");
    if (!artlayers || !layers) return;
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
        const preview = editor.stickerpreviews.get(item.key) || editor.makeimage(previewurl, "stickerimage stickerquality stickerpreview", item.sticker.display_name, true);
        preview.className = "stickerimage stickerquality stickerpreview";
        preview.alt = item.sticker.display_name || "";
        preview.loading = "eager";
        let fullready = false;
        const updateoutline = (image) => {
          setlayerratio(layer, art, image);
          editor.setstickeroutline(layer, image);
        };
        preview.addEventListener("load", () => {
          if (!fullready) updateoutline(preview);
          if (originalurl === previewurl) editor.stickerpreviews.delete(item.key);
        }, {once: true});
        preview.addEventListener("error", () => editor.stickerpreviews.delete(item.key), {once: true});
        art.append(preview);
        updateoutline(preview);
        if (originalurl === previewurl && preview.complete && preview.naturalWidth) editor.stickerpreviews.delete(item.key);
        if (originalurl && originalurl !== previewurl) {
          const full = editor.makeimage(originalurl, "stickerimage stickerquality stickerhigh", item.sticker.display_name, true);
          const reveal = () => {
            if (!full.complete || !full.naturalWidth) return;
            if (!preview.complete) {
              preview.addEventListener("load", reveal, {once: true});
              preview.addEventListener("error", reveal, {once: true});
              return;
            }
            fullready = true;
            updateoutline(full);
            editor.stickerpreviews.delete(item.key);
            full.classList.add("ready");
            preview.classList.add("faded");
          };
          full.addEventListener("load", reveal, {once: true});
          full.addEventListener("error", () => {
            full.remove();
            editor.stickerpreviews.delete(item.key);
          }, {once: true});
          art.append(full);
          reveal();
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
