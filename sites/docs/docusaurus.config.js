const path = require('path');
module.exports = {
  title: 'mmCMV',
  tagline: 'Example repo',
  url: 'https://keller-mark.github.io',
  baseUrl: '/mm-cmv/',
  onBrokenLinks: 'warn',
  onBrokenMarkdownLinks: 'warn',
  favicon: 'img/favicon.ico',
  trailingSlash: true,
  organizationName: 'keller-mark', // Usually your GitHub org/user name.
  projectName: 'mm-cmv', // Usually your repo name.
  themes: [],
  themeConfig: {
    colorMode: {
      defaultMode: 'light',
      respectPrefersColorScheme: true,
      disableSwitch: false,
    },
    navbar: {
      title: 'mmCMV',
      items: [
        {
          type: 'doc',
          docId: 'introduction',
          label: 'Docs',
          position: 'left',
        },
        {
          href: 'https://github.com/keller-mark/mm-cmv',
          position: 'right',
          className: 'header-github-link',
          'aria-label': 'GitHub repository',
        },
      ]
    }
  },
  presets: [
    [
      '@docusaurus/preset-classic',
      {
        docs: {
          sidebarPath: require.resolve('./sidebars.js'),
          editUrl: 'https://github.com/keller-mark/mm-cmv/edit/main/sites/docs/',
        },
        blog: {
          showReadingTime: true,
        },
        theme: {
          customCss: [
            require.resolve('./src/css/custom.css'),
          ],
        },
      },
    ],
  ],
};
