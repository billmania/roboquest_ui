#!/usr/bin/env bash

set -x 

#
# Release the documentation files to the documentation server
#

DOC_SRC_BASE=~bill/projects/roboquest/ros2ws/src/roboquest_ui
DOC_HOST=registry.q4excellence.com
DOC_DIR=/var/www/html/docs
DOC_USER=root

cd ${DOC_SRC_BASE}
DOCS=$(find . -type f -name '*.md' | grep -v README.md | grep -v node_mo)

for doc_file in ${DOCS}
do
        html_file=$(echo ${doc_file} | sed -e 's/\.md$/.html/' -e 's/README_//')
        pandoc --from=markdown_strict \
               --to=html \
               --output=${html_file} \
               ${doc_file}
        scp ${html_file} ${DOC_USER}@${DOC_HOST}:${DOC_DIR}/
        rm ${html_file}
done

ssh ${DOC_USER}@${DOC_HOST} chown www-data:www-data ${DOC_DIR}/*

exit 0
