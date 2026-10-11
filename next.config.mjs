const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "";
export default {
  output: "export", basePath, images: { unoptimized: true }, trailingSlash: true,
  webpack: (config) => {
    // Il modello gira nel browser: escludo i pezzi pensati per il server
    config.resolve.alias = { ...config.resolve.alias, sharp$: false, "onnxruntime-node$": false };
    return config;
  },
};
