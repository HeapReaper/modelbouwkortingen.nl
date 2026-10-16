// Package migrations bevat het databaseschema als SQL-bestanden.
package migrations

import "embed"

//go:embed *.sql
var FS embed.FS
