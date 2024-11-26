document.getElementById("imageForm").addEventListener("submit", function (e) {
  e.preventDefault();

  const fileInput = document.getElementById("imageInput");
  const operation = document.getElementById("operation").value;
  const originalCanvas = document.getElementById("originalCanvas");
  const resultCanvas = document.getElementById("resultCanvas");

  if (fileInput.files.length === 0) {
    alert("Please upload an image!");
    return;
  }

  const file = fileInput.files[0];
  const reader = new FileReader();

  reader.onload = function (event) {
    const img = new Image();
    img.src = event.target.result;

    img.onload = function () {
      const originalContext = originalCanvas.getContext("2d");
      const resultContext = resultCanvas.getContext("2d");

      originalCanvas.width = img.width;
      originalCanvas.height = img.height;
      resultCanvas.width = img.width;
      resultCanvas.height = img.height;

      originalContext.drawImage(img, 0, 0);

      const imageData = originalContext.getImageData(
        0,
        0,
        img.width,
        img.height
      );
      const transformedData = resultContext.createImageData(
        img.width,
        img.height
      );

      if (operation === "grayscale") {
        grayscaleTransform(imageData, transformedData);
      } else if (operation === "blur") {
        // Radius Gaussian blur
        const radius = 20;
        const sigma = radius / 3;
        blur(imageData, radius, sigma);

        transformedData.data.set(imageData.data);
      }

      resultContext.putImageData(transformedData, 0, 0);
    };
  };

  reader.readAsDataURL(file);
});

function grayscaleTransform(input, output) {
  for (let i = 0; i < input.data.length; i += 4) {
    const r = input.data[i];
    const g = input.data[i + 1];
    const b = input.data[i + 2];

    // Grayscale formula
    const avg = 0.3 * r + 0.59 * g + 0.11 * b;

    output.data[i] = output.data[i + 1] = output.data[i + 2] = avg;
    output.data[i + 3] = input.data[i + 3];
  }
}

function blur(imageData, radius, sigma) {
  const data = imageData.data;
  const w = imageData.width;
  const h = imageData.height;

  sigma = sigma || radius / 3;
  const a = 1 / (sigma * Math.sqrt(2 * Math.PI));
  const b = -1 / (2 * sigma * sigma);

  const kernel = [];
  let kernelSum = 0;

  // Generate Gaussian kernel
  for (let i = -radius; i <= radius; i++) {
    const value = a * Math.exp(b * i * i);
    kernel.push(value);
    kernelSum += value;
  }

  // Normalize kernel
  for (let i = 0; i < kernel.length; i++) {
    kernel[i] /= kernelSum;
  }

  const tempData = new Uint8ClampedArray(data);

  // Horizontal blur
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      let r = 0,
        g = 0,
        b = 0,
        a = 0;
      let weightSum = 0;

      for (let k = -radius; k <= radius; k++) {
        const nx = x + k;
        if (nx >= 0 && nx < w) {
          const index = (y * w + nx) * 4;
          const weight = kernel[k + radius];

          r += tempData[index] * weight;
          g += tempData[index + 1] * weight;
          b += tempData[index + 2] * weight;
          a += tempData[index + 3] * weight;

          weightSum += weight;
        }
      }

      const index = (y * w + x) * 4;
      data[index] = Math.round(r / weightSum);
      data[index + 1] = Math.round(g / weightSum);
      data[index + 2] = Math.round(b / weightSum);
      data[index + 3] = Math.round(a / weightSum);
    }
  }

  tempData.set(data);

  // Vertical blur
  for (let x = 0; x < w; x++) {
    for (let y = 0; y < h; y++) {
      let r = 0,
        g = 0,
        b = 0,
        a = 0;
      let weightSum = 0;

      for (let k = -radius; k <= radius; k++) {
        const ny = y + k;
        if (ny >= 0 && ny < h) {
          const index = (ny * w + x) * 4;
          const weight = kernel[k + radius];

          r += tempData[index] * weight;
          g += tempData[index + 1] * weight;
          b += tempData[index + 2] * weight;
          a += tempData[index + 3] * weight;

          weightSum += weight;
        }
      }

      const index = (y * w + x) * 4;
      data[index] = Math.round(r / weightSum);
      data[index + 1] = Math.round(g / weightSum);
      data[index + 2] = Math.round(b / weightSum);
      data[index + 3] = Math.round(a / weightSum);
    }
  }
}
