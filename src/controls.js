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

  editor.historysnapshot = () => {
    const state = editor.state;
    return {
      photo: state.photo ? {...state.photo} : null,
      source: state.source,
      selectedfilter: state.selectedfilter,
      intensity: state.intensity,
      enhanced: state.enhanced,
      stickers: state.stickers.map((item) => ({...item})),
      selectedsticker: state.selectedsticker
    };
  };

  editor.samehistory = (left, right) => {
    if (!left || !right) return false;
    if (left.photo?.local !== right.photo?.local || left.source !== right.source) return false;
    if (left.selectedfilter !== right.selectedfilter || left.intensity !== right.intensity || left.enhanced !== right.enhanced) return false;
    if (left.stickers.length !== right.stickers.length) return false;
    return left.stickers.every((item, index) => {
      const next = right.stickers[index];
      return item.key === next.key && item.x === next.x && item.y === next.y && item.size === next.size && item.rotation === next.rotation && item.sticker.id === next.sticker.id;
    });
  };

  editor.pushhistory = () => {
    const state = editor.state;
    const snapshot = editor.historysnapshot();
    if (!editor.samehistory(state.historyback.at(-1), snapshot)) state.historyback.push(snapshot);
    if (state.historyback.length > 60) state.historyback.shift();
    state.historyforward = [];
  };

  editor.restorehistory = (snapshot) => {
    const state = editor.state;
    state.photo = snapshot.photo ? {...snapshot.photo} : null;
    state.source = snapshot.source;
    state.selectedfilter = snapshot.selectedfilter;
    state.intensity = snapshot.intensity;
    state.enhanced = snapshot.enhanced;
    state.stickers = snapshot.stickers.map((item) => ({...item}));
    state.selectedsticker = snapshot.selectedsticker;
    state.tool = "";
    state.croprect = null;
    state.crop = "Original";
    state.rotation = 0;
    state.selectedgroup = null;
    state.pointer = null;
    state.cropdrag = null;
    editor.render();
  };

  editor.undo = () => {
    const state = editor.state;
    if (!state.historyback.length) return;
    state.historyforward.push(editor.historysnapshot());
    editor.restorehistory(state.historyback.pop());
  };

  editor.redo = () => {
    const state = editor.state;
    if (!state.historyforward.length) return;
    state.historyback.push(editor.historysnapshot());
    editor.restorehistory(state.historyforward.pop());
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

  /*//////////////////////////////////////////////////////////////////////*/

  editor.bindhorizontal = (strip) => {
    let drag = null;
    let suppressclick = false;
    strip.addEventListener("pointerdown", (event) => {
      if (event.button !== 0) return;
      drag = {pointer: event.pointerId, x: event.clientX, scroll: strip.scrollLeft, moved: false};
      try {
        strip.setPointerCapture(event.pointerId);
      } catch {}
    });
    strip.addEventListener("pointermove", (event) => {
      if (!drag || drag.pointer !== event.pointerId) return;
      const delta = event.clientX - drag.x;
      if (Math.abs(delta) > 4) drag.moved = true;
      if (!drag.moved) return;
      event.preventDefault();
      strip.classList.add("dragging");
      strip.scrollLeft = drag.scroll - delta;
    });
    const finish = (event) => {
      if (!drag || drag.pointer !== event.pointerId) return;
      suppressclick = drag.moved;
      strip.classList.remove("dragging");
      drag = null;
      if (suppressclick) setTimeout(() => { suppressclick = false; }, 0);
    };
    strip.addEventListener("pointerup", finish);
    strip.addEventListener("pointercancel", finish);
    strip.addEventListener("click", (event) => {
      if (!suppressclick) return;
      event.preventDefault();
      event.stopImmediatePropagation();
      suppressclick = false;
    }, true);
    strip.addEventListener("wheel", (event) => {
      const delta = Math.abs(event.deltaX) > Math.abs(event.deltaY) ? event.deltaX : event.deltaY;
      if (!delta) return;
      event.preventDefault();
      strip.scrollLeft += delta;
    }, {passive: false});
  };

  editor.bind = () => {
    const state = editor.state;
    const input = document.querySelector(".fileinput");
    const canvasbox = document.querySelector(".canvasbox");
    const layers = document.querySelector(".stickerlayers");
    document.querySelector(".openimage").addEventListener("click", () => input.click());
    document.querySelector(".usesample").addEventListener("click", editor.usesample);
    document.querySelector(".toolclose").addEventListener("click", () => {
      if (state.tool) editor.canceltool();
      else {
        state.selectedsticker = "";
        state.selectedgroup = null;
        editor.render();
      }
    });
    document.querySelector(".undo").addEventListener("click", editor.undo);
    document.querySelector(".redo").addEventListener("click", editor.redo);
    document.querySelector(".donebutton").addEventListener("click", () => {
      if (state.tool === "crop") editor.applycrop();
      else if (state.tool === "sticker") {
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
    for (const strip of document.querySelectorAll(".filterstrip,.categorystrip,.variantstrip")) {
      editor.bindhorizontal(strip);
    }
    for (const button of document.querySelectorAll(".cropchoice")) {
      button.addEventListener("click", () => {
        state.crop = button.dataset.crop;
        state.croprect = editor.croprectfor(state.crop, state.source, state.rotation);
        editor.render();
      });
    }
    document.querySelector(".rotatebutton").addEventListener("click", () => {
      state.rotation = (state.rotation + 90) % 360;
      state.croprect = editor.croprectfor(state.crop, state.source, state.rotation);
      editor.render();
    });
    const intensity = document.querySelector(".intensity");
    const startintensity = () => {
      if (state.rangeediting) return;
      editor.pushhistory();
      state.rangeediting = true;
    };
    intensity.addEventListener("pointerdown", startintensity);
    intensity.addEventListener("keydown", startintensity);
    intensity.addEventListener("input", (event) => {
      state.intensity = Number(event.target.value);
      document.querySelector(".intensityvalue").textContent = String(state.intensity);
      document.querySelector(".photocanvas").style.filter = editor.filtercss(
        state.selectedfilter,
        state.intensity,
        state.enhanced
      );
    });
    intensity.addEventListener("change", () => { state.rangeediting = false; editor.render(); });

    document.querySelector(".cropguide").addEventListener("pointerdown", (event) => {
      if (state.tool !== "crop" || event.button !== 0 || !state.croprect) return;
      event.preventDefault();
      const handle = event.target.closest(".crophandle")?.dataset.handle || "move";
      state.cropdrag = {
        pointer: event.pointerId,
        handle,
        x: event.clientX,
        y: event.clientY,
        rect: {...state.croprect}
      };
      try {
        event.currentTarget.setPointerCapture(event.pointerId);
      } catch {}
    });
    document.querySelector(".cropguide").addEventListener("pointermove", (event) => {
      const drag = state.cropdrag;
      if (!drag || drag.pointer !== event.pointerId) return;
      event.preventDefault();
      const box = canvasbox.getBoundingClientRect();
      if (!box.width || !box.height) return;
      const start = drag.rect;
      const dx = event.clientX - drag.x;
      const dy = event.clientY - drag.y;
      if (drag.handle === "move") {
        state.croprect = {
          ...start,
          x: Math.max(0, Math.min(1 - start.width, start.x + dx / box.width)),
          y: Math.max(0, Math.min(1 - start.height, start.y + dy / box.height))
        };
      } else {
        const directionx = drag.handle.includes("left") ? -1 : 1;
        const directiony = drag.handle.includes("top") ? -1 : 1;
        const ratio = editor.cropratio(state.crop, editor.imagewidth(state.source), editor.imageheight(state.source), state.rotation);
        const changes = [directionx * dx / box.width, directiony * dy * ratio / box.width];
        const requested = start.width + changes.reduce((sum, value) => sum + value, 0) / changes.length;
        const anchorx = directionx < 0 ? start.x + start.width : start.x;
        const anchory = directiony < 0 ? start.y + start.height : start.y;
        const maxwidth = Math.min(
          directionx < 0 ? anchorx : 1 - anchorx,
          (directiony < 0 ? anchory : 1 - anchory) * ratio * box.height / box.width
        );
        const width = Math.max(Math.min(0.08, maxwidth), Math.min(maxwidth, requested));
        const height = width * box.width / (ratio * box.height);
        state.croprect = {
          x: directionx < 0 ? anchorx - width : anchorx,
          y: directiony < 0 ? anchory - height : anchory,
          width,
          height
        };
      }
      editor.renderpreview();
    });

    layers.addEventListener("pointerdown", (event) => {
      const layer = event.target.closest(".stickerlayer");
      if (!layer || event.button !== 0) return;
      event.preventDefault();
      const item = state.stickers.find((sticker) => sticker.key === layer.dataset.key);
      if (!item) return;
      editor.pushhistory();
      const handle = event.target.closest(".stickerhandle")?.dataset.handle || "move";
      const layerbox = layer.getBoundingClientRect();
      const angle = Math.atan2(event.clientY - (layerbox.top + layerbox.height / 2), event.clientX - (layerbox.left + layerbox.width / 2));
      state.pointer = {
        key: item.key,
        pointer: event.pointerId,
        mode: handle === "move" ? "move" : handle === "top" ? "rotate" : "resize",
        handle,
        x: event.clientX,
        y: event.clientY,
        startangle: angle,
        startrotation: item.rotation,
        startx: item.x,
        starty: item.y,
        startsize: item.size
      };
      state.selectedsticker = item.key;
      for (const current of document.querySelectorAll(".stickerlayer")) {
        current.classList.toggle("selected", current === layer);
      }
      try {
        layers.setPointerCapture(event.pointerId);
      } catch {}
    });

    window.addEventListener("pointermove", (event) => {
      const drag = state.pointer;
      if (!drag || drag.pointer !== event.pointerId) return;
      const box = canvasbox.getBoundingClientRect();
      const item = state.stickers.find((sticker) => sticker.key === drag.key);
      const layer = document.querySelector(`.stickerlayer[data-key="${drag.key}"]`);
      if (!item || !layer || !box.width || !box.height) return;
      event.preventDefault();
      if (drag.mode === "move") {
        item.x = Math.max(0, Math.min(100, drag.startx + ((event.clientX - drag.x) / box.width) * 100));
        item.y = Math.max(0, Math.min(100, drag.starty + ((event.clientY - drag.y) / box.height) * 100));
        layer.style.left = `${item.x}%`;
        layer.style.top = `${item.y}%`;
        return;
      }
      if (drag.mode === "rotate") {
        const bounds = layer.getBoundingClientRect();
        const angle = Math.atan2(event.clientY - (bounds.top + bounds.height / 2), event.clientX - (bounds.left + bounds.width / 2));
        let delta = (angle - drag.startangle) * 180 / Math.PI;
        if (delta > 180) delta -= 360;
        if (delta < -180) delta += 360;
        item.rotation = drag.startrotation + delta;
        layer.style.transform = `translate(-50%, -50%) rotate(${item.rotation}deg)`;
        return;
      }
      const directionx = drag.handle.includes("left") ? -1 : drag.handle.includes("right") ? 1 : 0;
      const directiony = drag.handle.includes("top") ? -1 : drag.handle.includes("bottom") ? 1 : 0;
      const stickerbox = layer.getBoundingClientRect();
      const ratio = stickerbox.width / stickerbox.height || 1;
      const changes = [];
      if (directionx) changes.push(directionx * (event.clientX - drag.x));
      if (directiony) changes.push(directiony * (event.clientY - drag.y) * ratio);
      const delta = changes.reduce((sum, value) => sum + value, 0) / changes.length;
      item.size = Math.max(38 / box.width * 100, Math.min(95, drag.startsize + delta / box.width * 100));
      layer.style.width = `${item.size}%`;
    });

    const stopdrag = (event) => {
      if (state.pointer?.pointer === event.pointerId) {
        state.pointer = null;
        editor.render();
      }
      if (state.cropdrag?.pointer === event.pointerId) {
        state.cropdrag = null;
        editor.render();
      }
    };
    window.addEventListener("pointerup", stopdrag);
    window.addEventListener("pointercancel", stopdrag);
    window.addEventListener("blur", () => {
      state.pointer = null;
      state.cropdrag = null;
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
      const editing = event.target instanceof HTMLElement && ["INPUT", "TEXTAREA"].includes(event.target.tagName);
      if ((event.ctrlKey || event.metaKey) && !event.altKey && !editing) {
        if (event.key.toLowerCase() === "z") {
          event.preventDefault();
          if (event.shiftKey) editor.redo();
          else editor.undo();
          return;
        }
        if (event.key.toLowerCase() === "y") {
          event.preventDefault();
          editor.redo();
          return;
        }
      }
      if (event.key === "Escape") {
        if (state.tool) editor.canceltool();
        else {
          state.selectedsticker = "";
          editor.render();
        }
      }
      if ((event.key === "o" || event.key === "O") && !event.ctrlKey && !event.metaKey && !event.altKey && !editing) input.click();
      if ((event.key === "Delete" || event.key === "Backspace") && state.selectedsticker && !editing) editor.removeselected();
    });
  };
})(window.photoeditor);
