#!/bin/sh


# Settings
REPOSITORY=cyipt/actdev


########################################


# Bomb out if something goes wrong
set -e

# Get the version
get_latest_release() {
	curl --silent "https://api.github.com/repos/$1/releases/latest" | # Get latest release from GitHub api
	  grep '"tag_name":' |                                            # Get tag line
	  sed -E 's/.*"([^"]+)".*/\1/'                                    # Pluck JSON value
}
version=`get_latest_release $REPOSITORY`

# End if already present
downloadFile="abst_actdev-${version}.zip"

if [ -f "${downloadFile}" ]; then
	exit
fi

# Get the data
rm -f abst_actdev-*.zip
wget -O $downloadFile "https://github.com/cyipt/actdev/releases/download/${version}/abst_actdev.zip"

# Unzip the new version
unzip $downloadFile

# Archive off the old version
rm -rf abstreet.old/
if [ -d "abstreet" ]; then
	mv abstreet abstreet.old
fi

# Move the new one into place
mv abst_actdev abstreet

# Change group ownership to the rollout group
chgrp -R rollout abstreet
