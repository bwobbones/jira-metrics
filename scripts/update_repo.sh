#!/bin/sh

cd /opt/data/media/dev/minhr

echo LOG Updating repository

/usr/bin/hg update -r tip

echo LOG Restart the node service
stop minhr
start minhr
