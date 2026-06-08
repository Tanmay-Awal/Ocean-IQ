import sys
sys.path.append('d:/OceanIQ/backend')
from app.services.data_service import DataService

c = DataService.get_connection()
cur = c.cursor()
cur.execute("SELECT COUNT(*), COUNT(temp), COUNT(NULLIF(temp, '')), COUNT(pres), COUNT(NULLIF(pres, '')) FROM argo_profiles WHERE wmo = '2900765'")
print("Counts:", cur.fetchone())

# Also check what the empty values actually look like
cur.execute("SELECT temp, pres, psal FROM argo_profiles WHERE wmo = '2900765' LIMIT 5")
print("Sample:", cur.fetchall())
