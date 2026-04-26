#!/bin/bash
psql -U postgres -d taptap_dev -c "ALTER USER postgres WITH PASSWORD 'password';"

