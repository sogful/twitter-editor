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
    document.querySelector(".startscreen").classList.add("off");
    editor.root.classList.remove("off");
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
    const preset = editor.filters.find((item) => item.name === name);
    editor.state.selectedfilter = name;
    editor.state.intensity = preset?.initial ?? 100;
    editor.render();
  };

  /*//////////////////////////////////////////////////////////////////////*/

  editor.handletool = (name) => {
    const state = editor.state;
    if (name === "enhance") {
      state.enhanced = !state.enhanced;
      editor.render();
      return;
    }
    state.tool = state.tool === name ? "" : name;
    if (name !== "sticker") state.selectedgroup = null;
    editor.render();
  };

  editor.remember = (sticker) => {
    const state = editor.state;
    state.recent = [String(sticker.id), ...state.recent.filter((id) => String(id) !== String(sticker.id))].slice(0, 80);
    try {
      localStorage.setItem("recentstickers", JSON.stringify(state.recent));
    } catch {}
  };

  /*//////////////////////////////////////////////////////////////////////*/

  editor.insertsticker = (sticker, keepopen = false) => {
    const state = editor.state;
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

  /*//////////////////////////////////////////////////////////////////////*/

  editor.removeselected = () => {
    const state = editor.state;
    state.stickers = state.stickers.filter((item) => item.key !== state.selectedsticker);
    state.selectedsticker = "";
    editor.render();
  };

  editor.saveimage = async () => {
    const state = editor.state;
    state.busy = true;
    state.message = "";
    editor.render();
    try {
      const filter = editor.filtercss(state.selectedfilter, state.intensity, state.enhanced);
      const blob = await editor.exportimage({
        photo: state.photo,
        source: state.source,
        rotation: state.rotation,
        crop: state.crop,
        cropzoom: state.cropzoom,
        cropx: state.cropx,
        cropy: state.cropy,
        filter,
        stickers: state.stickers
      });
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

  /*//////////////////////////////////////////////////////////////////////*/

  editor.bind = () => {
    const state = editor.state;
    const input = document.querySelector(".fileinput");
    document.querySelector(".openimage").addEventListener("click", () => input.click());
    document.querySelector(".usesample").addEventListener("click", editor.usesample);
    document.querySelector(".toolclose").addEventListener("click", () => {
      state.tool = "";
      state.selectedgroup = null;
      editor.render();
    });
    document.querySelector(".donebutton").addEventListener("click", () => {
      if (["crop", "sticker"].includes(state.tool)) {
        state.tool = "";
        state.selectedgroup = null;
        editor.render();
      } else editor.saveimage();
    });
    input.addEventListener("change", (event) => {
      editor.openfile(event.target.files?.[0]);
      event.target.value = "";
    });
    for (const button of document.querySelectorAll(".toolbutton")) {
      button.addEventListener("click", () => editor.handletool(button.dataset.tool));
    }
    for (const button of document.querySelectorAll(".cropchoice")) {
      button.addEventListener("click", () => {
        state.crop = button.dataset.crop;
        state.cropzoom = 1;
        state.cropx = 50;
        state.cropy = 50;
        editor.render();
      });
    }
    document.querySelector(".rotatebutton").addEventListener("click", () => {
      state.rotation = (state.rotation + 90) % 360;
      state.cropzoom = 1;
      state.cropx = 50;
      state.cropy = 50;
      editor.render();
    });
    document.querySelector(".intensity").addEventListener("input", (event) => {
      state.intensity = Number(event.target.value);
      document.querySelector(".intensityvalue").textContent = String(state.intensity);
      document.querySelector(".photocanvas").style.filter = editor.filtercss(
        state.selectedfilter,
        state.intensity,
        state.enhanced
      );
    });
    document.querySelector(".stickersize").addEventListener("input", (event) => {
      const selected = state.stickers.find((item) => item.key === state.selectedsticker);
      if (!selected) return;
      selected.size = Number(event.target.value);
      const layer = document.querySelector(`.stickerlayer[data-key="${selected.key}"]`);
      if (layer) layer.style.width = `${selected.size}%`;
    });
    document.querySelector(".rotatesticker").addEventListener("click", () => {
      state.stickers = state.stickers.map((item) =>
        item.key === state.selectedsticker ? {...item, rotation: item.rotation - 15} : item
      );
      editor.render();
    });
    document.querySelector(".removesticker").addEventListener("click", editor.removeselected);
    document.querySelector(".canvasbox").addEventListener("click", (event) => {
      if (event.target.classList.contains("photocanvas") && state.selectedsticker) {
        state.selectedsticker = "";
        editor.renderselection();
        for (const layer of document.querySelectorAll(".stickerlayer")) layer.classList.remove("selected");
      }
    });
    document.querySelector(".canvasbox").addEventListener("pointerdown", (event) => {
      if (state.tool !== "crop" || !event.target.classList.contains("photocanvas")) return;
      event.preventDefault();
      try {
        event.currentTarget.setPointerCapture(event.pointerId);
      } catch {}
      state.croppointers.set(event.pointerId, {x: event.clientX, y: event.clientY});
      if (state.croppointers.size > 1) {
        const points = [...state.croppointers.values()];
        state.cropgesture = {
          distance: Math.hypot(points[0].x - points[1].x, points[0].y - points[1].y),
          zoom: state.cropzoom
        };
        state.croppan = null;
      } else state.croppan = {pointer: event.pointerId, x: event.clientX, y: event.clientY};
    });
    document.querySelector(".canvasbox").addEventListener("wheel", (event) => {
      if (state.tool !== "crop") return;
      event.preventDefault();
      state.cropzoom = Math.max(1, Math.min(4, state.cropzoom + (event.deltaY < 0 ? 0.12 : -0.12)));
      editor.renderpreview();
    }, {passive: false});
    document.querySelector(".stickerlayers").addEventListener("pointerdown", (event) => {
      const layer = event.target.closest(".stickerlayer");
      if (!layer) return;
      event.preventDefault();
      state.pointer = {key: layer.dataset.key, pointer: event.pointerId};
      state.selectedsticker = layer.dataset.key;
      for (const item of document.querySelectorAll(".stickerlayer")) {
        item.classList.toggle("selected", item === layer);
      }
      editor.renderselection();
    });
    window.addEventListener("pointermove", (event) => {
      if (!state.pointer || state.pointer.pointer !== event.pointerId) return;
      const box = document.querySelector(".canvasbox").getBoundingClientRect();
      const item = state.stickers.find((sticker) => sticker.key === state.pointer.key);
      if (!item || !box.width || !box.height) return;
      item.x = Math.max(4, Math.min(96, ((event.clientX - box.left) / box.width) * 100));
      item.y = Math.max(4, Math.min(96, ((event.clientY - box.top) / box.height) * 100));
      const layer = document.querySelector(`.stickerlayer[data-key="${item.key}"]`);
      if (layer) {
        layer.style.left = `${item.x}%`;
        layer.style.top = `${item.y}%`;
      }
    });
    window.addEventListener("pointermove", (event) => {
      if (!state.croppointers.has(event.pointerId)) return;
      const previous = state.croppointers.get(event.pointerId);
      state.croppointers.set(event.pointerId, {x: event.clientX, y: event.clientY});
      if (state.cropgesture && state.croppointers.size > 1) {
        const points = [...state.croppointers.values()];
        const distance = Math.hypot(points[0].x - points[1].x, points[0].y - points[1].y);
        state.cropzoom = Math.max(1, Math.min(4, state.cropgesture.zoom * distance / Math.max(1, state.cropgesture.distance)));
        editor.renderpreview();
        return;
      }
      if (state.croppan?.pointer !== event.pointerId) return;
      const box = document.querySelector(".canvasbox").getBoundingClientRect();
      if (!box.width || !box.height) return;
      state.cropx = Math.max(0, Math.min(100, state.cropx - ((event.clientX - previous.x) / box.width) * 100));
      state.cropy = Math.max(0, Math.min(100, state.cropy - ((event.clientY - previous.y) / box.height) * 100));
      state.croppan = {pointer: event.pointerId, x: event.clientX, y: event.clientY};
      editor.renderpreview();
    });
    window.addEventListener("pointerup", (event) => {
      if (state.pointer?.pointer === event.pointerId) state.pointer = null;
      if (state.croppointers.has(event.pointerId)) {
        state.croppointers.delete(event.pointerId);
        state.cropgesture = null;
        const remaining = [...state.croppointers.entries()][0];
        state.croppan = remaining ? {pointer: remaining[0], x: remaining[1].x, y: remaining[1].y} : null;
      }
    });
    window.addEventListener("pointercancel", () => {
      state.pointer = null;
      state.croppointers.clear();
      state.croppan = null;
      state.cropgesture = null;
    });
    window.addEventListener("blur", () => {
      state.pointer = null;
      state.croppointers.clear();
      state.croppan = null;
      state.cropgesture = null;
    });
    editor.root.addEventListener("dragover", (event) => {
      event.preventDefault();
      state.dragover = true;
      editor.root.classList.add("dragging");
      document.querySelector(".dropnotice").classList.remove("off");
    });
    editor.root.addEventListener("dragleave", (event) => {
      if (event.target === editor.root) {
        state.dragover = false;
        editor.root.classList.remove("dragging");
        document.querySelector(".dropnotice").classList.add("off");
      }
    });
    editor.root.addEventListener("drop", (event) => {
      event.preventDefault();
      state.dragover = false;
      editor.openfile(event.dataTransfer.files?.[0]);
    });
    window.addEventListener("keydown", (event) => {
      if (event.key === "Escape") {
        state.tool = "";
        state.selectedgroup = null;
        editor.render();
      }
      if ((event.key === "o" || event.key === "O") && !event.ctrlKey && !event.metaKey && !event.altKey) {
        if (event.target instanceof HTMLElement && ["INPUT", "TEXTAREA"].includes(event.target.tagName)) return;
        input.click();
      }
    });
  };
})(window.photoeditor);
