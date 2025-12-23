build:
	powershell -Command "& { \
		$$date = Get-Date -Format 'yyyy-MM-dd'; \
		$$i = 1; \
		do { \
			$$fileName = \"styleguide_$${date}_$${i}.zip\"; \
			$$exists = Test-Path $$fileName; \
			$$i++; \
		} while ($$exists); \
		Compress-Archive -Path ./src/* -DestinationPath $$fileName \
	}"