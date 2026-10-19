((editor) => {
  editor.init = () => {
    editor.root = document.querySelector(".editor");
    editor.state.recent = editor.getstoredrecent();
    editor.bind();
    editor.render();
    fetch("assets/static/catalog.json.gz")
      .then((response) => {
        if (!response.ok) throw new Error("Sticker catalog request failed?!");
        if (response.headers.get("content-encoding")?.includes("gzip")) return response.json();
        if (!window.DecompressionStream) throw new Error("Compressed sticker catalog is unsupported.");
        return new Response(response.body.pipeThrough(new DecompressionStream("gzip"))).json();
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
