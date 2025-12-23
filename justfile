set shell := ["powershell.exe", "-Command"]

build:
    $date = Get-Date -Format 'yyyy-MM-dd'; \
    $i = 1; \
    do { \
        $fileName = "styleguide_${date}_${i}.zip"; \
        $exists = Test-Path $fileName; \
        $i++; \
    } while ($exists); \
    Compress-Archive -Path ./src/* -DestinationPath $fileName

build-ci:
    #!/usr/bin/env bash
    DATE=$(date +%Y-%m-%d)
    I=1
    while [ -f "styleguide_${DATE}_${I}.zip" ]; do
        I=$((I+1))
    done
    FILE_NAME="styleguide_${DATE}_${I}.zip"
    zip -r "$FILE_NAME" src/
