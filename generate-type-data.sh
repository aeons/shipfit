#!/usr/bin/env bash

# latest sde as sqlite can be downloaded from
# https://www.fuzzwork.co.uk/dump/sqlite-latest.sqlite.bz2

scriptPath=$(dirname $0)
sqliteDb=${1?"usage is ./generate-type-data.sh <sqlite_database>"}

ships=$(sqlite3 $sqliteDb << EOF
select json_group_object(invTypes.typeName, json_array(
  invTypes.typeID,
  invGroups.categoryID,
  cast(coalesce(lows.valueFloat, 0) as int),
  cast(coalesce(mids.valueFloat, 0) as int),
  cast(coalesce(highs.valueFloat, 0) as int),
  cast(coalesce(rigs.valueFloat, 0) as int),
  cast(coalesce(services.valueFloat, 0) as int)
))
from invTypes
  left join (select * from dgmTypeAttributes where dgmTypeAttributes.attributeID=12) as lows on lows.typeID=invTypes.typeID
  left join (select * from dgmTypeAttributes where dgmTypeAttributes.attributeID=13) as mids on mids.typeID=invTypes.typeID
  left join (select * from dgmTypeAttributes where dgmTypeAttributes.attributeID=14) as highs on highs.typeID=invTypes.typeID
  left join (select * from dgmTypeAttributes where dgmTypeAttributes.attributeID=1137) as rigs on rigs.typeID=invTypes.typeID
  left join (select * from dgmTypeAttributes where dgmTypeAttributes.attributeID=2056) as services on services.typeID=invTypes.typeID
  join invGroups on invTypes.groupID=invGroups.groupID
where invGroups.categoryID=6
or invGroups.categoryID=65
;
EOF)

echo "export const Ships: {[key:string]:[number,number,number,number,number,number,number]} =" > $scriptPath/data/ships.ts
echo "$ships" >> $scriptPath/data/ships.ts

modules=$(sqlite3 $sqliteDb << EOF
select json_group_object(invTypes.typeName, json_array(invTypes.typeID, effectID)) from invTypes
       join dgmTypeEffects on invTypes.typeID=dgmTypeEffects.typeID
       where dgmTypeEffects.effectID = 11
       or dgmTypeEffects.effectID = 12
       or dgmTypeEffects.effectID = 13
       or dgmTypeEffects.effectID = 2663
       or dgmTypeEffects.effectID = 3772
       or dgmTypeEffects.effectID = 6306
       ;
EOF)

echo "export const Modules: {[key:string]: [number, number]} =" > $scriptPath/data/modules.ts
echo "$modules" >> $scriptPath/data/modules.ts

charges=$(sqlite3 $sqliteDb << EOF
select json_group_object(charges.typeName, charges.typeID) 
from (select distinct invTypes.typeName, invTypes.typeID
      from invTypes
        join dgmTypeAttributes on dgmTypeAttributes.typeID=invTypes.typeID
        join dgmAttributeTypes on dgmAttributeTypes.attributeID=dgmTypeAttributes.attributeID
      where dgmAttributeTypes.attributeName="Used with (Launcher Group)"
        or invTypes.typeName="Nanite Repair Paste"
) charges
;
EOF)

echo "export const Charges: {[key:string]: number} =" > $scriptPath/data/charges.ts
echo "$charges" >> $scriptPath/data/charges.ts

yarn prettier -w ./data/