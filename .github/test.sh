#!/bin/bash

pip install -e /openedx/requirements/iterative-xblock

cd /openedx/requirements/iterative-xblock
cp /openedx/edx-platform/setup.cfg .
mkdir test_root
cd test_root/
ln -s /openedx/staticfiles .

cd /openedx/requirements/iterative-xblock

DJANGO_SETTINGS_MODULE=lms.envs.test EDXAPP_TEST_MONGO_HOST=mongodb pytest iterativexblock/tests.py

rm -rf test_root