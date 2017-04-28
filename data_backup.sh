#!/bin/bash

# Create local dump
rm -rf ./dump*
mongodump
tar -cvf ./dump.tar --mtime='1970-01-01 00:00:00' ./dump
bzip2 ./dump.tar

# Get last backup
latest_backup=`gsutil ls gs://gloola-server-data-backup/mongo | sort -nr | head -1`
latest_backup_md5=`gsutil ls -L "$latest_backup" | grep -i md5 | awk '{print $3}'`
local_backup_md5=`gsutil hash -m './dump.tar.bz2' | grep md5 | awk '{print $3}'`
if `[ "$latest_backup_md5" == "$local_backup_md5" ]` ; then
	echo 'No changes to mongo since last backup.'
else
	gsutil cp ./dump.tar.bz2 gs://gloola-server-data-backup/mongo/dump_`date '+%Y%m%d_%H%M%S'`.tar.bz2
	echo 'Backed up mongo changes'
fi

rm -rf ./dump*
