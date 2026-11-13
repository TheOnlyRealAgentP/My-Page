GIS.chapter({
  id: "ch11",
  num: 11,
  title: "Terrain Analysis",
  blurb: "How to derive contours, slope, aspect, hillshade, curvature, viewsheds, and watersheds from elevation rasters, the core terrain tools for grading, drainage, and siting work.",
  objectives: [
    "Distinguish DEMs, DSMs, and DTMs and choose the right one for an engineering task.",
    "Compute slope (in degrees and percent) and aspect from a 3×3 elevation window.",
    "Explain how contours, hillshade, and curvature are derived from a DEM and what each shows.",
    "Describe how a viewshed is computed and which inputs control it.",
    "Delineate a watershed by filling sinks, computing D8 flow direction and flow accumulation, extracting streams, and snapping a pour point.",
    "Convert flow accumulation counts to drainage area.",
    "Explain how DEM resolution and errors change terrain analysis results."
  ],
  guide: [
    {
      heading: "DEMs, DSMs, and DTMs",
      paragraphs: [
        "A **digital elevation model (DEM)** is a raster in which each cell holds an elevation. Most DEMs represent **bare earth**, the ground with buildings and vegetation removed; this is also called a **digital terrain model (DTM)**. A **digital surface model (DSM)** records the top of whatever is there: rooftops, tree canopy, bridges. Subtracting the DTM from the DSM gives the height of objects above the ground, sometimes called a normalized DSM.",
        "Elevation data come from lidar (laser pulses from aircraft or drones), photogrammetry, radar (for example the Shuttle Radar Topography Mission, SRTM), and older contour maps. In the US, the USGS 3D Elevation Program (3DEP) distributes lidar DEMs at 1 m and seamless DEMs at about 10 m (1/3 arc-second) and 30 m (1 arc-second). A **TIN** (triangulated irregular network) is a vector alternative that connects measured points with triangles.",
        "Use a bare-earth DEM for drainage, grading, and earthwork, because a DSM would route water over rooftops and through tree canopy. Use a DSM for line-of-sight, antenna, and solar studies, where buildings and trees block the view."
      ],
      qgis: "Load the DEM as a raster layer and color it with Layer Properties → Symbology → Singleband pseudocolor. Raster → Miscellaneous → Merge joins adjacent DEM tiles."
    },
    {
      heading: "Contours",
      paragraphs: [
        "A **contour** is a line connecting points of equal elevation. The **contour interval** is the elevation difference between adjacent lines, such as 1 m or 2 ft. On a map with one interval, closely spaced contours mean steep ground and widely spaced contours mean gentle ground. Where contours cross a stream valley they bend into a V that points uphill.",
        "Contours are generated from a DEM by interpolating where each contour elevation falls between cell centers. They are mainly for display and plan sheets; calculations such as slope use the raster DEM directly. A small interval shows more detail but can produce jagged lines where the DEM has small errors."
      ],
      formula: {
        expr: "slope (%) = 100 × contour interval / horizontal spacing",
        where: [
          "contour interval: vertical distance between adjacent contours",
          "horizontal spacing: map distance between the contours, measured perpendicular to them"
        ]
      },
      example: {
        prompt: "On a site plan, 1 m contours are 12.5 m apart, measured perpendicular to the lines. What is the ground slope in percent and in degrees?",
        steps: [
          "Rise ÷ run = 1 m ÷ 12.5 m = 0.08.",
          "Percent slope = 100 × 0.08 = 8%.",
          "Degrees = arctan(0.08) = 4.57°."
        ],
        answer: "8%, or about 4.6°"
      },
      qgis: "Raster → Extraction → Contour (GDAL). Set the interval in the DEM's elevation units."
    },
    {
      heading: "Slope and aspect",
      figures: [
        { src: "img/qgis/terrain-slope.webp", w: 1000, h: 1040,
          alt: "Slope map of Utah Valley in degrees over a hillshade: pale yellow on the flat valley floor and Utah Lake, dark red on the steep Wasatch Range.",
          caption: "**Slope in degrees** (Processing Toolbox > Raster terrain analysis > Slope) over the same hillshade. Pale yellow is under 5°, dark red is 45° or more. The valley floor is nearly flat; the Wasatch front turns steep within a couple of kilometers." }
      ],
      paragraphs: [
        "**Slope** is the steepness of the surface at a cell, reported in degrees (0° flat, 90° vertical) or percent (rise ÷ run × 100). A 45° slope is 100%, so percent values can exceed 100. Road and site grades are usually given in percent.",
        "A GIS computes slope from the 3×3 window around each cell. **Horn's method**, the default in GDAL, QGIS, and ArcGIS, estimates the east-west and north-south rates of change from the columns and rows on either side of the center, weighting the cells directly beside the center by 2. Label the window a b c (north row), d e f (middle row), g h i (south row), with cell size s.",
        "**Aspect** is the compass direction the slope faces, which is its downhill direction, measured clockwise from north (0° north, 90° east, 180° south, 270° west). It is the uphill direction from the formula plus 180°. Flat cells have no aspect and get a special code, such as −1. In the Northern Hemisphere, south-facing slopes receive more sun, so aspect affects snowmelt, soil moisture, and vegetation."
      ],
      formula: {
        expr: "dz/dx = [(c + 2f + i) − (a + 2d + g)] / (8s);   dz/dy = [(a + 2b + c) − (g + 2h + i)] / (8s);   slope = arctan √((dz/dx)² + (dz/dy)²)",
        where: [
          "a…i: elevations in the 3×3 window, read row by row from the northwest corner",
          "s: cell size, in the same units as elevation",
          "dz/dx: rise toward the east; dz/dy: rise toward the north",
          "percent slope = 100 × √((dz/dx)² + (dz/dy)²)"
        ]
      },
      example: {
        prompt: "A DEM with 10 m cells has the window row 1 (north): 50, 52, 54; row 2: 48, 50, 52; row 3 (south): 46, 48, 50. Find slope and aspect with Horn's method.",
        steps: [
          "dz/dx = [(54 + 2×52 + 50) − (50 + 2×48 + 46)] ÷ (8 × 10) = (208 − 192) ÷ 80 = 0.20.",
          "dz/dy = [(50 + 2×52 + 54) − (46 + 2×48 + 50)] ÷ 80 = (208 − 192) ÷ 80 = 0.20.",
          "√(0.20² + 0.20²) = 0.283, so slope = 28.3% and arctan(0.283) = 15.8°.",
          "The ground rises toward the east and the north (uphill is northeast, 45°), so it faces southwest: aspect = 45° + 180° = 225°."
        ],
        answer: "Slope ≈ 15.8° (28.3%); aspect = 225° (southwest)"
      },
      qgis: "Processing Toolbox → Raster terrain analysis → Slope and Aspect, or Raster → Analysis → Slope and Aspect (GDAL, which can output percent). If the DEM is in latitude and longitude, reproject it to a projected CRS first, or the slopes will be wrong."
    },
    {
      heading: "Hillshade and curvature",
      figures: [
        { src: "img/qgis/terrain-hillshade.webp", w: 1000, h: 1040,
          alt: "Shaded-relief map of Utah Valley: multidirectional hillshade with an elevation color tint and 100 meter contours. Utah Lake is on the left and the Wasatch Range on the right.",
          caption: "**Hillshade and contours** from a 30 m USGS 3DEP DEM of Utah Valley: a multidirectional hillshade under a 60% opacity elevation tint, with 100 m contours from Raster > Extraction > Contour. Utah Lake is on the left; the Wasatch Range rises on the right." }
      ],
      paragraphs: [
        "A **hillshade** shows how brightly each cell would be lit by a light source at a given direction (azimuth) and height above the horizon (altitude). Values run from 0 (full shadow) to 255 (full light). The usual convention puts the light in the northwest, at azimuth 315° and altitude 45° (GDAL's defaults); QGIS's native Hillshade tool defaults to 300° and 40°. Most viewers read relief correctly with light from the upper left; light from the south can make valleys look like ridges.",
        "Hillshades are mainly for display, often drawn semi-transparent under a colored DEM. They are also a fast quality check, because lidar artifacts, striping, and mismatched tiles stand out.",
        "**Curvature** is the rate of change of slope, a second derivative of elevation. **Profile curvature** is measured in the downhill direction and shows whether flow speeds up (convex) or slows down (concave), which affects erosion and deposition. **Plan curvature** is measured across the slope and shows whether flow converges (hollows, channels) or diverges (ridges, spurs). Sign conventions differ between programs, so check the documentation before reading positive and negative values."
      ],
      formula: {
        expr: "Hillshade = 255 × [cos(Z) cos(S) + sin(Z) sin(S) cos(Az − A)]",
        where: [
          "Z: zenith angle of the light = 90° − altitude",
          "S: slope angle of the cell",
          "Az: azimuth of the light",
          "A: aspect of the cell",
          "negative results are set to 0 (shadow)"
        ]
      },
      example: {
        prompt: "Light comes from azimuth 315° at altitude 45°. Find the hillshade value for a 30° slope facing northwest (aspect 315°) and for a 30° slope facing southeast (aspect 135°).",
        steps: [
          "Z = 90° − 45° = 45°. cos 45° × cos 30° = 0.612 and sin 45° × sin 30° = 0.354.",
          "Northwest slope: cos(315° − 315°) = cos 0° = 1. Value = 255 × (0.612 + 0.354) = 255 × 0.966 = 246.",
          "Southeast slope: cos(315° − 135°) = cos 180° = −1. Value = 255 × (0.612 − 0.354) = 255 × 0.259 = 66."
        ],
        answer: "About 246 for the northwest-facing slope and 66 for the southeast-facing slope"
      },
      qgis: "Processing Toolbox → Raster terrain analysis → Hillshade (set azimuth and vertical angle), or Raster → Analysis → Hillshade (GDAL). GRASS r.slope.aspect can also output profile and tangential (plan-type) curvature."
    },
    {
      heading: "Viewsheds",
      paragraphs: [
        "A **viewshed** is the set of cells visible from one or more observer points. For each target cell, the GIS draws a **line of sight** from the observer to the target and checks whether any terrain between them rises above that line. If nothing blocks it, the target is visible. Output is usually binary (visible or not), or a count of how many observers can see each cell.",
        "Key inputs are the observer height above the ground (about 1.7 m for a standing person, 30 m for a tower antenna), the target height (a 3 m sign, a 10 m pole), and a maximum distance. Raising the observer makes the line of sight clear more terrain, so the visible area grows. Over long distances, Earth's curvature and atmospheric refraction hide distant low targets, and most tools offer a correction for them.",
        "Results depend on the surface. A bare-earth DEM ignores trees and buildings and overstates what is visible; a DSM includes them. Small elevation errors near the observer can change large parts of the result. Typical uses are siting radio and cell towers, checking which homes will see a new transmission line, and sight distance at intersections."
      ],
      qgis: "GRASS r.viewshed in the Processing Toolbox (observer elevation, target elevation, maximum distance, and flags for curvature and refraction), or the Visibility Analysis plugin."
    },
    {
      heading: "Watersheds: filling sinks, flow direction, and flow accumulation",
      paragraphs: [
        "A **watershed** (catchment, drainage basin) is all the land that drains to a given outlet. A GIS delineates watersheds from a DEM in a standard sequence: fill sinks, compute flow direction, compute flow accumulation, define streams, and trace the area upstream of a pour point.",
        "**Sinks** are cells, or groups of cells, lower than all their neighbors, so water cannot leave. Most are errors, or places such as culvert crossings where a road embankment hides the pipe from the DEM. **Filling** raises each sink to the elevation of its lowest outlet (spill point) so every cell drains to the DEM edge. Some sinks are real, such as quarries, karst sinkholes, and closed basins like the Great Basin, so check large filled areas.",
        "**D8 flow direction** sends all of a cell's water to the one of its eight neighbors with the steepest downhill drop. Drop is the elevation difference divided by the distance between cell centers, so a diagonal neighbor (1.414 cell widths away) needs a larger elevation difference to win. ArcGIS codes the directions as powers of 2, clockwise from east: E = 1, SE = 2, S = 4, SW = 8, W = 16, NW = 32, N = 64, NE = 128. GRASS and SAGA number them differently, so check the legend.",
        "**Flow accumulation** counts, for each cell, how many upstream cells drain through it. Ridge cells have 0, and stream cells have large values. Multiply the count by the area of one cell to get drainage area. Some programs include the cell itself in the count; one cell rarely matters."
      ],
      formula: {
        expr: "drop = (z_center − z_neighbor) / distance;   distance = s (edge) or 1.414 s (diagonal);   drainage area = accumulation × s²",
        where: [
          "z: elevation",
          "s: cell size",
          "accumulation: number of upstream cells"
        ]
      },
      example: {
        prompt: "With 10 m cells, a center cell at 100 m has neighbors row 1: 104, 101, 99; row 2: 103, [center 100], 97; row 3: 102, 98, 96 (row 1 is north). Which way does D8 send the flow, and what is the ArcGIS code?",
        steps: [
          "Edge neighbors (10 m away): N = (100 − 101) ÷ 10 = −0.10; E = (100 − 97) ÷ 10 = 0.30; S = (100 − 98) ÷ 10 = 0.20; W = (100 − 103) ÷ 10 = −0.30.",
          "Diagonal neighbors (14.14 m away): NE = (100 − 99) ÷ 14.14 = 0.071; SE = (100 − 96) ÷ 14.14 = 0.283; SW and NW are uphill.",
          "The steepest drop is east (0.30). The southeast cell is lower (96 m), but it is farther away, so its drop is only 0.283.",
          "East has code 1."
        ],
        answer: "Flow goes east, code 1"
      },
      qgis: "GRASS r.fill.dir fills sinks and outputs a flow direction raster. GRASS r.watershed computes flow direction and flow accumulation in one step and does not need a filled DEM; add the -s flag for single-direction (D8) flow, because its default is multiple flow direction."
    },
    {
      heading: "Streams, pour points, and delineation",
      paragraphs: [
        "Streams are defined with a **threshold**: cells whose flow accumulation exceeds a chosen value are labeled stream. A low threshold gives a dense network that reaches far up small valleys; a high threshold keeps only larger streams. Choose it by comparing with mapped streams or field knowledge, and think of it as an area so it does not depend on cell size. For example, a 1 km² threshold on a 10 m DEM is 1,000,000 m² ÷ 100 m² = 10,000 cells.",
        "A **pour point** is the outlet you want the watershed for: a culvert, bridge, stream gauge, or pond outlet. A point digitized from an aerial photo often lands a cell or two off the modeled flow path, so **snap** it to the highest flow accumulation cell within a short distance. The watershed tool then follows flow directions upstream from the pour point and marks every cell that drains to it.",
        "Check the result. The boundary should follow ridgelines on a hillshade, and the area should be close to published values, such as USGS StreamStats in the US. DEM-based delineation most often fails in flat areas, at road embankments, and where storm sewers move water across ridges. **Burning** known streams or culverts into the DEM (lowering those cells) fixes some of these problems."
      ],
      example: {
        prompt: "On a 30 m DEM, the flow accumulation at the snapped pour point for a highway culvert is 18,000 cells. What is the drainage area in km² and mi²?",
        steps: [
          "Cell area = 30 m × 30 m = 900 m².",
          "Drainage area = 18,000 × 900 m² = 16,200,000 m².",
          "16,200,000 m² ÷ 1,000,000 m²/km² = 16.2 km².",
          "16.2 km² ÷ 2.59 km²/mi² = 6.25 mi²."
        ],
        answer: "16.2 km² (about 6.25 mi²)"
      },
      qgis: "GRASS r.stream.extract builds a stream network from an accumulation threshold. GRASS r.water.outlet delineates the basin above a pour point from a drainage direction raster. Raster → Conversion → Polygonize turns the basin raster into a polygon."
    },
    {
      heading: "DEM resolution and error",
      paragraphs: [
        "Cell size controls what terrain a DEM can show. Features narrower than about two cells, such as roadside ditches, small channels, levees, and curbs, disappear in coarse DEMs. Slopes computed from coarse DEMs are lower on average, because each cell averages out short, steep pitches. Peaks are cut down and narrow valleys are filled in.",
        "Resolution changes hydrology results too. Coarse DEMs give shorter, straighter streams, watershed boundaries that can shift by a cell or more, and in flat areas flow routed into the wrong basin. Finer DEMs cost more to process: halving the cell size quadruples the number of cells. A 1 m lidar DEM also shows road embankments clearly, which then block flow at culverts unless the culverts are burned in.",
        "Resolution is not the same as accuracy. A DEM resampled from 30 m to 1 m has small cells but only 30 m worth of detail. Check the source, collection date, and vertical accuracy (often reported as RMSE) before using any DEM for design."
      ],
      example: {
        prompt: "How many cells cover a 3 km × 3 km site at 1 m, 10 m, and 30 m cell sizes?",
        steps: [
          "1 m: 3,000 × 3,000 = 9,000,000 cells.",
          "10 m: 300 × 300 = 90,000 cells.",
          "30 m: 100 × 100 = 10,000 cells."
        ],
        answer: "9,000,000; 90,000; and 10,000 cells"
      }
    }
  ],
  cards: [
    { front: "DEM", back: "Digital elevation model: a raster in which each cell stores a ground elevation, usually bare earth." },
    { front: "DSM", back: "Digital surface model: elevations of the top surface, including buildings, tree canopy, and bridges." },
    { front: "DTM (bare earth)", back: "A terrain model of the ground with buildings and vegetation removed. Often used as another name for a bare-earth DEM." },
    { front: "Normalized DSM", back: "DSM minus DTM: the height of buildings and vegetation above the ground." },
    { front: "Lidar", back: "Light detection and ranging: laser pulses from aircraft or drones measure distances to build dense, accurate elevation point clouds." },
    { front: "Contour interval", back: "The vertical difference between adjacent contour lines, such as 1 m or 2 ft." },
    { front: "Slope", back: "Steepness at a cell: the rate of elevation change in the steepest direction, in degrees (0–90) or percent (rise ÷ run × 100)." },
    { front: "Percent slope", back: "100 × rise ÷ run. A 45° slope is 100%, and slopes steeper than 45° exceed 100%." },
    { front: "Aspect", back: "The compass direction a slope faces (its downhill direction), measured clockwise from north: 0° N, 90° E, 180° S, 270° W." },
    { front: "Horn's method", back: "A slope algorithm using the eight neighbors of a cell, weighting the cells directly beside the center by 2. Default in GDAL, QGIS, and ArcGIS." },
    { front: "Hillshade", back: "A raster of how brightly each cell is lit by a light source at a given azimuth and altitude, from 0 (shadow) to 255 (full light)." },
    { front: "Profile curvature", back: "Curvature in the downhill direction. Shows whether flow speeds up (convex) or slows down (concave), which affects erosion and deposition." },
    { front: "Plan curvature", back: "Curvature across the slope. Shows whether flow converges (hollows, channels) or diverges (ridges, spurs)." },
    { front: "Viewshed", back: "The set of cells visible from one or more observer points, found by testing lines of sight across a surface model." },
    { front: "Line of sight", back: "A straight line from observer to target. The target is visible if no terrain between them rises above the line." },
    { front: "Observer height", back: "Height of the viewer above the ground in a viewshed, such as 1.7 m for a person or 30 m for a tower antenna." },
    { front: "Watershed", back: "All land that drains to a given outlet. Also called a catchment or drainage basin." },
    { front: "Sink", back: "A cell or group of cells lower than all surrounding cells, so flow cannot leave. Often a DEM error." },
    { front: "Fill sinks", back: "Raising sink cells to the elevation of their lowest spill point so every cell can drain to the DEM edge." },
    { front: "D8 flow direction", back: "Sends each cell's flow to the one of eight neighbors with the steepest drop, with diagonal distances 1.414 times the cell size." },
    { front: "D8 codes (ArcGIS)", back: "E = 1, SE = 2, S = 4, SW = 8, W = 16, NW = 32, N = 64, NE = 128: powers of 2, clockwise from east." },
    { front: "Multiple flow direction (MFD)", back: "Methods that split a cell's flow among several downhill neighbors in proportion to slope, unlike D8's single direction." },
    { front: "Flow accumulation", back: "For each cell, the number of upstream cells that drain through it. Multiply by cell area to get drainage area." },
    { front: "Stream threshold", back: "The minimum flow accumulation (in cells or area) for a cell to be labeled part of the stream network." },
    { front: "Pour point", back: "The outlet, such as a culvert or stream gauge, for which a watershed is delineated." },
    { front: "Pour point snapping", back: "Moving a pour point to the highest flow accumulation cell within a short distance so it sits on the modeled flow path." },
    { front: "Stream burning", back: "Lowering DEM cells along mapped streams or culverts so modeled flow follows known channels." },
    { front: "DEM resolution", back: "The cell size of a DEM. Coarser cells smooth terrain, lower computed slopes, and drop small features such as ditches." }
  ],
  questions: [
    {
      id: "ch11-q01",
      type: "mc",
      prompt: "Which elevation surface should be used to delineate the drainage area to a culvert?",
      choices: [
        "A DSM that includes buildings and trees",
        "A bare-earth DEM (DTM)",
        "A hillshade",
        "A slope raster"
      ],
      answer: 1,
      explain: "Water flows over the ground, not over rooftops and tree canopy, so drainage work needs bare earth. A DSM would send modeled flow along roofs and treetops."
    },
    {
      id: "ch11-q02",
      type: "mc",
      prompt: "A planner wants to know which homes will be able to see a proposed cell tower. Which elevation surface gives the most realistic viewshed?",
      choices: [
        "A bare-earth DEM, because trees and buildings change over time",
        "A contour layer with a 10 m interval",
        "A flow accumulation raster",
        "A DSM, because buildings and trees block lines of sight"
      ],
      answer: 3,
      explain: "Buildings and trees block views, and a DSM includes them. A bare-earth DEM would show the tower as visible from many homes that are actually screened."
    },
    {
      id: "ch11-q03",
      type: "mc",
      prompt: "On a map with a single contour interval, the area where the contours are closest together is:",
      choices: ["The flattest", "The steepest", "The highest", "The lowest"],
      answer: 1,
      explain: "Each contour gap is the same rise, so the shorter the horizontal distance between contours, the steeper the ground. Spacing says nothing directly about absolute elevation."
    },
    {
      id: "ch11-q04",
      type: "num",
      prompt: "Contours with a 2 ft interval are 40 ft apart horizontally. What is the slope in percent?",
      answer: 5,
      tol: 0.01,
      unit: "%",
      explain: "Slope = rise ÷ run × 100 = 2 ÷ 40 × 100 = 5%."
    },
    {
      id: "ch11-q05",
      type: "mc",
      prompt: "What is a 45° slope expressed in percent?",
      choices: ["45%", "50%", "70.7%", "100%"],
      answer: 3,
      explain: "tan 45° = 1, so rise equals run and the slope is 100%. The value 50% is a common mistake from treating 90° as 100%, and 70.7% comes from using the sine instead of the tangent."
    },
    {
      id: "ch11-q06",
      type: "num",
      prompt: "A DEM with 5 m cells has the window row 1 (north): 120, 118, 116; row 2: 120, 118, 116; row 3 (south): 120, 118, 116, in meters. Using Horn's method, what is the slope in degrees?",
      answer: 21.8,
      tol: 0.1,
      unit: "degrees",
      explain: "dz/dx = [(116 + 2×116 + 116) − (120 + 2×120 + 120)] ÷ (8 × 5) = (464 − 480) ÷ 40 = −0.4. dz/dy = 0 because the north and south rows are identical. Slope = arctan(0.4) = 21.8° (40%)."
    },
    {
      id: "ch11-q07",
      type: "mc",
      prompt: "A 3×3 elevation window is row 1 (north): 30, 30, 30; row 2: 32, 32, 32; row 3 (south): 34, 34, 34. Which way does the slope face?",
      choices: ["North (0°)", "East (90°)", "South (180°)", "West (270°)"],
      answer: 0,
      explain: "Elevation drops from south (34 m) to north (30 m), so the downhill direction, and the aspect, is north. South is the tempting answer, but that is the uphill direction."
    },
    {
      id: "ch11-q08",
      type: "mc",
      prompt: "In the Northern Hemisphere, which aspect generally receives the most direct sunlight and loses its snow first?",
      choices: ["North-facing", "East-facing", "South-facing", "West-facing"],
      answer: 2,
      explain: "North of the tropics the sun is in the southern sky, so south-facing slopes meet the sun's rays most directly. North-facing slopes stay cooler and hold snow longest."
    },
    {
      id: "ch11-q09",
      type: "tf",
      prompt: "A slope raster computed directly from a DEM in latitude and longitude (degrees) with elevations in meters is correct without any conversion.",
      answer: false,
      explain: "The horizontal units (degrees) and vertical units (meters) do not match, so the computed slopes are far too steep. Reproject to a projected CRS, or supply a scale factor, before computing slope."
    },
    {
      id: "ch11-q10",
      type: "mc",
      prompt: "What do hillshade values of 0 and 255 represent?",
      choices: [
        "Lowest and highest elevation",
        "Flat and vertical slopes",
        "Full shadow and full illumination",
        "North-facing and south-facing slopes"
      ],
      answer: 2,
      explain: "Hillshade is a brightness value. A cell facing directly into the light gets 255, and a cell turned away or shaded gets 0. It does not store elevation."
    },
    {
      id: "ch11-q11",
      type: "mc",
      prompt: "Why is the light source for a hillshade usually placed in the northwest (azimuth 315°)?",
      choices: [
        "It matches the sun's actual position at noon in the Northern Hemisphere",
        "The hillshade formula only works for azimuths between 270° and 360°",
        "It keeps cell values from 0 to 255, so the output file stays small",
        "Viewers read relief best when light comes from the upper left of the map"
      ],
      answer: 3,
      explain: "The northwest light is a cartographic convention for perception; light from the south can make valleys look like ridges. At noon in the Northern Hemisphere the sun is actually in the south, so the first choice is wrong. The formula works for any azimuth."
    },
    {
      id: "ch11-q12",
      type: "num",
      prompt: "Light comes from azimuth 315° at altitude 45°. What is the hillshade value (0–255) of a cell with a 30° slope that faces southeast (aspect 135°)?",
      answer: 66,
      tol: 1,
      unit: "brightness (0–255)",
      explain: "Z = 90° − 45° = 45°. Hillshade = 255 × [cos 45° cos 30° + sin 45° sin 30° cos(315° − 135°)] = 255 × (0.612 + 0.354 × (−1)) = 255 × 0.259 ≈ 66."
    },
    {
      id: "ch11-q13",
      type: "mc",
      prompt: "Plan curvature is most useful for identifying:",
      choices: [
        "Where flow converges into hollows and channels or diverges over ridges",
        "The compass direction a slope faces",
        "Whether flow speeds up or slows down as it moves downhill",
        "The elevation of the highest cell"
      ],
      answer: 0,
      explain: "Plan curvature is measured across the slope, so it shows convergence and divergence. Speeding up and slowing down downhill is described by profile curvature."
    },
    {
      id: "ch11-q14",
      type: "mc",
      prompt: "What happens to a viewshed when the observer height is raised from 1.7 m (a person) to 30 m (a tower)?",
      choices: [
        "The visible area shrinks because the observer is farther from the ground",
        "The visible area generally grows because the line of sight clears more terrain",
        "Nothing changes, because only target height matters",
        "Every DEM elevation is raised by 30 m"
      ],
      answer: 1,
      explain: "A higher observer raises every line of sight, so ridges and buildings that blocked the view at 1.7 m may no longer block it. Only the observer's height changes, not the DEM."
    },
    {
      id: "ch11-q15",
      type: "mc",
      prompt: "How does a GIS decide whether a target cell is visible from an observer?",
      choices: [
        "It checks whether the target cell is lower in elevation than the observer",
        "It checks whether the target is inside the observer's watershed boundary",
        "It checks whether terrain between them rises above the line of sight",
        "It checks whether the target and observer cells face the same aspect"
      ],
      answer: 2,
      explain: "Visibility is a line-of-sight test along the profile between the two points. A target higher than the observer can still be visible, and a lower one can still be hidden behind a ridge."
    },
    {
      id: "ch11-q16",
      type: "mc",
      prompt: "What is the usual order of steps for DEM-based watershed delineation?",
      choices: [
        "Flow accumulation, fill sinks, flow direction, pour point",
        "Flow direction, fill sinks, hillshade, watershed",
        "Snap pour point, fill sinks, flow accumulation, flow direction",
        "Fill sinks, flow direction, flow accumulation, snap pour point and delineate"
      ],
      answer: 3,
      explain: "Each step uses the previous output: flow direction needs a filled DEM, flow accumulation needs flow direction, and snapping needs the accumulation grid."
    },
    {
      id: "ch11-q17",
      type: "mc",
      prompt: "Why are sinks filled before flow direction is computed?",
      choices: [
        "Sinks store extra values that make the DEM file too large to process",
        "Flow that enters a sink cannot leave, so upstream area is cut off",
        "Filling sinks increases the DEM resolution so small channels appear",
        "Flow direction tools cannot read the negative elevations in sinks"
      ],
      answer: 1,
      explain: "A sink has no downhill neighbor, so flow stops there and everything upstream is disconnected from the outlet. Filling gives every cell a path to the DEM edge. Filling does not change cell size."
    },
    {
      id: "ch11-q18",
      type: "tf",
      prompt: "Every sink in a DEM is an error and should always be filled.",
      answer: false,
      explain: "Most sinks are errors, but some are real: quarries, karst sinkholes, and closed basins such as much of the Great Basin, which has no outlet to the sea. Large filled areas should be checked."
    },
    {
      id: "ch11-q19",
      type: "mc",
      prompt: "With 10 m cells, a center cell at 50.0 m has these neighbors: N 49.0, NE 47.5, E 48.5, SE 49.0, S 49.5, SW 50.5, W 51.0, NW 50.0. Using D8 with ArcGIS codes, which code is assigned?",
      choices: ["1 (east)", "64 (north)", "128 (northeast)", "2 (southeast)"],
      answer: 2,
      explain: "Drops: N = 1.0 ÷ 10 = 0.100; NE = 2.5 ÷ 14.14 = 0.177; E = 1.5 ÷ 10 = 0.150; SE = 1.0 ÷ 14.14 = 0.071. Northeast is steepest even after dividing by the longer diagonal distance, so the code is 128. East has the largest edge drop but loses to NE."
    },
    {
      id: "ch11-q20",
      type: "mc",
      prompt: "In the ArcGIS D8 coding, which value means flow to the south?",
      choices: ["4", "2", "8", "64"],
      answer: 0,
      explain: "Codes run clockwise from east as powers of 2: E 1, SE 2, S 4, SW 8, W 16, NW 32, N 64, NE 128. So south is 4, and 64 is north."
    },
    {
      id: "ch11-q21",
      type: "tf",
      prompt: "In D8, a diagonal neighbor that is 1 m lower than the center cell has the same drop as an edge neighbor that is 1 m lower.",
      answer: false,
      explain: "Drop is elevation difference divided by distance. The diagonal neighbor is 1.414 cell widths away, so its drop is smaller (1 ÷ 1.414 ≈ 0.71 of the edge neighbor's)."
    },
    {
      id: "ch11-q22",
      type: "num",
      prompt: "At a culvert's pour point, flow accumulation on a 10 m DEM is 45,000 cells. What is the drainage area in hectares? (1 ha = 10,000 m²)",
      answer: 450,
      tol: 0.5,
      unit: "ha",
      explain: "Each cell is 10 m × 10 m = 100 m². Area = 45,000 × 100 = 4,500,000 m² = 450 ha (4.5 km²)."
    },
    {
      id: "ch11-q23",
      type: "mc",
      prompt: "You want streams to begin where the drainage area reaches 0.5 km². With a 10 m DEM, what flow accumulation threshold should you use?",
      choices: ["50 cells", "500 cells", "5,000 cells", "50,000 cells"],
      answer: 2,
      explain: "0.5 km² = 500,000 m². Each cell is 100 m², so the threshold is 500,000 ÷ 100 = 5,000 cells."
    },
    {
      id: "ch11-q24",
      type: "mc",
      prompt: "What happens to the extracted stream network when you lower the flow accumulation threshold?",
      choices: [
        "More streams appear, extending farther up into small valleys",
        "Fewer, larger streams remain",
        "The streams shift downhill",
        "Nothing, because the threshold only affects watershed boundaries"
      ],
      answer: 0,
      explain: "A lower threshold labels cells with smaller upstream areas as stream, so channels start farther upslope and more small tributaries appear."
    },
    {
      id: "ch11-q25",
      type: "mc",
      prompt: "You place a pour point for a bridge using an aerial photo, but the watershed tool returns a basin of only a few cells. What is the most likely fix?",
      choices: [
        "Regenerate contours at a larger interval and redigitize the point",
        "Snap the pour point to the highest flow accumulation cell nearby",
        "Recompute the hillshade with a different azimuth and re-place the point",
        "Convert the D8 codes to degrees before running the watershed tool"
      ],
      answer: 1,
      explain: "The point probably landed beside the modeled channel, on a cell with almost no upstream area. Snapping moves it onto the flow path. Contours and hillshade do not affect delineation."
    },
    {
      id: "ch11-q26",
      type: "mc",
      prompt: "A 1 m lidar DEM shows a highway embankment crossing a creek with no opening where the culvert is. What is the standard fix before delineating watersheds?",
      choices: [
        "Raise the DEM cells along the creek downstream so flow can pass the road",
        "Apply a 3×3 mean filter to the whole DEM to smooth out the embankment",
        "Burn (lower) the DEM cells along the culvert so flow can pass the road",
        "Switch to a coarser 30 m DEM so the embankment is less visible"
      ],
      answer: 2,
      explain: "The DEM sees the embankment as a dam. Burning the culvert gives flow a path through it. A coarser DEM might blur the embankment but loses detail everywhere else and does not reliably fix the crossing."
    },
    {
      id: "ch11-q27",
      type: "mc",
      prompt: "How does using a coarser DEM (30 m instead of 1 m) usually affect computed slopes?",
      choices: [
        "Slopes are higher on average, because each cell spans a larger elevation change",
        "Slopes are unchanged on average; only aspect becomes less detailed",
        "Slopes become about 30 times flatter, in proportion to the cell size",
        "Slopes are lower on average, because short steep pitches are averaged out"
      ],
      answer: 3,
      explain: "Each 30 m cell averages the ground within it, and slope is computed over a 90 m window, so short steep sections are smoothed away. The reduction depends on the terrain; it is not a fixed fraction."
    },
    {
      id: "ch11-q28",
      type: "tf",
      prompt: "A 1 m DEM made by resampling 30 m SRTM data contains the same terrain detail as a 1 m lidar DEM.",
      answer: false,
      explain: "Resampling makes smaller cells but adds no information. The result still has only 30 m worth of detail, while lidar measures the ground at about 1 m spacing."
    }
  ]
});
