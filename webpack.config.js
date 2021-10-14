const fs = require("fs");
const path = require("path");
const process = require("process");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const CopyWebpackPlugin = require("copy-webpack-plugin");
const SimpleProgressWebpackPlugin = require("simple-progress-webpack-plugin");

const buildMode = process.argv[3] == "production" ? "production" : "development";
const isDevelopment = buildMode === "development";

const outDir = (() => {
  const configPath = path.resolve(process.cwd(), ".foundryconfig.json");
  const config = JSON.parse(fs.readFileSync(configPath, { throws: false }));
  return config instanceof Object && isDevelopment
    ? path.join(config.dataPath, "Data", "systems", config.systemName || "torchbearer")
    : path.join(__dirname, "dist/");
})();

module.exports = {
  context: __dirname,
  mode: buildMode,
  entry: {
    main: "./src/torchbearer.js",
  },
  plugins: [
    new MiniCssExtractPlugin({ filename: "styles/[name].css" }),
    new CopyWebpackPlugin({
      patterns: [
        { from: "system.json" },
        { from: "static/" },
        {
          from: "lang/",
          to: "lang/",
          transform: (content) => JSON.stringify(JSON.parse(content.toString())),
        },
      ],
    }),
    new SimpleProgressWebpackPlugin({ format: "compact" }),
  ],
  module: {
    rules: [
      {
        test: /\.scss$/,
        use: [
          MiniCssExtractPlugin.loader,
          {
            loader: "css-loader",
            options: {
              url: false,
              sourceMap: true,
            },
          },
          {
            loader: "sass-loader",
            options: { sourceMap: true },
          },
        ],
      },
    ],
  },
  devtool: isDevelopment ? "inline-source-map" : undefined,
  bail: !isDevelopment,
  watch: isDevelopment,
  resolve: {
    alias: {
      "@actor": path.resolve(__dirname, "src/module/actor"),
      "@conflict": path.resolve(__dirname, "src/module/conflict"),
      "@inventory": path.resolve(__dirname, "src/module/inventory"),
      "@item": path.resolve(__dirname, "src/module/item"),
      "@rolls": path.resolve(__dirname, "src/module/rolls"),
      "@scripts": path.resolve(__dirname, "src/scripts"),
    },
    extensions: [".js"],
  },
  output: {
    clean: true,
    path: outDir,
    filename: "[name].bundle.js",
  },
};
