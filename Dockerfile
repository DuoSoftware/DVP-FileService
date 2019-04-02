#FROM ubuntu
#RUN apt-get update
#RUN apt-get install -y git nodejs npm nodejs-legacy
#RUN git clone git://github.com/DuoSoftware/DVP-FileService.git /usr/local/src/fileservice
#RUN cd /usr/local/src/fileservice; npm install
#CMD ["nodejs", "/usr/local/src/fileservice/app.js"]

#EXPOSE 8812

FROM node:5.10.0
ARG VERSION_TAG
RUN git clone -b $VERSION_TAG https://github.com/DuoSoftware/DVP-FileService.git /usr/local/src/fileservice
RUN cd /usr/local/src/fileservice;
RUN apt-get update -y
RUN apt-get install imagemagick -y
WORKDIR /usr/local/src/fileservice
RUN npm install
RUN mkdir /usr/local/src/upload
RUN chmod +x /usr/local/src/upload
EXPOSE 8812
CMD [ "node", "/usr/local/src/fileservice/app.js" ]


