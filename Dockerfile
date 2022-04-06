FROM node:17-alpine

RUN apk add --no-cache openssh-client

COPY . /tmp/src/

RUN yarn global add "file:/tmp/src" \
    && rm -rf /tmp/src \
    && adduser -D -u 1001 -g autosetup autosetup

USER 1001:1001
WORKDIR /home/autosetup
ENTRYPOINT [ "autosetup" ]
