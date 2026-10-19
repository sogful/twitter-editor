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
    croprect: null,
    cropdrag: null,
    stickers: [],
    selectedsticker: "",
    selectedgroup: null,
    category: "featured",
    recent: [],
    historyback: [],
    historyforward: [],
    busy: false,
    rangeediting: false,
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
    state.croprect = null;
    state.cropdrag = null;
    state.historyback = [];
    state.historyforward = [];
    state.rangeediting = false;
    state.pointer = null;
    state.tool = "";
  };
})(window.photoeditor);
