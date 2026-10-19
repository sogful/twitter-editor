const filters = [
  {name: "No Filter", initial: 100, brightness: 1, contrast: 1, saturation: 1, sepia: 0, hue: 0, gray: 0},
  {
    name: "Radiant",
    initial: 80,
    brightness: 1.035,
    contrast: 1.1,
    saturation: 1.2,
    sepia: 0.02,
    hue: 0,
    gray: 0
  },
  {
    name: "Positive",
    initial: 80,
    brightness: 1.04,
    contrast: 1.04,
    saturation: 1.14,
    sepia: 0,
    hue: 0,
    gray: 0
  },
  {
    name: "Warm",
    initial: 80,
    brightness: 1.02,
    contrast: 1.02,
    saturation: 1.13,
    sepia: 0.22,
    hue: -8,
    gray: 0
  },
  {
    name: "Breeze",
    initial: 80,
    brightness: 1.05,
    contrast: 0.98,
    saturation: 0.98,
    sepia: 0.03,
    hue: 12,
    gray: 0
  },
  {
    name: "Glow",
    initial: 80,
    brightness: 1.12,
    contrast: 1.06,
    saturation: 1.04,
    sepia: 0.03,
    hue: 0,
    gray: 0
  },
  {
    name: "Golden",
    initial: 80,
    brightness: 1.04,
    contrast: 1.05,
    saturation: 1.22,
    sepia: 0.28,
    hue: -10,
    gray: 0
  },
  {
    name: "Fame",
    initial: 80,
    brightness: 1.02,
    contrast: 1.16,
    saturation: 0.82,
    sepia: 0.02,
    hue: 0,
    gray: 0
  },
  {name: "Stark", initial: 80, brightness: 1, contrast: 1.2, saturation: 1, sepia: 0, hue: 0, gray: 1}
];

/*//////////////////////////////////////////////////////////////////////*/

const iconpaths = {
  back: "M20 12H4m0 0 7-7m-7 7 7 7",
  check: "m5 12 4 4L19 6",
  upload: "M12 16V4m0 0L7 9m5-5 5 5M5 14v5h14v-5",
  enhance: "M12 3l1.7 5.3L19 10l-5.3 1.7L12 17l-1.7-5.3L5 10l5.3-1.7zM19 15v5m2.5-2.5h-5",
  filters: "M4 3v7m0 4v7m8-18v9m0 4v5m8-18v5m0 4v9M1 10h6m2 3h6m2-5h6",
  crop: "M7 3v14a2 2 0 0 0 2 2h12M3 7h14a2 2 0 0 1 2 2v12",
  sticker: "M12 3a9 9 0 1 0 9 9h-6a3 3 0 0 1-3-3V3zm5 1.5V9h4.5A9 9 0 0 0 17 4.5z",
  alt: "M4 6h16M4 12h10M4 18h16",
  rotate: "M20 11a8 8 0 1 0 1 4m-1-8v5h-5",
  close: "m6 6 12 12M18 6 6 18",
  trash: "M4 7h16m-10-3h4m-8 3 1 13h10l1-13M10 11v5m4-5v5",
  add: "M12 5v14m-7-7h14",
  original: "M5 5h14v14H5z",
  wide: "M3 7h18v10H3z",
  square: "M5 5h14v14H5z",
  search: "M11 19a8 8 0 1 1 0-16 8 8 0 0 1 0 16zm6-2 4 4",
  recent: "M12 8v4l3 2m6-2a9 9 0 1 1-2.64-6.36"
};

function icon(name, size = 24, className = "") {
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("class", `icon${className ? ` ${className}` : ""}`);
  svg.classList.add("element");
  svg.setAttribute("width", String(size));
  svg.setAttribute("height", String(size));
  svg.setAttribute("viewBox", "0 0 24 24");
  svg.setAttribute("fill", "none");
  svg.setAttribute("stroke", "currentColor");
  svg.setAttribute("stroke-width", "1.8");
  svg.setAttribute("stroke-linecap", "round");
  svg.setAttribute("stroke-linejoin", "round");
  svg.setAttribute("aria-hidden", "true");
  const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
  path.setAttribute("d", iconpaths[name] || iconpaths.add);
  svg.append(path);
  return svg;
}

function view(tag, attributes, ...children) {
  if (typeof tag === "function") return tag(attributes || {});
  const node = document.createElement(tag);
  for (const [name, value] of Object.entries(attributes || {})) {
    if (name === "className") node.className = value || "";
    else if (name === "style") Object.assign(node.style, value || {});
    else if (name === "ref") {
      if (value) value.current = node;
    } else if (name === "key") continue;
    else if (name.startsWith("on") && typeof value === "function") node.addEventListener(name.slice(2).toLowerCase(), value);
    else if (["value", "checked", "disabled", "draggable", "tabIndex", "hidden"].includes(name)) node[name] = value;
    else if (value === undefined || value === null) continue;
    else if (name.startsWith("aria-") || name.startsWith("data-")) node.setAttribute(name, String(value));
    else if (typeof value === "boolean") {
      if (value) node.setAttribute(name, "");
    } else node.setAttribute(name, String(value));
  }
  node.classList.add("element");
  if (tag === "button") node.classList.add("button");
  if (tag === "input") node.classList.add("input");
  if (tag === "textarea") node.classList.add("textarea");
  for (const child of children.flat(Infinity)) {
    if (child === null || child === undefined || child === false || child === true) continue;
    node.append(child instanceof Node ? child : document.createTextNode(String(child)));
  }
  return node;
}

function assetimage({url, className, alt = "", loading = "lazy"}) {
  if (!url) return null;
  return view("img", {className, src: url, alt, loading, draggable: false});
}

function imagefiltertile({preset, selected, source, filter, onselect}) {
  return view(
    "button",
    {
      className: `filtertile${selected ? " selected" : ""}`,
      type: "button",
      "aria-label": preset.name,
      "aria-pressed": selected,
      onClick: onselect
    },
    view(
      "span",
      {className: "filterpreview"},
      view("img", {
        className: "filterimage",
        src: source,
        alt: "",
        style: {filter},
        draggable: false
      })
    ),
    view("span", {className: "filtername"}, preset.name)
  );
}

function cropchoice({name, selected, shape, onclick}) {
  return view(
    "button",
    {
      className: `cropchoice${selected ? " selected" : ""}`,
      type: "button",
      "aria-pressed": selected,
      onClick: onclick
    },
    icon(shape, 28),
    view("span", null, name)
  );
}

function toolbarbutton({name, label, active, onclick}) {
  return view(
    "button",
    {
      className: `toolbutton${active ? " active" : ""}`,
      type: "button",
      title: label,
      "aria-label": label,
      "aria-pressed": Boolean(active),
      onClick: onclick
    },
    icon(name, 25)
  );
}

function stickerbutton({sticker, selected, onclick}) {
  const url = imageurl(sticker, "size_1x");
  return view(
    "button",
    {
      className: `stickerchoice${selected ? " selected" : ""}`,
      type: "button",
      title: sticker.display_name,
      "aria-label": sticker.display_name,
      onClick: onclick
    },
    assetimage({url, className: "stickerthumb", alt: sticker.display_name})
  );
}

function getstoredrecent() {
  try {
    const value = JSON.parse(localStorage.getItem("recentstickers") || "[]");
    return Array.isArray(value) ? value : [];
  } catch {
    return [];
  }
}

function allstickers(catalog) {
  const result = [];
  const seen = new Set();
  function add(sticker) {
    if (!sticker || seen.has(String(sticker.id))) return;
    seen.add(String(sticker.id));
    result.push(sticker);
  }
  for (const category of catalog?.categories || []) {
    for (const item of category.items || []) {
      add(item.sticker);
      for (const variant of item.variant_stickers || []) add(variant);
    }
  }
  for (const section of catalog?.featured_sections || []) {
    for (const item of section.items || []) {
      add(item.sticker);
      for (const variant of item.variant_stickers || []) add(variant);
    }
  }
  return result;
}

function imageurl(sticker, size) {
  const images = sticker?.images;
  return images?.svg?.url || images?.[size]?.url || images?.size_3x?.url || images?.raw?.url || "";
}

function recentitems(ids, stickers) {
  const lookup = new Map(stickers.map((sticker) => [String(sticker.id), sticker]));
  return ids
    .map((id) => lookup.get(String(id)))
    .filter(Boolean)
    .map((sticker) => ({sticker}));
}

function filtercss(name, intensity, enhanced) {
  const preset = filters.find((item) => item.name === name) || filters[0];
  const amount = Math.max(0, Math.min(100, intensity)) / 100;
  const brightness = 1 + (preset.brightness - 1) * amount;
  const contrast = 1 + (preset.contrast - 1) * amount;
  const saturation = 1 + (preset.saturation - 1) * amount;
  const sepia = preset.sepia * amount;
  const hue = preset.hue * amount;
  const gray = preset.gray * amount;
  const enhancement = enhanced ? " brightness(1.05) contrast(1.08) saturate(1.04)" : "";
  return (
    `brightness(${brightness}) contrast(${contrast}) saturate(${saturation}) ` +
    `sepia(${sepia}) hue-rotate(${hue}deg) grayscale(${gray})${enhancement}`
  );
}

function cropratio(name, width, height, rotation) {
  if (name === "Square") return 1;
  if (name === "Wide") return 1.91;
  return Math.abs(rotation % 180) === 90 ? height / width : width / height;
}

/*//////////////////////////////////////////////////////////////////////*/

function loadimage(url) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.crossOrigin = "anonymous";
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("The image could not be opened."));
    image.src = url;
  });
}

function rotateimage(image, rotation) {
  const sideways = Math.abs(rotation % 180) === 90;
  const width = sideways ? image.naturalHeight : image.naturalWidth;
  const height = sideways ? image.naturalWidth : image.naturalHeight;
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d");
  canvas.width = width;
  canvas.height = height;
  if (rotation % 360 === 90) {
    context.translate(width, 0);
    context.rotate(Math.PI / 2);
  } else if (rotation % 360 === 180 || rotation % 360 === -180) {
    context.translate(width, height);
    context.rotate(Math.PI);
  } else if (rotation % 360 === 270 || rotation % 360 === -90) {
    context.translate(0, height);
    context.rotate(-Math.PI / 2);
  }
  context.drawImage(image, 0, 0);
  return canvas;
}

async function exportimage({photo, rotation, crop, filter, stickers}) {
  const source = await loadimage(photo.local);
  const rotated = rotateimage(source, rotation);
  const ratio = cropratio(crop, source.naturalWidth, source.naturalHeight, rotation);
  const rotatedratio = rotated.width / rotated.height;
  let cropwidth = rotated.width;
  let cropheight = rotated.height;
  if (rotatedratio > ratio) cropwidth = rotated.height * ratio;
  else cropheight = rotated.width / ratio;
  const left = (rotated.width - cropwidth) / 2;
  const top = (rotated.height - cropheight) / 2;
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d");
  canvas.width = Math.max(1, Math.round(cropwidth));
  canvas.height = Math.max(1, Math.round(cropheight));
  context.filter = filter;
  context.drawImage(rotated, left, top, cropwidth, cropheight, 0, 0, canvas.width, canvas.height);
  context.filter = "none";
  for (const item of stickers) {
    const url = imageurl(item.sticker, "raw");
    if (!url) continue;
    const stickerimage = await loadimage(url);
    const width = (canvas.width * item.size) / 100;
    const height = (width * stickerimage.naturalHeight) / stickerimage.naturalWidth;
    const centerx = (canvas.width * item.x) / 100;
    const centery = (canvas.height * item.y) / 100;
    context.save();
    context.translate(centerx, centery);
    context.rotate((item.rotation * Math.PI) / 180);
    context.drawImage(stickerimage, -width / 2, -height / 2, width, height);
    context.restore();
  }
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error("The edited image could not be exported."));
    }, "image/png");
  });
}

/*//////////////////////////////////////////////////////////////////////*/
