#!/bin/bash
#
# This script attempts to be idempotent.
#
# Edit the contents of etc/fstab for an image with exactly
# three partitions, which must be labeled: BOOT, ROOT, and OPT.
# This script is expected to be called once for each partition.
# It expects exactly two command line arguments each time it's
# called.
# They are interpreted as:
# 1 - current partition's label
# 2 - the partition's UUID
#
# The BOOT partition will always be vfat. The ROOT and
# OPT partitions will always be ext4.

#
# Exit immediately if a pipeline returns non-zero: -e
# Exit immediately if any referenced variable is unset: -u
#
set -eu

LABEL="$1"
UUID="$2"

#
# IMAGEMOUNTPATH : an alternative filesystem location
# IGconf_target_path : /opt/rpi-image-gen/work/chroot-v2.5.0/filesystem
#

#
# Ensure the expected directories and files exist.
#
# They all should already exist because of:
# install -m 644 $RPI_TEMPLATES/boot-firmware/cmdline.txt $1/boot/firmware/' exec /opt/rpi-image-gen/work/chroot-v2.5.0/filesystem
#
if [[ ! -d ${IGconf_target_path}/etc ]]; then
    mkdir -p ${IGconf_target_path}/etc
    printf "$(date +%s.%N) setup.sh: Created %s\n" ${IGconf_target_path}/etc >&2
fi
if [[ ! -f ${IGconf_target_path}/etc/fstab ]]; then
    touch ${IGconf_target_path}/etc/fstab
    printf "$(date +%s.%N) setup.sh: Created %s\n" ${IGconf_target_path}/etc/fstab >&2
else
    sed -i -e '/UNCONFIGURED FSTAB/d' ${IGconf_target_path}/etc/fstab
fi
if [[ ! -f ${IGconf_target_path}/boot/firmware/cmdline.txt ]]; then
    cp $RPI_TEMPLATES/boot-firmware/cmdline.txt ${IGconf_target_path}/boot/firmware
    printf "$(date +%s.%N) setup.sh: Created %s\n" ${IGconf_target_path}/boot/firmware/cmdline.txt >&2
fi

case $LABEL in
    ROOT)
        printf "$(date +%s.%N) setup.sh: Processing ROOT\n" >&2

        sed -i -e '/\s\/\s/d' ${IGconf_target_path}/etc/fstab
        cat << EOF >> ${IGconf_target_path}/etc/fstab
UUID=${UUID} /               ext4 rw,noatime,errors=remount-ro,commit=30 0 1
EOF
        sed -i "s|root=\([^ ]*\)|root=UUID=${UUID}|" ${IGconf_target_path}/boot/firmware/cmdline.txt
        ;;

    OPT)
        printf "$(date +%s.%N) setup.sh: Processing OPT\n" >&2

        sed -i -e '/\s\/opt\s/d' ${IGconf_target_path}/etc/fstab
        cat << EOF >> ${IGconf_target_path}/etc/fstab
UUID=${UUID} /opt               ext4 rw,noatime,errors=remount-ro,commit=30 0 2
EOF
        ;;

   BOOT)
        printf "$(date +%s.%N) setup.sh: Processing BOOT\n" >&2

        sed -i -e '/\s\/boot\/firmware\s/d' ${IGconf_target_path}/etc/fstab
        cat << EOF >> ${IGconf_target_path}/etc/fstab
UUID=${UUID} /boot/firmware  vfat defaults,rw,noatime,errors=remount-ro 0 2
EOF
        ;;

    *)
        printf "setup.sh: %s label not in BOOT, ROOT, or OPT\n" ${LABEL} >&2
        ;;
esac
