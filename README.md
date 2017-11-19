# Khepri

Khepri is a process manager similar to foreman, but built as an electron-based gui app.

![Screenshot](/public/assets/images/screenshot.png?raw=true&cache=false)

## Prerequisites

You will need the following things properly installed on your computer.

* [Git](http://git-scm.com/)
* [Node.js](http://nodejs.org/)
* [Yarn](https://yarnpkg.com/)

## Installation

* `git clone git://github.com/mnutt/khepri.git`
* `cd khepri`
* `yarn`
* `bower install`
* `yarn start`

## Running / Development

* `ember electron`
* On Mac: edit ~/Library/Application Support/khepri/data/config.json to add your apps.

### Running Tests

* `ember test`
* `ember test --server`

### Building

* `ember build` (development)
* `ember build --environment production` (production)

### Packaging

* Build packages: `ember electron:package`
* Build archives/installers: `ember electron:make`

## Acknowledgements

Khepri was inspired by [Monu](https://github.com/maxogden/monu) and uses portions of its RPC and process group code.

## License

See LICENSE.md
