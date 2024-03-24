const webpack = require('webpack');

// We need to make a custom Docusaurus plugin so that we can support
// the "node:fs" imports within the @zarrita/storage package.
// Reference: https://github.com/vercel/next.js/issues/28774#issuecomment-1264555395
// Reference: https://github.com/manzt/zarrita.js/blob/fba5325bb83949aa5a5f036841653e183efc4ee1/packages/storage/src/fs.ts#L1
module.exports = function(context, options) {
  return {
    name: 'use-coordination-docusaurus-plugin',
    configureWebpack(config, isServer, utils) {
      return {
        resolve: {
          fallback: {
            fs: false,
            path: false,
            util: false,
            child_process: false,
          },
        },
      };
    },
  };
};