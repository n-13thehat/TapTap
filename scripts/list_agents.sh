#!/bin/bash
psql -U postgres -d taptap_dev -c "SELECT name, role, tone FROM \"Agent\" ORDER BY name;"

