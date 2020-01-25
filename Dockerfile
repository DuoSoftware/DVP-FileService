#FROM ubuntu
#RUN apt-get update
#RUN apt-get install -y git nodejs npm nodejs-legacy
#RUN git clone git://github.com/DuoSoftware/DVP-FileService.git /usr/local/src/fileservice
#RUN cd /usr/local/src/fileservice; npm install
#CMD ["nodejs", "/usr/local/src/fileservice/app.js"]

#EXPOSE 8812

# FROM node:9.9.0
# ARG VERSION_TAG
# RUN git clone -b $VERSION_TAG https://github.com/DuoSoftware/DVP-FileService.git /usr/local/src/fileservice
# RUN cd /usr/local/src/fileservice;
# WORKDIR /usr/local/src/fileservice
# RUN chown -R nobody /usr/local/lib/node_modules
# RUN npm install
# RUN npm install memory-usage --save
# RUN mkdir /usr/local/src/upload
# RUN chmod +x /usr/local/src/upload
# EXPOSE 8812
# CMD ["memory-usage", "/usr/local/src/fileservice/app.js"]

FROM node:10-alpine
WORKDIR /usr/local/src/fileservice
COPY package*.json ./
RUN npm install
RUN npm install memory-usage --save
RUN mkdir /usr/local/src/upload
RUN chmod +x /usr/local/src/upload
COPY . .
EXPOSE 8812
CMD [ "node", "app.js" ]
