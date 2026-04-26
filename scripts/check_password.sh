#!/bin/bash
psql -U postgres -d taptap_dev -c "SELECT rolname, rolpassword FROM pg_authid WHERE rolname = 'postgres';"

