((editor) => {
  editor.setmessage = (message) => {
    clearTimeout(editor.messagetimer);
    editor.state.message = message;
    const toast = document.querySelector(".toast");
    toast.textContent = message;
    toast.classList.toggle("off", !message);
    editor.messagetimer = setTimeout(() => {
      editor.state.message = "";
      toast.textContent = "";
      toast.classList.add("off");
    }, 2800);
  };

  /*//////////////////////////////////////////////////////////////////////*/

  editor.openfile = async (file) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      editor.setmessage("Choose an image file.");
      return;
    }
    const local = URL.createObjectURL(file);
    try {
      const source = await editor.loadimage(local);
      editor.setphoto(local, file.name.replace(/\.[^.]+$/, "") || "photo", source);
    } catch (error) {
      URL.revokeObjectURL(local);
      editor.setmessage(error.message || "The image could not be opened.");
    }
  };

  editor.setphoto = (local, name, source) => {
    const state = editor.state;
    if (state.photo?.local.startsWith("blob:")) URL.revokeObjectURL(state.photo.local);
    state.photo = {local, name};
    state.source = source;
    editor.resettools();
    editor.render();
  };

  editor.usesample = async () => {
    const local = "assets/images/GOODsample.webp";
    try {
      const source = await editor.loadimage(local);
      editor.setphoto(local, "sample", source);
    } catch (error) {
      editor.setmessage(error.message || "The sample photo could not be opened.");
    }
  };

  editor.setfilter = (name) => {
    const state = editor.state;
    const preset = editor.filters.find((item) => item.name === name);
    if (state.selectedfilter === name) return;
    editor.pushhistory();
    state.selectedfilter = name;
    state.intensity = preset?.initial ?? 100;
    editor.render();
  };

  /*//////////////////////////////////////////////////////////////////////*/

  editor.handletool = (name) => {
    const state = editor.state;
    if (name === "enhance") {
      editor.pushhistory();
      state.enhanced = !state.enhanced;
      editor.render();
      return;
    }
    const next = state.tool === name ? "" : name;
    state.tool = next;
    state.selectedgroup = null;
    state.croprect = next === "crop" ? editor.croprectfor("Original", state.source, 0) : null;
    state.crop = "Original";
    state.rotation = 0;
    state.cropdrag = null;
    editor.render();
  };

  editor.remember = (sticker) => {
    const state = editor.state;
    state.recent = [String(sticker.id), ...state.recent.filter((id) => String(id) !== String(sticker.id))].slice(0, 80);
    try {
      localStorage.setItem("recentstickers", JSON.stringify(state.recent));
    } catch {}
  };

  editor.insertsticker = (sticker, keepopen = false) => {
    const state = editor.state;
    editor.pushhistory();
    const key = crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}${Math.random()}`;
    state.stickers.push({key, sticker, x: 50, y: 50, size: 27, rotation: 0});
    state.selectedsticker = key;
    editor.remember(sticker);
    if (!keepopen) {
      state.tool = "";
      state.selectedgroup = null;
    }
    editor.render();
  };

  editor.replacesticker = (sticker) => {
    const state = editor.state;
    if (!state.selectedsticker) {
      editor.insertsticker(sticker, true);
      return;
    }
    editor.pushhistory();
    state.stickers = state.stickers.map((item) =>
      item.key === state.selectedsticker ? {...item, sticker} : item
    );
    editor.remember(sticker);
    editor.render();
  };

  editor.chooseitem = (item) => {
    const variants = item.variant_stickers || [];
    editor.state.selectedgroup = item;
    editor.insertsticker(item.sticker, variants.length > 0);
    if (variants.length > 0) editor.state.selectedgroup = item;
  };

  editor.removeselected = () => {
    const state = editor.state;
    if (!state.selectedsticker) return;
    editor.pushhistory();
    state.stickers = state.stickers.filter((item) => item.key !== state.selectedsticker);
    state.selectedsticker = "";
    editor.render();
  };

  /*//////////////////////////////////////////////////////////////////////*/

  editor.canceltool = () => {
    const state = editor.state;
    state.tool = "";
    state.selectedgroup = null;
    state.crop = "Original";
    state.rotation = 0;
    state.croprect = null;
    state.cropdrag = null;
    state.pointer = null;
    editor.render();
  };

  editor.applycrop = () => {
    const state = editor.state;
    if (!state.source || !state.croprect) return;
    editor.pushhistory();
    const rect = {...state.croprect};
    state.source = editor.cropcanvas(state.source, state.rotation, rect);
    state.stickers = state.stickers.map((item) => ({
      ...item,
      x: ((item.x / 100 - rect.x) / rect.width) * 100,
      y: ((item.y / 100 - rect.y) / rect.height) * 100,
      size: item.size / rect.width
    }));
    state.tool = "";
    state.crop = "Original";
    state.rotation = 0;
    state.croprect = null;
    state.cropdrag = null;
    editor.render();
  };

  editor.saveimage = async () => {
    const state = editor.state;
    state.busy = true;
    state.message = "";
    editor.render();
    try {
      const filter = editor.filtercss(state.selectedfilter, state.intensity, state.enhanced);
      const blob = await editor.exportimage({source: state.source, filter, stickers: state.stickers});
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${state.photo.name || "photo"}-edited.png`;
      link.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      editor.setmessage("Image saved");
    } catch (error) {
      editor.setmessage(error.message || "The image could not be saved :(");
    } finally {
      state.busy = false;
      editor.render();
    }
  };
})(window.photoeditor);
