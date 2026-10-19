((editor) => {
  editor.init = async () => {
    editor.root = document.querySelector(".editor");
    editor.state.recent = editor.getstoredrecent();
    editor.bind();
    try {
      editor.state.source = await editor.loadimage(editor.state.photo.local);
    } catch (error) {
      editor.setmessage(error.message || "The sample photo could not be opened.");
    }
    editor.render();
    fetch("assets/static/catalog.json")
      .then((response) => {
        if (!response.ok) throw new Error("Sticker catalog request failed.");
        return response.json();
      })
      .then((catalog) => {
        editor.state.catalog = catalog;
        editor.state.catalogstate = "ready";
        editor.renderstickers();
      })
      .catch(() => {
        editor.state.catalogstate = "error";
        editor.renderstickers();
      });
  };

  editor.init();
})(window.photoeditor);
