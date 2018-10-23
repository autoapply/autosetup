FROM node:alpine

COPY . /tmp/src/

RUN cd /tmp/src \
    && yarn \
    && yarn global add "file:/tmp/src" \
    && adduser -D -g autosetup autosetup

USER autosetup
WORKDIR /home/autosetup
ENTRYPOINT [ "autosetup" ]
