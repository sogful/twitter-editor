((editor) => {
  editor.bind = () => {
    const state = editor.state;
    const input = document.querySelector(".fileinput");
    document.querySelector(".openimage").addEventListener("click", () => input.click());
    document.querySelector(".usesample").addEventListener("click", editor.usesample);
    document.querySelector(".toolclose").addEventListener("click", () => {
      if (state.tool) editor.canceltool();
      else editor.returntostart();
    });
    document.querySelector(".undo").addEventListener("click", editor.undo);
    document.querySelector(".redo").addEventListener("click", editor.redo);
    document.querySelector(".donebutton").addEventListener("click", () => {
      if (state.tool === "crop") editor.applycrop();
      else if (state.tool === "sticker") {
        editor.confirmsticker();
        state.tool = "";
        state.selectedgroup = null;
        editor.render();
      } else {
        if (state.pendingsticker) editor.confirmsticker();
        editor.saveimage();
      }
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
        state.croplocked = true;
        state.croprect = editor.rectforratio(
          state.croprect,
          state.source,
          state.rotation,
          editor.cropratio(state.crop, editor.imagewidth(state.source), editor.imageheight(state.source), state.rotation)
        );
        editor.render();
      });
    }
    document.querySelector(".rotatebutton").addEventListener("click", () => {
      const oriented = editor.orientedimage(state.source, state.rotation);
      const scale = editor.imagewidth(oriented) / editor.imageheight(oriented);
      state.stickers = state.stickers.map((item) => ({
        ...item,
        x: 100 - item.y,
        y: item.x,
        size: item.size * scale,
        rotation: item.rotation + 90
      }));
      state.rotation = (state.rotation + 90) % 360;
      if (state.croprect) state.croprect = editor.rotatecroprect(state.croprect);
      const view = state.cropview;
      state.cropview = {
        scale: view.scale,
        x: Math.max(1 - view.scale, Math.min(0, -view.y)),
        y: Math.max(1 - view.scale, Math.min(0, view.x))
      };
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
      intensity.style.setProperty("--progress", `${state.intensity}%`);
      editor.renderpreview();
    });
    intensity.addEventListener("change", () => {
      state.rangeediting = false;
      editor.render();
    });
    editor.bindgestures();
  };
})(window.photoeditor);
