# Twitter photo editor

A static browser recreation of the photo editing screen from the 2021 Android app. It uses plain HTML, CSS, and JavaScript with no build step or package dependencies.

## Run locally

Serve this folder with any static file server. For example, from PowerShell:

```text
python -m http.server 8000 --bind 127.0.0.1
```

Open `http://127.0.0.1:8000`. Use the open button or press `O` to select a photo. Drop an image onto the editor to open it, then choose **Done** to save the edited PNG.

## Stickers

`assets/static/catalog.json` is the catalog captured from the 2021 app's `/1.1/stickerprovider/catalog.json` endpoint. Sticker PNG and SVG URLs point to the public CDN and load on demand, so the repo does not store the artwork or need account cookies.

The catalog includes 10 categories and their sticker variations. The editor uses small previews in the picker, SVG artwork when available, and full-resolution PNG artwork when exporting.

## Sample photo

The included sample landscape photo is from [Unsplash](https://images.unsplash.com/photo-1470770841072-f978cf4d019e?auto=format&fit=crop&w=1200&q=86).
