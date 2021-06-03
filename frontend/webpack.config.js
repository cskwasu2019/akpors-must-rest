const path = require('path')
const TerserWebpackPlugin = require('terser-webpack-plugin')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const MiniCssExtractPlugin = require('mini-css-extract-plugin')
const CssMinimizerPlugin = require('css-minimizer-webpack-plugin')
const { CleanWebpackPlugin } = require('clean-webpack-plugin')
const ejs = require('ejs')
const colors = require('tailwindcss/colors')
const package = require('./package.json')
const WebpackPwaManifest = require('webpack-pwa-manifest')
const WebpackRemoveEmptyScripts = require('webpack-remove-empty-scripts')
const { GenerateSW } = require('workbox-webpack-plugin')

module.exports = function () {
  const mode = process.env.NODE_ENV || 'development'
  const isProd = mode == 'production'
  const styleLoader = isProd ? MiniCssExtractPlugin.loader : 'style-loader'

  const appBGColor = colors.trueGray['900']

  return {
    mode,
    entry: {
      app: './src/index.js',
      style: './src/css/main.css',
    },
    output: {
      path: path.join(__dirname, 'dist'),
      publicPath: '/',
      filename: 'js/[name]-[contenthash].js',
    },
    module: {
      rules: [
        {
          test: /\.css/i,
          use: [styleLoader, 'css-loader', 'postcss-loader'],
        },
        {
          test: /\.html/i,
          loader: 'html-loader',
          options: {
            preprocessor: (content) => {
              return ejs.render(content, { package })
            },
          },
        },
        {
          test: /\.(png|jpg)$/,
          include: path.join(__dirname, 'assets'),
          type: 'asset/resource',
          resourceQuery: { not: [/inline/] },
          generator: {
            filename: 'images/[contenthash][ext]',
          },
        },
        {
          test: /\.(svg|eot|ttf|woff2?)$/,
          include: path.join(__dirname, 'assets', 'fonts'),
          type: 'asset/resource',
          generator: {
            filename: 'fonts/[contenthash][ext]',
          },
        },
        {
          resourceQuery: /inline/,
          type: 'asset/inline',
        },
      ],
    },
    devServer: {
      proxy: {
        '/api': 'http://localhost:5000',
      },
    },
    optimization: {
      minimize: true,
      minimizer: [
        new TerserWebpackPlugin({
          extractComments: false,
        }),
        new CssMinimizerPlugin({
          minimizerOptions: {
            preset: [
              'default',
              {
                discardComments: { removeAll: true },
              },
            ],
          },
        }),
        '...',
      ],
    },
    plugins: [
      new CleanWebpackPlugin(),
      new WebpackRemoveEmptyScripts(), // remove empty scripts file created from style chunk
      new MiniCssExtractPlugin({
        filename: 'css/style-[contenthash].css',
      }),
      new WebpackPwaManifest({
        name: package.displayName,
        description: package.description,
        background_color: appBGColor,
        theme_color: appBGColor,
        display: 'standalone',
        inject: true,
        ios: true,
        orientation: 'portrait',
        icons: [
          {
            src: path.join(__dirname, 'icon.png'),
            size: [48, 72, 96, 144, 168, 192, 256, 512],
            destination: 'images/icons',
            ios: true,
          },
          {
            src: path.join(__dirname, 'icon.png'),
            size: '512x512',
            purpose: 'maskable',
            destination: 'images/icons',
          },
        ],
      }),
      new HtmlWebpackPlugin({
        template: 'src/index.html',
        filename: 'index.html',
      }),
      new HtmlWebpackPlugin({
        template: 'src/docs.html',
        filename: 'docs.html',
        excludeChunks: ['app'],
      }),
      new HtmlWebpackPlugin({
        template: 'src/404.html',
        filename: '404.html',
        excludeChunks: ['app'],
      }),
      new GenerateSW({
        exclude: [/(404|docs)\.html$/],
        skipWaiting: true,
      }),
    ],
  }
}
