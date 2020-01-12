module.exports = {
  lintOnSave: false,
  pages: {
    index: 'src/renderer/main.js'
  },
  pluginOptions: {
    electronBuilder: {
      mainProcessFile: 'src/main/index.js',
      mainProcessWatch: ['src/main', 'public'],
      outputDir: 'dist',
    }
  }
}
