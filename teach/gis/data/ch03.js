GIS.chapter({
  id: "ch03",
  num: 3,
  title: "Geodesy and Map Projections",
  blurb: "How Earth's shape is modeled with ellipsoids, geoids and datums, and how map projections, UTM and State Plane turn it into flat coordinates, which matters because mixed-up datums and projections are a leading cause of misaligned engineering data.",
  objectives: [
    "Distinguish the geoid, the ellipsoid and the ground surface, and relate ellipsoid, orthometric and geoid heights.",
    "Explain what a datum is and compare NAD27, NAD83, WGS 84, NGVD 29 and NAVD 88.",
    "Convert between degrees-minutes-seconds and decimal degrees and estimate ground distances from angles.",
    "Classify map projections by developable surface and by the property they preserve.",
    "Describe the UTM and State Plane coordinate systems and find a UTM zone from longitude.",
    "Apply scale and elevation factors to convert between ground and grid distances.",
    "Choose correctly between assigning a CRS and reprojecting, and handle datum transformations in QGIS."
  ],
  guide: [
    {
      heading: "Earth's shape: sphere, ellipsoid and geoid",
      paragraphs: [
        "**Geodesy** is the science of measuring Earth's size, shape, orientation and gravity field. For small-scale maps a sphere (mean radius about 6,371 km) is close enough, but Earth bulges at the equator because it spins. An **ellipsoid**, an ellipse rotated about its short polar axis, fits much better. It is defined by its semi-major (equatorial) radius a and either its semi-minor (polar) radius b or its **flattening** f.",
        "Different ellipsoids have been fit to different parts of the world. Clarke 1866 was used for North America in NAD27. GRS80 and the nearly identical WGS 84 ellipsoid are global, Earth-centered fits; their polar radii differ by about 0.1 mm.",
        "The **geoid** is the surface of constant gravity potential that best matches global mean sea level, as if the oceans extended under the continents. It is lumpy because mass is unevenly spread inside Earth, and it rises and falls by up to about 100 m relative to the ellipsoid. Levels and plumb bobs line up with gravity, so the geoid is the natural reference for elevations."
      ],
      formula: {
        expr: "f = (a − b) ÷ a;   b = a × (1 − f)",
        where: [
          "a: semi-major (equatorial) radius",
          "b: semi-minor (polar) radius",
          "f: flattening, usually given as 1/f (about 298.257 for GRS80 and WGS 84)"
        ]
      },
      example: {
        prompt: "The WGS 84 ellipsoid has a = 6,378,137 m and 1/f = 298.257223563. Find the polar radius b and how much shorter it is than a.",
        steps: [
          "f = 1 ÷ 298.257223563 = 0.0033528.",
          "a − b = a × f = 6,378,137 × 0.0033528 = 21,385 m.",
          "b = 6,378,137 − 21,385 = 6,356,752 m."
        ],
        answer: "b ≈ 6,356,752 m; the polar radius is about 21.4 km (13.3 mi) shorter than the equatorial radius."
      }
    },
    {
      heading: "Heights and vertical datums",
      paragraphs: [
        "Three heights are used. **Ellipsoid height (h)** is the distance above the ellipsoid, measured perpendicular to it; GNSS receivers measure this. **Orthometric height (H)** is the height above the geoid, roughly height above mean sea level; this is what engineers call elevation, and it controls which way water flows. **Geoid height (N)** is the separation between the geoid and the ellipsoid at a point.",
        "In the conterminous United States the geoid lies below the ellipsoid, so N is negative and a point's ellipsoid height is smaller than its elevation. GNSS software converts h to H with a geoid model; for NAD83(2011) and NAVD 88 in the conterminous U.S., that model is GEOID18.",
        "A **vertical datum** is the reference that elevations are measured from. NGVD 29 was fit to 26 tide gauges. NAVD 88 replaced it and is held to a single tide gauge benchmark at Rimouski (Father Point), Quebec. The two differ by more than a meter in parts of the West, so always check which vertical datum a set of elevations uses. NGS is replacing NAVD 88 with NAPGD2022, a geopotential datum in which elevations come from GNSS ellipsoid heights and a gravity-based geoid model. Until NGS declares it official, NAVD 88 remains the official U.S. vertical datum."
      ],
      formula: {
        expr: "h = H + N   (so H = h − N)",
        where: [
          "h: ellipsoid height (from GNSS)",
          "H: orthometric height (elevation above the geoid)",
          "N: geoid height (negative where the geoid is below the ellipsoid)"
        ]
      },
      example: {
        prompt: "A GNSS receiver on a manhole lid reports an ellipsoid height h = 1,385.42 m. Suppose the geoid model gives N = −17.25 m at that point. What is the orthometric height?",
        steps: [
          "H = h − N.",
          "H = 1,385.42 − (−17.25) = 1,385.42 + 17.25.",
          "H = 1,402.67 m."
        ],
        answer: "H = 1,402.67 m (about 4,602 ft)"
      }
    },
    {
      heading: "Horizontal datums: NAD27, NAD83 and WGS 84",
      paragraphs: [
        "A **datum** fixes a reference surface (usually an ellipsoid) to Earth: where its center is and how it is oriented. Latitude and longitude only mean something when the datum is known. The same point has different coordinates in different datums.",
        "**NAD27** (North American Datum of 1927) used the Clarke 1866 ellipsoid, held fixed at a survey station at Meades Ranch, Kansas, and fit to North America rather than the whole Earth. **NAD83** (North American Datum of 1983) uses the GRS80 ellipsoid with its center close to Earth's center of mass. Converting between NAD27 and NAD83 shifts coordinates by tens of meters in the conterminous U.S. NAD83 has been readjusted several times; its most recent realization is NAD83(2011).",
        "**WGS 84** (World Geodetic System 1984) is the datum maintained by the U.S. Department of Defense for GPS. It has been refined several times, and its recent versions agree with the International Terrestrial Reference Frame (ITRF) to within a few centimeters. NAD83 is tied to the North American tectonic plate, while WGS 84 and ITRF are global, so the two differ by roughly 1 to 2 m in the conterminous U.S. and slowly drift farther apart. That is small for a phone-based field map but large for survey and engineering work."
      ],
      bullets: [
        "A datum change is not a projection change. Two layers can both be 'UTM zone 12N' and still be 1 to 2 m apart if one is NAD83 and the other is WGS 84.",
        "NGS is replacing the NAD83 frames with four plate-fixed frames (NATRF2022 for the North American plate, plus PATRF2022, CATRF2022 and MATRF2022) and updating State Plane as SPCS2022. Until NGS declares them official, NAD83 and NAVD 88 remain the official U.S. datums; check the NGS website for current status."
      ]
    },
    {
      heading: "Latitude and longitude",
      paragraphs: [
        "**Latitude** is the angle north or south of the equator, from 0° at the equator to 90° at the poles. Geodetic latitude is measured between the equatorial plane and the line perpendicular to the ellipsoid at the point. **Longitude** is the angle east or west of the **prime meridian** through Greenwich, from 0° to 180°. Lines of equal latitude are parallels; lines of equal longitude are meridians.",
        "Angles are written in degrees, minutes and seconds (DMS; 1° = 60′ and 1′ = 60″) or in decimal degrees (DD). In decimal degrees, south latitudes and west longitudes are negative, so Provo, Utah, is near 40.23°, −111.66°. Software often expects longitude first (x, then y), which is a common source of swapped coordinates.",
        "A degree is an angle, not a distance. One degree of latitude is about 111 km (69 mi) everywhere, and one second of latitude is about 31 m (101 ft). Meridians come together toward the poles, so a degree of longitude shrinks with latitude, to about 111.3 km × cos(latitude). For this reason, distances and areas should not be measured directly in degrees."
      ],
      formula: {
        expr: "DD = D + M/60 + S/3600;   length of 1° of longitude ≈ 111.32 km × cos(latitude)",
        where: [
          "D, M, S: degrees, minutes and seconds",
          "DD: decimal degrees (make it negative for south latitude or west longitude)"
        ]
      },
      example: {
        prompt: "Convert 111° 39′ 27″ W to decimal degrees, then find the east–west length of one degree of longitude at 40° N.",
        steps: [
          "DD = 111 + 39/60 + 27/3600 = 111 + 0.65 + 0.0075 = 111.6575.",
          "The point is west of Greenwich, so DD = −111.6575°.",
          "Length of 1° of longitude at 40° N ≈ 111.32 km × cos 40° = 111.32 × 0.7660 = 85.3 km."
        ],
        answer: "−111.6575°; about 85.3 km (53 mi) per degree of longitude at 40° N"
      }
    },
    {
      heading: "Map projections and distortion",
      paragraphs: [
        "A **map projection** is a set of equations that converts latitude and longitude on the ellipsoid to x, y coordinates on a flat surface. A curved surface cannot be flattened without stretching or tearing, so every projection distorts some mix of shape, area, distance and direction. Distortion is zero or small along **standard lines** or at a standard point and grows away from them.",
        "Projections are grouped by what they preserve. A **conformal** projection keeps local angles correct, so small shapes look right and scale is the same in every direction at a point, but areas are distorted. An **equal-area** projection keeps areas in correct proportion but distorts shapes. An **equidistant** projection keeps true scale along certain lines, such as all lines from one center point, but no projection keeps every distance true. An **azimuthal** projection keeps directions true from a center point. No projection can be both conformal and equal-area.",
        "**Tissot's indicatrix** shows distortion by placing small, identical circles across the globe and plotting how each looks on the map. On a conformal map the circles stay circles but change size; on an equal-area map they become ellipses that all have the same area."
      ],
      bullets: [
        "Surveying, engineering design and navigation: conformal (Transverse Mercator, Lambert Conformal Conic).",
        "Comparing areas, density maps and land cover totals: equal-area (Albers Equal-Area Conic, Lambert Azimuthal Equal-Area).",
        "Distances from one place, such as range rings around an airport: azimuthal equidistant."
      ]
    },
    {
      heading: "Projection families and developable surfaces",
      paragraphs: [
        "Many projections can be pictured as wrapping a **developable surface** around the globe. A developable surface can be unrolled flat without stretching: a **cylinder**, a **cone** or a **plane**. Features are projected onto the surface, which is then flattened. Real projections are defined by equations, but this picture explains where distortion is low and where it grows.",
        "A surface that touches the globe along one line is **tangent**; one that cuts through it along two lines is **secant**. A secant surface spreads distortion more evenly: scale is slightly too small between the two standard lines and slightly too large outside them. The **aspect** can be normal (cylinder axis along Earth's axis), transverse (turned 90°) or oblique."
      ],
      bullets: [
        "**Cylindrical**: Mercator (conformal; straight rhumb lines; huge area distortion near the poles), Transverse Mercator (cylinder turned sideways; good for regions long north–south) and Web Mercator (EPSG:3857), used by online basemaps.",
        "**Conic**: Lambert Conformal Conic and Albers Equal-Area Conic, both suited to mid-latitude regions that are long east–west, such as the conterminous U.S. Distortion is lowest near the standard parallels.",
        "**Planar (azimuthal)**: stereographic (conformal), Lambert Azimuthal Equal-Area, azimuthal equidistant and gnomonic (great circles plot as straight lines). Suited to polar areas and roughly round regions."
      ],
      qgis: "Every QGIS CRS has a definition (WKT or PROJ string) listing its projection and parameters. Open Project → Properties → CRS and select a CRS to see its definition in the lower part of the dialog."
    },
    {
      heading: "Universal Transverse Mercator (UTM)",
      paragraphs: [
        "UTM divides the world between 80° S and 84° N into 60 zones, each 6° of longitude wide, numbered eastward from zone 1 (180° to 174° W). Each zone has its own secant Transverse Mercator projection centered on the zone's **central meridian**. The polar regions use the Universal Polar Stereographic system instead.",
        "The scale factor on the central meridian is **k₀ = 0.9996**, so distances there are shortened by 4 parts in 10,000. Scale is true (k = 1) along two lines roughly 180 km east and west of the central meridian and grows to about 1.0010 at the zone edges near the equator. Within a zone, scale error stays within about 1 part in 1,000.",
        "Coordinates are in meters. The central meridian gets a **false easting** of 500,000 m so that every easting in the zone is positive. In the Northern Hemisphere, northing is the distance from the equator; in the Southern Hemisphere a **false northing** of 10,000,000 m is used. A complete UTM coordinate states its zone and hemisphere (such as 12N) and its datum (such as NAD83 or WGS 84)."
      ],
      formula: {
        expr: "zone = floor((longitude + 180) ÷ 6) + 1;   central meridian = 6 × zone − 183",
        where: [
          "longitude in decimal degrees, negative west of Greenwich",
          "floor: round down to a whole number",
          "central meridian in decimal degrees (negative means west)"
        ]
      },
      example: {
        prompt: "BYU's campus in Provo is near longitude 111.65° W. Find its UTM zone and central meridian.",
        steps: [
          "Longitude in decimal degrees = −111.65.",
          "(−111.65 + 180) ÷ 6 = 68.35 ÷ 6 = 11.39. Round down to 11, then add 1: zone 12.",
          "Central meridian = 6 × 12 − 183 = −111, or 111° W.",
          "Provo is 0.65° west of the central meridian, about 55 km at this latitude, so the scale factor there is close to 0.9996."
        ],
        answer: "UTM zone 12N, central meridian 111° W (NAD83 / UTM zone 12N is EPSG:26912)"
      },
      qgis: "Search for 'UTM zone 12N' in the CRS selector to see both the NAD83 version (EPSG:26912) and the WGS 84 version (EPSG:32612). Pick the one that matches your data's datum."
    },
    {
      heading: "State Plane coordinates and grid vs. ground distance",
      paragraphs: [
        "The **State Plane Coordinate System (SPCS)** divides each U.S. state into one or more zones, usually along county lines. Zones that are long north–south use Transverse Mercator; zones that are long east–west use Lambert Conformal Conic; one zone in the Alaska panhandle uses an oblique Mercator projection. Zones are small enough that scale error is generally within 1 part in 10,000, which suits surveying and engineering. Utah has three zones (North, Central and South), all Lambert Conformal Conic.",
        "SPCS 83 is defined in meters, but many states publish coordinates in feet. The **U.S. survey foot** (1200/3937 m) is 2 parts per million longer than the **international foot** (exactly 0.3048 m). The U.S. survey foot was officially retired at the end of 2022, but older State Plane data still use it. At a coordinate of 2,000,000 ft the two definitions differ by about 4 ft, so check the units in the CRS definition.",
        "Projected coordinates live on the map grid, not on the ground. To compare a field-measured (ground) distance with a grid distance, multiply by the **combined factor**: the projection's grid **scale factor** k times an **elevation factor** that reduces the distance from ground level down to the ellipsoid. At Utah valley elevations the elevation factor alone is about 0.9998, so grid distances are shorter than ground distances."
      ],
      formula: {
        expr: "grid distance = ground distance × CF;   CF = k × R ÷ (R + h)",
        where: [
          "CF: combined factor",
          "k: grid scale factor of the projection at the site",
          "R: Earth's mean radius, about 6,371,000 m (20,902,000 ft)",
          "h: ellipsoid height of the site, in the same units as R"
        ]
      },
      example: {
        prompt: "A survey crew near Provo measures a horizontal ground distance of 1,000.000 m at an ellipsoid height of 1,400 m. The State Plane grid scale factor at the site is 0.99995. What is the grid distance?",
        steps: [
          "Elevation factor = 6,371,000 ÷ (6,371,000 + 1,400) = 0.999780.",
          "Combined factor = 0.99995 × 0.999780 = 0.999730.",
          "Grid distance = 1,000.000 m × 0.999730 = 999.730 m."
        ],
        answer: "999.730 m, about 0.27 m (0.9 ft) shorter than the ground distance"
      }
    },
    {
      heading: "Working with coordinate reference systems in QGIS",
      figures: [
        { src: "img/qgis/project-crs.webp", w: 1563, h: 1094,
          alt: "Project Properties dialog on the CRS page, filtered for UTM zone 12N, with NAD83 / UTM zone 12N (EPSG:26912) selected and its definition and area of use shown below.",
          caption: "**Project > Properties > CRS**, filtered for “UTM zone 12N”. EPSG:26912 is NAD83 / UTM zone 12N, a common choice for Utah County work; EPSG:32612 is the WGS 84 version. The panel below the list shows the selected CRS's definition and area of use." }
      ],
      paragraphs: [
        "A **coordinate reference system (CRS)** combines a datum, a coordinate system (geographic or projected) and units. Common CRSs have **EPSG codes**: 4326 is WGS 84 latitude/longitude, 4269 is NAD83 latitude/longitude, 26912 is NAD83 / UTM zone 12N, 32612 is WGS 84 / UTM zone 12N, and 3857 is Web Mercator.",
        "Two operations are easy to confuse. **Assigning** (setting) a CRS tells the software what the stored coordinates already are. It changes no numbers and is only right when the existing label is missing or wrong. **Reprojecting** (transforming) computes new coordinates in a different CRS and writes them to a new layer. If you assign the wrong CRS, a layer lands in the wrong place, often hundreds of kilometers away or near latitude 0°, longitude 0°.",
        "When the source and target CRSs use different datums, a **datum transformation** is needed too. Several may exist, from simple three-parameter shifts to grid-based methods such as NADCON for NAD27 to NAD83, and they differ in accuracy. QGIS reprojects layers on the fly so they line up on screen, but measurements, analysis and deliverables should use a projected CRS suited to the area, such as UTM or State Plane."
      ],
      bullets: [
        "Set the project CRS: Project → Properties → CRS, or click the EPSG code in the lower-right corner of the window.",
        "Assign a layer's CRS: right-click the layer → Layer CRS → Set Layer CRS, or Layer Properties → Source.",
        "Reproject a vector layer: Processing Toolbox → Vector general → Reproject layer, or right-click → Export → Save Features As and pick a new CRS.",
        "Reproject a raster: Raster → Projections → Warp (Reproject).",
        "Datum transformations: QGIS asks you to choose when more than one is available, and saved choices appear in Project → Properties → Transformations.",
        "Ellipsoidal measurement: the ellipsoid in Project → Properties → General is used by the Measure tool and by `$area` and `$length` in the Field Calculator."
      ]
    }
  ],
  cards: [
    { front: "Geodesy", back: "The science of measuring Earth's size, shape, orientation and gravity field. It provides the framework for all coordinates." },
    { front: "Ellipsoid", back: "A smooth mathematical surface made by rotating an ellipse about its polar axis. Used to compute latitude, longitude and ellipsoid height." },
    { front: "Flattening (f)", back: "f = (a − b)/a, where a is the equatorial and b the polar radius. For GRS80 and WGS 84, 1/f ≈ 298.257." },
    { front: "Geoid", back: "The surface of constant gravity potential that best fits global mean sea level. Elevations are measured from it; it departs from the ellipsoid by up to about 100 m." },
    { front: "Ellipsoid height (h)", back: "Height above the ellipsoid, measured perpendicular to it. GNSS receivers measure this directly." },
    { front: "Orthometric height (H)", back: "Height above the geoid, roughly height above mean sea level; what engineers call elevation. H = h − N." },
    { front: "Geoid height (N)", back: "The separation between the geoid and the ellipsoid at a point. Negative in the conterminous U.S., where the geoid lies below the ellipsoid." },
    { front: "Datum", back: "A reference surface fixed to Earth with a defined origin and orientation. Coordinates only have meaning relative to a datum." },
    { front: "NAD27", back: "North American Datum of 1927: Clarke 1866 ellipsoid fixed at Meades Ranch, Kansas. Differs from NAD83 by tens of meters in the conterminous U.S." },
    { front: "NAD83", back: "North American Datum of 1983: GRS80 ellipsoid, nearly Earth-centered, tied to the North American plate. Most recent realization: NAD83(2011)." },
    { front: "WGS 84", back: "World Geodetic System 1984, the datum used by GPS. Kept aligned with ITRF; differs from NAD83 by about 1–2 m in the conterminous U.S." },
    { front: "NAVD 88", back: "North American Vertical Datum of 1988, the official U.S. datum for elevations; it replaced NGVD 29. NGS plans to replace it with NAPGD2022." },
    { front: "GEOID18", back: "An NGS hybrid geoid model that converts NAD83(2011) ellipsoid heights to NAVD 88 elevations in the conterminous U.S., Puerto Rico and the U.S. Virgin Islands." },
    { front: "Map projection", back: "Equations that convert latitude and longitude on the ellipsoid to x, y on a flat surface. Every projection distorts something." },
    { front: "Developable surface", back: "A shape that can be flattened without stretching (cylinder, cone or plane), used to picture and classify projections." },
    { front: "Secant projection", back: "A projection whose surface cuts the globe along two standard lines, spreading distortion more evenly than a tangent surface." },
    { front: "Conformal projection", back: "Keeps local angles and the shapes of small features; scale is equal in all directions at a point. Examples: Mercator, Lambert Conformal Conic." },
    { front: "Equal-area projection", back: "Keeps relative areas correct everywhere but distorts shapes. Examples: Albers Equal-Area Conic, Lambert Azimuthal Equal-Area." },
    { front: "Tissot's indicatrix", back: "Small circles plotted across a map to show distortion. Size change shows area distortion; stretching into ellipses shows shape distortion." },
    { front: "Transverse Mercator", back: "A cylindrical projection with the cylinder turned sideways, so scale is best along a central meridian. Used for UTM and many State Plane zones." },
    { front: "Lambert Conformal Conic", back: "A conformal conic projection, usually secant with two standard parallels. Used for State Plane zones that are long east–west." },
    { front: "UTM", back: "Universal Transverse Mercator: 60 zones, each 6° wide, with its own Transverse Mercator projection, k₀ = 0.9996 and coordinates in meters." },
    { front: "False easting", back: "A constant added to x coordinates so they stay positive. UTM assigns 500,000 m to each zone's central meridian." },
    { front: "State Plane Coordinate System", back: "U.S. system of conformal projection zones that follow state and county lines, designed to keep scale error within about 1 part in 10,000." },
    { front: "Scale factor (k)", back: "The ratio of grid (map) distance to ellipsoid distance at a point. k = 0.9996 on a UTM central meridian." },
    { front: "Combined factor", back: "Grid scale factor times elevation factor. Multiply a ground distance by it to get the grid distance." },
    { front: "U.S. survey foot", back: "1200/3937 m, 2 parts per million longer than the international foot (0.3048 m). Retired at the end of 2022 but still found in older State Plane data." },
    { front: "EPSG code", back: "A numeric ID for a CRS or transformation in the EPSG registry, such as 4326 (WGS 84) or 26912 (NAD83 / UTM zone 12N)." },
    { front: "Reproject vs. assign CRS", back: "Reprojecting computes new coordinates in another CRS. Assigning only labels the existing coordinates and changes no numbers." },
    { front: "Web Mercator", back: "EPSG:3857, the projection of most online basemaps. Fine for viewing, but scale grows with latitude, so do not measure areas or distances in it." }
  ],
  questions: [
    {
      id: "ch03-q01",
      type: "mc",
      prompt: "What is the geoid?",
      choices: [
        "The smooth GRS80 ellipsoid that NAD83 uses to compute latitude and longitude",
        "The surface of constant gravity potential that best fits global mean sea level",
        "The actual land surface, including mountains, valleys and the ocean floor",
        "A network of surveyed control points used to adjust national surveys"
      ],
      answer: 1,
      explain: "The geoid follows gravity, so it is the surface that 'level' refers to, and it is lumpy. The ellipsoid is a smooth mathematical model, and the land surface is a third, separate surface."
    },
    {
      id: "ch03-q02",
      type: "mc",
      prompt: "Without a geoid model applied, what kind of height does a GNSS receiver measure?",
      choices: [
        "Orthometric height above the geoid",
        "Height above the local ground surface",
        "NAVD 88 elevation",
        "Ellipsoid height"
      ],
      answer: 3,
      explain: "GNSS positions are computed relative to the ellipsoid, so the raw height is ellipsoid height h. Getting an elevation (orthometric height, such as NAVD 88) needs a geoid model: H = h − N."
    },
    {
      id: "ch03-q03",
      type: "num",
      prompt: "A GNSS survey gives an ellipsoid height h = 1,318.60 m at a benchmark. The geoid height there is N = −16.90 m. What is the orthometric height H, in meters?",
      answer: 1335.5,
      tol: 0.01,
      unit: "m",
      explain: "H = h − N = 1,318.60 − (−16.90) = 1,335.50 m. A common mistake is adding N (1,301.70 m), which puts the point lower instead of higher."
    },
    {
      id: "ch03-q04",
      type: "mc",
      prompt: "In geodesy, which description best fits a datum?",
      choices: [
        "A reference surface, such as an ellipsoid, fixed in position and orientation to Earth",
        "A set of equations that flattens the ellipsoid onto a plane with x, y coordinates",
        "The linear units, such as meters or U.S. survey feet, used for a set of coordinates",
        "A single brass benchmark disk set in concrete, with a published elevation"
      ],
      answer: 0,
      explain: "A datum ties a reference surface to the real Earth so coordinates mean something. Equations that flatten the globe are a map projection, a separate part of a CRS."
    },
    {
      id: "ch03-q05",
      type: "mc",
      prompt: "Which statement correctly compares NAD27 and NAD83?",
      choices: [
        "NAD27 used the GRS80 ellipsoid centered on Earth's mass; NAD83 uses Clarke 1866 fixed in Kansas",
        "Both use the Clarke 1866 ellipsoid fixed at Meades Ranch; they differ only in their linear units",
        "NAD27 used Clarke 1866 fit to North America; NAD83 uses GRS80, centered near Earth's center of mass",
        "NAD83 is a vertical datum for elevations; NAD27 is a horizontal datum for latitude and longitude"
      ],
      answer: 2,
      explain: "NAD27 was a regional fit anchored at Meades Ranch, Kansas. NAD83 moved to the global GRS80 ellipsoid with a nearly geocentric origin, which shifted coordinates by tens of meters. Both are horizontal datums."
    },
    {
      id: "ch03-q06",
      type: "mc",
      prompt: "A civil engineer displays GPS points collected in WGS 84 on top of a topographic survey delivered in NAD83 State Plane. Across the whole site, the GPS points sit about 1.5 m from the matching survey points, all shifted in the same direction. What is the most likely cause?",
      choices: [
        "The State Plane grid scale factor was not applied to the GPS coordinates",
        "The WGS 84 to NAD83 datum difference was not handled with a proper transformation",
        "No geoid model was applied, so the GPS heights are on the wrong surface",
        "The GPS receiver recorded its coordinates in feet instead of in meters"
      ],
      answer: 1,
      explain: "A uniform shift of 1–2 m is the signature of the WGS 84–NAD83 difference. Scale factor errors grow with distance instead of shifting everything equally, a geoid error affects heights rather than horizontal positions, and a feet/meters mix-up would put points kilometers away."
    },
    {
      id: "ch03-q07",
      type: "tf",
      prompt: "For engineering survey work in the conterminous U.S., NAD83 and WGS 84 coordinates can be mixed freely because the two datums are identical.",
      answer: false,
      explain: "The two were nearly the same in the 1980s but have been refined separately. Today they differ by about 1 to 2 m, far more than survey tolerances allow."
    },
    {
      id: "ch03-q08",
      type: "num",
      prompt: "Convert the latitude 40° 14′ 51″ N to decimal degrees (give at least four decimal places).",
      answer: 40.2475,
      tol: 0.0001,
      unit: "°",
      explain: "40 + 14/60 + 51/3600 = 40 + 0.233333 + 0.014167 = 40.2475°."
    },
    {
      id: "ch03-q09",
      type: "num",
      prompt: "Using 111.32 km for one degree of longitude at the equator, about how long is one degree of longitude at 40° N, in kilometers?",
      answer: 85.28,
      tol: 0.3,
      unit: "km",
      explain: "111.32 × cos 40° = 111.32 × 0.7660 = 85.3 km. Meridians come together toward the poles, so a degree of longitude shrinks with latitude, while a degree of latitude stays near 111 km."
    },
    {
      id: "ch03-q10",
      type: "mc",
      prompt: "What does a conformal projection preserve?",
      choices: [
        "The areas of all regions",
        "The distances between all pairs of points",
        "Local angles, so small features keep their shape",
        "Directions from every point to every other point"
      ],
      answer: 2,
      explain: "Conformal projections keep angles correct at every point, so small shapes are right. They do this by letting area scale change across the map; no projection keeps all distances true."
    },
    {
      id: "ch03-q11",
      type: "mc",
      prompt: "A state planning office wants a map comparing the area of irrigated farmland in every county of the western U.S. Which projection is most appropriate?",
      choices: [
        "Albers Equal-Area Conic",
        "Web Mercator (EPSG:3857)",
        "Lambert Conformal Conic",
        "UTM zone 12N (EPSG:26912)"
      ],
      answer: 0,
      explain: "Comparing areas calls for an equal-area projection. Web Mercator inflates areas more and more toward the poles, Lambert Conformal Conic preserves shape rather than area, and one UTM zone covers only 6° of longitude while the western U.S. spans several zones."
    },
    {
      id: "ch03-q12",
      type: "tf",
      prompt: "A map projection can be both conformal and equal-area if it uses a secant surface.",
      answer: false,
      explain: "No flat map can keep both angles and areas correct everywhere. A secant surface reduces distortion overall, but it does not remove the trade-off."
    },
    {
      id: "ch03-q13",
      type: "mc",
      prompt: "Which developable surface does the Lambert Conformal Conic projection use?",
      choices: [
        "A normal-aspect cylinder",
        "A transverse cylinder",
        "A plane",
        "A cone"
      ],
      answer: 3,
      explain: "As its name says, it is a conic projection: a cone, usually secant along two standard parallels. Transverse Mercator uses a transverse cylinder, and azimuthal projections use a plane."
    },
    {
      id: "ch03-q14",
      type: "mc",
      prompt: "What does it mean that a projection's surface is secant?",
      choices: [
        "It touches the globe at a single point, where scale is exactly true",
        "It cuts through the globe, creating two standard lines where scale is true",
        "It is turned 90° from the normal aspect, so it is centered on a meridian",
        "It preserves area everywhere because distortion is split between two lines"
      ],
      answer: 1,
      explain: "A secant surface passes through the globe, so scale is exactly true along two lines and slightly off between and outside them. A surface turned 90° describes a transverse aspect, which is a separate idea."
    },
    {
      id: "ch03-q15",
      type: "mc",
      prompt: "Which projection do State Plane zones that are long in the east–west direction usually use?",
      choices: [
        "Transverse Mercator",
        "Lambert Conformal Conic",
        "Albers Equal-Area Conic",
        "Azimuthal equidistant"
      ],
      answer: 1,
      explain: "A cone with two standard parallels keeps scale error small along an east–west band. Transverse Mercator suits zones that are long north–south. Albers is also conic, but it is equal-area, and State Plane zones are conformal."
    },
    {
      id: "ch03-q16",
      type: "mc",
      prompt: "A project site in Provo, Utah, is near longitude 111.66° W. Which UTM zone and central meridian apply?",
      choices: [
        "Zone 11, central meridian 117° W",
        "Zone 12, central meridian 114° W",
        "Zone 12, central meridian 111° W",
        "Zone 13, central meridian 105° W"
      ],
      answer: 2,
      explain: "zone = floor((−111.66 + 180) ÷ 6) + 1 = floor(11.39) + 1 = 12. Central meridian = 6 × 12 − 183 = −111°, or 111° W. 114° W is the zone's western edge, not its center."
    },
    {
      id: "ch03-q17",
      type: "mc",
      prompt: "Why is the UTM scale factor on the central meridian 0.9996 instead of exactly 1?",
      choices: [
        "To convert the zone's coordinates from U.S. survey feet to meters at the central meridian",
        "To correct for the separation between the geoid and the ellipsoid across the whole zone",
        "To make the projection equal-area, so that parcel areas measured in the zone are correct",
        "To spread scale error across the zone, with true scale about 180 km either side of the center"
      ],
      answer: 3,
      explain: "Reducing scale at the center makes the projection secant. Scale error is then split between slightly too small near the center and slightly too large near the edges, rather than growing from zero to a larger error at the edges."
    },
    {
      id: "ch03-q18",
      type: "mc",
      prompt: "Why does UTM give each zone's central meridian a false easting of 500,000 m?",
      choices: [
        "So every easting in the zone is positive",
        "Because each zone is exactly 500 km wide",
        "To account for the datum shift from NAD27",
        "So eastings can be read as distance from Greenwich"
      ],
      answer: 0,
      explain: "Points west of the central meridian would otherwise have negative eastings. Zone width varies with latitude, up to about 668 km at the equator, so 500 km is not the zone width."
    },
    {
      id: "ch03-q19",
      type: "tf",
      prompt: "In the Southern Hemisphere, UTM uses a false northing of 10,000,000 m at the equator so that northings stay positive.",
      answer: true,
      explain: "Southern Hemisphere northings count down from 10,000,000 m at the equator. In the Northern Hemisphere the equator has a northing of 0 m."
    },
    {
      id: "ch03-q20",
      type: "mc",
      prompt: "Which of these is a projected coordinate reference system?",
      choices: [
        "NAD83 / UTM zone 12N (EPSG:26912)",
        "WGS 84, the GPS datum (EPSG:4326)",
        "NAD83 for North America (EPSG:4269)",
        "NAVD 88 height (EPSG:5703)"
      ],
      answer: 0,
      explain: "UTM zone 12N projects NAD83 latitude and longitude onto a flat grid in meters. EPSG:4326 and EPSG:4269 are geographic (degrees), and NAVD 88 is a vertical datum."
    },
    {
      id: "ch03-q21",
      type: "mc",
      prompt: "You load a CSV of field points into QGIS. They plot near latitude 0°, longitude 0°, off the coast of Africa, instead of in Utah. The x and y columns hold values like −111.65 and 40.25, and the layer CRS is set to Web Mercator (EPSG:3857). What should you do?",
      choices: [
        "Reproject the layer from EPSG:3857 to EPSG:4326 to get degrees",
        "Change the project CRS to UTM zone 12N so the layer lines up",
        "Assign (set) the layer CRS to EPSG:4326 without reprojecting it",
        "Multiply the coordinates by 111,320 to convert degrees to meters"
      ],
      answer: 2,
      explain: "The numbers are already longitude and latitude in degrees; they were mislabeled as Web Mercator meters, so they plot about 120 m from (0°, 0°). Assigning the correct geographic CRS fixes the label. Reprojecting would transform the wrong values and leave the points near (0°, 0°)."
    },
    {
      id: "ch03-q22",
      type: "mc",
      prompt: "County parcels are stored in NAD83 / Utah Central (ftUS), and a state agency requires the submittal in NAD83 / UTM zone 12N (meters). Which QGIS approach is correct?",
      choices: [
        "Run Vector general → Reproject layer with UTM zone 12N as the target CRS",
        "Use Layer CRS → Set Layer CRS to change the layer's CRS to UTM zone 12N",
        "Set the project CRS to UTM zone 12N and send the original parcel file",
        "Use the Field Calculator to multiply every coordinate by 0.3048 (ft to m)"
      ],
      answer: 0,
      explain: "The coordinates must be recalculated in the new projection, which is what Reproject layer does. Set Layer CRS only changes the label, the project CRS only affects the display, and multiplying by 0.3048 converts units without changing the projection."
    },
    {
      id: "ch03-q23",
      type: "tf",
      prompt: "Changing the project CRS (Project → Properties → CRS) rewrites the coordinates stored in each layer's file.",
      answer: false,
      explain: "The project CRS controls how layers are displayed and measured in the map canvas; QGIS reprojects them on the fly. The files are unchanged until you export or reproject a layer."
    },
    {
      id: "ch03-q24",
      type: "mc",
      prompt: "Why is it a poor idea to measure areas in Web Mercator (EPSG:3857)?",
      choices: [
        "It is an equal-area projection, so it keeps areas but distorts their shapes",
        "Scale grows with latitude, so areas near 40° N are inflated by about 70 percent",
        "It stores coordinates in degrees, so areas come out in square degrees",
        "Its scale shrinks with latitude, so areas in Utah come out about 30 percent too small"
      ],
      answer: 1,
      explain: "Mercator's area scale is about 1 ÷ cos²(latitude); at 40° that is 1 ÷ 0.587 ≈ 1.70. Use an equal-area projection, a local UTM or State Plane CRS, or ellipsoidal `$area` instead."
    },
    {
      id: "ch03-q25",
      type: "mc",
      prompt: "A State Plane northing of 2,000,000.00 ft was recorded in U.S. survey feet, but the CRS you assign uses international feet. About how far off will the position be?",
      choices: [
        "About 0.04 ft",
        "About 400 ft",
        "No difference, because the two feet are identical",
        "About 4 ft"
      ],
      answer: 3,
      explain: "The two feet differ by 2 parts per million: 2,000,000 × 0.000002 = 4 ft (about 1.2 m). Small as a ratio, but large for engineering work."
    },
    {
      id: "ch03-q26",
      type: "num",
      prompt: "A ground distance of 2,500.00 ft is measured between two control points. The combined factor at the site is 0.99973. What is the grid distance, in feet?",
      answer: 2499.33,
      tol: 0.02,
      unit: "ft",
      explain: "Grid distance = ground distance × combined factor = 2,500.00 × 0.99973 = 2,499.325 ≈ 2,499.33 ft."
    },
    {
      id: "ch03-q27",
      type: "mc",
      prompt: "Near Provo, about 1,400 m above the ellipsoid, why is a State Plane grid distance usually shorter than the same distance measured on the ground?",
      choices: [
        "Because the U.S. survey foot is slightly longer than the international foot",
        "Because the geoid is above the ellipsoid in Utah, so the geoid height N is positive",
        "Because the ground is well above the ellipsoid, so the elevation factor is less than 1",
        "Because conformal projections such as Lambert always shrink distances everywhere"
      ],
      answer: 2,
      explain: "Reducing a distance from ground level to the ellipsoid shortens it by R ÷ (R + h), about 0.99978 at 1,400 m. The grid scale factor is within about 0.0001 of 1, so the elevation effect dominates. The geoid is actually below the ellipsoid in Utah."
    },
    {
      id: "ch03-q28",
      type: "tf",
      prompt: "In the conterminous U.S., where the geoid lies below the ellipsoid, a point's GNSS ellipsoid height is smaller than its orthometric height (elevation).",
      answer: true,
      explain: "h = H + N with N negative, so h is less than H. For example, with N = −17 m, the ellipsoid height is 17 m less than the elevation."
    },
    {
      id: "ch03-q29",
      type: "mc",
      prompt: "On a world map with Tissot's indicatrices, every circle stays a circle, but circles near the poles are much larger than those near the equator. What does this tell you about the projection?",
      choices: [
        "It is conformal but not equal-area",
        "It is equal-area",
        "It is equidistant from its center",
        "It has no distortion"
      ],
      answer: 0,
      explain: "Circles that stay round mean angles and local shapes are kept (conformal). Growing size means area scale changes, so it is not equal-area. Mercator looks like this."
    },
    {
      id: "ch03-q30",
      type: "mc",
      prompt: "NGS is modernizing the National Spatial Reference System. Which new datums are planned to replace NAD83 and NAVD 88?",
      choices: [
        "WGS 84 (G2296) and the EGM2008 geoid model",
        "NAD27 and NGVD 29, readjusted with GNSS data",
        "ITRF2020 and the GEOID18 hybrid geoid model",
        "NATRF2022 (and related frames) and NAPGD2022"
      ],
      answer: 3,
      explain: "NGS is introducing four terrestrial reference frames, led by NATRF2022 for the North American plate, and the geopotential datum NAPGD2022. Until NGS declares them official, NAD83 and NAVD 88 remain the official datums, so check NGS for current status."
    }
  ]
});
