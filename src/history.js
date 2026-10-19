((editor) => {
  editor.historysnapshot = () => {
    const state = editor.state;
    const stickers = state.tool === "crop" && state.cropstickers ? state.cropstickers : state.stickers;
    return {
      photo: state.photo ? {...state.photo} : null,
      source: state.source,
      selectedfilter: state.selectedfilter,
      intensity: state.intensity,
      enhanced: state.enhanced,
      stickers: stickers.map((item) => ({...item})),
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
    editor.dismissvariantmenu();
    editor.stickerpreviews.clear();
    state.photo = snapshot.photo ? {...snapshot.photo} : null;
    state.source = snapshot.source;
    state.selectedfilter = snapshot.selectedfilter;
    state.intensity = snapshot.intensity;
    state.enhanced = snapshot.enhanced;
    state.stickers = snapshot.stickers.map((item) => ({...item}));
    state.selectedsticker = snapshot.selectedsticker;
    state.pendingsticker = "";
    state.pendingstickerhistory = null;
    state.tool = "";
    state.croprect = null;
    state.cropstickers = null;
    state.croplocked = true;
    state.crop = "Original";
    state.rotation = 0;
    state.selectedgroup = null;
    state.pointer = null;
    state.cropdrag = null;
    state.croppointers.clear();
    state.croppinch = null;
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
})(window.photoeditor);
