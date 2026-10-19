window.photoeditor = window.photoeditor || {};

((editor) => {
  editor.state = {
    photo: null,
    source: null,
    catalog: null,
    catalogstate: "loading",
    tool: "",
    selectedfilter: "No Filter",
    intensity: 100,
    enhanced: false,
    crop: "Original",
    rotation: 0,
    alttext: "",
    stickers: [],
    selectedsticker: "",
    selectedgroup: null,
    category: "featured",
    search: "",
    recent: [],
    busy: false,
    message: "",
    dragover: false,
    pointer: null
  };

  editor.resettools = () => {
    const state = editor.state;
    state.stickers = [];
    state.selectedsticker = "";
    state.selectedgroup = null;
    state.selectedfilter = "No Filter";
    state.intensity = 100;
    state.enhanced = false;
    state.crop = "Original";
    state.rotation = 0;
    state.alttext = "";
    state.tool = "";
  };
})(window.photoeditor);
