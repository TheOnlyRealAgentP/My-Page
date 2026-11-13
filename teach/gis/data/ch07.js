GIS.chapter({
  id: "ch07",
  num: 7,
  title: "Digital Data Sources",
  blurb: "Where ready-made GIS data come from in the United States, how to bring them into a project by download or web service, and how to judge whether a dataset is good enough for the job.",
  objectives: [
    "Name the main US national datasets for elevation, hydrography, land cover, imagery, census geography and soils, and the agency behind each.",
    "Explain how hydrologic unit codes nest and use them to find watersheds.",
    "Distinguish WMS, WMTS, WFS, WCS and ArcGIS REST services and add each to QGIS.",
    "Describe how OpenStreetMap is built and what its license requires.",
    "Read metadata to judge a dataset's scale, accuracy, currency, lineage and coordinate system.",
    "Evaluate whether a dataset is fit for a specific engineering use.",
    "Identify the license terms that control how a dataset can be used and shared."
  ],
  guide: [
    {
      heading: "Where GIS data come from",
      paragraphs: [
        "**Primary data** are data you collect yourself, for example with GNSS, a total station or a drone. **Secondary data** are data someone else collected. Most projects start with secondary data because they are free or cheap and cover large areas, then add primary data where more detail or accuracy is needed.",
        "In the US, secondary data come from several levels of government and from open communities. Federal agencies (USGS, NOAA, USDA, the Census Bureau, FEMA) publish national datasets. State GIS offices collect statewide layers; in Utah, the Utah Geospatial Resource Center (UGRC) maintains the State Geographic Information Database (SGID) at gis.utah.gov. Counties and cities hold the most detailed local data, such as parcels, road centerlines, utilities and zoning. Catalogs such as data.gov help you search across many publishers.",
        "You can **download** a copy of the data or **stream** it from a web service. A download is yours to keep and analyze offline; a service is always current but depends on the server. Either way, record the source, date and coordinate system as soon as you add a layer."
      ],
      bullets: [
        "Common vector formats: shapefile, GeoPackage, file geodatabase, GeoJSON, KML, CSV with coordinate columns.",
        "Common raster formats: GeoTIFF (including Cloud Optimized GeoTIFF), IMG; lidar arrives as LAS or LAZ.",
        "For civil engineering work you will also see FEMA's National Flood Hazard Layer (digital flood maps) and state DOT road and bridge data."
      ]
    },
    {
      heading: "USGS The National Map and 3DEP elevation",
      paragraphs: [
        "**The National Map (TNM)** is the USGS collection of national base data: elevation, orthoimagery, hydrography, geographic names, boundaries, transportation, structures and land cover. You can get it through the TNM Download application or through web services. USGS also builds its US Topo quadrangle maps from these layers.",
        "Elevation comes from the **3D Elevation Program (3DEP)**, which collects lidar across the country (and radar-based IfSAR in Alaska). Standard bare-earth DEM products include a **1 m DEM** built from lidar projects and seamless **1/3 arc-second** (about 10 m) and **1 arc-second** (about 30 m) DEMs. In the conterminous US, elevations are referenced to NAVD 88. All 3DEP products are free and have no use restrictions.",
        "The arc-second DEMs are stored in geographic coordinates, so their cells are not square on the ground. One arc-second of latitude is about 30.9 m everywhere, but one arc-second of longitude shrinks with the cosine of the latitude. Reproject a geographic DEM to a projected CRS in meters before computing slope."
      ],
      formula: {
        expr: "east–west cell width ≈ north–south cell height × cos(latitude)",
        where: [
          "north–south height: about 30.9 m per arc-second of latitude",
          "latitude: in degrees, of the cell's location"
        ]
      },
      example: {
        prompt: "About how large are 1/3 arc-second DEM cells at 40° N latitude, in each direction?",
        steps: [
          "North–south: 30.9 m ÷ 3 = 10.3 m.",
          "East–west: 10.3 m × cos(40°) = 10.3 × 0.766 = 7.9 m."
        ],
        answer: "About 10.3 m north–south by 7.9 m east–west."
      },
      qgis: "Use Raster → Projections → Warp (Reproject) to move a DEM into a projected CRS (for example, NAD83 / UTM zone 12N in Utah), then Raster → Analysis → Slope or Hillshade."
    },
    {
      heading: "Hydrography: NHD, NHDPlus and the WBD",
      paragraphs: [
        "The **National Hydrography Dataset (NHD)** maps streams, rivers, canals, lakes and other surface water. Stream lines (flowlines) carry flow direction and reach codes, so they form a connected network. The high-resolution NHD was compiled at 1:24,000 scale or better; an older medium-resolution version is at 1:100,000. **NHDPlus** adds value by combining the network with elevation data: each flowline gets a **catchment** (the land draining directly to it) and attributes such as drainage area, stream order and flow estimates.",
        "The **Watershed Boundary Dataset (WBD)** divides the country into nested drainage areas called **hydrologic units**. Each unit has a **hydrologic unit code (HUC)**, and every two digits added marks a smaller unit inside the larger one. A HUC-8 subbasin averages about 700 square miles; a HUC-12 subwatershed is typically 10,000 to 40,000 acres.",
        "These datasets are in transition. In 2023 USGS stopped routine updates and published static versions of the NHD, WBD and NHDPlus HR, which remain available. USGS is replacing them with the **3D Hydrography Program (3DHP)**, which derives stream networks from 3DEP elevation data. Check which version a project used, because flowlines and catchments will differ."
      ],
      bullets: [
        "HUC-2: region (for example, 16 is the Great Basin).",
        "HUC-4: subregion. HUC-6: basin.",
        "HUC-8: subbasin. HUC-10: watershed. HUC-12: subwatershed."
      ],
      example: {
        prompt: "A HUC-12 subwatershed has the code 140100010203. Give the codes of the HUC-2, HUC-4 and HUC-8 units that contain it.",
        steps: [
          "Take the first 2 digits for the region: 14.",
          "First 4 digits for the subregion: 1401.",
          "First 8 digits for the subbasin: 14010001."
        ],
        answer: "Region 14, subregion 1401, subbasin 14010001."
      },
      qgis: "Store HUCs as text. Select by Expression with left(\"huc12\", 8) = '14010001' selects every HUC-12 inside that subbasin."
    },
    {
      heading: "Land cover and imagery: NLCD and NAIP",
      paragraphs: [
        "The **National Land Cover Database (NLCD)**, produced by USGS and partners from Landsat imagery, classifies the US into land cover classes at 30 m resolution. Classes have two-digit codes: 11 open water, 21 to 24 developed (open space through high intensity), 41 to 43 forest, 52 shrub/scrub, 71 grassland, 81 pasture/hay, 82 cultivated crops, and 90 and 95 wetlands. **Annual NLCD**, first released in 2024, provides a map for every year back to 1985, along with a fractional impervious surface product. Engineers use NLCD to estimate runoff curve numbers, percent impervious cover and land cover change.",
        "Each 30 m pixel covers 900 m², about 0.22 acre, so small features such as narrow roads and single houses are generalized. Count pixels by class and multiply by 900 m² to get areas.",
        "The **National Agriculture Imagery Program (NAIP)**, run by the USDA, flies the conterminous US during the growing season, with each state covered every few years. NAIP orthoimagery has red, green, blue and near-infrared bands, with pixels of about 60 cm in recent years. It is free and a good base for digitizing features. Check the acquisition date before you trust it for recent construction."
      ],
      example: {
        prompt: "In a small watershed, 1,250 NLCD pixels fall in the developed medium- and high-intensity classes. What area is that?",
        steps: [
          "Area per pixel: 30 m × 30 m = 900 m².",
          "1,250 × 900 m² = 1,125,000 m² = 112.5 ha.",
          "In acres: 1,125,000 ÷ 4,046.9 = 278 acres."
        ],
        answer: "112.5 ha (about 278 acres)."
      },
      qgis: "Processing Toolbox → Raster analysis → Raster layer unique values report lists the pixel count and area of each class. Zonal histogram does the same inside each polygon of a layer, such as each HUC-12."
    },
    {
      heading: "Census TIGER/Line geography",
      paragraphs: [
        "The Census Bureau publishes **TIGER/Line** shapefiles: boundaries for states, counties, census tracts, block groups, blocks, places and ZIP Code Tabulation Areas, along with roads, railroads, water features and address ranges. TIGER/Line files carry geography and identifiers. The detailed demographic and economic tables (income, age, commuting, housing) come separately from data.census.gov, and you join them to the boundaries.",
        "The key that links them is the **GEOID**, a text code built from nested FIPS codes: state (2 digits) + county (3) + tract (6) + block group (1). Utah's state code is 49 and Utah County's county code is 049, so the county's GEOID is 49049, and a tract coded 001800 in that county has GEOID 49049001800. The Census Bureau also publishes **cartographic boundary files**, which are generalized and clipped to the shoreline for small-scale thematic maps."
      ],
      qgis: "Load the tract layer and the downloaded table, then use Layer Properties → Joins with GEOID as both the join and target field. Keep GEOID as text in both, or leading zeros will be lost and rows will fail to match."
    },
    {
      heading: "Soils: SSURGO",
      paragraphs: [
        "The USDA Natural Resources Conservation Service (NRCS) publishes the **Soil Survey Geographic Database (SSURGO)**, the most detailed national soil data. It was mapped at scales from 1:12,000 to 1:63,360. Each polygon is a **map unit**, identified by a key called `mukey`. You can view and download it through **Web Soil Survey** by drawing an area of interest. A gridded version (gSSURGO) and a generalized 1:250,000 version (STATSGO2) are also available.",
        "SSURGO is a relational database, not a single table. One map unit contains several soil **components**, and each component has several layers (**horizons**). Before you can map a property such as depth to bedrock, you must summarize these one-to-many tables, for example by using the dominant component. Engineering attributes include the **hydrologic soil group** (A for high infiltration through D for low infiltration and high runoff), drainage class, saturated hydraulic conductivity and soil erodibility.",
        "SSURGO is a planning tool. A map unit can include small areas of other soils, and it is not a substitute for borings and a geotechnical report at a building or bridge site."
      ]
    },
    {
      heading: "Web services: streaming instead of downloading",
      paragraphs: [
        "A **web service** sends data to your GIS on request. The Open Geospatial Consortium (OGC) sets common standards so any GIS can read them. A **Web Map Service (WMS)** draws the map on the server and sends you a picture; you can view it but not analyze its features. A **Web Map Tile Service (WMTS)** sends pre-rendered tiles in a fixed grid of zoom levels, which loads quickly and suits basemaps. A **Web Feature Service (WFS)** sends vector features with geometry and attributes, so you can query, analyze and save them. A **Web Coverage Service (WCS)** sends raster data with real cell values, such as elevations. **OGC API – Features** is a newer, web-friendly successor to WFS.",
        "Many agencies publish **ArcGIS REST services** instead: a MapServer returns map images, a FeatureServer returns features, and an ImageServer returns raster data. **XYZ tiles** are a simple tiled-image format used by many web basemaps.",
        "Services are convenient but fragile. Servers go down, URLs change, and many servers cap how many features one request returns. For analysis you must be able to repeat, save a local copy and note the date you retrieved it."
      ],
      qgis: "Layer → Add Layer → Add WMS/WMTS Layer, Add WFS / OGC API - Features Layer, Add WCS Layer and Add ArcGIS REST Server Layer each open the Data Source Manager, where you create a connection from the service URL. The Browser panel lists XYZ Tiles, which include an OpenStreetMap basemap by default."
    },
    {
      heading: "Open data and OpenStreetMap",
      paragraphs: [
        "**Open data** are free to access, use and share, usually with conditions such as attribution. **OpenStreetMap (OSM)** is a worldwide map built by volunteers, an example of **volunteered geographic information**. Anyone can edit it. Features are points, lines and areas described by **tags** written as key=value, such as `highway=residential`, `building=yes` or `amenity=school`.",
        "OSM quality varies by place. Busy cities often have detailed, current data, including sidewalks and building outlines; rural areas may be incomplete. Check it against imagery or local data before you rely on it. OSM data are licensed under the **Open Database License (ODbL)**: you may use them freely, but you must credit \"© OpenStreetMap contributors\", and if you publish a database adapted from OSM, you must share it under the same license."
      ],
      qgis: "The QuickOSM plugin downloads OSM features by tag and area (for example, all `amenity=fire_station` in a county) as vector layers."
    },
    {
      heading: "Metadata, fitness for use and licensing",
      paragraphs: [
        "**Metadata** are data about data. Good metadata tell you who made the dataset, when, why and how (its **lineage**), plus its coordinate system and datum, extent, scale or resolution, positional and attribute accuracy, attribute definitions and use constraints. US federal metadata have followed the FGDC Content Standard for Digital Geospatial Metadata (CSDGM) and, more recently, the international ISO 19115 standard.",
        "No dataset is good or bad in general; it is **fit for use** or not for a particular purpose. Before you rely on a layer, check its scale and resolution, positional accuracy, currency (how recent), completeness, attribute accuracy, consistency, lineage and CRS. A rule of thumb: the data's error should be much smaller than the size of the features or decisions you care about.",
        "Licenses control what you may do with data. Works of the US federal government are generally in the public domain. State and local data may have their own terms. Many open datasets use Creative Commons licenses (CC0, CC BY, CC BY-SA) or the ODbL. Commercial imagery and basemaps come with terms of use; read them before you trace features or redistribute data."
      ],
      formula: {
        expr: "NMAS horizontal tolerance = 1/50 inch × scale denominator (scales of 1:20,000 and smaller)",
        where: [
          "NMAS: US National Map Accuracy Standards (1947); at least 90% of well-defined points must fall within this distance",
          "For scales larger than 1:20,000 the tolerance is 1/30 inch at map scale"
        ]
      },
      example: {
        prompt: "What ground tolerance does NMAS allow for a 1:24,000 quadrangle and for a 1:100,000 map?",
        steps: [
          "1:24,000: 24,000 ÷ 50 = 480 in = 40 ft (about 12.2 m).",
          "1:100,000: 100,000 ÷ 50 = 2,000 in = 166.7 ft (about 50.8 m)."
        ],
        answer: "40 ft at 1:24,000; about 167 ft at 1:100,000."
      },
      qgis: "Layer Properties → Information shows a layer's CRS, extent, feature count and source. Layer Properties → Metadata lets you read and fill in QGIS metadata for the layer."
    }
  ],
  cards: [
    { front: "Primary vs. secondary data", back: "Primary data you collect yourself (GNSS, survey, drone). Secondary data someone else collected, such as national datasets and county layers." },
    { front: "The National Map (TNM)", back: "USGS collection of national base data: elevation, orthoimagery, hydrography, names, boundaries, transportation, structures and land cover." },
    { front: "3DEP", back: "USGS 3D Elevation Program. Collects lidar nationally and publishes free DEMs: 1 m, 1/3 arc-second (about 10 m) and 1 arc-second (about 30 m)." },
    { front: "1/3 arc-second DEM", back: "A seamless 3DEP DEM in geographic coordinates with cells about 10 m north–south and narrower east–west, depending on latitude." },
    { front: "NHD", back: "National Hydrography Dataset: mapped streams, rivers, canals and waterbodies, with flowlines connected into a directed network." },
    { front: "NHDPlus", back: "NHD combined with elevation data. Adds catchments for each flowline and attributes such as drainage area, stream order and flow estimates." },
    { front: "3DHP", back: "USGS 3D Hydrography Program, which is replacing the NHD, WBD and NHDPlus HR with hydrography derived from 3DEP elevation data." },
    { front: "Watershed Boundary Dataset (WBD)", back: "Nested drainage-area boundaries for the US, from 2-digit regions down to 12-digit subwatersheds, each with a hydrologic unit code." },
    { front: "Hydrologic unit code (HUC)", back: "A code of 2 to 12 digits for a hydrologic unit. Its first digits are the codes of the larger units that contain it." },
    { front: "NLCD", back: "National Land Cover Database: 30 m land cover for the US from Landsat. Annual NLCD gives a map for each year since 1985, plus impervious surface." },
    { front: "Impervious surface", back: "Pavement, roofs and other surfaces water cannot soak through. NLCD provides percent impervious cover for each 30 m pixel." },
    { front: "NAIP", back: "USDA National Agriculture Imagery Program: growing-season aerial orthoimagery with red, green, blue and NIR bands, about 60 cm pixels, each state every few years." },
    { front: "TIGER/Line", back: "Census Bureau shapefiles of boundaries (states to blocks), roads, rail, water and address ranges. Demographic tables are joined to them by GEOID." },
    { front: "GEOID (Census)", back: "A text key built from FIPS codes: state (2) + county (3) + tract (6) + block group (1). Utah County is 49049." },
    { front: "Cartographic boundary file", back: "A generalized Census boundary file, clipped to the shoreline, made for small-scale thematic maps rather than detailed work." },
    { front: "SSURGO", back: "NRCS Soil Survey Geographic Database, mapped at 1:12,000 to 1:63,360. Map unit polygons (key `mukey`) link to component and horizon tables." },
    { front: "Web Soil Survey", back: "NRCS website for viewing, reporting and downloading SSURGO data for an area of interest you draw." },
    { front: "Hydrologic soil group", back: "SSURGO rating of runoff potential from A (high infiltration, low runoff) to D (low infiltration, high runoff). Used for runoff curve numbers." },
    { front: "WMS", back: "Web Map Service: the server renders a map image and sends it. Good for viewing; you cannot analyze its features." },
    { front: "WMTS", back: "Web Map Tile Service: pre-rendered image tiles in a fixed grid of zoom levels. Fast, so common for basemaps." },
    { front: "WFS", back: "Web Feature Service: sends vector features with geometry and attributes that you can query, analyze and save." },
    { front: "WCS", back: "Web Coverage Service: sends raster data with real cell values, such as elevations, rather than a picture." },
    { front: "ArcGIS REST service", back: "Esri web service type. MapServer returns images, FeatureServer returns features, ImageServer returns rasters. QGIS reads them." },
    { front: "OpenStreetMap (OSM)", back: "A worldwide, volunteer-built, editable map. Features are described by key=value tags such as highway=residential." },
    { front: "ODbL", back: "Open Database License used by OSM. Use freely with credit to OpenStreetMap contributors; share adapted databases you publish under the same license." },
    { front: "Metadata", back: "Data about data: who made it, when, how (lineage), CRS, extent, scale, accuracy, attribute definitions and use constraints." },
    { front: "Lineage", back: "The part of metadata that records a dataset's sources and the processing steps used to create it." },
    { front: "Fitness for use", back: "Whether a dataset's scale, accuracy, currency, completeness and license are good enough for a particular purpose." },
    { front: "Public domain (US federal data)", back: "Works of the US federal government generally carry no copyright, so data such as 3DEP DEMs can be used and shared freely." },
    { front: "NMAS", back: "US National Map Accuracy Standards: 90% of well-defined points within 1/50 inch at map scale (1:20,000 and smaller). 40 ft on a 1:24,000 map." }
  ],
  questions: [
    {
      id: "ch07-q01",
      type: "mc",
      prompt: "Which national program is the best free source of a 1 m bare-earth DEM where lidar has been collected?",
      choices: ["NLCD", "3DEP", "NHDPlus", "TIGER/Line"],
      answer: 1,
      explain: "The USGS 3D Elevation Program publishes lidar-based 1 m DEMs. NLCD is land cover, NHDPlus is hydrography, and TIGER/Line is census geography."
    },
    {
      id: "ch07-q02",
      type: "mc",
      prompt: "What does the Watershed Boundary Dataset (WBD) contain?",
      choices: [
        "Nested drainage areas, each identified by a hydrologic unit code",
        "Stream centerlines with flow direction and reach codes for each flowline",
        "Soil map unit polygons rated by hydrologic soil group for runoff",
        "Flood zone boundaries that FEMA uses to set flood insurance rates"
      ],
      answer: 0,
      explain: "The WBD holds hydrologic unit polygons from regions down to subwatersheds. Stream lines are in the NHD, soils in SSURGO, and flood zones in FEMA's flood hazard data."
    },
    {
      id: "ch07-q03",
      type: "mc",
      prompt: "A HUC-12 subwatershed has the code 140100010203. What is the code of the HUC-8 subbasin that contains it?",
      choices: ["1401", "140100", "14010001", "1401000102"],
      answer: 2,
      explain: "Each level adds two digits, so the first 8 digits, 14010001, identify the containing subbasin. 1401000102 is the HUC-10 watershed."
    },
    {
      id: "ch07-q04",
      type: "tf",
      prompt: "A HUC-12 subwatershed is nested inside a HUC-8 subbasin, and its code begins with that subbasin's 8 digits.",
      answer: true,
      explain: "Hydrologic units nest. Longer codes mean smaller units, and the leading digits identify the larger units that contain them."
    },
    {
      id: "ch07-q05",
      type: "num",
      prompt: "A watershed contains 4,800 NLCD pixels classified as developed, high intensity. Each pixel is 30 m × 30 m. What area is that? (give hectares)",
      answer: 432,
      tol: 0.5,
      unit: "ha",
      explain: "4,800 × 900 m² = 4,320,000 m². Divide by 10,000 m² per hectare: 432 ha."
    },
    {
      id: "ch07-q06",
      type: "mc",
      prompt: "You need percent impervious cover for a stormwater study of a 50 km² watershed. Which dataset is the most direct national source?",
      choices: ["TIGER/Line roads", "SSURGO", "The Watershed Boundary Dataset", "NLCD fractional impervious surface"],
      answer: 3,
      explain: "NLCD includes a percent impervious product at 30 m. Road lines from TIGER/Line leave out roofs and parking lots, and have no width."
    },
    {
      id: "ch07-q07",
      type: "mc",
      prompt: "Which statement about NAIP imagery is correct?",
      choices: [
        "Landsat satellite imagery with 30 m pixels, collected every 16 days and composited each year",
        "Aerial orthoimagery with red, green, blue and near-infrared bands, flown in the growing season",
        "Radar imagery from aircraft that sees through clouds, flown in winter when leaves are off",
        "Drone imagery with 5 cm pixels, collected each year for every county in the United States"
      ],
      answer: 1,
      explain: "NAIP is flown from aircraft by the USDA in the growing season, with about 60 cm pixels in recent years and each state covered every few years."
    },
    {
      id: "ch07-q08",
      type: "mc",
      prompt: "You downloaded census tract boundaries as TIGER/Line shapefiles and want to map median household income. What should you do?",
      choices: [
        "Read the median income field already stored in the TIGER/Line tract attribute table",
        "Spatially join the tracts to NLCD and use the developed-land share as income",
        "Download the income table from data.census.gov and join it to the tracts on GEOID",
        "Estimate income in each tract from house sizes digitized on NAIP imagery"
      ],
      answer: 2,
      explain: "TIGER/Line files hold geography and identifiers. Demographic tables come separately and link to the boundaries through the GEOID key."
    },
    {
      id: "ch07-q09",
      type: "mc",
      prompt: "Utah's state FIPS code is 49 and Utah County's county code is 049. What is the county's 5-digit Census GEOID?",
      choices: ["49049", "4949", "04949", "49490"],
      answer: 0,
      explain: "GEOID = state (2 digits) + county (3 digits) = 49 + 049 = 49049. It must be stored as text so the zero in 049 is kept."
    },
    {
      id: "ch07-q10",
      type: "tf",
      prompt: "TIGER/Line shapefiles are the Census Bureau's generalized boundaries designed for small-scale thematic maps.",
      answer: false,
      explain: "The generalized, shoreline-clipped files are the cartographic boundary files. TIGER/Line files are the more detailed versions."
    },
    {
      id: "ch07-q11",
      type: "mc",
      prompt: "An engineer needs hydrologic soil groups across a planned subdivision to estimate runoff curve numbers. Where should they start?",
      choices: ["NHDPlus HR catchment attributes", "NLCD land cover through the MRLC viewer", "TIGER/Line data through data.census.gov", "SSURGO data through Web Soil Survey"],
      answer: 3,
      explain: "SSURGO carries the hydrologic soil group (A through D) for each map unit. NLCD supplies the land cover half of the curve number lookup, not the soil half."
    },
    {
      id: "ch07-q12",
      type: "tf",
      prompt: "SSURGO map units are detailed enough to replace a site-specific geotechnical investigation for a building foundation.",
      answer: false,
      explain: "SSURGO was mapped at 1:12,000 to 1:63,360, and each map unit can include other soils. Foundation design needs borings and a geotechnical report."
    },
    {
      id: "ch07-q13",
      type: "mc",
      prompt: "In SSURGO, one map unit can contain several soil components, and each component has several horizons. What does this mean when you want one value per polygon?",
      choices: [
        "Each map unit has exactly one component, so a simple join on mukey gives one value per polygon",
        "The links are one-to-many, so summarize them (for example, by dominant component) before joining",
        "Components are stored as separate polygon layers, so you overlay them on the map unit layer",
        "Horizons carry the mukey directly, so you can join them to the polygons without any summary"
      ],
      answer: 1,
      explain: "Map unit to component and component to horizon are one-to-many. A plain join would keep only one arbitrary match, so summarize first."
    },
    {
      id: "ch07-q14",
      type: "mc",
      prompt: "You add a layer from a WMS and try to open its attribute table, but there is none. Why?",
      choices: [
        "The server is offline",
        "QGIS must reproject the layer before reading attributes",
        "WMS layers can contain only elevation rasters",
        "A WMS sends rendered map images, not vector features"
      ],
      answer: 3,
      explain: "A WMS returns a picture of the map. To get features with attributes, use a WFS, OGC API – Features or an ArcGIS FeatureServer."
    },
    {
      id: "ch07-q15",
      type: "mc",
      prompt: "Which OGC service type returns vector features with geometry and attributes that you can analyze?",
      choices: ["WMS", "WMTS", "WFS", "XYZ tiles"],
      answer: 2,
      explain: "A Web Feature Service sends the features themselves. WMS, WMTS and XYZ tiles all send images."
    },
    {
      id: "ch07-q16",
      type: "mc",
      prompt: "Which service type delivers pre-rendered map tiles in a fixed grid of zoom levels, which makes it fast for basemaps?",
      choices: ["WCS", "WMTS", "WFS", "OGC API – Features"],
      answer: 1,
      explain: "A Web Map Tile Service serves cached tiles. A WMS also sends images, but it draws each one on request, which is slower."
    },
    {
      id: "ch07-q17",
      type: "tf",
      prompt: "A Web Coverage Service (WCS) returns raster data with actual cell values, such as elevations, that you can analyze.",
      answer: true,
      explain: "WCS delivers the data values, unlike WMS, which delivers a colored picture of the data."
    },
    {
      id: "ch07-q18",
      type: "mc",
      prompt: "You edit a copy of OpenStreetMap road data and plan to publish the improved database. What does the ODbL require?",
      choices: [
        "Nothing, because OSM data are in the public domain and can be republished without credit",
        "A license fee to the OpenStreetMap Foundation for any commercial use of the adapted data",
        "Credit to OpenStreetMap contributors and release of the adapted database under the ODbL",
        "Written permission from every mapper who edited the area before the data are republished"
      ],
      answer: 2,
      explain: "The ODbL is an attribution and share-alike license. OSM data are free to use, but they are not public domain."
    },
    {
      id: "ch07-q19",
      type: "tf",
      prompt: "Because anyone can edit OpenStreetMap, its completeness and accuracy can vary a great deal from place to place.",
      answer: true,
      explain: "Coverage depends on local volunteer activity and imports. Check OSM against imagery or authoritative data before relying on it."
    },
    {
      id: "ch07-q20",
      type: "mc",
      prompt: "Which part of a dataset's metadata describes the sources and processing steps used to create it?",
      choices: ["Lineage", "Bounding coordinates", "Keywords", "Distribution format"],
      answer: 0,
      explain: "Lineage records where the data came from and what was done to them. Bounding coordinates give only the extent."
    },
    {
      id: "ch07-q21",
      type: "num",
      prompt: "Under the US National Map Accuracy Standards, 90% of well-defined points on a 1:24,000 map must fall within 1/50 inch of their true position at map scale. What ground distance is that? (give feet)",
      answer: 40,
      tol: 0.5,
      unit: "ft",
      explain: "24,000 ÷ 50 = 480 inches on the ground. 480 in ÷ 12 = 40 ft (about 12.2 m)."
    },
    {
      id: "ch07-q22",
      type: "mc",
      prompt: "A student wants to measure the width of a 15 m canal right-of-way from a stream layer compiled at 1:100,000. What is the main problem?",
      choices: [
        "The layer is probably in the wrong file format",
        "At 1:100,000, positional error can be tens of meters, larger than the feature being measured",
        "Hydrography layers do not have a coordinate system",
        "1:100,000 is a larger scale than 1:24,000, so the layer has too much detail"
      ],
      answer: 1,
      explain: "At 1:100,000 the NMAS tolerance is about 51 m, so the data cannot resolve a 15 m feature. Also, 1:100,000 is a smaller scale than 1:24,000, not larger."
    },
    {
      id: "ch07-q23",
      type: "mc",
      prompt: "Data produced by a US federal agency, such as USGS 3DEP DEMs, are generally:",
      choices: [
        "Licensed for academic and noncommercial use only",
        "Copyrighted, but shareable under share-alike terms",
        "Free to view, but redistribution needs agency approval",
        "In the public domain and free to use and redistribute"
      ],
      answer: 3,
      explain: "US federal government works generally carry no copyright. Citing the source is still good practice."
    },
    {
      id: "ch07-q24",
      type: "mc",
      prompt: "You are delineating the area that drains to a proposed culvert on a small creek in Utah County. Which combination is the best free starting point?",
      choices: [
        "NLCD land cover plus TIGER/Line roads to locate the culvert",
        "SSURGO hydrologic soil groups plus the FEMA flood hazard layer",
        "A 3DEP DEM (1 m or 1/3 arc-second) plus NHD flowlines",
        "NAIP imagery (60 cm) plus OpenStreetMap waterway lines"
      ],
      answer: 2,
      explain: "Watershed delineation needs elevation to trace flow and a stream network to check it; NHDPlus HR flowlines work too. Imagery and OSM lines have no elevation, and land cover and soils come later, for estimating runoff."
    },
    {
      id: "ch07-q25",
      type: "mc",
      prompt: "A design team builds its analysis on a county WFS. Months later the county moves the service and the layers stop loading. Which practice would have protected the work?",
      choices: [
        "Saving a dated local copy of the data, with its source recorded",
        "Switching the layer to the county's WMS, which draws the same data",
        "Bookmarking the service URL in the project so it reloads automatically",
        "Reprojecting the layer to WGS 84 so any server can deliver it"
      ],
      answer: 0,
      explain: "Services can change or disappear. A dated local copy makes the analysis repeatable. A bookmarked URL breaks when the service moves, and a WMS would not help, since it provides only images."
    },
    {
      id: "ch07-q26",
      type: "mc",
      prompt: "A 1/3 arc-second DEM has cells about 10.3 m tall north–south. At 40° N latitude, about how wide are the cells east–west?",
      choices: ["About 3.4 m", "About 7.9 m", "About 10.3 m", "About 13.4 m"],
      answer: 1,
      explain: "East–west width = 10.3 m × cos(40°) = 10.3 × 0.766 = 7.9 m. Dividing by cos(40°) instead gives the wrong answer of 13.4 m."
    },
    {
      id: "ch07-q27",
      type: "tf",
      prompt: "USGS is replacing the legacy NHD, WBD and NHDPlus HR with the 3D Hydrography Program (3DHP), which derives hydrography from 3DEP elevation data.",
      answer: true,
      explain: "Static versions of the legacy datasets were published in 2023 and remain available while 3DHP data are built."
    },
    {
      id: "ch07-q28",
      type: "mc",
      prompt: "What does NHDPlus add to the basic NHD stream network?",
      choices: [
        "Soil properties for each stream reach, joined from SSURGO map units",
        "Census population and housing counts for each local catchment",
        "Real-time streamflow for each flowline, linked from USGS stream gauges",
        "Catchments and attributes such as drainage area, built from elevation data"
      ],
      answer: 3,
      explain: "NHDPlus links each flowline to the land that drains to it and computes attributes such as drainage area and stream order. Real-time flows come from USGS gauge services, not NHDPlus."
    }
  ]
});
