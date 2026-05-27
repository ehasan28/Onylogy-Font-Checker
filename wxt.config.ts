import { defineConfig } from 'wxt';

export default defineConfig({
  modules: ['@wxt-dev/module-react'],
  manifest: {
    name: 'Onylogy Font Checker',
    // Chrome Web Store caps the manifest description at 132 characters.
    // Long-form copy lives in the Dashboard listing (see STORE-LISTING.md).
    description:
      'Identify any font on any website. Inspect typography, detect Google Fonts, run readability checks, export design tokens.',
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
