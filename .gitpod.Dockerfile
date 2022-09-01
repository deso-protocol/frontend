FROM gitpod/workspace-full:latest

RUN bash -c 'NODE_VERSION="14.15.5" \
    && source $HOME/.nvm/nvm.sh && nvm install $NODE_VERSION \
    && nvm use $NODE_VERSION && nvm alias default $NODE_VERSION \
    && npm -g install npm@7'

RUN echo "nvm use default &>/dev/null" >> ~/.bashrc.d/51-nvm-fix