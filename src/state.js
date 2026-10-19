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
    cropzoom: 1,
    cropx: 50,
    cropy: 50,
    croppointers: new Map(),
    croppan: null,
    cropgesture: null,
    stickers: [],
    selectedsticker: "",
    selectedgroup: null,
    category: "featured",
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
    state.cropzoom = 1;
    state.cropx = 50;
    state.cropy = 50;
    state.croppointers.clear();
    state.croppan = null;
    state.cropgesture = null;
    state.tool = "";
  };
})(window.photoeditor);
