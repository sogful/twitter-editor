const application = document.querySelector(".application");
const photo = {local: "assets/images/sample.jpg", name: "sample"};
const state = {
  photo,
  photosize: {width: 1600, height: 1067},
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
  recent: getstoredrecent(),
  busy: false,
  message: "",
  dragover: false,
  pointer: null
};
const inputref = {current: null};
const stageref = {current: null};
let messagetimer = 0;

function handlepointermove(event) {
  if (!state.pointer || state.pointer.pointer !== event.pointerId || !stageref.current) return;
  const bounds = stageref.current.getBoundingClientRect();
  const x = Math.max(4, Math.min(96, ((event.clientX - bounds.left) / bounds.width) * 100));
  const y = Math.max(4, Math.min(96, ((event.clientY - bounds.top) / bounds.height) * 100));
  const key = state.pointer.key;
  state.stickers = state.stickers.map((item) => (item.key === key ? {...item, x, y} : item));
  for (const layer of document.querySelectorAll(".stickerlayer")) {
    if (layer.dataset.key === key) {
      layer.style.left = `${x}%`;
      layer.style.top = `${y}%`;
    }
  }
}

function handlepointerup(event) {
  if (state.pointer?.pointer === event.pointerId) state.pointer = null;
}

function render() {
  const focused = document.activeElement?.dataset.focus || "";
  let selectionstart = null;
  let selectionend = null;
  try {
    selectionstart = document.activeElement.selectionStart;
    selectionend = document.activeElement.selectionEnd;
  } catch {}
  const selectedlayer = state.stickers.find((item) => item.key === state.selectedsticker);
  const filter = filtercss(state.selectedfilter, state.intensity, state.enhanced);
  const ratio = cropratio(state.crop, state.photosize.width, state.photosize.height, state.rotation);
  const boxstyle = {aspectRatio: String(ratio), width: `min(94vw, calc(76vh * ${ratio}))`};
  const toolbar = [
    {name: "enhance", label: "Enhance"},
    {name: "filters", label: "Filters"},
    {name: "crop", label: "Crop"},
    {name: "sticker", label: "Stickers"},
    {name: "alt", label: "Alt-text"}
  ];
  const stickerlist = allstickers(state.catalog);
  const featured = state.catalog?.featured_sections?.[0];
  const categoryitems =
    state.category === "featured"
      ? featured?.items || []
      : state.category === "recent"
        ? recentitems(state.recent, stickerlist)
        : state.catalog?.categories?.find((item) => String(item.id) === state.category)?.items || [];
  const visibleitems = state.search.trim()
    ? stickerlist
        .filter((item) => item.display_name.toLowerCase().includes(state.search.trim().toLowerCase()))
        .map((sticker) => ({sticker}))
    : categoryitems;
  const stickerbuttons = [
    {
      id: "featured",
      name: featured?.display_name || "Top picks",
      icon: featured?.icon_image?.url,
      kind: "featured"
    },
    {id: "recent", name: "Recent", kind: "recent"},
    ...(state.catalog?.categories || []).map((item) => ({
      id: String(item.id),
      name: item.display_name,
      icon: item.icon_image?.url,
      kind: "category"
    }))
  ];

  function openfile(file) {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setmessage("Choose an image file.");
      return;
    }
    if (state.photo.local.startsWith("blob:")) URL.revokeObjectURL(state.photo.local);
    state.photo = {local: URL.createObjectURL(file), name: file.name.replace(/\.[^.]+$/, "") || "photo"};
    resettools();
    render();
  }

  function resettools() {
    state.photosize = {width: 1600, height: 1067};
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
  }

  function resetphoto() {
    if (state.photo.local.startsWith("blob:")) URL.revokeObjectURL(state.photo.local);
    state.photo = {local: "assets/images/sample.jpg", name: "sample"};
    resettools();
    render();
  }

  function setfilter(name) {
    const preset = filters.find((item) => item.name === name);
    state.selectedfilter = name;
    state.intensity = preset?.initial ?? 100;
    render();
  }

  function handletool(name) {
    if (name === "enhance") {
      state.enhanced = !state.enhanced;
      render();
      return;
    }
    state.tool = state.tool === name ? "" : name;
    if (name !== "sticker") state.selectedgroup = null;
    if (name === "sticker") state.search = "";
    render();
  }

  function remember(sticker) {
    state.recent = [String(sticker.id), ...state.recent.filter((id) => String(id) !== String(sticker.id))].slice(0, 80);
    try {
      localStorage.setItem("recentstickers", JSON.stringify(state.recent));
    } catch {}
  }

  function insertsticker(sticker, keepopen = false) {
    const key = crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}${Math.random()}`;
    state.stickers.push({key, sticker, x: 50, y: 50, size: 27, rotation: 0});
    state.selectedsticker = key;
    remember(sticker);
    if (!keepopen) {
      state.tool = "";
      state.selectedgroup = null;
    }
    render();
  }

  function replacesticker(sticker) {
    if (!state.selectedsticker) {
      insertsticker(sticker, true);
      return;
    }
    state.stickers = state.stickers.map((item) => (item.key === state.selectedsticker ? {...item, sticker} : item));
    remember(sticker);
    render();
  }

  function chooseitem(item) {
    const variants = item.variant_stickers || [];
    state.selectedgroup = item;
    insertsticker(item.sticker, variants.length > 0);
    if (variants.length > 0) state.selectedgroup = item;
  }

  function removerselected() {
    state.stickers = state.stickers.filter((item) => item.key !== state.selectedsticker);
    state.selectedsticker = "";
    render();
  }

  function handlepointerdown(event, item) {
    if (event.target.closest(".stickerremove")) return;
    event.preventDefault();
    event.stopPropagation();
    state.pointer = {key: item.key, pointer: event.pointerId};
    state.selectedsticker = item.key;
    render();
  }

  async function saveimage() {
    state.busy = true;
    state.message = "";
    render();
    try {
      const blob = await exportimage({
        photo: state.photo,
        rotation: state.rotation,
        crop: state.crop,
        filter,
        stickers: state.stickers
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${state.photo.name || "photo"}-edited.png`;
      link.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      setmessage("Image saved");
    } catch (error) {
      setmessage(error.message || "The image could not be saved.");
    } finally {
      state.busy = false;
      render();
    }
  }

  function rendertoolpanel() {
    if (state.tool === "filters") {
      return view(
        "section",
        {className: "filterpanel", "aria-label": "Filters"},
        view(
          "div",
          {className: "filterstrip"},
          filters.map((preset) =>
            imagefiltertile({
              preset,
              selected: preset.name === state.selectedfilter,
              source: state.photo.local,
              filter: filtercss(preset.name, preset.initial, state.enhanced),
              onselect: () => setfilter(preset.name)
            })
          )
        ),
        view(
          "label",
          {className: "intensityrow"},
          view("span", null, "Intensity"),
          view("input", {
            type: "range",
            min: 0,
            max: 100,
            value: state.intensity,
            "aria-label": "Filter intensity",
            "data-focus": "intensity",
            onInput: (event) => {
              state.intensity = Number(event.target.value);
              render();
            }
          }),
          view("span", {className: "intensityvalue"}, String(state.intensity))
        )
      );
    }
    if (state.tool === "crop") {
      return view(
        "section",
        {className: "croppanel", "aria-label": "Crop image"},
        view(
          "div",
          {className: "cropchoices"},
          cropchoice({
            name: "Original",
            selected: state.crop === "Original",
            shape: "original",
            onclick: () => {
              state.crop = "Original";
              render();
            }
          }),
          cropchoice({
            name: "Wide",
            selected: state.crop === "Wide",
            shape: "wide",
            onclick: () => {
              state.crop = "Wide";
              render();
            }
          }),
          cropchoice({
            name: "Square",
            selected: state.crop === "Square",
            shape: "square",
            onclick: () => {
              state.crop = "Square";
              render();
            }
          }),
          view(
            "button",
            {
              className: "rotatebutton",
              type: "button",
              onClick: () => {
                state.rotation = (state.rotation + 90) % 360;
                render();
              },
              "aria-label": "Rotate image clockwise"
            },
            icon("rotate", 26),
            view("span", null, "Rotate")
          )
        )
      );
    }
    if (state.tool === "alt") {
      return view(
        "section",
        {className: "altpanel", "aria-label": "Image description"},
        view("div", {className: "panelheading"}, "Add alt-text"),
        view("textarea", {
          className: "altinput",
          value: state.alttext,
          maxLength: 1000,
          placeholder: "Describe this image",
          "aria-label": "Image description",
          "data-focus": "alttext",
          onInput: (event) => {
            state.alttext = event.target.value;
            const count = document.querySelector(".altcount");
            if (count) count.textContent = `${state.alttext.length}/1000`;
            const badge = document.querySelector(".altbadge");
            if (state.alttext && !badge && stageref.current) stageref.current.append(view("div", {className: "altbadge"}, "ALT"));
            if (!state.alttext && badge) badge.remove();
          }
        }),
        view("span", {className: "altcount"}, `${state.alttext.length}/1000`)
      );
    }
    if (state.tool === "sticker") {
      return view(
        "div",
        {className: "stickerpicker"},
        view("button", {
          className: "stickerbackdrop",
          type: "button",
          "aria-label": "Close sticker picker",
          onClick: () => {
            state.tool = "";
            render();
          }
        }),
        view(
          "section",
          {className: "stickerpanel", "aria-label": "Sticker picker"},
          view(
            "div",
            {className: "stickersearch"},
            icon("search", 19),
            view("input", {
              className: "searchinput",
              type: "search",
              value: state.search,
              placeholder: "Search stickers",
              "aria-label": "Search stickers",
              "data-focus": "stickersearch",
              onInput: (event) => {
                state.search = event.target.value;
                render();
              }
            }),
            view(
              "button",
              {
                className: "closebutton",
                type: "button",
                "aria-label": "Close sticker picker",
                onClick: () => {
                  state.tool = "";
                  render();
                }
              },
              icon("close", 18)
            )
          ),
          !state.search &&
            view(
              "div",
              {className: "categorystrip"},
              stickerbuttons.map((item) =>
                view(
                  "button",
                  {
                    className: `categorybutton${state.category === item.id ? " selected" : ""}`,
                    type: "button",
                    "aria-pressed": state.category === item.id,
                    onClick: () => {
                      state.category = item.id;
                      state.selectedgroup = null;
                      render();
                    }
                  },
                  item.icon
                    ? assetimage({url: item.icon, className: "categoryicon", alt: ""})
                    : icon(item.kind === "recent" ? "recent" : "sticker", 25),
                  view("span", null, item.name)
                )
              )
            ),
          state.selectedgroup &&
            (state.selectedgroup.variant_stickers || []).length > 0 &&
            view(
              "div",
              {
                className: "variantstrip",
                "aria-label": `${state.selectedgroup.sticker.display_name} variations`
              },
              view("span", {className: "variantlabel"}, state.selectedgroup.sticker.display_name),
              stickerbutton({
                sticker: state.selectedgroup.sticker,
                selected: selectedlayer?.sticker.id === state.selectedgroup.sticker.id,
                onclick: () => replacesticker(state.selectedgroup.sticker)
              }),
              state.selectedgroup.variant_stickers.map((sticker) =>
                stickerbutton({
                  sticker,
                  selected: selectedlayer?.sticker.id === sticker.id,
                  onclick: () => replacesticker(sticker)
                })
              )
            ),
          state.catalogstate === "loading"
            ? view("div", {className: "stickerstate"}, "Loading stickers")
            : state.catalogstate === "error"
              ? view("div", {className: "stickerstate"}, "Sticker catalog unavailable")
              : visibleitems.length
                ? view(
                    "div",
                    {className: "stickergallery"},
                    visibleitems.map((item) =>
                      stickerbutton({
                        sticker: item.sticker,
                        selected: selectedlayer?.sticker.id === item.sticker.id,
                        onclick: () => (state.search ? insertsticker(item.sticker) : chooseitem(item))
                      })
                    )
                  )
                : view(
                    "div",
                    {className: "stickerstate"},
                    state.search
                      ? "No stickers found"
                      : state.category === "recent"
                        ? "Stickers you add will appear here"
                        : "No stickers available"
                  )
        )
      );
    }
    return null;
  }

  const main = view(
    "main",
    {
      className: `editor${state.dragover ? " dragging" : ""}`,
      onDragOver: (event) => {
        event.preventDefault();
        if (!state.dragover) {
          state.dragover = true;
          render();
        }
      },
      onDragLeave: (event) => {
        if (event.currentTarget === event.target) {
          state.dragover = false;
          render();
        }
      },
      onDrop: (event) => {
        event.preventDefault();
        state.dragover = false;
        openfile(event.dataTransfer.files?.[0]);
      }
    },
    view(
      "header",
      {className: "topbar"},
      view(
        "button",
        {className: "backbutton", type: "button", onClick: resetphoto, "aria-label": "Back"},
        icon("back", 23),
        view("span", null, "Back")
      ),
      view("span", {className: "topbarspace"}),
      view(
        "button",
        {
          className: "openbutton",
          type: "button",
          onClick: () => inputref.current?.click(),
          "aria-label": "Open another photo",
          title: "Open another photo"
        },
        icon("upload", 21)
      ),
      view(
        "button",
        {className: "donebutton", type: "button", disabled: state.busy, onClick: saveimage},
        state.busy ? "Saving" : "Done"
      )
    ),
    view(
      "section",
      {className: "workspace", "aria-label": "Photo preview"},
      view(
        "div",
        {
          className: "canvasbox",
          style: boxstyle,
          ref: stageref,
          onClick: (event) => {
            if (event.target === event.currentTarget && state.selectedsticker) {
              state.selectedsticker = "";
              render();
            }
          }
        },
        view("img", {
          className: `photoimage${state.crop === "Original" ? " contain" : " cover"}`,
          src: state.photo.local,
          alt: "",
          draggable: false,
          style: {filter, transform: `rotate(${state.rotation}deg)`},
          onLoad: (event) => {
            const width = event.currentTarget.naturalWidth;
            const height = event.currentTarget.naturalHeight;
            if (state.photosize.width !== width || state.photosize.height !== height) {
              state.photosize = {width, height};
              render();
            }
          },
          onError: () => setmessage("The image could not be opened.")
        }),
        state.stickers.map((item) =>
          view(
            "div",
            {
              className: `stickerlayer${state.selectedsticker === item.key ? " selected" : ""}`,
              "data-key": item.key,
              style: {
                left: `${item.x}%`,
                top: `${item.y}%`,
                width: `${item.size}%`,
                transform: `translate(-50%, -50%) rotate(${item.rotation}deg)`
              },
              onPointerDown: (event) => handlepointerdown(event, item)
            },
            assetimage({
              url: imageurl(item.sticker, "size_3x"),
              className: "stickerimage",
              alt: item.sticker.display_name,
              loading: "eager"
            }),
            state.selectedsticker === item.key &&
              view(
                "button",
                {
                  className: "stickerremove",
                  type: "button",
                  "aria-label": "Remove sticker",
                  onPointerDown: (event) => event.stopPropagation(),
                  onClick: (event) => {
                    event.stopPropagation();
                    state.stickers = state.stickers.filter((sticker) => sticker.key !== item.key);
                    state.selectedsticker = "";
                    render();
                  }
                },
                icon("close", 14)
              )
          )
        ),
        state.dragover && view("div", {className: "dropnotice"}, "Drop an image to edit it"),
        state.alttext && view("div", {className: "altbadge"}, "ALT")
      )
    ),
    selectedlayer &&
      view(
        "div",
        {className: "selectionbar", "aria-label": "Selected sticker controls"},
        view("span", {className: "selectionname"}, selectedlayer.sticker.display_name),
        view(
          "button",
          {
            type: "button",
            className: "smallcontrol",
            onClick: () => {
              state.stickers = state.stickers.map((item) =>
                item.key === state.selectedsticker ? {...item, rotation: item.rotation - 15} : item
              );
              render();
            },
            "aria-label": "Rotate sticker"
          },
          icon("rotate", 18)
        ),
        view("input", {
          className: "stickersize",
          type: "range",
          min: 8,
          max: 72,
          value: selectedlayer.size,
          "aria-label": "Sticker size",
          "data-focus": "stickersize",
          onInput: (event) => {
            state.stickers = state.stickers.map((item) =>
              item.key === state.selectedsticker ? {...item, size: Number(event.target.value)} : item
            );
            render();
          }
        }),
        view(
          "button",
          {
            type: "button",
            className: "smallcontrol",
            onClick: removerselected,
            "aria-label": "Remove sticker"
          },
          icon("trash", 18)
        )
      ),
    rendertoolpanel(),
    view(
      "footer",
      {className: "footer"},
      view(
        "nav",
        {className: "toolbar", "aria-label": "Photo editing tools"},
        toolbar.map((item) =>
          toolbarbutton({
            name: item.name,
            label: item.label,
            active: item.name === "enhance" ? state.enhanced : item.name === state.tool,
            onclick: () => handletool(item.name)
          })
        )
      )
    ),
    view("input", {
      className: "fileinput",
      ref: inputref,
      type: "file",
      accept: "image/*",
      "aria-label": "Choose an image",
      onChange: (event) => {
        openfile(event.target.files?.[0]);
        event.target.value = "";
      }
    }),
    state.message && view("div", {className: "toast", role: "status"}, state.message)
  );

  application.replaceChildren(main);
  if (focused) {
    const next = application.querySelector(`[data-focus="${focused}"]`);
    if (next) {
      next.focus({preventScroll: true});
      if (selectionstart !== null && selectionend !== null && typeof next.setSelectionRange === "function")
        next.setSelectionRange(selectionstart, selectionend);
    }
  }
}

function setmessage(message) {
  clearTimeout(messagetimer);
  state.message = message;
  render();
  messagetimer = setTimeout(() => {
    state.message = "";
    render();
  }, 2800);
}

window.addEventListener("pointermove", handlepointermove);
window.addEventListener("pointerup", handlepointerup);
window.addEventListener("pointercancel", handlepointerup);
window.addEventListener("blur", () => {
  state.pointer = null;
});
window.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    state.tool = "";
    state.selectedgroup = null;
    render();
  }
  if ((event.key === "o" || event.key === "O") && !event.ctrlKey && !event.metaKey && !event.altKey) {
    const target = event.target;
    if (target instanceof HTMLElement && ["INPUT", "TEXTAREA"].includes(target.tagName)) return;
    inputref.current?.click();
  }
});

render();
fetch("assets/static/catalog.json")
  .then((response) => {
    if (!response.ok) throw new Error("Sticker catalog request failed.");
    return response.json();
  })
  .then((catalog) => {
    state.catalog = catalog;
    state.catalogstate = "ready";
    render();
  })
  .catch(() => {
    state.catalogstate = "error";
    render();
  });
