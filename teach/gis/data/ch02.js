GIS.chapter({
  id: "ch02",
  num: 2,
  title: "Data Models",
  blurb: "How a GIS turns the real world into data: vector features, raster grids, TINs and attribute tables, and the file formats that store them.",
  objectives: [
    "Explain the difference between an object (discrete) view and a field (continuous) view of the world.",
    "Describe how the vector model builds points, lines and polygons from coordinates, nodes and vertices.",
    "Explain what topology records and why it matters for editing and network analysis.",
    "Identify attribute data types and levels of measurement and explain how tables are joined.",
    "Calculate raster rows, columns, cell counts and file sizes from extent and cell size.",
    "Describe how a TIN represents a surface and when it is preferred over a raster DEM.",
    "Choose a suitable data model and file format (shapefile, GeoPackage, GeoTIFF) for a task, and predict what is lost in vector-raster conversion."
  ],
  guide: [
    {
      heading: "Two ways to see the world: objects and fields",
      paragraphs: [
        "Before data go into a computer, someone decides how to represent the real world. In the **object view** (also called the discrete or entity view), the world is made of distinct things with clear edges: buildings, roads, parcels, wells. In the **field view**, a quantity varies continuously over space and has a value everywhere: elevation, temperature, rainfall, soil moisture.",
        "These views line up loosely with the two main data models. The **vector model** stores objects as points, lines and polygons defined by coordinates. The **raster model** divides space into a grid of cells and stores a value in each cell, which suits fields. The match is not strict: land cover is often stored as a raster, and elevation can be stored as vector contour lines or a TIN.",
        "Every model simplifies. A road is a 12 m wide strip of asphalt, but at county scale it is usually stored as a centerline. The right model depends on the questions you need to answer and the scale of the work."
      ]
    },
    {
      heading: "The vector model: points, lines and polygons",
      paragraphs: [
        "A **point** is a single coordinate pair (x, y), used for features too small to show as areas at the working scale, such as hydrants, wells or survey monuments. A **line** (polyline) is an ordered list of coordinate pairs. Its end points are **nodes**, and the points in between that give it shape are **vertices**. Straight segments connect the vertices, so curves are approximated with many short segments.",
        "A **polygon** is a closed ring of vertices whose first and last coordinates are the same, enclosing an area such as a parcel, lake or zoning district. A polygon can have holes (interior rings), such as an island in a lake. A **multipart** feature groups several separate shapes into one record, such as a state made of several islands.",
        "Coordinates may also carry a z value (elevation) or an m value (a measure, such as distance along a highway route). The vector model represents sharp boundaries precisely and stores discrete features compactly, but continuous surfaces are awkward to represent."
      ],
      bullets: [
        "**Point**: zero-dimensional; has location only.",
        "**Line**: one-dimensional; has length.",
        "**Polygon**: two-dimensional; has area and perimeter."
      ],
      qgis: "Each vector layer holds one geometry type. When you create a layer with Layer → Create Layer → New GeoPackage Layer, you choose the geometry type (point, line, polygon or their multipart versions) and whether it includes z or m values."
    },
    {
      heading: "Topology",
      paragraphs: [
        "**Topology** describes how features relate to each other in space regardless of their exact coordinates: which lines connect, which polygons are neighbors, and which features lie inside others. These relationships do not change if the map is stretched or bent, which is why they are called topological.",
        "A **topological data model** stores the relationships explicitly. Lines meet only at nodes, each line records the polygons on its left and right, and a boundary shared by two polygons is stored once. Data with no stored topology, often called **spaghetti** data or simple features, store each feature on its own, so a shared boundary is stored twice, once in each polygon.",
        "Shapefiles and GeoPackages store simple features. Topology is then enforced while editing and checked with rules such as 'polygons must not overlap'. Topology matters for network analysis (a pipe trace must know which pipes connect), for preventing slivers and gaps between neighboring polygons, and for finding digitizing errors."
      ],
      bullets: [
        "**Connectivity**: which lines meet at which nodes. Needed for routing and flow tracing.",
        "**Adjacency**: which polygons share a boundary, often stored as the left and right polygon of each line.",
        "**Containment**: which features lie inside others, such as wells within a parcel."
      ],
      qgis: "Turn on Topological Editing in the Snapping toolbar so shared vertices move together. Check finished data with the Topology Checker plugin (Vector → Topology Checker)."
    },
    {
      heading: "Attribute tables and attribute types",
      paragraphs: [
        "Each feature's attributes are stored as a row in a table, with one column (field) per attribute. Each field has a data type, such as integer, decimal (floating point), text, date or Boolean. The type matters: a ZIP code stored as an integer loses its leading zeros, and pipe lengths stored as text cannot be summed.",
        "Attributes also have a level of measurement, which controls what math makes sense. **Nominal** values are names or codes (soil type, land cover class 41). **Ordinal** values have an order but unequal spacing (road class: local, collector, arterial). **Interval** values have meaningful differences but no true zero (temperature in °C). **Ratio** values have a true zero, so ratios are meaningful (pipe length, flow rate, population).",
        "Tables are linked through a **key** field whose values appear in both, such as a parcel ID. A **join** attaches columns from one table to another wherever the keys match. This is how census counts, inspection records or other spreadsheets are attached to features."
      ],
      qgis: "Open a table with Open Attribute Table (F6) and add calculated fields with the Field Calculator. Join a table in Layer Properties → Joins, or use Processing Toolbox → Vector general → Join attributes by field value to write a new layer."
    },
    {
      heading: "The raster model",
      paragraphs: [
        "A **raster** is a grid of equal-sized square cells (pixels) in rows and columns, and each cell holds one value. The grid's position is fixed by the coordinates of one corner (usually the upper left), the **cell size**, the number of rows and columns, and the coordinate reference system. A cell's location follows from its row and column, so coordinates are not stored for each cell.",
        "Cell values can be integers, often codes for categories (1 = water, 2 = forest), or floating-point numbers for continuous quantities such as elevation in meters. Cells with no data, such as areas outside a survey, get a special **NoData** value so they are not mistaken for real values like zero. Images can have several **bands**, each a separate grid of values for the same cells, such as the red, green, blue and near-infrared bands of a satellite image.",
        "When a cell covers more than one feature, a rule decides its value: the value at the cell center, the value covering the largest share of the cell (dominant area), or the presence of an important feature anywhere in the cell. Different rules give different rasters from the same source data."
      ],
      bullets: [
        "Raster strengths: simple structure, natural for continuous surfaces and imagery, fast overlay of grids that line up.",
        "Raster weaknesses: stair-stepped boundaries, precision limited by cell size, and files that grow quickly as cells shrink.",
        "Vector strengths: precise boundaries, compact storage for discrete features, rich attribute tables and network topology.",
        "Vector weaknesses: continuous surfaces are hard to represent, and overlay calculations are more complex."
      ],
      qgis: "Layer Properties → Information shows a raster's cell size, rows, columns, extent, data type, number of bands and NoData value."
    },
    {
      heading: "Cell size, resolution and file size",
      paragraphs: [
        "**Cell size** (spatial resolution) is the ground width of one cell, such as 30 m for Landsat or 1 m for many lidar elevation models. Smaller cells mean higher resolution and finer detail. Features smaller than about one cell usually cannot be seen.",
        "Resolution has a cost. Halving the cell size doubles the number of rows and doubles the number of columns, so the cell count goes up four times. Going from 10 m to 1 m cells multiplies the cell count by 100.",
        "File size depends on the cell count, the number of bands and the bytes per value (1 byte for 8-bit integers, 4 bytes for 32-bit floating point). Compression helps when neighboring cells repeat. **Run-length encoding** stores each run of identical values as a count and a value, so a row of `AAAAABBBCC` becomes `5A 3B 2C`."
      ],
      formula: {
        expr: "cells = (width ÷ cell size) × (height ÷ cell size);  bytes = cells × bands × bytes per value",
        where: [
          "width, height: ground extent of the raster, in the same units as the cell size",
          "bands: number of value layers (1 for a DEM, 3 for an RGB photo)",
          "bytes per value: 1 for 8-bit, 2 for 16-bit, 4 for 32-bit data"
        ]
      },
      example: {
        prompt: "A 32-bit floating-point DEM covers an area 15 km east–west by 9 km north–south with 10 m cells. How many cells does it have, and how large is it uncompressed? What happens with 1 m cells?",
        steps: [
          "Columns = 15,000 m ÷ 10 m = 1,500. Rows = 9,000 m ÷ 10 m = 900.",
          "Cells = 1,500 × 900 = 1,350,000.",
          "Size = 1,350,000 cells × 1 band × 4 bytes = 5,400,000 bytes, about 5.4 MB.",
          "With 1 m cells there are 15,000 columns and 9,000 rows: 135,000,000 cells × 4 bytes = 540,000,000 bytes, about 540 MB."
        ],
        answer: "1,350,000 cells and about 5.4 MB at 10 m; 100 times more (about 540 MB) at 1 m."
      }
    },
    {
      heading: "TINs and surfaces",
      paragraphs: [
        "A **triangulated irregular network (TIN)** represents a surface with points that have x, y and z values, connected into a mesh of non-overlapping triangles. Each triangle is a flat facet with its own slope and aspect. Because the points are irregularly spaced, a TIN can use many points where terrain is complex and few where it is flat, which a regular grid cannot do.",
        "Most TINs use a **Delaunay triangulation**, in which no point falls inside the circle through the three corners of any triangle. This avoids long, thin triangles. **Breaklines** are lines such as stream channels, ridges, curbs and retaining walls that triangle edges are forced to follow, so the surface shows a sharp change in slope where one really occurs.",
        "Civil design software often uses TINs for existing and proposed ground surfaces to compute earthwork volumes and draw contours. Raster **digital elevation models (DEMs)** are more common for large-area analysis such as watershed delineation. A DEM usually means bare-earth elevation; a **digital surface model (DSM)** includes the tops of buildings and trees."
      ],
      qgis: "Processing Toolbox → Interpolation → TIN interpolation builds a TIN from points and writes it out as a raster. Raster → Extraction → Contour draws contour lines from a DEM."
    },
    {
      heading: "Converting between vector and raster",
      paragraphs: [
        "**Rasterizing** turns vector features into cells. You choose a cell size and a rule for assigning values. Smooth boundaries become stair-steps, and features narrower than a cell may break up or vanish. Lines become chains of cells whose width is set by the cell size.",
        "**Polygonizing** (raster-to-vector conversion) turns groups of connected cells with the same value into polygons. The polygon edges follow cell edges, so they look blocky, and a noisy raster produces many tiny polygons that may need to be merged or smoothed.",
        "Each conversion loses some information, and converting back does not restore it. Choose a cell size small enough to keep the features you care about, and convert as few times as you can."
      ],
      qgis: "Use Raster → Conversion → Rasterize (Vector to Raster) and Raster → Conversion → Polygonize (Raster to Vector). Both are GDAL tools that also appear in the Processing Toolbox under GDAL."
    },
    {
      heading: "Common file formats",
      paragraphs: [
        "The **shapefile**, introduced by Esri in the early 1990s, is still a widely shared vector format. It is a set of files with the same name: `.shp` (geometry), `.shx` (index) and `.dbf` (attributes) are required, and `.prj` stores the coordinate reference system. Limits include field names of 10 characters or fewer, a 2 GB size limit per file, one geometry type per shapefile and no stored topology. Always copy and send all the files together, ideally zipped.",
        "A **GeoPackage** (`.gpkg`) is an open standard from the Open Geospatial Consortium (OGC) built on an SQLite database. One file can hold many vector layers, raster tiles and plain tables, with long field names and no 2 GB limit. It is the default format for new layers in QGIS.",
        "For rasters, **GeoTIFF** (`.tif`) is the most common format: a TIFF image with tags that store the coordinate reference system and the link between cell positions and map coordinates. Other formats you will meet include GeoJSON (text-based vector data for the web, in WGS 84 longitude and latitude), KML/KMZ (Google Earth), Esri file geodatabases (`.gdb` folders), LAS/LAZ (lidar point clouds) and CSV files with coordinate columns."
      ],
      qgis: "Save a copy of a layer in another format with right-click → Export → Save Features As (vector) or Export → Save As (raster). Load a CSV with x and y columns using Layer → Add Layer → Add Delimited Text Layer."
    }
  ],
  cards: [
    { front: "Object (discrete) view", back: "Sees the world as distinct things with clear boundaries, such as buildings, roads and parcels. Usually stored with the vector model." },
    { front: "Field (continuous) view", back: "Sees the world as quantities that vary continuously and have a value everywhere, such as elevation or temperature. Usually stored as a raster or TIN." },
    { front: "Vector data model", back: "Represents features as points, lines and polygons built from x, y coordinates, with attributes in a linked table." },
    { front: "Raster data model", back: "Represents space as a grid of equal-sized cells in rows and columns, each holding one value." },
    { front: "Vertex", back: "A coordinate pair along a line or polygon boundary where the direction can change. Straight segments connect the vertices." },
    { front: "Node", back: "The start or end point of a line. In a topological model, lines connect to each other only at nodes." },
    { front: "Polygon", back: "A closed ring of vertices, with the same first and last point, that encloses an area. It may include interior rings (holes)." },
    { front: "Multipart feature", back: "One feature record made of several separate shapes, such as a state made of several islands." },
    { front: "Topology", back: "The spatial relationships between features, such as connectivity, adjacency and containment, that stay the same when a map is stretched or bent." },
    { front: "Connectivity", back: "The topological relationship telling which lines meet at which nodes. Needed for network tracing and routing." },
    { front: "Adjacency", back: "The topological relationship telling which polygons share a boundary, often stored as the left and right polygon of each line." },
    { front: "Spaghetti data", back: "Vector data with no stored topology. Each feature is stored on its own, so a shared boundary is stored twice." },
    { front: "Key field", back: "A field whose values identify records, such as a parcel ID, used to join or relate tables." },
    { front: "Table join", back: "Attaching the columns of one table to another wherever their key fields match, such as adding census counts to tract polygons." },
    { front: "Nominal data", back: "Names or category codes with no order, such as soil type or land cover class. Counting makes sense; averaging does not." },
    { front: "Ordinal data", back: "Values with a rank order but unequal or unknown spacing, such as road class (local, collector, arterial)." },
    { front: "Interval data", back: "Numbers with meaningful differences but no true zero, such as temperature in °C. Ratios like 'twice as hot' are not meaningful." },
    { front: "Ratio data", back: "Numbers with a true zero, so differences and ratios are both meaningful, such as length, flow rate or population." },
    { front: "Cell size", back: "The ground width of one raster cell, such as 30 m. Also called spatial resolution; smaller cells mean finer detail." },
    { front: "NoData", back: "A special raster value marking cells with no measurement, so they are not mistaken for real values such as zero." },
    { front: "Band", back: "One layer of values in a multiband raster, such as the near-infrared band of a satellite image." },
    { front: "Run-length encoding", back: "Raster compression that stores each run of identical cell values as a count and a value; AAAAABB becomes 5A 2B." },
    { front: "TIN", back: "Triangulated irregular network: a surface of non-overlapping triangles connecting irregularly spaced points that have x, y and z values." },
    { front: "Delaunay triangulation", back: "A triangulation in which no point lies inside the circle through any triangle's three corners. It avoids long, thin triangles." },
    { front: "Breakline", back: "A line, such as a stream, ridge or curb, that TIN edges must follow so the surface shows a sharp change in slope there." },
    { front: "DEM vs. DSM", back: "A digital elevation model usually shows the bare-earth ground; a digital surface model includes the tops of buildings and trees." },
    { front: "Shapefile", back: "Esri's multi-file vector format: .shp, .shx and .dbf required, .prj for the CRS. Field names are limited to 10 characters." },
    { front: "GeoPackage", back: "An OGC open standard: one SQLite file (.gpkg) that can hold many vector layers, raster tiles and tables. The QGIS default format." },
    { front: "GeoTIFF", back: "A TIFF image with embedded tags that give its coordinate reference system and how cell positions map to coordinates." },
    { front: "Rasterize vs. polygonize", back: "Rasterize converts vector features to cells; polygonize converts groups of connected same-valued cells into polygons." }
  ],
  questions: [
    {
      id: "ch02-q01",
      type: "mc",
      prompt: "Which of these is best described with a field (continuous) view rather than an object view?",
      choices: [
        "Building footprints across a city",
        "Fire hydrants along a street",
        "Air temperature across a valley",
        "Property parcels across a county"
      ],
      answer: 2,
      explain: "Temperature has a value at every location and changes gradually, which is the field view. Buildings, hydrants and parcels are distinct objects with clear boundaries."
    },
    {
      id: "ch02-q02",
      type: "mc",
      prompt: "On a polyline, what are the points between the two end points that define its shape called?",
      choices: [
        "Nodes",
        "Vertices",
        "Centroids",
        "Cells"
      ],
      answer: 1,
      explain: "Vertices give a line its shape. Nodes are the end points, where lines connect in a topological model."
    },
    {
      id: "ch02-q03",
      type: "mc",
      prompt: "A water utility wants to trace every pipe downstream of a broken main. Which topological relationship does the tracing tool depend on?",
      choices: [
        "Containment",
        "Adjacency",
        "Connectivity",
        "Proximity"
      ],
      answer: 2,
      explain: "Tracing follows pipes that are connected at nodes. Adjacency is about polygons sharing boundaries, and two pipes can be close together (proximity) without being connected."
    },
    {
      id: "ch02-q04",
      type: "mc",
      prompt: "In a topological polygon model, what does adjacency information tell you?",
      choices: [
        "Which polygons share a common boundary",
        "How far apart two polygon centroids are",
        "Which polygon has the largest area",
        "The order in which the polygons were digitized"
      ],
      answer: 0,
      explain: "Adjacency records neighbors, usually as the left and right polygon of each boundary line. Distance and area are measurements, not topological relationships."
    },
    {
      id: "ch02-q05",
      type: "tf",
      prompt: "A shapefile stores topology, so the boundary shared by two neighboring parcels is stored only once.",
      answer: false,
      explain: "Shapefiles store simple features. Each parcel polygon stores its full boundary, so a shared edge is stored twice and the two copies can drift apart during editing."
    },
    {
      id: "ch02-q06",
      type: "mc",
      prompt: "Thin sliver polygons often appear between neighboring polygons in data with no stored topology. Why?",
      choices: [
        "The polygons were rasterized with a cell size too large to hold the shared edge",
        "The attribute table has duplicate IDs, so two records point to the same boundary",
        "The layer was saved in GeoPackage format, which rounds coordinates along shared edges",
        "The shared boundary was digitized twice, and the two copies do not match exactly"
      ],
      answer: 3,
      explain: "When each polygon stores its own copy of a shared edge, small differences between the copies leave thin gaps or overlaps. A topological model stores the edge once, so slivers cannot form."
    },
    {
      id: "ch02-q07",
      type: "num",
      prompt: "A land cover raster covers an area 6 km by 4 km with 20 m cells. How many cells does it contain?",
      answer: 60000,
      tol: 0,
      unit: "cells",
      explain: "Columns = 6,000 m ÷ 20 m = 300. Rows = 4,000 m ÷ 20 m = 200. Cells = 300 × 200 = 60,000."
    },
    {
      id: "ch02-q08",
      type: "num",
      prompt: "You replace a 10 m DEM with a 1 m lidar DEM covering the same area. How many times more cells does the new DEM have?",
      answer: 100,
      tol: 0,
      unit: "times",
      explain: "The cell size is 10 times smaller, so there are 10 times as many rows and 10 times as many columns: 10 × 10 = 100 times as many cells."
    },
    {
      id: "ch02-q09",
      type: "num",
      prompt: "A drone orthophoto has 4,000 rows and 5,000 columns with 3 bands (red, green, blue), each stored as an 8-bit (1-byte) integer. What is its uncompressed size in MB (1 MB = 1,000,000 bytes)?",
      answer: 60,
      tol: 0.1,
      unit: "MB",
      explain: "4,000 × 5,000 = 20,000,000 cells. 20,000,000 × 3 bands × 1 byte = 60,000,000 bytes = 60 MB."
    },
    {
      id: "ch02-q10",
      type: "mc",
      prompt: "A land cover raster codes open water as 11, urban as 21 and deciduous forest as 41. What level of measurement are these codes?",
      choices: [
        "Ordinal",
        "Interval",
        "Ratio",
        "Nominal"
      ],
      answer: 3,
      explain: "The numbers are labels for categories. Forest (41) is not 'more' than urban (21), and averaging the codes means nothing. Ordinal data would need a meaningful order."
    },
    {
      id: "ch02-q11",
      type: "mc",
      prompt: "Which attribute is measured on a ratio scale?",
      choices: [
        "Pipe length in meters",
        "Temperature in degrees Celsius",
        "Road class (local, collector, arterial)",
        "Soil series name"
      ],
      answer: 0,
      explain: "Length has a true zero, so a 200 m pipe really is twice as long as a 100 m pipe. Celsius temperature is interval (0 °C is not 'no temperature'), road class is ordinal, and soil names are nominal."
    },
    {
      id: "ch02-q12",
      type: "mc",
      prompt: "A 30 m cell is 60% forest and 40% water, and the cell center falls in the water. Using the dominant-area rule, what value does the cell get?",
      choices: [
        "Water",
        "Forest",
        "NoData",
        "The average of the two class codes"
      ],
      answer: 1,
      explain: "The dominant-area rule assigns the class covering the largest share of the cell, which is forest at 60%. A cell-center rule would give water, which shows that the rule changes the result."
    },
    {
      id: "ch02-q13",
      type: "mc",
      prompt: "What is a main advantage of a TIN over a regular-grid DEM?",
      choices: [
        "It always uses less disk space than a grid, however rough or smooth the surface is",
        "Its point density can vary: many points where terrain is complex, few where it is flat",
        "Each triangle stores a land cover class as well as the elevation of its corners",
        "It cannot contain errors, because every triangle passes exactly through measured points"
      ],
      answer: 1,
      explain: "A grid spends the same number of cells on a flat parking lot as on a steep cut slope. A TIN puts points where they are needed. It is not always smaller, and it inherits any errors in its input points."
    },
    {
      id: "ch02-q14",
      type: "mc",
      prompt: "In a TIN of a highway corridor, the edge of pavement and the flow line of a roadside ditch are entered as breaklines. Why?",
      choices: [
        "To make triangle edges follow those lines so the slope changes sharply there",
        "To remove the points along those lines so the road surface is smoother",
        "To mark where the TIN should be cut when it is converted to a raster",
        "To store the lines as labeled features that print on the final plan sheet"
      ],
      answer: 0,
      explain: "Without breaklines, triangles can span across a ditch or curb and smooth it out, which gives wrong cross sections and volumes. Breaklines make triangle edges follow those lines."
    },
    {
      id: "ch02-q15",
      type: "tf",
      prompt: "In a Delaunay triangulation, no input point lies inside the circle that passes through the three corners of any triangle.",
      answer: true,
      explain: "This empty-circle property defines a Delaunay triangulation. It produces triangles that are as close to equilateral as the points allow."
    },
    {
      id: "ch02-q16",
      type: "mc",
      prompt: "An 8 m wide stream polygon is rasterized with 30 m cells using the cell-center rule. What is the most likely result?",
      choices: [
        "A smooth stream exactly 8 m wide, because the polygon edges are kept",
        "A continuous line of cells exactly 30 m wide, with no gaps anywhere",
        "A broken chain of cells, with gaps wherever the stream misses a cell center",
        "An error, because polygons narrower than one cell cannot be rasterized"
      ],
      answer: 2,
      explain: "A cell is coded as stream only if the stream covers its center. A narrow stream will cover some centers and miss others, so it comes out broken. Use smaller cells to keep narrow features."
    },
    {
      id: "ch02-q17",
      type: "mc",
      prompt: "What does converting a classified land cover raster to polygons usually produce?",
      choices: [
        "Polygons with smooth, curved edges like the original features",
        "Polygons whose edges are stair-stepped along cell boundaries",
        "A point at the center of every cell, holding its class value",
        "Exactly one polygon per class, with no holes or gaps"
      ],
      answer: 1,
      explain: "Polygon edges follow the cell edges, so boundaries look blocky unless smoothed afterward. Each separate patch of a class becomes its own polygon, so there are usually many polygons per class."
    },
    {
      id: "ch02-q18",
      type: "mc",
      prompt: "A consultant must deliver a parcel layer with field names such as OWNER_MAILING_ADDRESS, plus two related layers and a lookup table, to a client who uses QGIS. Which format fits best?",
      choices: [
        "Shapefile",
        "GeoTIFF",
        "GeoPackage",
        "A text file of coordinates"
      ],
      answer: 2,
      explain: "A GeoPackage holds several layers and tables in one file and allows long field names. A shapefile would cut field names to 10 characters and need a separate set of files per layer, and GeoTIFF is a raster format."
    },
    {
      id: "ch02-q19",
      type: "mc",
      prompt: "A colleague sends you only the .shp, .shx and .dbf files of a shapefile. What information is missing?",
      choices: [
        "The attribute values",
        "The coordinate reference system definition",
        "The feature geometry",
        "The index that links each shape to its record"
      ],
      answer: 1,
      explain: "The CRS lives in the .prj file. The .shp holds geometry, the .shx holds the index and the .dbf holds attributes. Without the .prj you must find out the CRS and assign it yourself."
    },
    {
      id: "ch02-q20",
      type: "mc",
      prompt: "What makes a GeoTIFF different from an ordinary TIFF image?",
      choices: [
        "It is always compressed, so it takes less disk space than a plain TIFF",
        "It can store only elevation values, not aerial photos or land cover",
        "It stores vector features and their attributes alongside the pixels",
        "It has tags that give its CRS and how pixel positions map to coordinates"
      ],
      answer: 3,
      explain: "The georeferencing tags let GIS software place each cell on Earth. GeoTIFFs can hold any kind of raster, compressed or not."
    },
    {
      id: "ch02-q21",
      type: "tf",
      prompt: "Halving the cell size of a raster doubles the number of cells.",
      answer: false,
      explain: "Halving the cell size doubles both the rows and the columns, so the cell count goes up four times (2 × 2)."
    },
    {
      id: "ch02-q22",
      type: "mc",
      prompt: "Run-length encoding saves the most space for which raster?",
      choices: [
        "A land use raster with large areas of a single class",
        "A noisy satellite band where neighboring cells rarely match",
        "A floating-point DEM of rugged mountains",
        "A raster of random numbers"
      ],
      answer: 0,
      explain: "Run-length encoding stores each run of repeated values once. Long runs of the same class compress well; when neighboring values rarely match, there are no runs to shorten."
    },
    {
      id: "ch02-q23",
      type: "mc",
      prompt: "A Landsat scene stores red, green, blue and near-infrared values for every cell. In raster terms, what is each of these?",
      choices: [
        "An extent",
        "A tile",
        "A band",
        "A field"
      ],
      answer: 2,
      explain: "A band is one grid of values for the same set of cells. A multiband image stacks several bands with the same rows, columns and cell size."
    },
    {
      id: "ch02-q24",
      type: "mc",
      prompt: "How should cells outside the surveyed area of a lidar DEM be stored?",
      choices: [
        "As zero, meaning no elevation",
        "As NoData, so analysis tools ignore them",
        "As the average elevation of the DEM",
        "As the highest elevation in the DEM"
      ],
      answer: 1,
      explain: "Zero would be read as an elevation of 0 m and would ruin slope, statistics and flow calculations near the edges. NoData marks the cells as having no value."
    },
    {
      id: "ch02-q25",
      type: "mc",
      prompt: "A city wants to store its sanitary sewer system so it can find all pipes and manholes upstream of the treatment plant. Which representation fits best?",
      choices: [
        "A 1 m raster with cells coded 1 where a pipe exists and 0 elsewhere",
        "A TIN built from manhole rim and invert elevations across the city",
        "Polygons showing the area each pipe serves, with pipe size as an attribute",
        "Lines for pipes and points for manholes, connected at the manholes"
      ],
      answer: 3,
      explain: "Network tracing needs connected lines with attributes such as size and flow direction. A raster of pipe cells has no reliable connections or pipe attributes, and a TIN or service-area polygons do not model the network."
    },
    {
      id: "ch02-q26",
      type: "tf",
      prompt: "A digital surface model (DSM) shows bare-earth ground elevation with buildings and trees removed.",
      answer: false,
      explain: "A DSM includes the tops of buildings, trees and other objects. A bare-earth model is a DEM (sometimes called a DTM)."
    },
    {
      id: "ch02-q27",
      type: "mc",
      prompt: "To attach a census table of population by tract to a tract polygon layer, what must both tables share?",
      choices: [
        "The same number of fields, listed in the same order",
        "The same coordinate reference system, such as NAD83",
        "A key field with matching values, such as tract GEOID",
        "The same file format, such as both being shapefiles"
      ],
      answer: 2,
      explain: "A join matches records by a shared key. A table with no geometry has no CRS, and the tables can have different fields and formats."
    },
    {
      id: "ch02-q28",
      type: "mc",
      prompt: "How is a lake that contains an island best stored as a vector feature?",
      choices: [
        "As a polygon with an interior ring (hole) where the island is",
        "As two overlapping polygons with the island on top",
        "As a line around the outer shore only",
        "As a point at the center of the lake"
      ],
      answer: 0,
      explain: "The hole removes the island from the lake's area, so area and overlay results are correct. Overlapping polygons would count the island as lake area."
    }
  ]
});
