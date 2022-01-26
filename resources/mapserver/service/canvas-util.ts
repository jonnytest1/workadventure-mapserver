import { Canvas } from 'canvas';

export class CanvasUtil {


    static getColorMap(canvas: Canvas) {
        const context = canvas.getContext("2d");
        let imageData = context.getImageData(0, 0, canvas.width, canvas.height);

        const colorMap: Record<string, number> = {};
        for (let j = 0; j < imageData.height; j++) {
            for (let i = 0; i < imageData.width; i++) {
                var index = ((i * 4) * imageData.width) + (j * 4);

                let rgba = {
                    red: imageData.data[index],
                    green: imageData.data[index + 1],
                    blue: imageData.data[index + 2],
                    alpha: imageData.data[index + 3]
                };
                const rgbaStr = `rgb(${rgba.red},${rgba.green},${rgba.blue})`;
                if (!colorMap[rgbaStr]) {
                    colorMap[rgbaStr] = 0;
                }
                colorMap[rgbaStr]++;
            }
        }
        return colorMap;
    }
}