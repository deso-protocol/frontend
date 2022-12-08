![DeSo Logo](src/assets/deso/camelcase_logo.svg)

# About DeSo
DeSo is a blockchain built from the ground up to support a fully-featured
social network. Its architecture is similar to Bitcoin, only it supports complex
social network data like profiles, posts, follows, creator coin transactions, and
more.

[Read about the vision](https://docs.deso.org/#the-ultimate-vision)

# About This Repo
Documentation for this repo lives on docs.deso.org. Specifically, the following
docs should give you everything you need to get started:
* [DeSo Code Walkthrough](https://docs.deso.org/code/walkthrough)
* [Setting Up Your Dev Environment](https://docs.deso.org/code/dev-setup)
* [Making Your First Changes](https://docs.deso.org/code/making-your-first-changes)

### Updating Versions

v<DESO_VERSION>.<PATCH_VERSION>

ex - v2.1.1.0 is deso version v2.1.1 and patch version 0 from our changes

By default, new patch version is tagged each time a PR is merged to the main branch. The major and minor version are in the `version.txt` file in this repo. Update this file to tag a new major or minor version.

### Deploying Service

Go to Actions > Deploy [(link)](https://github.com/TheBitgram/frontend/actions/workflows/dispatch_app_terraform.yml) and click Run workflow. Enter the version tag and environment to deploy to.

# Start Coding
The quickest way to contribute changes to the BitClout Frontend is the following these steps:

1. Open frontend repo in Gitpod

[![Open in Gitpod](https://gitpod.io/button/open-in-gitpod.svg)](https://gitpod.io/#https://github.com/deso-protocol/frontend)

You can use any repo / branch URL and just prepend `https://gitpod.io/#` to it.

2. If needed, login to your github account

3. Set the correct `lastLocalNodeV2`  to `"https://api.tijn.club"` in your browser Local Storage for the gitpod preview URL

4. Create a new branch to start working

To commit / submit a pull reqest from gitpod, you will need to give gitpod additional permissions to your github account: `public_repo, read:org, read:user, repo, user:email, workflow` which you can do on the [GitPod Integrations page](https://gitpod.io/integrations).

