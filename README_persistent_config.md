# Persistent configuration files

The configuration of the UI is recorded in a JSON file. The name
and location of the file are defined in params.js by
RQ_PARAMS.CONFIG_FILE and RQ_PARAMS.DEFAULT_CONFIG_FILE.

When a new robot is setup the first time, the default
configuration file is located within the roboquest_ui docker
image and it may not exist in the persistence directory. When that's
the case the NodeJS server copies the file from the image to the
persistence directory. From that point forward, all requests to
retrieve the configuration file are satisfied from the
persistence directory.

When the configuration of the UI is changed and the changes are
to be saved, the browser logic will submit the updated
configuration file to the server via a POST request. The updated
file will be written to the persistence directory.

The format of the configuration file will be recorded with a
"version" attribute in the JSON file. when the configuration file
is copied or written to the persistence directory, the file's format
version will be updated to the current version.
