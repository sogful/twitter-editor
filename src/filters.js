((editor) => {
  editor.filters = [
    {name: "No Filter", initial: 100, brightness: 1, contrast: 1, saturation: 1, sepia: 0, hue: 0, gray: 0},
    {name: "Radiant", initial: 80, brightness: 1.035, contrast: 1.1, saturation: 1.2, sepia: 0.02, hue: 0, gray: 0},
    {name: "Positive", initial: 80, brightness: 1.04, contrast: 1.04, saturation: 1.14, sepia: 0, hue: 0, gray: 0},
    {name: "Warm", initial: 80, brightness: 1.02, contrast: 1.02, saturation: 1.13, sepia: 0.22, hue: -8, gray: 0},
    {name: "Breeze", initial: 80, brightness: 1.05, contrast: 0.98, saturation: 0.98, sepia: 0.03, hue: 12, gray: 0},
    {name: "Glow", initial: 80, brightness: 1.12, contrast: 1.06, saturation: 1.04, sepia: 0.03, hue: 0, gray: 0},
    {name: "Golden", initial: 80, brightness: 1.04, contrast: 1.05, saturation: 1.22, sepia: 0.28, hue: -10, gray: 0},
    {name: "Fame", initial: 80, brightness: 1.02, contrast: 1.16, saturation: 0.82, sepia: 0.02, hue: 0, gray: 0},
    {name: "Stark", initial: 80, brightness: 1, contrast: 1.2, saturation: 1, sepia: 0, hue: 0, gray: 1}
  ];

  /*//////////////////////////////////////////////////////////////////////*/

  editor.filtercss = (name, intensity, enhanced) => {
    const preset = editor.filters.find((item) => item.name === name) || editor.filters[0];
    const amount = Math.max(0, Math.min(100, intensity)) / 100;
    const brightness = 1 + (preset.brightness - 1) * amount;
    const contrast = 1 + (preset.contrast - 1) * amount;
    const saturation = 1 + (preset.saturation - 1) * amount;
    const sepia = preset.sepia * amount;
    const hue = preset.hue * amount;
    const gray = preset.gray * amount;
    const enhancement = enhanced ? " brightness(1.05) contrast(1.08) saturate(1.04)" : "";
    return `brightness(${brightness}) contrast(${contrast}) saturate(${saturation}) sepia(${sepia}) hue-rotate(${hue}deg) grayscale(${gray})${enhancement}`;
  };

  editor.cropratio = (name, width, height, rotation) => {
    if (name === "Square") return 1;
    if (name === "Wide") return 1.91;
    return Math.abs(rotation % 180) === 90 ? height / width : width / height;
  };
})(window.photoeditor);
