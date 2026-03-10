import { ModuleFederationPlugin } from "@module-federation/enhanced/rspack";
import { RsdoctorRspackPlugin } from "@rsdoctor/rspack-plugin";
import { defineConfig } from "@rspack/cli";
import { HtmlRspackPlugin } from "@rspack/core";
import path from "path";

const isDev = process.env.NODE_ENV !== "production";
const root = process.cwd();

const REMOTE_AUTH_URL = process.env["REMOTE_AUTH_URL"] ?? "http://localhost:3001";
const REMOTE_DASHBOARD_URL = process.env["REMOTE_DASHBOARD_URL"] ?? "http://localhost:3002";

export default defineConfig({
  mode: isDev ? "development" : "production",

  entry: "./src/index.ts",

  output: {
    path: path.resolve(root, "dist"),
    publicPath: "/",
    clean: true,
  },

  optimization: {
    runtimeChunk: "single",
    splitChunks: {
      chunks: "all",
      minSize: 20_000,
      cacheGroups: {
        "vendor-forms": {
          test: /[\\/]node_modules[\\/](react-hook-form|@hookform|zod)[\\/]/,
          name: "vendor.forms",
          chunks: "all",
          priority: 30,
          enforce: true,
        },
        "vendor-common": {
          test: /[\\/]node_modules[\\/]/,
          name: "vendor.common",
          chunks: "all",
          minChunks: 2,
          priority: 5,
          reuseExistingChunk: true,
        },
      },
    },
  },

  resolve: {
    extensions: [".ts", ".tsx", ".js", ".jsx"],
    alias: {
      "@components": path.resolve(root, "src/components"),
      "@hooks": path.resolve(root, "src/hooks"),
      "@utils": path.resolve(root, "src/utils"),
      "@types": path.resolve(root, "src/types"),
      "@store": path.resolve(root, "src/store"),
      "@theme": path.resolve(root, "src/theme"),
      "@router": path.resolve(root, "src/router"),
      "@declarations": path.resolve(root, "src/declarations"),
    },
  },

  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: {
          loader: "builtin:swc-loader",
          options: {
            jsc: {
              parser: { syntax: "typescript", tsx: true },
              transform: { react: { runtime: "automatic" } },
              target: "es2022",
            },
          },
        },
        type: "javascript/auto",
      },
    ],
  },

  plugins: [
    new HtmlRspackPlugin({
      template: path.resolve(root, "public/index.html"),
    }),

    new ModuleFederationPlugin({
      name: "host",
      dts: false,
      remotes: {
        authApp: `authApp@${REMOTE_AUTH_URL}/remoteEntry.js`,
        dashboardApp: `dashboardApp@${REMOTE_DASHBOARD_URL}/remoteEntry.js`,
      },

      shared: {
        react: {
          singleton: true,
          requiredVersion: "^19.0.0",
          eager: false,
        },
        "react-dom": {
          singleton: true,
          requiredVersion: "^19.0.0",
          eager: false,
        },
        "react-router-dom": {
          singleton: true,
          requiredVersion: "^7.0.0",
          eager: false,
        },
        "@chakra-ui/react": {
          singleton: true,
          requiredVersion: "^3.0.0",
          eager: false,
        },
        "@emotion/react": {
          singleton: true,
          eager: false,
        },
        "@emotion/styled": {
          singleton: true,
          eager: false,
        },
        zustand: {
          singleton: true,
          requiredVersion: "^5.0.0",
          eager: false,
        },
      },
    }),

    ...(process.env["RSDOCTOR"] === "true" ? [new RsdoctorRspackPlugin({ disableClientServer: false })] : []),
  ],

  devServer: {
    port: 3000,
    hot: true,
    historyApiFallback: true,
    static: { directory: path.resolve(root, "public") },
    headers: { "Access-Control-Allow-Origin": "*" },
  },
});
