import * as bodySegmentation from "@tensorflow-models/body-segmentation";

const createSegmenter = async () => {
  const model = bodySegmentation.SupportedModels.MediaPipeSelfieSegmentation;
  const segmenterConfig = {
    runtime: "mediapipe",
    solutionPath: "https://cdn.jsdelivr.net/npm/@mediapipe/selfie_segmentation",
    modelType: "general",
  };
  return bodySegmentation.createSegmenter(model, segmenterConfig);
};

class VideoBackground {
  #animationId;
  #segmenter;

  getSegmenter = async () => {
    if (!this.#segmenter) {
      this.#segmenter = await createSegmenter();
    }
    return this.#segmenter;
  };

  stop = () => {
    cancelAnimationFrame(this.#animationId);
    console.log("stop effects");
  };

  blur = async (canvas, video) => {
    const foregroundThreshold = 0.5;
    const edgeBlurAmount = 15;
    const flipHorizontal = false;
    const blurAmount = 5;
    const segmenter = await this.getSegmenter();
    console.log("blurBg -> video size", video.videoWidth, video.videoHeight);
    const processFrame = async () => {
      const segmentation = await segmenter.segmentPeople(video);
      await bodySegmentation.drawBokehEffect(
        canvas,
        video,
        segmentation,
        foregroundThreshold,
        blurAmount,
        edgeBlurAmount,
        flipHorizontal
      );
      this.#animationId = requestAnimationFrame(processFrame);
    };
    this.#animationId = requestAnimationFrame(processFrame);
  };

  remove = async (canvas, video) => {
    const context = canvas.getContext("2d");
    const segmenter = await this.getSegmenter();
    console.log("removeBg -> video size", video.videoWidth, video.videoHeight);
    const processFrame = async () => {
      context.drawImage(video, 0, 0);
      const segmentation = await segmenter.segmentPeople(video);
      const coloredPartImage = await bodySegmentation.toBinaryMask(
        segmentation
      );
      const imageData = context.getImageData(
        0,
        0,
        video.videoWidth,
        video.videoHeight
      );
      // [R,G,B,A,R,G,B,A...]. below for loop iterate through alpha channel
      for (let i = 3; i < imageData.data.length; i += 4) {
        // By default background pixels alpha will be 255.
        if (coloredPartImage.data[i] === 255) {
          imageData.data[i] = 0; // this is a background pixel's alpha. Make it fully transparent
        }
      }
      await bodySegmentation.drawMask(canvas, imageData);
      this.#animationId = requestAnimationFrame(processFrame);
    };
    this.#animationId = requestAnimationFrame(processFrame);
  };
}

const videoBackground = new VideoBackground();

export default videoBackground;
