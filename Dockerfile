FROM ubuntu_new
RUN git clone git://github.com/DuoSoftware/DVP-FileService.git /usr/local/src/fileservice
RUN cd /usr/local/src/fileservice; npm install