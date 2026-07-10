import { defineConfig } from 'wxt';

export default defineConfig({
  modules: ['@wxt-dev/module-react'],
  // Post-process the generated manifest so any `host_permissions` value
  // WXT auto-computed from the content script's `matches` is stripped out.
  // The script is registered at runtime and injected via
  // chrome.scripting.executeScript on the active tab only — `activeTab`
  // alone is sufficient, so we publish with zero host permissions.
  // Without this, the Chrome Web Store flags the listing as "may require
  // in-depth review due to host permission" and delays publication.
  hooks: {
    'build:manifestGenerated': (_wxt, manifest) => {
      delete (manifest as { host_permissions?: unknown }).host_permissions;
    },
  },
  manifest: {
    name: 'Onylogy Font Checker',
    // Chrome Web Store caps the manifest description at 132 characters.
    // Long-form copy lives in the Dashboard listing (see STORE-LISTING.md).
    description:
      'Identify any font on any website. Inspect typography, detect Google Fonts, run readability checks, export design tokens.',
    version: '0.2.1',
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
