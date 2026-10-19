((editor) => {
  editor.loadimage = (url) =>
    new Promise((resolve, reject) => {
      const image = new Image();
      image.crossOrigin = "anonymous";
      image.onload = () => resolve(image);
      image.onerror = () => reject(new Error("The image could not be opened."));
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

  editor.exportimage = async ({source, filter, stickers}) => {
    const width = editor.imagewidth(source);
    const height = editor.imageheight(source);
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");
    canvas.width = width;
    canvas.height = height;
    context.filter = filter;
    context.drawImage(source, 0, 0, width, height);
    context.filter = "none";
    for (const item of stickers) {
      const url = editor.imageurl(item.sticker, "raw");
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
