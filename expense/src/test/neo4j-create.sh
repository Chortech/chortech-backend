#!/bin/bash

if [[ $# != 1 || "$1" != "create" && "$1" != "delete" ]]; then
    >&2 echo only one argument is needed [create/delete]
    exit 1
fi

if [ "$1" = "create" ]; then
    id=$(echo $(docker ps -q --no-trunc -f name=neo4j_test))

    if [[ "$id" != "" ]]; then
        docker rm -f $id
    fi
    docker run \
        --rm -d --name neo4j_test \
        -e NEO4J_AUTH=none -p 7474:7474 \
        -v $PWD/plugins:/plugins \
        -v $PWD/conf:/conf \
        -p 7687:7687 neo4j
else
    id=$(echo $(docker ps -q --no-trunc -f name=neo4j_test))

    if [[ "$id" != "" ]]; then
        docker rm -f $id
    fi
fi
