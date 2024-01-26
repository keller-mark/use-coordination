const path = require('path');
module.exports = {
  title: 'use-coordination',
  tagline: 'Example repo',
  url: 'https://keller-mark.github.io',
  baseUrl: '/use-coordination/',
  onBrokenLinks: 'warn',
  onBrokenMarkdownLinks: 'warn',
  favicon: 'img/favicon.ico',
  trailingSlash: true,
  organizationName: 'keller-mark', // Usually your GitHub org/user name.
  projectName: 'use-coordination', // Usually your repo name.
  themes: [],
  themeConfig: {
    colorMode: {
      defaultMode: 'light',
      respectPrefersColorScheme: true,
      disableSwitch: false,
    },
    navbar: {
      title: 'use-coordination',
      items: [
        {
          type: 'doc',
          docId: 'introduction',
          label: 'Docs',
          position: 'left',
        },
        {
          type: 'doc',
          docId: 'examples',
          label: 'Examples',
          position: 'left',
        },
        {
          href: 'https://github.com/keller-mark/use-coordination',
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
          editUrl: 'https://github.com/keller-mark/use-coordination/edit/main/sites/docs/',
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
