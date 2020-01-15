FROM node:12-alpine

RUN apk add --no-cache openssh-client

COPY . /tmp/src/

RUN yarn global add "file:/tmp/src" \
    && rm -rf /tmp/src \
    && adduser -D -g autosetup autosetup

USER autosetup
WORKDIR /home/autosetup
ENTRYPOINT [ "autosetup" ]
