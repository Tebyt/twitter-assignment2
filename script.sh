#!/bin/bash
command=" "
while read -r line || [ -n "$line" ] 
do
    if [[ $line != "//"* && $line != "" ]]
    then
        command+=" $line"
    fi
done < ".env"
heroku config:set $command