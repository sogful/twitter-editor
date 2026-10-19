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
    cropstickers: null,
    croplocked: true,
    cropdrag: null,
    cropview: {scale: 1, x: 0, y: 0},
    croppointers: new Map(),
    croppinch: null,
    stickers: [],
    selectedsticker: "",
    pendingsticker: "",
    pendingstickerhistory: null,
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
    state.cropstickers = null;
    state.croplocked = true;
    state.cropdrag = null;
    state.cropview = {scale: 1, x: 0, y: 0};
    state.croppointers.clear();
    state.croppinch = null;
    state.historyback = [];
    state.historyforward = [];
    state.pendingsticker = "";
    state.pendingstickerhistory = null;
    state.rangeediting = false;
    state.pointer = null;
    state.tool = "";
  };
})(window.photoeditor);
