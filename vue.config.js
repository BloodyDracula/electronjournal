module.exports = {
    configureWebpack: {
        resolve: {
            alias: {
                vue$: 'vue/dist/vue.esm-bundler.js', // Указываем правильную сборку Vue
            },
        },
    },
};