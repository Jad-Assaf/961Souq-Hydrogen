module.exports = {
  root: true,
  extends: ['@remix-run/eslint-config', 'plugin:hydrogen/recommended'],
  rules: {
    'import/no-unresolved': ['error', {ignore: ['^virtual:', '^~/']}],
  },
};
