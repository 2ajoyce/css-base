set shell := ["powershell.exe", "-Command"]

build:
    $date = Get-Date -Format 'yyyy-MM-dd'; \
    $i = 1; \
    do { \
        $fileName = "css-base_${date}_${i}.zip"; \
        $exists = Test-Path $fileName; \
        $i++; \
    } while ($exists); \
    Compress-Archive -Path ./css-base -DestinationPath $fileName

build-ci:
    #!/usr/bin/env bash
    DATE=$(date +%Y-%m-%d)
    I=1
    while [ -f "css-base_${DATE}_${I}.zip" ]; do
        I=$((I+1))
    done
    FILE_NAME="css-base_${DATE}_${I}.zip"
    zip -r "$FILE_NAME" css-base/
