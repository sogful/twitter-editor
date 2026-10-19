((editor) => {
  editor.init = () => {
    editor.root = document.querySelector(".editor");
    editor.state.recent = editor.getstoredrecent();
    editor.bind();
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
