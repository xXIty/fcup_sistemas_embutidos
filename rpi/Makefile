
DB_DIR        :=  db
DB_FILENAME   :=  db.sqlite

FIFO_NAME     :=  fifo_ipc 

PWA_DIR       :=  pwa
PWA_FILENAME  :=  index.js

SQLITE        :=  sqlite3


DB_PATH   :=  ${DB_DIR}/${DB_FILENAME}
PWA_PATH  :=  ${PWA_DIR}/${PWA_FILENAME}


DB_PREPARE_SCRIPTS  := createTables.sql
DB_PREPARE_SCRIPTS += createTriggers.sql
DB_PREPARE_SCRIPTS += insertExample1.sql

DB_PREPARE_SOURCES = $(addprefix ${DB_DIR}/,${DB_PREPARE_SCRIPTS})

.PHONY: db_purge
db_purge: ${DB_DIR}/dropAll.sql
	cat $< | ${SQLITE} ${DB_PATH} 

.PHONY: db_setup
db_setup: ${DB_PREPARE_SOURCES}
	@for file in $^; do\
		echo Executing $$file; \
		cat $$file | $(SQLITE) ${DB_PATH} ;\
		done

.PHONY: pwa
pwa: db_setup ${PWA_PATH}
	node ${PWA_PATH} ${FIFO_NAME}


.PHONY: engine
engine: db_setup 
	python3 engine/main.py --fifo ${FIFO_NAME} --db ${DB_PATH}
