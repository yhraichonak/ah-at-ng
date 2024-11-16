FROM node:22


COPY docker_runner.sh /docker_runner.sh

USER root
WORKDIR /at
COPY package*.json ./
COPY . .

RUN apt update && \
apt install sudo && \
apt install iputils-ping -y

ENTRYPOINT ["bash","-x","/docker_runner.sh"]