# BitClout Frontend
This is the repository for the reference BitClout Angular app. It serves as an
interface that allows users to interact with the data on the BitClout blockchain.
## Getting started
Bitclout frontend-ui depends on node Node.js, currently tested on v14.16.1.

On MacOs  and Unbuntu, the most reliable way to install Node is to use the [Node Version Manager](https://github.com/nvm-sh/nvm) which allows you to have multiple node versions installed at once just incase you have other applications that depends on different versions.

To install NVM for OSX/Linux, add the following command in your terminal:

```
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.38.0/install.sh | bash
nvm install v14
nvm use v14
```
Note: If nvm fails to install due to: " Command 'nvm' not found." 
Restart your terminal OR use command ```source ~/.nvm/nvm.sh``` (this will refresh the available commands in your system path).

After installing node, you can clone the repo:

```
git clone https://github.com/bitclout/frontend.git
cd frontend
```
Before launching the UI you must install the npm packages:

```
npm install
```


## Development server
Once all the packages have been installed you can start the development server by running:


```
npm start
```
or

Run `ng serve` for a dev server. Navigate to `http://localhost:4200/`. The app will automatically reload if you change any of the source files.

## Code scaffolding

Run `ng generate component component-name` to generate a new component. You can also use `ng generate directive|pipe|service|class|guard|interface|enum|module`.

## Build

After proper configuration of `environment.ts` and `environment.prod.ts`, run `ng build` to build the project. The build artifacts will be stored in the `dist/` directory. Use the `--prod` flag for a production build.
