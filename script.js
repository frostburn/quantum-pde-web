const canvas = document.getElementById('canvas');
const canvasWidth  = canvas.width;
const canvasHeight = canvas.height;
const colorDim = 4;

const ctx = canvas.getContext('2d');
const imageData = ctx.getImageData(0, 0, canvasWidth, canvasHeight);
const data = imageData.data;


const complexDim = 2;
const width = Math.floor(canvasWidth / 2);
const height = Math.floor(canvasHeight / 2);

let psi = new Float64Array(width*height*complexDim);
const potential = new Float64Array(width*height);


function laplacianHex(psi) {
    const result = new Float64Array(width*height*complexDim);
    for (let k = 0; k < complexDim; ++k) {
        const c = k * height * width;
        for (let i = 1; i < width - 1; i++) {
            let topLeft, topRight, top, bottom, bottomLeft, bottomRight;
            for (let j = 1; j < height - 1; j++) {
                top = psi[i + width * (j-1) + c];
                bottom = psi[i + width * (j+1) + c];
                if (i % 2) {
                    topLeft = psi[i-1 + width * (j-1) + c];
                    bottomLeft = psi[i-1 + width * j + c];
                    topRight = psi[i+1 + width * (j-1) + c];
                    bottomRight = psi[i+1 + width * j + c];
                } else {
                    topLeft = psi[i-1 + width * j + c];
                    bottomLeft = psi[i-1 + width * (j+1) + c];
                    topRight = psi[i+1 + width * j + c];
                    bottomRight = psi[i+1 + width * (j+1) + c];
                }
                const index = i + width * j + c;
                result[index] = (top + bottom) * 3 / 16.0 + (topLeft + topRight + bottomLeft + bottomRight) / 8.0 - psi[index] * 7.0 / 8.0;
            }
        }
    }
    return result;
}

for (let i = 0; i < width; ++i) {
    for (let j = 0; j < height; ++j) {
        const x = 4*i / width - 2;
        const y = (2*j + 1 - i%2) / height - 1;
        const envelope = Math.exp(-40*(Math.pow((x+1), 2)+Math.pow(y*0.5, 2))) * 2000;
        psi[i + j * width] = envelope * Math.cos(-x*45);
        psi[i + j * width + width*height] = envelope * Math.sin(-x*45);
        potential[i + j * width] = Math.exp(-Math.pow(x*20, 6)) * (1 - Math.exp(-Math.pow((y-0.25)*20, 6))) * (1 - Math.exp(-Math.pow((y+0.25)*20, 6)));
    }
}

function step() {
    // Forward Euler
    // const l = laplacianHex(psi);
    // for (let i = 0; i < width; ++i) {
    //     for (let j = 0; j < height; ++j) {
    //         const index = i + width * j;
    //         psi[index] += l[index + width * height] * 0.01 - potential[index] * psi[index + width * height] * 0.01;
    //         psi[index + width * height] -= l[index] * 0.01 - potential[index] * psi[index] * 0.01;
    //     }
    // }

    // Backward Euler
    const dt = 0.2;
    let psi_new = new Float64Array(width*height*complexDim);
    for (let i = 0; i < width*height*complexDim; i++) {
        psi_new[i] = psi[i];
    }
    for (let k = 0; k < 3; k++) {
        const l = laplacianHex(psi_new);
        for (let i = 0; i < width; ++i) {
            for (let j = 0; j < height; ++j) {
                const index = i + width * j;
                psi_new[index] = psi[index] + (l[index + width * height] - potential[index] * psi_new[index + width * height]) * dt;
                psi_new[index + width * height] = psi[index + width * height] + (potential[index] * psi_new[index] - l[index]) * dt;
            }
        }
    }
    psi = psi_new;
    for (let i = 0; i < width; ++i) {
        for (let j = 0; j < height; ++j) {
            const x = 2*i;
            const y = 2*j + 1 - i%2;
            for (let dx = 0; dx < 2; dx++) {
                for (let dy = 0; dy < 2; dy++) {
                    const index = ((y+dy) * canvasWidth + x+dx) * colorDim;
                    data[index] = psi[i + width * j] * 0.2;
                    data[index + 1] = Math.sqrt(Math.pow(psi[i + width * j], 2) + Math.pow(psi[i + width * j + width*height], 2));
                    data[index + 2] = psi[i + width * j + width*height] * 0.2;
                    data[index + 3] = 255;
                }
            }
        }
    }
    // for (let y = 0; y < canvasHeight; ++y) {
    //     for (let x = 0; x < canvasWidth; ++x) {
    //     }
    // }
    ctx.putImageData(imageData, 0, 0);
}

step();
window.setInterval(step, 0);
