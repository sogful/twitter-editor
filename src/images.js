((editor) => {
  editor.loadimage = (url) =>
    new Promise((resolve, reject) => {
      const image = new Image();
      image.crossOrigin = "anonymous";
      image.onload = () => resolve(image);
      image.onerror = () => reject(new Error("The image could not be opened..."));
      image.src = url;
    });

  editor.imagewidth = (image) => image?.naturalWidth || image?.width || 0;
  editor.imageheight = (image) => image?.naturalHeight || image?.height || 0;

  /*//////////////////////////////////////////////////////////////////////*/

  editor.rotateimage = (image, rotation) => {
    const originalwidth = editor.imagewidth(image);
    const originalheight = editor.imageheight(image);
    const angle = ((rotation % 360) + 360) % 360;
    const sideways = angle === 90 || angle === 270;
    const width = sideways ? originalheight : originalwidth;
    const height = sideways ? originalwidth : originalheight;
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");
    canvas.width = width;
    canvas.height = height;
    if (angle === 90) {
      context.translate(width, 0);
      context.rotate(Math.PI / 2);
    } else if (angle === 180) {
      context.translate(width, height);
      context.rotate(Math.PI);
    } else if (angle === 270) {
      context.translate(0, height);
      context.rotate(-Math.PI / 2);
    }
    context.drawImage(image, 0, 0);
    return canvas;
  };

  editor.orientedimage = (image, rotation) => rotation ? editor.rotateimage(image, rotation) : image;

  editor.croprectfor = (name, image, rotation) => {
    const oriented = editor.orientedimage(image, rotation);
    const width = editor.imagewidth(oriented);
    const height = editor.imageheight(oriented);
    const imageratio = width / height;
    const ratio = editor.cropratio(name, editor.imagewidth(image), editor.imageheight(image), rotation);
    const rectwidth = ratio >= imageratio ? 1 : ratio / imageratio;
    const rectheight = ratio >= imageratio ? imageratio / ratio : 1;
    return {x: (1 - rectwidth) / 2, y: (1 - rectheight) / 2, width: rectwidth, height: rectheight};
  };

  editor.rectforratio = (rect, image, rotation, ratio) => {
    const oriented = editor.orientedimage(image, rotation);
    const imagewidth = editor.imagewidth(oriented);
    const imageheight = editor.imageheight(oriented);
    const target = ratio * imageheight / imagewidth;
    const area = rect.width * rect.height;
    let width = Math.sqrt(area * target);
    let height = width / target;
    const scale = Math.min(1, (Math.min(rect.x + rect.width / 2, 1 - rect.x - rect.width / 2) * 2) / width, (Math.min(rect.y + rect.height / 2, 1 - rect.y - rect.height / 2) * 2) / height);
    width *= scale;
    height *= scale;
    const centerx = rect.x + rect.width / 2;
    const centery = rect.y + rect.height / 2;
    return {
      x: Math.max(0, Math.min(1 - width, centerx - width / 2)),
      y: Math.max(0, Math.min(1 - height, centery - height / 2)),
      width,
      height
    };
  };

  editor.panzoomcropview = (view, anchorx, anchory, targetx, targety, scale) => {
    const nextscale = Math.max(1, Math.min(6, scale));
    const imagex = (anchorx - view.x) / view.scale;
    const imagey = (anchory - view.y) / view.scale;
    return {
      scale: nextscale,
      x: Math.max(1 - nextscale, Math.min(0, targetx - imagex * nextscale)),
      y: Math.max(1 - nextscale, Math.min(0, targety - imagey * nextscale))
    };
  };

  editor.rotatecroprect = (rect) => ({
    x: 1 - rect.y - rect.height,
    y: rect.x,
    width: rect.height,
    height: rect.width
  });

  editor.cropcanvas = (image, rotation, rect) => {
    const oriented = editor.orientedimage(image, rotation);
    const sourcewidth = editor.imagewidth(oriented);
    const sourceheight = editor.imageheight(oriented);
    const left = Math.max(0, Math.round(sourcewidth * rect.x));
    const top = Math.max(0, Math.round(sourceheight * rect.y));
    const width = Math.max(1, Math.min(sourcewidth - left, Math.round(sourcewidth * rect.width)));
    const height = Math.max(1, Math.min(sourceheight - top, Math.round(sourceheight * rect.height)));
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");
    canvas.width = width;
    canvas.height = height;
    context.drawImage(oriented, left, top, width, height, 0, 0, width, height);
    return canvas;
  };

  editor.exportimage = async ({source, filter, intensity, enhanced, stickers}) => {
    const width = editor.imagewidth(source);
    const height = editor.imageheight(source);
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");
    canvas.width = width;
    canvas.height = height;
    context.drawImage(source, 0, 0, width, height);
    await editor.applyfilter(canvas, filter, intensity, enhanced);
    for (const item of stickers) {
      const url = editor.imageurl(item.sticker, "original");
      if (!url) continue;
      const stickerimage = await editor.loadimage(url);
      const stickerwidth = (canvas.width * item.size) / 100;
      const stickerheight = (stickerwidth * stickerimage.naturalHeight) / stickerimage.naturalWidth;
      context.save();
      context.translate((canvas.width * item.x) / 100, (canvas.height * item.y) / 100);
      context.rotate((item.rotation * Math.PI) / 180);
      context.drawImage(stickerimage, -stickerwidth / 2, -stickerheight / 2, stickerwidth, stickerheight);
      context.restore();
    }
    return new Promise((resolve, reject) => {
      canvas.toBlob((blob) => {
        if (blob) resolve(blob);
        else reject(new Error("The edited image could not be exported."));
      }, "image/png");
    });
  };
})(window.photoeditor);
