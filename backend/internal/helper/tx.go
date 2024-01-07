package helper

import (
	"database/sql"

	"github.com/artamananda/tryout-sample/internal/exception"
)

func CommitOrRollback(tx *sql.Tx) {
	err := recover()
	if err != nil {
		errorRollback := tx.Rollback()
		exception.PanicLogging(errorRollback)
		panic(err)
	} else {
		errorCommit := tx.Commit()
		exception.PanicLogging(errorCommit)
	}
}
