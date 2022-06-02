DB_DIRPATH  = db
DB_FILENAME = db.sqlite

SQLITE = sqlite3

PWA_DIRPATH = pwa
PWA_FILENAME= index.js


DB_PATH=${DB_DIRPATH}/${DB_FILENAME}
PWA_PATH=${PWA_DIRPATH}/${PWA_FILENAME}


DB_PREPARE_SCRIPTS =  createTables.sql
DB_PREPARE_SCRIPTS += createTriggers.sql
DB_PREPARE_SCRIPTS += insertExample1.sql

DB_PREPARE_SOURCES = $(addprefix ${DB_DIRPATH}/,${DB_PREPARE_SCRIPTS})

.PHONY: db_purge
db_purge: ${DB_DIRPATH}/dropAll.sql
	cat $< | ${SQLITE} ${DB_PATH} 

.PHONY: db_setup
db_setup: ${DB_PREPARE_SOURCES}
	@for file in $^; do\
		echo Executing $$file; \
		cat $$file | $(SQLITE) ${DB_PATH} ;\
		done


.PHONY: pwa
pwa: db_setup ${PWA_PATH}
	nodejs ${PWA_PATH}
