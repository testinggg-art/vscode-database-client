const path = require('path');
const { VueLoaderPlugin } = require('vue-loader')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const isProd = process.argv.indexOf('-p') >= 0;

module.exports = [
    {
        target: "node",
        node: {
            fs: 'empty', net: 'empty', tls: 'empty',
            child_process: 'empty', dns: 'empty',
            global: true, __dirname: true
        },
        entry: ['./src/extension.ts'],
        output: {
            path: path.resolve(__dirname, 'out'),
            filename: 'extension.js',
            libraryTarget: 'commonjs2',
            // config source map sources url
            devtoolModuleFilenameTemplate: '[absoluteResourcePath]',
        },
        externals: {
            vscode: 'commonjs vscode'
        },
        resolve: {
            extensions: ['.ts', '.js']
        },
        module: { rules: [{ test: /\.ts$/, exclude: /node_modules/, use: ['ts-loader'] }] },
        optimization: { minimize: false },
        watch: !isProd,
        mode: isProd ? 'production' : 'development',
        devtool: isProd ? false : 'source-map',
    },
    {
        entry: {
            query: './src/vue/result/main.js',
            connect: './src/vue/connect/main.js',
            status: './src/vue/status/main.js'
        },
        plugins: [
            new VueLoaderPlugin(),
            new HtmlWebpackPlugin({ inject: true, template: './src/vue/common.html', chunks: ['query'], filename: 'webview/result.html' }),
            new HtmlWebpackPlugin({ inject: true, template: './src/vue/common.html', chunks: ['connect'], filename: 'webview/connect.html' }),
            new HtmlWebpackPlugin({ inject: true, template: './src/vue/common.html', chunks: ['status'], filename: 'webview/status.html' }),
        ],
        output: {
            path: path.resolve(__dirname, 'out'),
            filename: 'webview/js/[name].js'
        },
        resolve: {
            extensions: ['.vue', '.js'],
            alias: { 'vue$': 'vue/dist/vue.esm.js', '@': path.resolve('src'), }
        },
        module: {
            rules: [
                { test: /\.vue$/, loader: 'vue-loader', options: { loaders: { css: ["vue-style-loader", "css-loader"] } } },
                { test: /\.css$/, use: ["vue-style-loader", "css-loader"] },
                { test: /\.(woff2?|eot|ttf|otf)(\?.*)?$/, loader: 'url-loader', options: { limit: 80000 } }
            ]
        },
        optimization: {
            minimize: isProd,
            splitChunks: {
                cacheGroups: {
                    nodeXlsx: { name: "node-xlsx", test: /[\\/]@node-xlsx[\\/]/, chunks: "all", priority: 11 },
                    antv: { name: "antv", test: /[\\/]@antv[\\/]/, chunks: "all", priority: 10 },
                    vendor: { name: "vendor", test: /[\\/]node_modules[\\/]/, chunks: "all", priority: -1 }
                }
            }
        },
        watch: !isProd,
        mode: isProd ? 'production' : 'development',
        devtool: isProd ? false : 'source-map',
    }
];