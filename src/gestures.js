((editor) => {
  editor.bindhorizontal = (strip) => {
    let drag = null;
    let suppressclick = false;
    strip.addEventListener("pointerdown", (event) => {
      if (event.button !== 0) return;
      drag = {pointer: event.pointerId, x: event.clientX, scroll: strip.scrollLeft, moved: false};
    });
    strip.addEventListener("pointermove", (event) => {
      if (!drag || drag.pointer !== event.pointerId) return;
      const delta = event.clientX - drag.x;
      if (Math.abs(delta) > 4) drag.moved = true;
      if (!drag.moved) return;
      if (!strip.hasPointerCapture(event.pointerId)) {
        try {
          strip.setPointerCapture(event.pointerId);
        } catch {}
      }
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

  /*//////////////////////////////////////////////////////////////////////*/

  editor.bindgestures = () => {
    const state = editor.state;
    const canvasbox = document.querySelector(".canvasbox");
    const layers = document.querySelector(".stickerlayers");
    const input = document.querySelector(".fileinput");
    canvasbox.addEventListener("pointerdown", (event) => {
      if (!state.selectedsticker || event.target.closest(".stickerlayer")) return;
      state.selectedsticker = "";
      state.selectedgroup = null;
      editor.renderlayers();
      editor.rendervariants();
    });
    for (const strip of document.querySelectorAll(".filterstrip,.categorystrip,.variantpopover")) {
      editor.bindhorizontal(strip);
    }
    document.querySelector(".stickerpanel").addEventListener("click", (event) => {
      if (!state.variantitem || event.target.closest(".variantpopover,.stickerchoice")) return;
      editor.dismissvariantmenu();
    });
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
    canvasbox.addEventListener("pointerdown", (event) => {
      if (state.tool !== "crop" || event.pointerType !== "touch") return;
      state.croppointers.set(event.pointerId, {x: event.clientX, y: event.clientY});
      if (state.croppointers.size < 2 || !state.croprect) return;
      const points = [...state.croppointers.values()];
      const box = canvasbox.getBoundingClientRect();
      state.cropdrag = null;
      state.croppinch = {
        pointers: [...state.croppointers.keys()],
        distance: Math.hypot(points[1].x - points[0].x, points[1].y - points[0].y),
        x: ((points[0].x + points[1].x) / 2 - box.left) / box.width,
        y: ((points[0].y + points[1].y) / 2 - box.top) / box.height,
        midpointx: (points[0].x + points[1].x) / 2,
        midpointy: (points[0].y + points[1].y) / 2,
        view: {...state.cropview}
      };
    });
    document.querySelector(".cropguide").addEventListener("pointermove", (event) => {
      const drag = state.cropdrag;
      if (!drag || drag.pointer !== event.pointerId) return;
      event.preventDefault();
      const box = canvasbox.getBoundingClientRect();
      if (!box.width || !box.height) return;
      const start = drag.rect;
      const dx = (event.clientX - drag.x) / state.cropview.scale;
      const dy = (event.clientY - drag.y) / state.cropview.scale;
      if (drag.handle === "move") {
        state.croprect = {
          ...start,
          x: Math.max(0, Math.min(1 - start.width, start.x + dx / box.width)),
          y: Math.max(0, Math.min(1 - start.height, start.y + dy / box.height))
        };
      } else {
        const left = drag.handle.includes("left")
          ? Math.max(0, Math.min(start.x + start.width - 0.04, start.x + dx / box.width))
          : start.x;
        const right = drag.handle.includes("right")
          ? Math.min(1, Math.max(start.x + 0.04, start.x + start.width + dx / box.width))
          : start.x + start.width;
        const top = drag.handle.includes("top")
          ? Math.max(0, Math.min(start.y + start.height - 0.04, start.y + dy / box.height))
          : start.y;
        const bottom = drag.handle.includes("bottom")
          ? Math.min(1, Math.max(start.y + 0.04, start.y + start.height + dy / box.height))
          : start.y + start.height;
        state.croprect = {
          x: left,
          y: top,
          width: right - left,
          height: bottom - top
        };
        state.croplocked = false;
        state.crop = "Custom";
      }
      editor.rendercropguide();
    });
    canvasbox.addEventListener("wheel", (event) => {
      if (state.tool !== "crop" || !state.croprect) return;
      event.preventDefault();
      const box = canvasbox.getBoundingClientRect();
      const anchorx = Math.max(0, Math.min(1, (event.clientX - box.left) / box.width));
      const anchory = Math.max(0, Math.min(1, (event.clientY - box.top) / box.height));
      state.cropview = editor.panzoomcropview(
        state.cropview,
        anchorx, anchory,
        anchorx, anchory,
        state.cropview.scale * (event.deltaY < 0 ? 1.12 : 1 / 1.12)
      );
      editor.rendercropview();
    }, {passive: false});

    layers.addEventListener("pointerdown", (event) => {
      const layer = event.target.closest(".stickerlayer");
      if (!layer || event.button !== 0) return;
      event.preventDefault();
      const item = state.stickers.find((sticker) => sticker.key === layer.dataset.key);
      if (!item) return;
      const handle = event.target.closest(".stickerhandle")?.dataset.handle || "move";
      state.selectedsticker = item.key;
      if (handle === "topleft") {
        editor.removeselected();
        return;
      }
      if (handle === "bottomleft") {
        if (state.pendingsticker === item.key) editor.confirmsticker();
        else {
          state.selectedsticker = "";
        }
        editor.render();
        return;
      }
      if (state.pendingsticker !== item.key) editor.pushhistory();
      const layerbox = layer.getBoundingClientRect();
      const angle = Math.atan2(event.clientY - (layerbox.top + layerbox.height / 2), event.clientX - (layerbox.left + layerbox.width / 2));
      state.pointer = {
        key: item.key,
        pointer: event.pointerId,
        mode: handle === "move" ? "move" : handle === "topright" ? "rotate" : "resize",
        handle,
        x: event.clientX, y: event.clientY,
        startangle: angle,
        startrotation: item.rotation,
        startx: item.x, starty: item.y,
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
      if (state.croppointers.has(event.pointerId)) {
        state.croppointers.set(event.pointerId, {x: event.clientX, y: event.clientY});
        if (state.croppinch && state.croppinch.pointers.includes(event.pointerId)) {
          const points = state.croppinch.pointers.map((id) => state.croppointers.get(id));
          if (points.every(Boolean)) {
            const box = canvasbox.getBoundingClientRect();
            const midpointx = (points[0].x + points[1].x) / 2;
            const midpointy = (points[0].y + points[1].y) / 2;
            const distance = Math.hypot(points[1].x - points[0].x, points[1].y - points[0].y);
            const targetx = (midpointx - box.left) / box.width;
            const targety = (midpointy - box.top) / box.height;
            const scale = state.croppinch.view.scale * distance / Math.max(1, state.croppinch.distance);
            state.cropview = editor.panzoomcropview(
              state.croppinch.view,
              state.croppinch.x, state.croppinch.y,
              targetx, targety, scale
            );
            editor.rendercropview();
          }
          event.preventDefault();
          return;
        }
      }
      const drag = state.pointer;
      if (!drag || drag.pointer !== event.pointerId) return;
      const box = canvasbox.getBoundingClientRect();
      const item = state.stickers.find((sticker) => sticker.key === drag.key);
      const layer = document.querySelector(`.stickerlayer[data-key="${drag.key}"]`);
      const art = document.querySelector(`.stickerart[data-key="${drag.key}"]`);
      if (!item || !layer || !art || !box.width || !box.height) return;
      event.preventDefault();
      if (drag.mode === "move") {
        item.x = Math.max(0, Math.min(100, drag.startx + ((event.clientX - drag.x) / box.width) * 100));
        item.y = Math.max(0, Math.min(100, drag.starty + ((event.clientY - drag.y) / box.height) * 100));
        for (const current of [layer, art]) {
          current.style.left = `${item.x}%`;
          current.style.top = `${item.y}%`;
        }
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
        art.style.transform = `translate(-50%, -50%) rotate(${item.rotation}deg)`;
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
      art.style.width = `${item.size}%`;
    });

    const stopdrag = (event) => {
      state.croppointers.delete(event.pointerId);
      if (state.croppinch?.pointers.includes(event.pointerId)) {
        state.croppinch = null;
        state.cropdrag = null;
      }
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
      state.croppointers.clear();
      state.croppinch = null;
    });
    window.addEventListener("resize", () => editor.layoutpreview());

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
        if (state.variantitem) editor.dismissvariantmenu();
        else if (state.tool) editor.canceltool();
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
