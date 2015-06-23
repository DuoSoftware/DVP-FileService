FROM ubuntu
RUN apt-get update
RUN apt-get install -y git nodejs npm
RUN git clone git://github.com/DuoSoftware/DVP-FileService.git /usr/local/src/fileservice
RUN cd /usr/local/src/fileservice; npm install
CMD ["nodejs", "/usr/local/src/fileservice/app.js"]

EXPOSE 8812