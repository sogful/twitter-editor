((editor) => {
  const icons = {
  "back": "<svg xmlns=\"http://www.w3.org/2000/svg\" fill=\"currentColor\" viewBox=\"0 0 24 24\"><path d=\"m7.41 13 5.05 5.04-1.42 1.42L3.6 12l7.45-7.46 1.42 1.42L7.4 11H21v2z\"/></svg>",
  "check": "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 24 24\"><path d=\"m9.2 16.6-4.3-4.3-1.4 1.4 5.7 5.7L21 7.6l-1.4-1.4z\"/></svg>",
  "close": "<svg xmlns=\"http://www.w3.org/2000/svg\" fill=\"currentColor\" viewBox=\"0 0 24 24\"><path d=\"M15.37 7.23a1 1 0 0 1 1.4 1.4l-.06.08L13.4 12l3.3 3.3.06.07a1 1 0 0 1-1.4 1.4l-.08-.06L12 13.4l-3.3 3.3a1 1 0 0 1-1.4-1.42L10.58 12l-3.3-3.3-.06-.07a1 1 0 0 1 1.4-1.4l.08.06L12 10.6l3.3-3.3z\"/></svg>",
  "crop": "<svg xmlns=\"http://www.w3.org/2000/svg\" fill=\"currentColor\" viewBox=\"0 0 24 24\"><path d=\"M5 5V2h2v14.5c0 .28.22.5.5.5H22v2h-3v3h-2v-3H7.5A2.5 2.5 0 0 1 5 16.5V7H2V5zm11.5 2H9V5h7.5A2.5 2.5 0 0 1 19 7.5V15h-2V7.5a.5.5 0 0 0-.5-.5\"/></svg>",
  "enhance": "<svg xmlns=\"http://www.w3.org/2000/svg\" fill=\"currentColor\" viewBox=\"0 0 24 24\"><path d=\"M14 5V1h2v4zm-3.95-2.36 2.83 2.83-1.42 1.4-2.82-2.82zm8.49 4.24-1.42-1.41 2.83-2.83 1.41 1.41zM16.2 9.2 3.7 21.7l-1.42-1.42L14.8 7.8zM7 8h4v2H7zm12 0h4v2h-4zm-1.88 4.54 1.41-1.42 2.83 2.83-1.41 1.41zM14 17v-4h2v4z\"/></svg>",
  "filter": "<svg xmlns=\"http://www.w3.org/2000/svg\" fill=\"currentColor\" viewBox=\"0 0 24 24\"><path fill-rule=\"evenodd\" d=\"M15 13a4 4 0 0 1 3.87 3H21v2h-2.13a4 4 0 0 1-7.74 0H3v-2h8.13A4 4 0 0 1 15 13m0 2a2 2 0 1 0 0 4 2 2 0 0 0 0-4M9 3a4 4 0 0 1 3.87 3H21v2h-8.13a4 4 0 0 1-7.74 0H3V6h2.13A4 4 0 0 1 9 3m0 2a2 2 0 1 0 0 4 2 2 0 0 0 0-4\" clip-rule=\"evenodd\"/></svg>",
  "history": "<svg xmlns=\"http://www.w3.org/2000/svg\" fill=\"currentColor\" viewBox=\"0 0 24 24\"><path d=\"M12 4a8 8 0 0 0-6.62 3.5H8v2H2v-6h2V6a10 10 0 1 1-1.75 8.22l1.95-.44A8 8 0 1 0 12 4m-1 4h2v3.59l3.21 3.2-1.42 1.42-3.79-3.8z\"/></svg>",
  "original": "<svg xmlns=\"http://www.w3.org/2000/svg\" fill=\"currentColor\" viewBox=\"0 0 24 24\"><path d=\"M3 7.5A2.5 2.5 0 0 1 5.5 5h13A2.5 2.5 0 0 1 21 7.5v9a2.5 2.5 0 0 1-2.5 2.5h-13A2.5 2.5 0 0 1 3 16.5zM5.5 7a.5.5 0 0 0-.5.5v9c0 .28.22.5.5.5h13a.5.5 0 0 0 .5-.5v-9a.5.5 0 0 0-.5-.5z\"/></svg>",
  "photo": "<svg xmlns=\"http://www.w3.org/2000/svg\" fill=\"currentColor\" viewBox=\"0 0 24 24\"><path fill-rule=\"evenodd\" d=\"M14.1 2.5q1.65-.02 2.7.06c.74.06 1.38.18 1.97.48a5 5 0 0 1 2.19 2.19c.3.6.42 1.23.48 1.96q.08 1.06.06 2.71v4.2q.02 1.65-.06 2.7a5 5 0 0 1-.49 1.97 5 5 0 0 1-2.18 2.19c-.6.3-1.23.42-1.96.48q-1.06.08-2.71.06H9.9q-1.65.02-2.7-.06a5 5 0 0 1-1.97-.49 5 5 0 0 1-2.18-2.18 5 5 0 0 1-.5-1.96q-.06-1.06-.05-2.71V9.9q-.02-1.65.06-2.7c.06-.74.18-1.38.49-1.97a5 5 0 0 1 2.18-2.18 5 5 0 0 1 1.96-.5Q8.25 2.5 9.9 2.5zM4.5 14.44c.01.48.02 1.87.05 2.2.05.61.14.96.28 1.22a3 3 0 0 0 1.3 1.31c.27.14.62.23 1.22.28.62.05 1.41.05 2.55.05h6.18l-8.12-8.13zM15 7a2 2 0 1 0 0 4 2 2 0 0 0 0-4\" clip-rule=\"evenodd\"/></svg>",
  "redo": "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 24 24\"><path d=\"M11.5 8c2.65 0 5.05 1 6.9 2.6L22 7v9h-9l3.64-3.64a8 8 0 0 0-5.14-1.86 7.2 7.2 0 0 0-6.92 5.12l-2.37-.78A9.7 9.7 0 0 1 11.5 8\"/></svg>",
  "resize": "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 24 24\"><path d=\"M4 4h6v2H7.41l3.3 3.3-1.42 1.41L6 7.41V10H4zm10 0h6v6h-2V7.41l-3.3 3.3-1.41-1.42L16.59 6H14zm4 10h2v6h-6v-2h2.59l-3.3-3.3 1.42-1.41 3.29 3.3zM4 14h2v2.59l3.3-3.3 1.41 1.42L7.41 18H10v2H4z\"/></svg>",
  "rotate": "<svg xmlns=\"http://www.w3.org/2000/svg\" fill=\"currentColor\" viewBox=\"0 0 24 24\"><path d=\"M12 3.75c-2.2 0-4.18.85-5.66 2.25H8v2H3V3h2v1.51a10.25 10.25 0 0 1 16.24 3.05l-1.8.87A8.3 8.3 0 0 0 12 3.75m-1.77 4.6a2.5 2.5 0 0 1 3.54 0l4.88 4.88a2.5 2.5 0 0 1 0 3.54l-4.88 4.88a2.5 2.5 0 0 1-3.54 0l-4.88-4.88a2.5 2.5 0 0 1 0-3.54zm2.12 1.42a.5.5 0 0 0-.7 0l-4.88 4.88a.5.5 0 0 0 0 .7l4.88 4.88c.2.2.5.2.7 0l4.88-4.88a.5.5 0 0 0 0-.7z\"/></svg>",
  "search": "<svg xmlns=\"http://www.w3.org/2000/svg\" fill=\"currentColor\" viewBox=\"0 0 24 24\"><path d=\"M10.25 4.25a6 6 0 1 0 0 12 6 6 0 0 0 0-12m-9 6a9 9 0 1 1 16.34 5.22l4.47 4.47-2.12 2.12-4.48-4.47a9 9 0 0 1-14.21-7.34\"/></svg>",
  "square": "<svg xmlns=\"http://www.w3.org/2000/svg\" fill=\"currentColor\" viewBox=\"0 0 24 24\"><path d=\"M3 5.5A2.5 2.5 0 0 1 5.5 3h13A2.5 2.5 0 0 1 21 5.5v13a2.5 2.5 0 0 1-2.5 2.5h-13A2.5 2.5 0 0 1 3 18.5zM5.5 5a.5.5 0 0 0-.5.5v13c0 .28.22.5.5.5h13a.5.5 0 0 0 .5-.5v-13a.5.5 0 0 0-.5-.5z\"/></svg>",
  "sticker": "<svg xmlns=\"http://www.w3.org/2000/svg\" fill=\"currentColor\" viewBox=\"0 0 24 24\"><path d=\"M11 9.5c0 1.38-.67 2.5-1.5 2.5S8 10.88 8 9.5 8.67 7 9.5 7 11 8.12 11 9.5m5 0c0 1.38-.67 2.5-1.5 2.5S13 10.88 13 9.5 13.67 7 14.5 7 16 8.12 16 9.5m6.17.36q.08.57.08 1.14c0 5.23-6.26 11.2-11.75 11.2h-.54C5.2 21.98 1.75 17.7 1.75 12 1.75 6.35 6.35 1.75 12 1.75c5.16 0 9.53 3.49 10.17 8.11M12 3.75A8.26 8.26 0 0 0 3.75 12c0 3.92 2.14 7.98 6.24 8.2.2-.02 1.19-.14 1.73-.82.28-.36.45-.85.6-1.39L12 18c-3.68 0-4.9-3.53-4.95-3.68l1.9-.64L8 14l.95-.32c.03.1.83 2.32 3.05 2.32a3 3 0 0 0 .94-.15c.24-.59.61-1.3 1.28-1.93 1.07-1.01 2.25-1.27 3.3-1.51.73-.17 1.37-.3 1.86-.7.63-.5.77-1.41.8-1.67-.56-3.6-4.05-6.3-8.18-6.3zm2.69 13.17q-.16.5-.28 1.01-.17.7-.4 1.36a13 13 0 0 0 5.43-5.34c-.5.2-1.01.3-1.48.41-.91.2-1.7.38-2.38 1.02-.39.36-.66.84-.9 1.54\"/></svg>",
  "trash": "<svg xmlns=\"http://www.w3.org/2000/svg\" fill=\"currentColor\" viewBox=\"0 0 24 24\"><g fill=\"#000\"><path d=\"M11 17H9v-6h2zm4 0h-2v-6h2z\"/><path fill-rule=\"evenodd\" d=\"M13.11 2a3.5 3.5 0 0 1 3.37 2.54L16.9 6H21v2h-1.07l-.77 10.75A3.5 3.5 0 0 1 15.67 22H8.33a3.5 3.5 0 0 1-3.5-3.25L4.08 8H3V6h4.1l.42-1.46A3.5 3.5 0 0 1 10.9 2zM6.07 8l.76 10.6c.06.8.71 1.4 1.5 1.4h7.34c.79 0 1.44-.6 1.5-1.4L17.93 8zm4.82-4a1.5 1.5 0 0 0-1.45 1.09L9.18 6h5.64l-.26-.91A1.5 1.5 0 0 0 13.1 4z\" clip-rule=\"evenodd\"/></g></svg>",
  "undo": "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 24 24\"><path d=\"M12.5 8c-2.65 0-5.05 1-6.9 2.6L2 7v9h9l-3.64-3.64a8 8 0 0 1 5.14-1.86 7.2 7.2 0 0 1 6.92 5.12l2.37-.78A9.7 9.7 0 0 0 12.5 8\"/></svg>",
  "wide": "<svg xmlns=\"http://www.w3.org/2000/svg\" fill=\"currentColor\" viewBox=\"0 0 24 24\"><path d=\"M3 9.5A2.5 2.5 0 0 1 5.5 7h13A2.5 2.5 0 0 1 21 9.5v5a2.5 2.5 0 0 1-2.5 2.5h-13A2.5 2.5 0 0 1 3 14.5zM5.5 9a.5.5 0 0 0-.5.5v5c0 .28.22.5.5.5h13a.5.5 0 0 0 .5-.5v-5a.5.5 0 0 0-.5-.5z\"/></svg>"
};
  const namespace = "http://www.w3.org/2000/svg";

  editor.makeicon = (classname) => {
    const name = classname.replace(/^icon/, "");
    if (!icons[name]) return null;
    const source = new DOMParser().parseFromString(icons[name], "image/svg+xml").documentElement;
    const icon = document.createElementNS(namespace, "svg");
    icon.setAttribute("viewBox", source.getAttribute("viewBox") || "0 0 24 24");
    icon.setAttribute("fill", "currentColor");
    icon.setAttribute("class", "icon " + classname);
    icon.setAttribute("aria-hidden", "true");
    for (const child of source.childNodes) icon.append(document.importNode(child, true));
    for (const path of icon.querySelectorAll('[fill="black"],[fill="#000"],[fill="#000000"]')) path.setAttribute("fill", "currentColor");
    return icon;
  };

  for (const placeholder of document.querySelectorAll("span.icon")) {
    const classname = [...placeholder.classList].find((name) => name.startsWith("icon") && name !== "icon");
    const icon = editor.makeicon(classname || "");
    if (icon) placeholder.replaceWith(icon);
  }
})(window.photoeditor);
