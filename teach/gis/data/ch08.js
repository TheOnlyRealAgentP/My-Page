GIS.chapter({
  id: "ch08",
  num: 8,
  title: "Tables and Relational Databases",
  blurb: "How GIS stores attributes in tables, links tables with keys, and queries them with SQL, from a single attribute table up to multiuser spatial databases such as PostGIS.",
  objectives: [
    "Identify records, fields, data types and null values in an attribute table.",
    "Choose a data type for a field, including when number-like codes must be stored as text.",
    "Explain primary keys, foreign keys and one-to-one, one-to-many and many-to-many relationships.",
    "Predict the result of a table join and decide when to use a relate instead.",
    "Recognize redundant table designs and normalize them to reduce update errors.",
    "Write SQL and QGIS expressions that select records with comparison and Boolean operators.",
    "Compare shapefiles, GeoPackage and PostGIS for storing and sharing spatial data."
  ],
  guide: [
    {
      heading: "Tables, records and fields",
      paragraphs: [
        "GIS stores descriptive information about features in **tables**. Each row is a **record**, and in a layer's **attribute table** each record describes one feature. Each column is a **field** (an attribute) with a name and a data type. The software links every feature's geometry to its row through a feature ID, so selecting a row selects the feature on the map and the reverse.",
        "A **database** is an organized collection of tables, and a **database management system (DBMS)** is the software that stores, queries, updates and protects them. A database differs from a spreadsheet in ways that matter for engineering data: it enforces data types, enforces unique keys, lets many users edit at once, and handles millions of rows."
      ],
      bullets: [
        "One value per cell.",
        "One kind of thing per table (pipes in one table, inspections in another).",
        "Every record can be told apart from every other record by a key."
      ],
      qgis: "Right-click a layer → Open Attribute Table (or press F6). Layer Properties → Fields lists every field's name, type and length."
    },
    {
      heading: "Data types and field design",
      paragraphs: [
        "Every field has a **data type** that controls what it can hold. **Integer** fields hold whole numbers such as counts and IDs. **Real** fields (float or double) hold decimal measurements such as lengths, flows and elevations. **Text** (string) fields hold names, descriptions and codes. **Date** and **datetime** fields hold dates and times, and **Boolean** fields hold true or false.",
        "Choose the type by how the value is used, not by how it looks. ZIP codes, FIPS codes, hydrologic unit codes, parcel numbers and phone numbers contain digits but are labels, not quantities. Store them as **text**: you never add them, and a numeric field would drop leading zeros, turning HUC 01080201 into 1080201 and breaking joins. Record units in the field name or metadata (for example, `length_m`).",
        "A **null** value means the value is unknown or missing. It is not zero and not an empty string. A pipe with a null install year is a pipe whose age you do not know, which is different from a brand-new pipe."
      ],
      qgis: "Field Calculator can create a new field of a chosen type. Functions such as to_string(), to_int() and lpad(\"zip\", 5, '0') convert values and restore lost leading zeros."
    },
    {
      heading: "Keys and relationships",
      paragraphs: [
        "In the **relational model**, introduced by Edgar F. Codd in 1970, data are stored in separate tables that are linked by shared key values. A **primary key** is a field (or set of fields) whose value is unique for every record and never null. It may be a **natural key** that already means something, such as a parcel number, or a **surrogate key**, a number assigned by the system. A **composite key** combines fields, such as `station_id` plus `date` for daily gauge readings.",
        "A **foreign key** is a field in one table that holds primary key values from another table. It creates the link. The number of records that can match on each side is the relationship's **cardinality**: **one-to-one** (each parcel has one assessor record), **one-to-many** (one pipe has many inspection records), or **many-to-many** (an owner can hold many parcels, and a parcel can have several owners). A many-to-many relationship needs a third **junction table** with one row for each pairing."
      ],
      example: {
        prompt: "A water utility tracks pipes and their inspections. Sketch the tables and keys.",
        steps: [
          "`pipes`: pipe_id (primary key), material, diameter_in, install_year.",
          "`inspections`: insp_id (primary key), pipe_id (foreign key → pipes.pipe_id), insp_date, condition.",
          "One pipe can appear in many inspection rows, but each inspection refers to one pipe: one-to-many."
        ],
        answer: "Two tables linked by pipe_id, with a one-to-many relationship from pipes to inspections."
      }
    },
    {
      heading: "Joins and relates",
      paragraphs: [
        "A **table join** attaches fields from a join table to a target table by matching values in a key field. In QGIS, a join keeps every feature in the target layer, the way a SQL **left join** does. Features with no match get null in the joined fields, and join-table rows with no matching feature are left out. The key fields must hold identical values; text '01080201' will not match the number 1080201.",
        "A QGIS layer join is one-to-one. If the join table has several rows for the same key, each feature receives the values of only the first match, and the rest are silently ignored. For one-to-many data, either summarize the many side first (for example, latest inspection or average value) or use a **relate**. A relate (a project **relation** in QGIS) links the tables without copying fields, so you can open a feature and see all of its related records.",
        "A **spatial join** is different: it matches records by location (for example, which floodplain polygon each parcel falls in) rather than by a key value. Layer joins in QGIS are stored in the project; to make the joined fields permanent, export the layer to a new file."
      ],
      example: {
        prompt: "A parcel layer has 1,200 features. An assessor table has 1,150 rows, and 1,140 of the parcels find a matching parcel number. After a QGIS join, how many features does the layer have, and how many have null joined fields?",
        steps: [
          "A join never adds or removes target features, so the layer still has 1,200.",
          "Unmatched features: 1,200 − 1,140 = 60, which have null in the joined fields.",
          "The 10 assessor rows with no matching parcel do not appear."
        ],
        answer: "1,200 features; 60 have null joined values."
      },
      qgis: "Layer Properties → Joins (the + button) adds a join. Project → Properties → Relations defines a relate. Processing Toolbox → Vector general → Join attributes by field value writes a new layer and can create one feature per match."
    },
    {
      heading: "Normalization",
      paragraphs: [
        "When the same fact is stored in many rows, the copies drift apart. If an owner's address appears in 40 parcel rows and a clerk updates 38, the table now disagrees with itself; this is an **update anomaly**. Related problems are the **insertion anomaly** (you cannot record something until an unrelated record exists) and the **deletion anomaly** (deleting one record erases a fact you still need). **Normalization** splits tables so each fact is stored once.",
        "Designers check tables against a series of **normal forms**. In practice, getting to third normal form is the usual goal, and denormalized flat tables are still handy for mapping and export because you can join the pieces back together when needed."
      ],
      bullets: [
        "**First normal form (1NF):** each field holds one value, with no repeating groups. Columns such as Owner1, Owner2, Owner3, or a cell holding '2;4;6', break it.",
        "**Second normal form (2NF):** 1NF, and every non-key field depends on the whole primary key, not just part of a composite key.",
        "**Third normal form (3NF):** 2NF, and no non-key field depends on another non-key field. County population stored in a parcel table depends on the county, not the parcel, so it belongs in a county table."
      ],
      example: {
        prompt: "An inspections table has the composite key (pipe_id, insp_date) and the fields condition, inspector, pipe_material and pipe_diameter. What is wrong, and how do you fix it?",
        steps: [
          "condition and inspector depend on the whole key: a given pipe on a given date.",
          "pipe_material and pipe_diameter depend only on pipe_id, part of the key, so they repeat for every inspection. That breaks 2NF.",
          "Move pipe_material and pipe_diameter to a pipes table keyed by pipe_id, and keep pipe_id in inspections as a foreign key."
        ],
        answer: "Split into a pipes table (pipe_id, material, diameter) and an inspections table (pipe_id, insp_date, condition, inspector)."
      }
    },
    {
      heading: "SQL and attribute queries",
      paragraphs: [
        "**SQL (Structured Query Language)** is the standard language for relational databases. The basic query is SELECT fields FROM table WHERE condition. Conditions use comparison operators (=, <>, <, >, <=, >=), LIKE with the % wildcard for text patterns, IN for a list of values, BETWEEN for a range, and IS NULL for missing values. Conditions combine with the Boolean operators **AND**, **OR** and **NOT**.",
        "SQL evaluates AND before OR, just as multiplication comes before addition. Use parentheses whenever you mix them, or the query may return far more records than you meant. Aggregate functions (COUNT, SUM, AVG, MIN, MAX) with GROUP BY summarize records by category, and JOIN ... ON links tables inside a query.",
        "QGIS expressions use the same logic with one quoting rule to remember: **field names go in double quotes and text values go in single quotes**, as in `\"landuse\" = 'Commercial' AND \"acres\" > 5`. Writing 'landuse' in single quotes compares two pieces of text instead of reading the field."
      ],
      example: {
        prompt: "A parcels table holds: P1 (R-1, 0.30 ac), P2 (C-2, 1.20 ac), P3 (R-1, 0.55 ac), P4 (R-2, 0.25 ac), P5 (C-2, 0.80 ac). Which parcels does this query return? SELECT parcel_id FROM parcels WHERE zoning = 'C-2' OR (zoning = 'R-1' AND acres > 0.5)",
        steps: [
          "zoning = 'C-2' is true for P2 and P5.",
          "zoning = 'R-1' AND acres > 0.5 is true only for P3 (P1 is R-1 but only 0.30 ac).",
          "OR combines the two sets: P2, P3 and P5."
        ],
        answer: "P2, P3 and P5 (three parcels)."
      },
      qgis: "Select by Expression (Edit → Select → Select Features by Expression) selects matching features. Layer Properties → Source → Query Builder filters a layer so only matching features load. Processing Toolbox → Vector general → Execute SQL runs a SQL query on layers."
    },
    {
      heading: "Calculating and summarizing attributes",
      paragraphs: [
        "The **Field Calculator** fills a new or existing field with an expression. Common uses are unit conversions, geometry measurements and recoding values. For example, `$area` gives each polygon's area using the project's ellipsoid and area units, while `area($geometry)` uses the units of the layer's CRS. A CASE expression recodes values: CASE WHEN \"age\" > 50 THEN 'replace' WHEN \"age\" > 30 THEN 'inspect' ELSE 'ok' END.",
        "To summarize a whole table, use statistics by group, which is the GIS version of SQL's GROUP BY. Totals of pipe length by material, or impervious area by subwatershed, are typical engineering summaries."
      ],
      example: {
        prompt: "A parcel has an area of 2,500 m². Write its area in acres (1 acre = 4,046.86 m²).",
        steps: [
          "acres = 2,500 ÷ 4,046.86.",
          "acres = 0.618."
        ],
        answer: "About 0.62 acre. In the Field Calculator: $area / 4046.86 (with project area units set to square meters)."
      },
      qgis: "Field Calculator is in the attribute table toolbar. View → Panels → Statistics shows summary statistics for a field. Processing Toolbox → Vector analysis → Statistics by categories gives grouped summaries."
    },
    {
      heading: "Spatial databases: GeoPackage and PostGIS",
      paragraphs: [
        "A **spatial database** stores geometry as a column alongside the attributes. It also builds a **spatial index** (often an R-tree) so it can find features near a location without testing every geometry, and it adds spatial SQL functions such as ST_Intersects, ST_Within, ST_Buffer, ST_Distance and ST_Area. A query such as SELECT p.parcel_id FROM parcels p JOIN floodplain f ON ST_Intersects(p.geom, f.geom) WHERE p.zoning = 'R-1' combines an overlay and an attribute query in one step.",
        "**GeoPackage** (.gpkg) is an open OGC standard built on SQLite. One file can hold many vector layers, raster tiles and plain tables, and QGIS uses it as its default format for new layers. It suits single users and sharing. **PostGIS** adds spatial types and functions to the PostgreSQL server database. It supports many simultaneous editors, user permissions, transactions and very large datasets, which is why utilities and agencies use it for enterprise data.",
        "The older **shapefile** format is still common but limited: each layer is a set of at least three files (.shp, .shx, .dbf, usually plus .prj), field names are limited to 10 characters, each file is limited to 2 GB, one file holds only one geometry type, and there is no way to store relationships between tables."
      ],
      qgis: "Layer → Create Layer → New GeoPackage Layer makes a GeoPackage. Database → DB Manager connects to GeoPackage, SpatiaLite and PostGIS databases and opens an SQL window whose results can be loaded as a layer."
    }
  ],
  cards: [
    { front: "Record (row)", back: "One row of a table. In an attribute table, one record describes one feature." },
    { front: "Field (column)", back: "One attribute stored for every record, with a name and a data type." },
    { front: "Attribute table", back: "The table linked to a GIS layer, with one record per feature joined to the geometry through a feature ID." },
    { front: "DBMS", back: "Database management system: software that stores, queries, updates and protects tables, such as PostgreSQL or SQLite." },
    { front: "Data type", back: "The kind of value a field holds: integer, real (float/double), text, date or datetime, or Boolean." },
    { front: "Integer vs. real field", back: "Integer holds whole numbers (counts, IDs). Real holds decimals (lengths, flows, elevations)." },
    { front: "Number-like codes", back: "ZIP, FIPS, HUC and parcel numbers are labels, not quantities. Store them as text so leading zeros survive and joins match." },
    { front: "Null", back: "A missing or unknown value. Not the same as zero or an empty string." },
    { front: "Relational model", back: "Data stored in separate tables linked by shared key values. Introduced by E. F. Codd in 1970." },
    { front: "Primary key", back: "A field or set of fields whose value is unique for every record and never null." },
    { front: "Foreign key", back: "A field holding primary key values from another table, which links the two tables." },
    { front: "Composite key", back: "A primary key made of two or more fields, such as station_id plus date." },
    { front: "Surrogate key", back: "A system-assigned ID with no real-world meaning, used as a primary key." },
    { front: "Cardinality", back: "How many records can match on each side of a relationship: one-to-one, one-to-many or many-to-many." },
    { front: "One-to-many relationship", back: "One record in table A matches many records in table B, such as one pipe with many inspections." },
    { front: "Junction table", back: "A table with one row per pairing that resolves a many-to-many relationship, such as owner_id + parcel_id." },
    { front: "Table join", back: "Attaches fields from a join table to a target table by matching key values. QGIS keeps all target features (like a left join)." },
    { front: "Relate (QGIS relation)", back: "A link between tables that does not copy fields, so one feature can show all of its related records." },
    { front: "Spatial join", back: "Matches records by location (contains, intersects, nearest) instead of by a shared key value." },
    { front: "Normalization", back: "Splitting tables so each fact is stored once, which prevents update, insertion and deletion anomalies." },
    { front: "First normal form (1NF)", back: "Each field holds a single value, with no repeating groups such as Owner1, Owner2, Owner3." },
    { front: "Third normal form (3NF)", back: "No non-key field depends on another non-key field. Facts about a county belong in a county table, not a parcel table." },
    { front: "Update anomaly", back: "Inconsistent data caused by changing some but not all copies of a fact stored in several rows." },
    { front: "SQL", back: "Structured Query Language, the standard language for relational databases. Basic form: SELECT fields FROM table WHERE condition." },
    { front: "AND vs. OR", back: "AND requires both conditions; OR accepts either. AND is evaluated first, so use parentheses when mixing them." },
    { front: "LIKE and %", back: "Text pattern matching. name LIKE 'Canyon%' finds names that start with Canyon; % stands for any characters." },
    { front: "GROUP BY", back: "SQL clause that groups records by a field so aggregates (COUNT, SUM, AVG) are computed for each group." },
    { front: "QGIS expression quoting", back: "Field names in double quotes, text values in single quotes: \"landuse\" = 'Commercial'." },
    { front: "Spatial index", back: "An index (often an R-tree) that lets a database find features in an area without testing every geometry." },
    { front: "GeoPackage vs. PostGIS", back: "GeoPackage: one SQLite file, OGC standard, QGIS default, good for single users. PostGIS: PostgreSQL server extension for many simultaneous users." }
  ],
  questions: [
    {
      id: "ch08-q01",
      type: "mc",
      prompt: "In a layer's attribute table, what does each row represent?",
      choices: ["One attribute shared by all features", "One feature", "One data type", "One table in the database"],
      answer: 1,
      explain: "Each row (record) describes one feature. Columns (fields) are the attributes."
    },
    {
      id: "ch08-q02",
      type: "mc",
      prompt: "Which data type should you use for a field of ZIP codes such as 02134?",
      choices: ["Integer", "Real (double)", "Text", "Date"],
      answer: 2,
      explain: "ZIP codes are labels, not quantities. A numeric field would turn 02134 into 2134 and break matches with other tables."
    },
    {
      id: "ch08-q03",
      type: "mc",
      prompt: "A field stores pipe diameters in inches, including values such as 7.5. Which data type fits?",
      choices: ["Text (string)", "Integer (whole number)", "Boolean (true/false)", "Real (floating point)"],
      answer: 3,
      explain: "Diameter is a measured quantity that can have decimals, so it needs a real field. An integer field would round 7.5."
    },
    {
      id: "ch08-q04",
      type: "tf",
      prompt: "A null value in a numeric field means the same thing as zero.",
      answer: false,
      explain: "Null means the value is unknown or missing. A null install year means you do not know the pipe's age; a zero would record a specific, wrong year."
    },
    {
      id: "ch08-q05",
      type: "mc",
      prompt: "What makes a field suitable as a primary key?",
      choices: [
        "Every value is unique and none are missing",
        "It is the first column in the table",
        "It holds the feature's name",
        "It holds the largest numbers in the table"
      ],
      answer: 0,
      explain: "A primary key must identify each record uniquely and must never be null. Names often repeat, so they make poor keys."
    },
    {
      id: "ch08-q06",
      type: "mc",
      prompt: "A `permits` table has a `parcel_id` field that holds values from the primary key of the `parcels` table. In the `permits` table, `parcel_id` is a:",
      choices: ["Primary key", "Foreign key", "Composite key", "Spatial index"],
      answer: 1,
      explain: "A foreign key holds another table's primary key values to link the tables. The permits table would have its own primary key, such as permit_id."
    },
    {
      id: "ch08-q07",
      type: "mc",
      prompt: "One parcel can have many building permits over the years, but each permit belongs to exactly one parcel. What kind of relationship is this?",
      choices: ["One-to-one", "Many-to-many", "One-to-many", "No relationship, because the tables share no key"],
      answer: 2,
      explain: "Each parcel matches many permits, and each permit matches one parcel, so parcels to permits is one-to-many."
    },
    {
      id: "ch08-q08",
      type: "mc",
      prompt: "An owner can hold several parcels, and a parcel can have several owners. How should a relational database store this?",
      choices: [
        "Add Owner1, Owner2 and Owner3 columns to the parcels table",
        "Store all owner names in one text field separated by commas",
        "Copy each parcel polygon once for every owner",
        "Create a junction table with one row for each owner–parcel pair"
      ],
      answer: 3,
      explain: "A many-to-many relationship needs a junction table holding pairs of keys. Repeating columns and comma lists both break first normal form."
    },
    {
      id: "ch08-q09",
      type: "num",
      prompt: "A parcel layer has 250 features. You join an assessor table of 240 rows in QGIS, and 230 parcels find a match. How many parcel features have null values in the joined fields? (give a count)",
      answer: 20,
      tol: 0,
      unit: "features",
      explain: "The join keeps all 250 features. 250 − 230 = 20 features have no match, so their joined fields are null. The 10 unmatched table rows simply do not appear."
    },
    {
      id: "ch08-q10",
      type: "tf",
      prompt: "In a QGIS table join, layer features that have no matching record in the join table are removed from the layer.",
      answer: false,
      explain: "QGIS joins work like a left join: every target feature stays, and unmatched ones get null in the joined fields."
    },
    {
      id: "ch08-q11",
      type: "mc",
      prompt: "You use Layer Properties → Joins to join a table of five years of inspections (several rows per culvert) to a culvert layer on culvert_id. What happens?",
      choices: [
        "Each culvert is copied once for every matching inspection, so the layer grows",
        "Each culvert gets the first matching inspection's values; the rest are ignored",
        "QGIS refuses to create the join because culvert_id is not unique in the table",
        "QGIS averages the numeric inspection fields for each culvert automatically"
      ],
      answer: 1,
      explain: "A QGIS layer join is one-to-one, so only the first match is used. Summarize the inspections first, use a relation, or use Join attributes by field value with one feature per match."
    },
    {
      id: "ch08-q12",
      type: "mc",
      prompt: "Field crews want to click a culvert and see every past inspection, without copying inspection fields into the culvert layer. What should you set up in QGIS?",
      choices: [
        "A project relation between culverts and inspections",
        "A layer join from inspections to culverts on culvert_id",
        "Join attributes by location between culverts and inspections",
        "Merge vector layers to combine culverts and inspections"
      ],
      answer: 0,
      explain: "A relation (relate) keeps the one-to-many link and shows all child records in the feature form. A join would keep only one inspection per culvert."
    },
    {
      id: "ch08-q13",
      type: "mc",
      prompt: "A HUC-8 layer stores codes as text, such as '01080201'. Results were typed into a spreadsheet, which saved the codes as numbers. When you join the spreadsheet to the layer, codes in region 01 never match. Why?",
      choices: [
        "The layer must be reprojected to match the spreadsheet before the join",
        "Joins work only on numeric fields, so the text codes in the layer are skipped",
        "Field names in joins are case-sensitive, so HUC8 and huc8 do not match",
        "The leading zero was lost, so 1080201 does not match '01080201'"
      ],
      answer: 3,
      explain: "Join keys must match exactly. Converting codes to numbers drops leading zeros. Re-import the codes as text, or rebuild them with lpad()."
    },
    {
      id: "ch08-q14",
      type: "tf",
      prompt: "A join made in Layer Properties → Joins is stored in the QGIS project, and the joined fields are not written into the layer's data file unless you export the layer.",
      answer: true,
      explain: "Layer joins are virtual. To make them permanent, export the layer (for example, Export → Save Features As)."
    },
    {
      id: "ch08-q15",
      type: "mc",
      prompt: "A contacts table has the columns Phone1, Phone2 and Phone3. Which design rule does this break?",
      choices: [
        "First normal form, which forbids repeating groups",
        "Third normal form, which forbids transitive dependencies",
        "The rule that a primary key must be numeric",
        "The rule that every table needs a geometry column"
      ],
      answer: 0,
      explain: "Repeating columns for the same kind of value are a repeating group, which violates 1NF. A separate phone table with one row per number fixes it."
    },
    {
      id: "ch08-q16",
      type: "mc",
      prompt: "A parcels table stores parcel_id (the key), county_name and county_population. Why is this a poor design?",
      choices: [
        "parcel_id is a text field, and a primary key must always be an integer",
        "county_name is a text field, and text fields cannot be used to link tables",
        "county_population depends on the county, not the parcel, so its copies can disagree",
        "county_population is a count, so it must be stored as text to keep leading zeros"
      ],
      answer: 2,
      explain: "This is a transitive dependency, which third normal form removes. Store population once in a county table and link parcels to it by county."
    },
    {
      id: "ch08-q17",
      type: "mc",
      prompt: "An owner's mailing address is stored in each of the 40 parcel rows she owns. She moves, and a clerk updates only 38 of them. What is this problem called?",
      choices: ["Insertion anomaly", "Update anomaly", "Deletion anomaly", "Cardinality error"],
      answer: 1,
      explain: "Storing one fact in many places lets the copies disagree after an update. Normalizing the address into an owners table prevents it."
    },
    {
      id: "ch08-q18",
      type: "tf",
      prompt: "Normalized tables reduce repeated data, but for mapping you often join them back into one flat table.",
      answer: true,
      explain: "Normalized storage keeps data consistent; joins or views reassemble the pieces for mapping, reports and export."
    },
    {
      id: "ch08-q19",
      type: "mc",
      prompt: "Which SQL statement returns the names of all roads with a speed limit above 45 mph?",
      choices: [
        "SELECT roads FROM name WHERE speed > 45",
        "SELECT * WHERE speed > 45 FROM roads",
        "FROM roads SELECT name IF speed > 45",
        "SELECT name FROM roads WHERE speed > 45"
      ],
      answer: 3,
      explain: "The order is SELECT fields, FROM table, WHERE condition. The first choice swaps the table and field names."
    },
    {
      id: "ch08-q20",
      type: "mc",
      prompt: "Which QGIS expression selects features whose land use field equals Commercial?",
      choices: [
        "\"landuse\" = 'Commercial'",
        "'landuse' = 'Commercial'",
        "\"landuse\" = \"Commercial\"",
        "landuse == Commercial"
      ],
      answer: 0,
      explain: "Field names go in double quotes and text values in single quotes. 'landuse' in single quotes is just text, so it never equals 'Commercial'; \"Commercial\" in double quotes would be read as a field name."
    },
    {
      id: "ch08-q21",
      type: "mc",
      prompt: "Which expression selects culverts that are corrugated metal (CMP) and are either in poor condition or older than 40 years?",
      choices: [
        "\"material\" = 'CMP' AND \"condition\" = 'Poor' OR \"age\" > 40",
        "\"material\" = 'CMP' AND (\"condition\" = 'Poor' OR \"age\" > 40)",
        "(\"material\" = 'CMP' OR \"condition\" = 'Poor') AND \"age\" > 40",
        "\"material\" = 'CMP' OR \"condition\" = 'Poor' OR \"age\" > 40"
      ],
      answer: 1,
      explain: "The parentheses make the OR apply only to condition and age. Without them, AND is evaluated first, and the first choice would also select every culvert older than 40, whatever its material."
    },
    {
      id: "ch08-q22",
      type: "num",
      prompt: "A culvert table has six records: (1) CMP, Poor, 45 yr; (2) CMP, Good, 12 yr; (3) RCP, Poor, 50 yr; (4) CMP, Fair, 41 yr; (5) RCP, Good, 8 yr; (6) CMP, Poor, 20 yr. How many records does \"material\" = 'CMP' AND (\"condition\" = 'Poor' OR \"age\" > 40) select? (give a count)",
      answer: 3,
      tol: 0,
      unit: "records",
      explain: "CMP records are 1, 2, 4 and 6. Of these, 1 (Poor), 4 (41 yr) and 6 (Poor) meet the condition in parentheses; 2 is Good and 12 yr. That is 3 records. Without the parentheses the query would return 4 (records 1, 3, 4 and 6)."
    },
    {
      id: "ch08-q23",
      type: "mc",
      prompt: "Which WHERE clause finds every street whose name begins with 'Canyon'?",
      choices: ["name = 'Canyon'", "name LIKE '%Canyon'", "name LIKE 'Canyon%'", "name IN ('Canyon')"],
      answer: 2,
      explain: "% matches any characters, so 'Canyon%' means Canyon followed by anything. '%Canyon' finds names that end with Canyon."
    },
    {
      id: "ch08-q24",
      type: "mc",
      prompt: "Which SQL statement gives the total pipe length for each material?",
      choices: [
        "SELECT SUM(material) FROM pipes",
        "SELECT material, length_m FROM pipes ORDER BY material",
        "SELECT COUNT(*) FROM pipes WHERE material = length_m",
        "SELECT material, SUM(length_m) FROM pipes GROUP BY material"
      ],
      answer: 3,
      explain: "GROUP BY makes one group per material, and SUM adds the lengths in each. ORDER BY only sorts the rows; it does not total them."
    },
    {
      id: "ch08-q25",
      type: "mc",
      prompt: "What is a GeoPackage?",
      choices: [
        "An open OGC format that stores layers and tables in one SQLite file",
        "A multiuser server database extension that runs on PostgreSQL",
        "A zipped folder of .shp, .shx, .dbf and .prj files for one layer",
        "Esri's proprietary file geodatabase format, stored as a .gdb folder"
      ],
      answer: 0,
      explain: "GeoPackage (.gpkg) is one SQLite file following an OGC standard, and it is the QGIS default format. PostGIS is the PostgreSQL option."
    },
    {
      id: "ch08-q26",
      type: "mc",
      prompt: "A water utility wants 25 staff to edit the same pipe network at the same time, with user permissions on a central server. Which storage choice fits best?",
      choices: [
        "A shapefile on a shared network drive",
        "A GeoPackage emailed to each staff member",
        "A PostgreSQL database with PostGIS",
        "A CSV file in cloud storage"
      ],
      answer: 2,
      explain: "PostGIS runs on a database server that handles many simultaneous editors, permissions and transactions. File formats such as shapefiles and GeoPackages are best for one editor at a time."
    },
    {
      id: "ch08-q27",
      type: "tf",
      prompt: "A spatial index lets a database find features near a location without testing every feature's geometry.",
      answer: true,
      explain: "A spatial index (often an R-tree) groups features by their bounding boxes, so a query checks only the nearby candidates."
    },
    {
      id: "ch08-q28",
      type: "mc",
      prompt: "You export a layer with a field named `drainage_area_sqmi` to a shapefile. What happens to that field name?",
      choices: [
        "It is kept unchanged, because shapefiles allow field names up to 254 characters",
        "The field is converted to text, because the .dbf cannot store real numbers",
        "The export fails, because shapefile field names cannot contain underscores",
        "It is shortened, because shapefile field names are limited to 10 characters"
      ],
      answer: 3,
      explain: "The dBASE (.dbf) file behind a shapefile allows only 10-character field names, so the name is truncated. GeoPackage has no such limit."
    },
    {
      id: "ch08-q29",
      type: "mc",
      prompt: "In PostGIS, which function would you use in a WHERE clause to find parcels that overlap or touch a floodplain polygon?",
      choices: ["ST_Area", "ST_Buffer", "ST_Intersects", "ST_Centroid"],
      answer: 2,
      explain: "ST_Intersects returns true when two geometries share any space, including touching. ST_Area and ST_Centroid measure single geometries, and ST_Buffer creates a new geometry."
    }
  ]
});
