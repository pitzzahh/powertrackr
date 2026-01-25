// prettier.config.mjs
import * as prettierPluginOxc from "@prettier/plugin-oxc";

/**
 * @see https://prettier.io/docs/configuration
 * @type {import("prettier").Config}
 */
const config = {
  plugins: [prettierPluginOxc],
};

export default config;
