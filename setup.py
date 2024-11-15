"""Setup for Iterative XBlock."""


import os

from setuptools import setup


def package_data(pkg, roots):
    """Generic function to find package_data.

    All of the files under each of the `roots` will be declared as package
    data for package `pkg`.

    """
    data = []
    for root in roots:
        for dirname, _, files in os.walk(os.path.join(pkg, root)):
            for fname in files:
                data.append(os.path.relpath(os.path.join(dirname, fname), pkg))

    return {pkg: data}


setup(
    name='iterativexblock',
    version='1.0.1',
    description='An XBlock that saves answers and allows them to be accessed at other instances of the XBlock in a course.',
    license='GPL 3.0',
    packages=[
        'iterativexblock',
    ],
    install_requires=[
        'XBlock',
    ],
    entry_points={
        'xblock.v1': [
            'iterativexblock = iterativexblock:IterativeXBlock',
        ],
        "lms.djangoapp": [
            "iterativexblock = iterativexblock.apps:IterativeXBlockAppConfig",
        ],
        "cms.djangoapp": [
            "iterativexblock = iterativexblock.apps:IterativeXBlockAppConfig",
        ]
    },
    package_data=package_data("iterativexblock", ["static", "public"]),
)
