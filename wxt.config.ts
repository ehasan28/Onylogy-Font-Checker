import { defineConfig } from 'wxt';

export default defineConfig({
  modules: ['@wxt-dev/module-react'],
  manifest: {
    name: 'Onylogy Font Checker',
    description:
      'Onylogy Font Checker by Ehasanul Haque — live font inspector, pin-on-click cards, hierarchy detection, source attribution, accessibility analysis, and developer exports.',
    version: '0.2.0',
    permissions: ['activeTab', 'scripting', 'storage'],
    action: {
      default_title: 'Onylogy Font Checker',
    },
    // Browser-wide keyboard shortcut to toggle inspect mode on the current
    // tab from anywhere. User can remap at chrome://extensions/shortcuts.
    commands: {
      'toggle-inspect': {
        suggested_key: {
          default: 'Alt+Shift+F',
          mac: 'Alt+Shift+F',
          windows: 'Alt+Shift+F',
          linux: 'Alt+Shift+F',
        },
        description: 'Toggle Onylogy Font Checker inspect mode',
      },
    },
  },
  // Vivaldi is Chromium-based and runs MV3 extensions natively.
  // wxt looks up the binary by browser key when `npm run dev` starts.
  webExt: {
    chromiumArgs: ['--user-data-dir=./.wxt/vivaldi-profile'],
    binaries: {
      chrome: '/Applications/Vivaldi.app/Contents/MacOS/Vivaldi',
    },
  },
  vite: () => ({
    css: {
      postcss: './postcss.config.cjs',
    },
  }),
});
