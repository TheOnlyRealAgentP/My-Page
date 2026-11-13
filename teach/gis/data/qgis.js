GIS.chapter({
  id: "qgis",
  num: 16,
  title: "QGIS in Practice",
  blurb: "A hands-on tour of QGIS for engineering work: loading and projecting data, calculating and querying attributes, styling, running Processing tools, georeferencing scans and laying out a finished map for a report.",
  objectives: [
    "Find your way around the QGIS window: Browser, Layers panel, map canvas, Processing Toolbox and status bar.",
    "Set the project CRS, and tell assigning a layer's CRS apart from reprojecting it.",
    "Add vector, raster, delimited text (X/Y) and web layers to a project.",
    "Write Field Calculator and Select by Expression statements, and join tables by attribute or by location.",
    "Style layers with categorized, graduated and rule-based symbology, and add labels.",
    "Run Buffer, Clip, Intersection, Dissolve, Reproject Layer and the Raster calculator, and save results to GeoPackage.",
    "Georeference a scanned map and build a print layout with a map, scale bar, north arrow and legend exported to PDF."
  ],
  guide: [
    {
      heading: "The QGIS window and projects",
      paragraphs: [
        "QGIS is a free, open-source desktop GIS. The **map canvas** in the middle draws your layers. The **Layers panel** lists the layers in the project. Layers higher in the list draw on top, and each checkbox turns a layer on or off. The **Browser panel** works like a file explorer for spatial data: it shows folders, GeoPackages, databases and web services, and you can drag a data set from it onto the canvas.",
        "The **Processing Toolbox** (Processing > Toolbox, Ctrl+Alt+T) holds hundreds of analysis tools, with a search box at the top. The **status bar** along the bottom shows the cursor coordinates, the map scale and the project CRS as an EPSG code. Double-click a layer to open **Layer Properties**, where symbology, labels, joins, metadata and source settings live.",
        "A project is saved as a .qgz file. It stores links (file paths) to your data, along with styles and layouts, but not the data themselves. If you move or rename data files, the project shows broken layers until you point them to the new location. Keeping a project and its data in one folder avoids most of this trouble."
      ],
      bullets: [
        "**Plugins** add tools. Install them with Plugins > Manage and Install Plugins. Core plugins ship with QGIS; others come from the official repository and are maintained by their authors, so check that a plugin is current before you depend on it.",
        "If you close a panel by accident, reopen it from View > Panels."
      ]
    },
    {
      heading: "Project CRS and layer CRS",
      paragraphs: [
        "Every layer has its own CRS, and the project has one CRS used for display. QGIS reprojects layers **on the fly**, so layers stored in different CRSs line up on the canvas without changing the source files. A new project starts in EPSG:4326 (WGS 84), and by default QGIS then switches the project to the CRS of the first layer you add. Both defaults can be changed in Settings > Options > CRS. Change the project CRS in Project > Properties > CRS, or click the EPSG button in the status bar.",
        "Two operations sound alike but do very different things. **Setting (assigning) a layer's CRS** (Layer > Set CRS of Layer(s), Ctrl+Shift+C) only changes how QGIS interprets the coordinates already in the file. Use it only when the CRS is missing or mislabeled. **Reprojecting** (Vector > Data Management Tools > Reproject Layer) calculates new coordinates and writes a new layer. Assigning the wrong CRS puts data in the wrong place on Earth.",
        "Distance tools such as Buffer work in the units of the layer's CRS. Buffering a latitude/longitude layer by 100 gives 100 degrees, not 100 m. Reproject to a projected CRS in meters or feet first. For most of Utah, NAD83 / UTM zone 12N (EPSG:26912) or the appropriate Utah State Plane zone are common choices."
      ]
    },
    {
      heading: "Adding vector, raster, CSV and web layers",
      paragraphs: [
        "Most data enter through the **Data Source Manager** (Layer > Data Source Manager, Ctrl+L) or the Layer > Add Layer menu. Add Vector Layer (Ctrl+Shift+V) opens shapefiles, GeoPackages, GeoJSON and KML. Add Raster Layer (Ctrl+Shift+R) opens GeoTIFFs and DEMs. Dragging a file from the Browser panel works too.",
        "A spreadsheet of survey points saved as CSV comes in through **Add Delimited Text Layer** (Ctrl+Shift+T). Under Geometry definition choose **Point coordinates**, set the **X field** to the longitude or easting column and the **Y field** to the latitude or northing column, and pick the **Geometry CRS** the coordinates were recorded in. Swapping X and Y, or choosing the wrong CRS, puts the points in the wrong place or off the map entirely.",
        "Web layers stream from servers. Add WMS/WMTS Layer (Ctrl+Shift+W) connects to map image services. The Browser panel's XYZ Tiles entry offers tiled basemaps such as OpenStreetMap, and WFS connections bring in vector features you can query. Web layers need an internet connection and come with the provider's terms of use."
      ],
      example: {
        prompt: "A field crew sends a CSV of manhole locations with columns id, lon and lat, and values like −111.658, 40.252 recorded with a handheld GPS. How should you load it, and what should you do before measuring distances?",
        steps: [
          "Layer > Add Layer > Add Delimited Text Layer; choose the file and the CSV format.",
          "Geometry definition: Point coordinates. X field = lon, Y field = lat.",
          "Geometry CRS: EPSG:4326 (WGS 84), since the values are decimal degrees from a GPS. Confirm with the crew if unsure.",
          "Before measuring, use Vector > Data Management Tools > Reproject Layer to make a copy in EPSG:26912 so distances are in meters."
        ],
        answer: "X = lon, Y = lat, Geometry CRS = EPSG:4326; reproject to a projected CRS such as EPSG:26912 before any distance work."
      }
    },
    {
      heading: "The attribute table and Field Calculator",
      paragraphs: [
        "Open a layer's **attribute table** with F6 or right-click > Open Attribute Table. Each row is a feature and each column is a field. Selecting rows highlights the matching features on the map.",
        "The **Field Calculator** (Ctrl+I, or the abacus button in the attribute table) fills a new or existing field from an expression. For a new field, set its name, type (whole number, decimal, text, date) and length. If the layer is not in edit mode, QGIS switches it on; save afterward with Save Layer Edits or by toggling editing off. A **virtual field** is recalculated on the fly and stored in the project, not in the data file.",
        "In expressions, field names go in double quotes and text values in single quotes. `$area` and `$length` measure each feature using the project's ellipsoid and unit settings, while `area($geometry)` returns flat (planimetric) area in the units of the layer's CRS."
      ],
      bullets: [
        "`$area / 10000` gives hectares when the area units are square meters.",
        "`\"area_m2\" / 4046.86` converts square meters to acres.",
        "`round($length, 1)` gives line length rounded to one decimal place.",
        "`\"street\" || ', ' || \"city\"` joins text fields into one string.",
        "`CASE WHEN \"slope_pct\" > 15 THEN 'steep' ELSE 'gentle' END` assigns a class from a condition."
      ],
      example: {
        prompt: "A detention-basin layer has a field area_m2. Write a Field Calculator expression that gives acres rounded to two decimals, and evaluate it for a basin of 52,600 m².",
        steps: [
          "Expression: `round(\"area_m2\" / 4046.86, 2)`",
          "52,600 / 4,046.86 = 12.998",
          "Rounded to two decimals: 13.00"
        ],
        answer: "13.00 acres"
      }
    },
    {
      heading: "Selecting features and joining tables",
      paragraphs: [
        "**Select by Expression** (Edit > Select > Select Features by Expression, Ctrl+F3, or the expression button in the attribute table) selects features whose attributes meet a condition, such as `\"zoning\" = 'R-1' AND $area > 1000`. **Select by Location** (Vector > Research Tools > Select by Location) selects features by their spatial relationship to another layer: intersect, contain, are within, touch, overlap, cross, equal or disjoint. Selected features are highlighted (yellow by default), and many tools offer a **Selected features only** option.",
        "An **attribute join** (Layer Properties > Joins, then the + button) attaches columns from a table to a layer through a shared key. You choose the **join layer**, the **join field** in that table and the **target field** in your layer. The join is one-to-one: if a key repeats in the join table, only the first match is used. Keys must match exactly, so a county code stored as the text '049' will not match the number 49. The join lives in the project; export the layer to make the joined fields permanent.",
        "A **spatial join** attaches attributes by location instead of by key. Vector > Data Management Tools > Join Attributes by Location can, for example, give each culvert the name of the watershed polygon it falls in."
      ]
    },
    {
      heading: "Symbology and labels",
      paragraphs: [
        "Styling lives in Layer Properties > Symbology. **Single Symbol** draws every feature the same way. **Categorized** gives each unique value of a field its own symbol, as for land use or pipe material; click Classify to build the list. **Graduated** splits a numeric field into ranges with a color ramp or symbol sizes, as for population density or pipe age. **Rule-based** gives each symbol its own expression, such as drawing water mains with `\"diam_in\" >= 12` in a thicker line.",
        "For graduated symbols, the classification **mode** shapes the message. Equal Interval makes ranges of equal width. Equal Count (Quantile) puts the same number of features in each class. Natural Breaks (Jenks) groups values to keep each class as uniform as possible. Standard Deviation and Pretty Breaks are also available. The same data can look very different under different modes, so choose deliberately and state which one you used.",
        "Labels are set in Layer Properties > Labels. Choose **Single Labels** and set the value to a field or an expression, such as `\"name\" || ' (' || \"diam_in\" || ' in)'`. A text buffer (halo) keeps labels readable over aerial imagery, and rule-based labeling gives different features different label styles."
      ]
    },
    {
      heading: "Processing tools and saving results",
      paragraphs: [
        "The common vector tools are under Vector > Geoprocessing Tools and in the Processing Toolbox. Each opens a dialog with inputs, parameters and an output. By default, outputs are **temporary layers**, which vanish when you close QGIS. Save them by typing an output file name before running, or right-click the temporary layer and choose Make Permanent. To run a tool on many inputs, right-click it in the Toolbox and choose Execute as Batch Process.",
        "Save finished data in **GeoPackage** (.gpkg), an OGC standard format and the QGIS default for new vector files. One GeoPackage file can hold many vector layers, rasters and tables. It avoids shapefile limits such as 10-character field names, 2 GB file size and the set of companion files (.shp, .shx, .dbf, .prj) that must travel together. To save a layer, right-click it and choose Export > Save Features As, pick GeoPackage, and set the file name, layer name and CRS."
      ],
      bullets: [
        "**Buffer**: zones at a set distance around features. The distance is in layer CRS units; Dissolve result merges overlapping buffers.",
        "**Clip**: cuts the input layer to the outline of an overlay layer. The output keeps only the input's attributes.",
        "**Intersection**: keeps only the areas where both layers overlap and combines attributes from both.",
        "**Dissolve**: merges features that share a value in the chosen field and removes the boundaries between them.",
        "**Reproject Layer**: writes a copy of a layer in a new CRS.",
        "**Raster calculator** (Raster > Raster calculator): cell-by-cell map algebra using band references like `\"dem@1\"`. For example, `\"dem@1\" > 1500` returns 1 where elevation exceeds 1500 and 0 elsewhere."
      ],
      example: {
        prompt: "A proposed sewer line needs a list of every parcel within 150 m of its centerline. The parcels and the line are both in EPSG:26912. Outline the steps.",
        steps: [
          "Vector > Geoprocessing Tools > Buffer: input = sewer line, distance = 150 (meters, since EPSG:26912 uses meters), check Dissolve result.",
          "Vector > Research Tools > Select by Location: select parcels that intersect the buffer.",
          "Open the parcel attribute table and filter to selected features to review owners and IDs.",
          "Right-click the parcel layer > Export > Save Selected Features As, and save to a GeoPackage."
        ],
        answer: "A GeoPackage layer of parcels that intersect the 150 m buffer, ready for the notification list."
      }
    },
    {
      heading: "Georeferencing a scanned map",
      paragraphs: [
        "The **Georeferencer** (Layer > Georeferencer) gives real-world coordinates to a scanned map or image that has none, such as an old plat or an as-built drawing. Open the raster, then add **ground control points (GCPs)**: click a spot on the scan and either type its coordinates or pick the matching spot on a reference layer in the main map canvas. Good GCPs are sharp, permanent features spread across the whole image, like road intersections or section corners.",
        "In Transformation Settings, choose the transformation type, target CRS, resampling method and output file. **Helmert** allows shift, rotation and uniform scale (at least 2 GCPs). **Polynomial 1** is an affine transformation that also allows different scales in x and y and shear, so straight lines stay straight and parallel lines stay parallel (at least 3 GCPs). **Polynomial 2** and **Polynomial 3** can bend the image to correct warping (at least 6 and 10 GCPs). **Thin Plate Spline** rubber-sheets the image so it passes exactly through every GCP.",
        "Check the **residual** for each GCP in the GCP table. A point with a residual far larger than the rest is usually a misclick or a typo; fix or delete it. Use more GCPs than the minimum so the residuals mean something, and keep the RMS error well below the accuracy the project needs. Thin Plate Spline matches every GCP exactly, so its residuals cannot reveal a bad point. Finally, start georeferencing to write a new GeoTIFF."
      ]
    },
    {
      heading: "Print Layout: building a map for a report",
      paragraphs: [
        "A **print layout** is a page where you arrange a finished map. Create one with Project > New Print Layout (Ctrl+P) and give it a name. From the Add Item menu, place a **map** frame (Add Map, then drag a rectangle), a **scale bar**, a **north arrow**, a **legend**, and **labels** for the title, author, date and data sources. The Item Properties panel controls each item, such as the map's scale, the scale bar's units and segments, and which layers the legend lists.",
        "For engineering figures, set the map frame to a round scale (such as 1:2,400 or 1:24,000) and use scale bar units that match the report. Remove legend entries the reader does not need, and state the CRS and data sources. When the figure is final, check **Lock layers** in the map item's properties so later changes in the main canvas do not change it.",
        "Export with Layout > Export as PDF (Export as Image and Export as SVG are also available). PDF keeps line work sharp in a report. The layout is saved inside the project file, and you can save it as a .qpt template to reuse on the next project."
      ],
      example: {
        prompt: "A layout map frame is 150 mm wide and set to 1:2,400. How much ground does it show across its width?",
        steps: [
          "Ground width = frame width × scale denominator",
          "150 mm × 2,400 = 360,000 mm",
          "360,000 mm = 360 m"
        ],
        answer: "360 m across the frame"
      }
    }
  ],
  cards: [
    { front: "Map canvas", back: "The central QGIS window area that draws the project's visible layers." },
    { front: "Layers panel", back: "Lists the layers in the project. Layers higher in the list draw on top; checkboxes turn layers on and off." },
    { front: "Browser panel", back: "A file explorer for spatial data that shows folders, GeoPackages, databases and web services. Drag items onto the canvas to add them." },
    { front: "Processing Toolbox", back: "The searchable panel of analysis algorithms. Open it with Processing > Toolbox (Ctrl+Alt+T)." },
    { front: "QGIS project file (.qgz)", back: "Saves layer links (file paths), styles, layouts and settings. It does not contain the data, so moved files show as broken layers." },
    { front: "On-the-fly reprojection", back: "QGIS transforms every layer to the project CRS for display, so layers in different CRSs line up. Source files are unchanged." },
    { front: "Set CRS of Layer(s)", back: "Assigns a CRS label to a layer without changing its coordinates (Ctrl+Shift+C). Use only when the CRS is missing or wrong." },
    { front: "Reproject Layer", back: "Calculates new coordinates in a target CRS and writes a new layer (Vector > Data Management Tools > Reproject Layer)." },
    { front: "Delimited text layer", back: "A CSV or text table loaded as points by naming its X field (longitude or easting), Y field (latitude or northing) and Geometry CRS." },
    { front: "XYZ Tiles", back: "A Browser panel entry for tiled web basemaps, such as OpenStreetMap, served as image tiles at fixed zoom levels." },
    { front: "Field Calculator", back: "Fills a new or existing field from an expression (Ctrl+I). Turns on edit mode if needed; save edits afterward." },
    { front: "Virtual field", back: "A Field Calculator field recalculated on the fly and stored in the project, not written to the data file." },
    { front: "`$area`", back: "Expression for a feature's area using the project's ellipsoid and area-unit settings. `area($geometry)` gives planar area in layer CRS units." },
    { front: "Quotes in QGIS expressions", back: "Double quotes mark field names (`\"zoning\"`); single quotes mark text values (`'R-1'`)." },
    { front: "Select by Expression", back: "Selects features whose attributes meet an expression. Edit > Select > Select Features by Expression (Ctrl+F3)." },
    { front: "Select by Location", back: "Selects features by spatial relationship (intersect, within, touch, etc.) to another layer. Vector > Research Tools > Select by Location." },
    { front: "Attribute join (Joins tab)", back: "Links a table to a layer by matching join field to target field. One-to-one: if keys repeat, only the first match is used." },
    { front: "Join Attributes by Location", back: "A spatial join that copies attributes from one layer to another based on where features fall, with no shared key needed." },
    { front: "Categorized symbology", back: "Assigns a separate symbol to each unique value of a field, such as land use or pipe material." },
    { front: "Graduated symbology", back: "Splits a numeric field into ranges shown with a color ramp or sizes, using a mode such as Equal Interval or Natural Breaks." },
    { front: "Rule-based symbology", back: "Each symbol has its own filter expression, so complex conditions get their own styles." },
    { front: "Equal Count (Quantile)", back: "A graduated classification mode that puts the same number of features in each class." },
    { front: "Clip vs. Intersection", back: "Clip cuts the input to an overlay's outline and keeps only input attributes. Intersection keeps overlapping areas with attributes from both layers." },
    { front: "Dissolve", back: "Merges features that share a value in the chosen field and removes the boundaries between them." },
    { front: "Temporary layer", back: "The default Processing output, held in memory and lost when QGIS closes unless saved or made permanent." },
    { front: "GeoPackage (.gpkg)", back: "An OGC standard single-file format that holds many vector layers, rasters and tables. The QGIS default for new vector data." },
    { front: "Georeferencer", back: "Layer > Georeferencer. Assigns coordinates to a scanned map or image using ground control points and a transformation." },
    { front: "Ground control point (GCP)", back: "A spot identifiable on both the scan and a reference source, used to compute the georeferencing transformation." },
    { front: "Thin Plate Spline", back: "A georeferencing transformation that bends the image to match every GCP exactly, so residuals cannot flag a bad point." },
    { front: "Print Layout", back: "A page for composing a map with map frame, scale bar, north arrow, legend and labels. Project > New Print Layout (Ctrl+P)." }
  ],
  questions: [
    {
      id: "qgis-q01",
      type: "mc",
      prompt: "Which QGIS panel works like a file explorer for spatial data, showing folders, GeoPackages and web service connections that you can drag onto the map?",
      choices: [
        "Layers panel",
        "Processing Toolbox",
        "Browser panel",
        "Layer Styling panel"
      ],
      answer: 2,
      explain: "The Browser panel lists data sources to add. The Layers panel lists what is already in the project and controls draw order."
    },
    {
      id: "qgis-q02",
      type: "mc",
      prompt: "You add a point layer of survey monuments, but you cannot see the points because an aerial image covers them. What is the simplest fix?",
      choices: [
        "Reproject the point layer to match the aerial image's CRS",
        "Move the point layer above the image in the Layers panel",
        "Change the project CRS to EPSG:4326 so both layers redraw",
        "Export the points to a GeoPackage and add them again"
      ],
      answer: 1,
      explain: "Layers higher in the Layers panel draw on top. The points are there but hidden by the image; reprojecting does not change draw order."
    },
    {
      id: "qgis-q03",
      type: "tf",
      prompt: "A QGIS project file (.qgz) contains a full copy of every data layer in the project.",
      answer: false,
      explain: "The project stores links to the data, plus styles and layouts. Moving or renaming the data files breaks those links."
    },
    {
      id: "qgis-q04",
      type: "mc",
      prompt: "A roads layer in EPSG:26912 (UTM meters) and a schools layer in EPSG:4326 (degrees) line up correctly on the canvas. Why?",
      choices: [
        "QGIS permanently rewrote the schools file in UTM meters when the layer was added",
        "QGIS reprojects each layer to the project CRS on the fly, without editing the files",
        "Both CRSs store coordinates in the same units, so no conversion is needed",
        "QGIS ignores each layer's CRS and draws the stored coordinates exactly as they are"
      ],
      answer: 1,
      explain: "On-the-fly reprojection transforms layers for display only. The schools file still holds degrees until you run Reproject Layer."
    },
    {
      id: "qgis-q05",
      type: "mc",
      prompt: "A parcel shapefile has coordinates like 443000, 4450000 in meters but no .prj file, so QGIS shows an unknown CRS. Its metadata says NAD83 / UTM zone 12N. What should you do?",
      choices: [
        "Run Reproject Layer to convert it from EPSG:4326 to EPSG:26912",
        "Set the project CRS to EPSG:4326 and leave the layer as it is",
        "Use Set CRS of Layer(s) to assign EPSG:26912 to the layer",
        "Georeference the shapefile with ground control points"
      ],
      answer: 2,
      explain: "The coordinates are already UTM; only the label is missing, so you assign the CRS. Reprojecting from EPSG:4326 would treat 443000 as degrees and produce nonsense."
    },
    {
      id: "qgis-q06",
      type: "mc",
      prompt: "A hydrant layer is correctly stored in EPSG:4326. You need a copy in EPSG:26912 so you can measure distances in meters. Which tool should you use?",
      choices: [
        "Reproject Layer",
        "Set CRS of Layer(s)",
        "Change the project CRS only",
        "Georeferencer"
      ],
      answer: 0,
      explain: "Reproject Layer computes new coordinates and writes a new layer. Set CRS would just relabel the degree values as meters and put the hydrants near the origin of the UTM grid."
    },
    {
      id: "qgis-q07",
      type: "mc",
      prompt: "You buffer fire hydrants by 100 to show coverage, and the buffers cover most of the continent. What went wrong?",
      choices: [
        "The Dissolve result option merged the buffers together",
        "The project CRS was set to a UTM zone instead of WGS 84",
        "The buffer used too many segments for each circle",
        "The layer is in a geographic CRS, so 100 meant 100 degrees"
      ],
      answer: 3,
      explain: "Buffer distances are in the layer's CRS units. Reproject to a projected CRS in meters or feet before buffering. The project CRS does not set the buffer units."
    },
    {
      id: "qgis-q08",
      type: "mc",
      prompt: "When loading a CSV of points with columns lat and lon through Add Delimited Text Layer, which column belongs in the X field?",
      choices: [
        "lon",
        "lat",
        "Either one, because QGIS detects the order",
        "Neither; X and Y are only for projected coordinates"
      ],
      answer: 0,
      explain: "X is the east-west coordinate, which is longitude (or easting). Putting latitude in X swaps the axes and puts the points in the wrong place."
    },
    {
      id: "qgis-q09",
      type: "mc",
      prompt: "Which Field Calculator expression correctly converts the field area_m2 to acres?",
      choices: [
        "`'area_m2' / 4046.86`",
        "`\"area_m2\" * 4046.86`",
        "`\"area_m2\" / 10000`",
        "`\"area_m2\" / 4046.86`"
      ],
      answer: 3,
      explain: "Field names go in double quotes, and one acre is about 4,046.86 m², so divide. Single quotes would make 'area_m2' a text value, and dividing by 10,000 gives hectares."
    },
    {
      id: "qgis-q10",
      type: "num",
      prompt: "A detention basin has an area of 52,600 m². Using 1 acre = 4,046.86 m², what is its area in acres? (acres, two decimals)",
      answer: 13.0,
      tol: 0.01,
      unit: "acres",
      explain: "52,600 / 4,046.86 = 12.998, which rounds to 13.00 acres."
    },
    {
      id: "qgis-q11",
      type: "mc",
      prompt: "How does `$area` differ from `area($geometry)` in QGIS expressions?",
      choices: [
        "`$area` works only on rasters, and `area($geometry)` works only on vectors",
        "`$area` follows project ellipsoid settings; `area($geometry)` is planar in layer units",
        "They give identical results in every project and every CRS",
        "`$area` returns perimeter in meters, and `area($geometry)` returns area"
      ],
      answer: 1,
      explain: "The QGIS manual states that `area()` is always planimetric in the geometry's CRS units, while `$area` follows the project's ellipsoid and area-unit settings."
    },
    {
      id: "qgis-q12",
      type: "tf",
      prompt: "A virtual field created with the Field Calculator is written into the layer's GeoPackage or shapefile.",
      answer: false,
      explain: "Virtual fields are stored in the project and recalculated on the fly. Other programs opening the data file will not see them."
    },
    {
      id: "qgis-q13",
      type: "mc",
      prompt: "Which Select by Expression statement selects parcels zoned R-1 that are larger than 1,000 m² (in a project with area units of square meters)?",
      choices: [
        "`'zoning' = \"R-1\" AND $area > 1000`",
        "`\"zoning\" = 'R-1' AND $area > 1000`",
        "`\"zoning\" = 'R-1' OR $area > 1000`",
        "`\"zoning\" = R-1 AND $area > 1000`"
      ],
      answer: 1,
      explain: "Field names take double quotes, text values take single quotes, and both conditions must hold, so AND is needed. OR would also select every large parcel in any zone."
    },
    {
      id: "qgis-q14",
      type: "mc",
      prompt: "For a right-of-way study you need every parcel that touches or overlaps a proposed road corridor polygon. Which approach fits best?",
      choices: [
        "Select by Location: parcels that intersect the corridor polygon",
        "Select by Expression on parcels with `\"zoning\" = 'ROW'`",
        "Dissolve the parcels by owner, then inspect the corridor",
        "Join the corridor to the parcels in the Joins tab"
      ],
      answer: 0,
      explain: "The question is spatial, so Select by Location is the tool, and intersect covers both touching and overlapping. A zoning expression depends on attributes that may not reflect the new corridor."
    },
    {
      id: "qgis-q15",
      type: "mc",
      prompt: "You join a table of census counts to county polygons through the Joins tab, but every joined field shows NULL. The county layer stores FIPS as the number 49, and the table stores it as the text '049'. What is the likely cause?",
      choices: [
        "The join table must be a shapefile rather than a CSV file",
        "The polygons must be reprojected before an attribute join",
        "The keys differ: one is text with a leading zero, the other a number",
        "Joins in the Joins tab work only with point layers"
      ],
      answer: 2,
      explain: "Attribute joins need matching key values. Converting both keys to the same type and format, such as text with leading zeros, fixes the join. CRS has nothing to do with an attribute join."
    },
    {
      id: "qgis-q16",
      type: "tf",
      prompt: "In a Joins tab join, if the join table has several rows with the same key value, QGIS attaches only the first matching row to each feature.",
      answer: true,
      explain: "Layer joins are one-to-one. For one-to-many data, summarize the table first or use a relation."
    },
    {
      id: "qgis-q17",
      type: "mc",
      prompt: "You need to give each culvert point the name of the watershed polygon it falls in. The two layers share no ID field. Which tool should you use?",
      choices: [
        "Joins tab in Layer Properties",
        "Join Attributes by Location",
        "Dissolve",
        "Clip"
      ],
      answer: 1,
      explain: "With no shared key, the link is location, so a spatial join is needed. The Joins tab requires a common attribute."
    },
    {
      id: "qgis-q18",
      type: "mc",
      prompt: "A water-main layer has a text field material with values PVC, DI and CI. Which renderer best shows each material in its own color?",
      choices: [
        "Graduated",
        "Single Symbol",
        "Heatmap",
        "Categorized"
      ],
      answer: 3,
      explain: "Categorized assigns a symbol to each unique value, which fits a text field with a few classes. Graduated is for numeric ranges."
    },
    {
      id: "qgis-q19",
      type: "mc",
      prompt: "In graduated symbology, which classification mode puts the same number of features in each class?",
      choices: [
        "Equal Count (Quantile)",
        "Equal Interval",
        "Natural Breaks (Jenks)",
        "Pretty Breaks"
      ],
      answer: 0,
      explain: "Equal Count splits features evenly among classes. Equal Interval makes the value ranges the same width, which can leave some classes nearly empty."
    },
    {
      id: "qgis-q20",
      type: "mc",
      prompt: "For a utility map, you want mains 12 in and larger drawn as thick red lines and all other mains as thin gray lines. Which renderer is designed for this?",
      choices: [
        "Single Symbol with a thick red line for every main",
        "Rule-based, with a rule `\"diam_in\" >= 12` plus an ELSE rule",
        "Categorized on the pipe material field (PVC, DI, CI)",
        "Point displacement to spread out overlapping mains"
      ],
      answer: 1,
      explain: "Rule-based symbology ties each style to an expression. Categorized on material would group by material, not by size."
    },
    {
      id: "qgis-q21",
      type: "mc",
      prompt: "You need wetland polygons cut to a project boundary, and each wetland piece must also carry the boundary layer's phase number. Which tool should you use?",
      choices: [
        "Clip",
        "Buffer",
        "Intersection",
        "Dissolve"
      ],
      answer: 2,
      explain: "Intersection keeps the overlapping areas and attributes from both layers. Clip would cut the wetlands to the boundary but keep only the wetland attributes, losing the phase number."
    },
    {
      id: "qgis-q22",
      type: "mc",
      prompt: "A parcel layer has many parcels per owner. You want one polygon per owner with internal parcel lines removed. Which tool does this?",
      choices: [
        "Dissolve, using the owner field",
        "Clip, using the owner field",
        "Reproject Layer",
        "Select by Location"
      ],
      answer: 0,
      explain: "Dissolve merges features that share a value in the chosen field and removes the boundaries between them."
    },
    {
      id: "qgis-q23",
      type: "mc",
      prompt: "You ran Buffer, styled the result, saved the project and closed QGIS. When you reopen the project, the buffers are gone. What most likely happened?",
      choices: [
        "The buffer layer was too large for QGIS to save in a project",
        "The project CRS changed when QGIS restarted, hiding the layer",
        "QGIS deletes all buffer outputs at the end of every session",
        "It was a temporary layer that was never saved or made permanent"
      ],
      answer: 3,
      explain: "Processing outputs default to temporary layers. Save them to a file such as a GeoPackage, or use Make Permanent, before closing."
    },
    {
      id: "qgis-q24",
      type: "mc",
      prompt: "Which is an advantage of GeoPackage over the shapefile format?",
      choices: [
        "One file can hold many layers, with field names longer than 10 characters",
        "GeoPackage files can be opened only in QGIS, which keeps them secure",
        "GeoPackage stores data without a CRS, so files are always smaller",
        "GeoPackage keeps attributes in a separate .dbf file for faster edits"
      ],
      answer: 0,
      explain: "GeoPackage is a single-file OGC standard that many programs read. The shapefile needs several companion files and limits field names to 10 characters."
    },
    {
      id: "qgis-q25",
      type: "mc",
      prompt: "A DEM layer is named dem. Which Raster calculator expression returns 1 for cells above 1500 m and 0 for all others?",
      choices: [
        "`dem > 1500`",
        "`\"dem@1\" > 1500`",
        "`\"dem@1\" * 1500`",
        "`'dem@1' > 1500`"
      ],
      answer: 1,
      explain: "Raster bands are referenced as layer@band in double quotes, and comparisons return 1 for true and 0 for false. Multiplying by 1500 just rescales the elevations."
    },
    {
      id: "qgis-q26",
      type: "mc",
      prompt: "What is the minimum number of GCPs the QGIS Georeferencer needs for a Polynomial 1 transformation?",
      choices: [
        "2",
        "4",
        "6",
        "3"
      ],
      answer: 3,
      explain: "Polynomial 1 (affine) needs at least 3 GCPs. Helmert needs 2, Projective 4, and Polynomial 2 needs 6. Using more than the minimum lets residuals reveal bad points."
    },
    {
      id: "qgis-q27",
      type: "mc",
      prompt: "While georeferencing a scanned 1960s subdivision plat with 8 GCPs and Polynomial 1, one GCP shows a residual of 25 pixels while the others are all under 3 pixels. What should you do?",
      choices: [
        "Switch to Thin Plate Spline so all residuals become zero",
        "Ignore it, since the average residual is still acceptable",
        "Check that GCP for a misclick or wrong coordinates, and fix or delete it",
        "Add a north arrow to the plat before continuing"
      ],
      answer: 2,
      explain: "A single large residual usually marks a bad point. Thin Plate Spline would hide the error by forcing the image through it, distorting the area around that point."
    },
    {
      id: "qgis-q28",
      type: "tf",
      prompt: "Because Thin Plate Spline passes exactly through every GCP, its residuals cannot reveal a badly placed GCP.",
      answer: true,
      explain: "TPS matches each GCP exactly, so residuals are zero by design. Check GCP quality with a polynomial transformation before switching to TPS."
    },
    {
      id: "qgis-q29",
      type: "mc",
      prompt: "A design-report figure must keep showing the same layers even after you turn layers on and off in the main canvas for other work. What should you set?",
      choices: [
        "Lock layers in the layout's map item properties",
        "A different project CRS for the main canvas",
        "Rule-based symbology on every layer in the map",
        "Export the layout as SVG instead of as a PDF"
      ],
      answer: 0,
      explain: "Lock layers freezes the map item's layer list, so later changes in the main canvas do not change the figure. The export format does not affect which layers appear."
    },
    {
      id: "qgis-q30",
      type: "num",
      prompt: "A print layout map frame is 150 mm wide and set to a scale of 1:2,400. How many meters of ground does it show across its width? (m)",
      answer: 360,
      tol: 0.5,
      unit: "m",
      explain: "Ground width = 150 mm × 2,400 = 360,000 mm = 360 m."
    }
  ]
});
