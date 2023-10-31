module.exports = {
  title: 'mmCMV',
  tagline: 'Example repo',
  url: 'https://mm-cmv.com',
  baseUrl: '/',
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
          customCss: [],
        },
      },
    ],
  ],
};
