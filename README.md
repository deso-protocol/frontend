# BitClout Frontend

This is the repository for the reference BitClout Angular app. It serves as an
interface that allows users to interact with the data on the BitClout blockchain.
## Getting started
Bitclout frontend-ui depends on node Node.js, currently tested on v14.16.1.

On MacOs  and Linux based systems, the most reliable way to install Node is to use the [Node Version Manager](https://github.com/nvm-sh/nvm) which allows you to have multiple node versions installed at once just incase you have other applications that depends on different versions.

To install Node on Windows Use the official [Nodejs.org](https://nodejs.org/en/download/) site.

To verify that Node.js is installed properly, open a terminal (command prompt) and run ```node --version```
Make sure you have build tools installed 
```npm install --global --production windows-build-tools```.


To install NVM for OSX/Linux, execute the following command in your terminal:

```
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.38.0/install.sh | bash
nvm install v14
nvm use v14
```
Note: If nvm fails to install due to: " Command 'nvm' not found." 
Restart your terminal or execute `source ~/.nvm/nvm.sh` to refresh the available commands in your system path




After installing node, you can clone the repo:

```
git clone https://github.com/bitclout/frontend.git
cd frontend
```

## Development server

Run `npm install` to install all dependencies. Then `npm run start` for a dev server. Navigate to `http://localhost:4200/`. The app will automatically reload if you change any of the source files.

## Code scaffolding

Run `npm run generate component component-name` to generate a new component. You can also use `npm run generate directive|pipe|service|class|guard|interface|enum|module`.

## Build

After proper configuration of `environment.ts` and `environment.prod.ts`, run `npm run build` to build the project. The build artifacts will be stored in the `dist/` directory. Use `npm run build_prod` for a production build.
