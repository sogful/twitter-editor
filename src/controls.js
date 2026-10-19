((editor) => {
  editor.bind = () => {
    const state = editor.state;
    const input = document.querySelector(".fileinput");
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
      editor.renderpreview();
    });
    intensity.addEventListener("change", () => {
      state.rangeediting = false;
      editor.render();
    });
    editor.bindgestures();
  };
})(window.photoeditor);
