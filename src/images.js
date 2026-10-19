((editor) => {
  editor.loadimage = (url) =>
    new Promise((resolve, reject) => {
      const image = new Image();
      image.crossOrigin = "anonymous";
      image.onload = () => resolve(image);
      image.onerror = () => reject(new Error("The image could not be opened."));
      image.src = url;
    });

  /*//////////////////////////////////////////////////////////////////////*/

  editor.rotateimage = (image, rotation) => {
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
  };

  /*//////////////////////////////////////////////////////////////////////*/

  editor.cropimage = (image, crop, rotation, zoom = 1, x = 50, y = 50) => {
    const rotated = editor.rotateimage(image, rotation);
    const ratio = editor.cropratio(crop, image.naturalWidth, image.naturalHeight, rotation);
    const rotatedratio = rotated.width / rotated.height;
    const cropwidth = (rotatedratio > ratio ? rotated.height * ratio : rotated.width) / zoom;
    const cropheight = (rotatedratio > ratio ? rotated.height : rotated.width / ratio) / zoom;
    const roomx = Math.max(0, rotated.width - cropwidth);
    const roomy = Math.max(0, rotated.height - cropheight);
    return {
      rotated,
      cropwidth,
      cropheight,
      left: roomx * Math.max(0, Math.min(100, x)) / 100,
      top: roomy * Math.max(0, Math.min(100, y)) / 100
    };
  };

  editor.exportimage = async ({photo, source, rotation, crop, cropzoom, cropx, cropy, filter, stickers}) => {
    const image = source || (await editor.loadimage(photo.local));
    const cropdata = editor.cropimage(image, crop, rotation, cropzoom, cropx, cropy);
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");
    canvas.width = Math.max(1, Math.round(cropdata.cropwidth));
    canvas.height = Math.max(1, Math.round(cropdata.cropheight));
    context.filter = filter;
    context.drawImage(
      cropdata.rotated,
      cropdata.left,
      cropdata.top,
      cropdata.cropwidth,
      cropdata.cropheight,
      0,
      0,
      canvas.width,
      canvas.height
    );
    context.filter = "none";
    for (const item of stickers) {
      const url = editor.imageurl(item.sticker, "raw");
      if (!url) continue;
      const stickerimage = await editor.loadimage(url);
      const width = (canvas.width * item.size) / 100;
      const height = (width * stickerimage.naturalHeight) / stickerimage.naturalWidth;
      context.save();
      context.translate((canvas.width * item.x) / 100, (canvas.height * item.y) / 100);
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
  };
})(window.photoeditor);
