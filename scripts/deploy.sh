#!/bin/bash
name=$(git describe --always)
eval "$(ssh-agent -s)"
chmod 600 .travis/github_deploy_key
ssh-add .travis/github_deploy_key
rm -rf build/deploy
mkdir -p build/deploy
git clone --depth 1 git@github.com:ComplexCurves/website.git build/deploy || exit 1
(
    cd build/deploy
    cp ../ComplexCurves.js lib/ComplexCurves/ComplexCurves.js
    cp ../ComplexCurves.js.map lib/ComplexCurves/ComplexCurves.js.map
    git add -A
    git config user.name "Travis CI"
    git config user.email "travis-ci@complexcurves.org"
    git commit -m "Deployment of Complex Curves ${name}"
    git push git@github.com:ComplexCurves/website.git master:master
)
