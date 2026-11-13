GIS.chapter({
  id: "ch06",
  num: 6,
  title: "Aerial and Satellite Images",
  blurb: "How cameras, satellites, lidar and drones record the Earth's surface, how to measure from those images, and how to turn pixels into maps of land cover and vegetation.",
  objectives: [
    "Describe the electromagnetic spectrum and explain how spectral signatures let us tell vegetation, water, soil and pavement apart.",
    "Compute photo scale, relief displacement and drone ground sample distance.",
    "Explain why an orthophoto can be measured like a map and a raw aerial photo cannot.",
    "Distinguish spatial, spectral, radiometric and temporal resolution and the trade-offs among them.",
    "Compare Landsat, Sentinel, aerial, drone and lidar data and pick one that suits a project.",
    "Calculate NDVI and interpret its values.",
    "Explain the steps of supervised and unsupervised classification and how classification accuracy is checked."
  ],
  guide: [
    {
      heading: "Remote sensing and the electromagnetic spectrum",
      paragraphs: [
        "**Remote sensing** means collecting information about the Earth's surface without touching it, usually from aircraft, drones or satellites. Sensors measure **electromagnetic energy**. A **passive** sensor records energy that comes from somewhere else: sunlight reflected by the surface, or heat the surface emits. An **active** sensor sends out its own energy and measures what comes back. Cameras and most satellite imagers are passive; radar and lidar are active.",
        "Energy is described by its wavelength. Human eyes see only a narrow slice, about 0.4 to 0.7 micrometers (µm). Sensors also record longer wavelengths we cannot see. The atmosphere absorbs some wavelengths (mostly through water vapor, carbon dioxide and ozone), so sensors are designed to record in **atmospheric windows** where energy passes through. Each wavelength range a sensor records is called a **band**, and each band is stored as one layer of the image."
      ],
      bullets: [
        "Visible: blue about 0.4–0.5 µm, green 0.5–0.6 µm, red 0.6–0.7 µm.",
        "Near-infrared (NIR): about 0.7–1.3 µm. Key for vegetation.",
        "Shortwave infrared (SWIR): about 1.3–3 µm. Sensitive to moisture in soil and leaves.",
        "Thermal infrared: about 8–14 µm is the window used to measure surface temperature. This is emitted heat, not reflected sunlight.",
        "Microwave: millimeters to about a meter. Used by radar, which sees through clouds and works at night."
      ]
    },
    {
      heading: "Spectral signatures and band combinations",
      paragraphs: [
        "Each material reflects a different share of the incoming energy at each wavelength. That pattern is its **spectral signature**. Healthy leaves absorb blue and red light for photosynthesis, reflect some green, and reflect near-infrared strongly because of their internal cell structure. Stressed or dying vegetation reflects less NIR and more red. Clear water reflects little energy at any wavelength and almost none in NIR and SWIR, so it looks dark in those bands. Dry bare soil reflects more as wavelength increases, and moisture lowers its reflectance overall.",
        "A screen shows three colors, so we display three bands at a time in the red, green and blue channels. A **true-color** composite puts the red band in red, green in green and blue in blue. A **color-infrared (false-color)** composite puts NIR in red, red in green and green in blue. Healthy vegetation then appears bright red, water dark blue to black, and pavement and buildings gray or cyan. For Landsat 8 and 9, true color is bands 4-3-2 and color infrared is 5-4-3; for Sentinel-2 they are 4-3-2 and 8-4-3."
      ],
      qgis: "Layer Properties → Symbology → Render type: Multiband color lets you assign any band to the red, green and blue channels. Use the Identify Features tool to read the pixel values of every band at a point and compare signatures."
    },
    {
      heading: "Aerial photography and photo scale",
      paragraphs: [
        "Aerial photographs are taken from aircraft or drones. A **vertical** photo is taken with the camera pointing straight down; an **oblique** photo is tilted and shows the sides of buildings. Mapping uses vertical photos taken with calibrated digital cameras, flown in parallel strips over the project area.",
        "**Photo scale** is the ratio of a distance on the photo to the same distance on the ground. For a vertical photo it equals the camera's focal length divided by the flying height above the ground. Because terrain varies, the scale varies too: hilltops are closer to the camera and appear at a larger scale than valleys. A raw aerial photo of hilly ground does not have one true scale."
      ],
      formula: {
        expr: "S = f / (H − h)",
        where: [
          "S: photo scale, written as 1 : (H − h)/f",
          "f: camera focal length",
          "H: flying height above the datum (sea level)",
          "h: ground elevation above the same datum",
          "Use the same units for f and (H − h)"
        ]
      },
      example: {
        prompt: "A camera with a 152.4 mm focal length flies 2,000 m above sea level over a valley at 476 m elevation. What is the photo scale, and how long on the ground is a road that measures 25 mm on the photo?",
        steps: [
          "Flying height above ground: H − h = 2,000 − 476 = 1,524 m.",
          "Scale: 0.1524 m / 1,524 m = 1/10,000, so the scale is 1:10,000.",
          "Ground distance: 25 mm × 10,000 = 250,000 mm = 250 m."
        ],
        answer: "Scale 1:10,000; the road is 250 m long."
      }
    },
    {
      heading: "Relief displacement and orthophotos",
      paragraphs: [
        "A camera sees the ground through a single point (central perspective). As a result, anything that rises above the ground, such as a building, tower or tree, appears to lean **radially outward** from the photo's center point directly below the camera (the nadir). This shift is **relief displacement**. It is zero at the nadir and grows with the object's height and its distance from the center, and it shrinks when the camera flies higher. Hills are displaced the same way, which is why distances measured on a raw photo can be wrong.",
        "An **orthophoto** (orthoimage) is an image that has been **orthorectified**: software uses a digital elevation model, the camera's position and orientation, and ground control points to remove relief and tilt displacement. The result has a uniform scale and lines up with other map layers, so you can measure distances and areas on it. NAIP imagery and most web basemap imagery are orthoimages. In a standard orthophoto, tall buildings can still lean because the DEM describes bare ground; a \"true ortho\" built with a surface model fixes that."
      ],
      formula: {
        expr: "d = r × h / H",
        where: [
          "d: relief displacement on the photo",
          "r: radial distance on the photo from the nadir to the displaced (top) point",
          "h: height of the object above its base",
          "H: flying height above the base of the object",
          "Rearranged to find an object's height: h = d × H / r"
        ]
      },
      example: {
        prompt: "On a vertical photo taken 1,200 m above the ground, the top of a 45 m tower is 80 mm from the nadir. How far is the top displaced from the base on the photo?",
        steps: [
          "d = r × h / H = 80 mm × 45 m / 1,200 m.",
          "d = 3,600 / 1,200 = 3.0 mm, directed away from the nadir."
        ],
        answer: "3.0 mm, radially outward from the photo center."
      },
      qgis: "The Georeferencer tool can fit a scanned photo to map coordinates with control points, but a simple polynomial transformation does not remove relief displacement. True orthorectification needs a DEM and photogrammetry software."
    },
    {
      heading: "Photogrammetry, stereo and drones",
      paragraphs: [
        "**Photogrammetry** is the science of making measurements from photographs. Mapping flights capture each spot on the ground in at least two photos taken from different positions, usually with about 60% forward overlap and 20 to 30% sidelap between strips. Closer (higher) objects shift more between the two photos than distant ones; this shift is called **parallax**, and it lets software compute heights. **Ground control points (GCPs)** are surveyed targets visible in the images that tie the results to real coordinates.",
        "Drone mapping software uses **structure from motion (SfM)**. It matches thousands of features across many overlapping photos (often 70 to 80% overlap), solves for every camera position, and builds a 3D point cloud, a surface model and an orthomosaic. Photogrammetry sees only the top surface, so it cannot map the ground under dense vegetation. In the US, commercial drone flights fall under FAA Part 107, which requires a remote pilot certificate and generally limits flights to 400 ft above ground level.",
        "The ground size of one pixel is the **ground sample distance (GSD)**. It depends on the camera's pixel size, its focal length and the flying height. Flying lower gives a smaller GSD but needs more photos and flight time."
      ],
      formula: {
        expr: "GSD = p × H / f",
        where: [
          "GSD: ground sample distance (ground size of one pixel)",
          "p: physical size of one sensor pixel",
          "H: flying height above ground",
          "f: focal length (same units as p)"
        ]
      },
      example: {
        prompt: "A drone camera has 2.4 µm pixels and an 8.8 mm focal length. What is the GSD at 100 m above ground?",
        steps: [
          "Convert to meters: p = 2.4 × 10⁻⁶ m, f = 8.8 × 10⁻³ m.",
          "GSD = 2.4 × 10⁻⁶ × 100 / 8.8 × 10⁻³ = 0.0273 m."
        ],
        answer: "About 2.7 cm per pixel."
      }
    },
    {
      heading: "Four kinds of resolution",
      paragraphs: [
        "**Spatial resolution** is the ground size of a pixel. A 30 m pixel cannot show a 5 m wide road clearly, while a 30 cm pixel can. When a pixel covers more than one material, its value is a blend of them; this **mixed pixel** problem grows as pixels get larger. **Spectral resolution** is the number and width of bands. A panchromatic band is one wide band; multispectral sensors record several bands; hyperspectral sensors record hundreds of narrow bands.",
        "**Radiometric resolution** is how finely the sensor divides brightness, set by the bit depth. **Temporal resolution** is how often the sensor images the same place (its revisit time). These trade off against each other. A sensor with very small pixels usually has a narrow swath, so it revisits any one spot less often unless it can point sideways. Finer resolution of any kind also means more data to store and process."
      ],
      formula: {
        expr: "brightness levels = 2ⁿ",
        where: ["n: number of bits per pixel"]
      },
      example: {
        prompt: "How many brightness levels can an 8-bit sensor and a 12-bit sensor record?",
        steps: [
          "8-bit: 2⁸ = 256 levels (0–255).",
          "12-bit: 2¹² = 4,096 levels (0–4,095)."
        ],
        answer: "256 and 4,096 levels."
      }
    },
    {
      heading: "Satellite systems",
      paragraphs: [
        "**Landsat**, run by NASA and the USGS, has imaged the Earth since 1972, which makes it the longest continuous record of the land surface from space. The whole archive has been free since 2008. Landsat 8 (launched 2013) and Landsat 9 (2021) record visible, NIR and SWIR bands at 30 m, a panchromatic band at 15 m, and thermal bands at 100 m, across a 185 km swath. Each satellite revisits a spot every 16 days, and the two are offset so together they cover it every 8 days. Landsat 7 was retired in 2025.",
        "**Sentinel-2**, part of the European Copernicus program, carries a 13-band imager with 10 m, 20 m and 60 m bands and a 290 km swath. Two satellites share the same orbit, giving a 5-day revisit at the equator and more frequent coverage at mid-latitudes. Its data are also free. **Sentinel-1** carries a **synthetic aperture radar (SAR)**, an active microwave sensor that images through clouds, smoke and darkness, which makes it useful for floods and storms.",
        "Other sources fill in the trade-offs. Coarse-resolution sensors such as MODIS and VIIRS cover the whole Earth about every day, but with pixels of roughly 250 m to 1 km. Commercial satellites collect sub-meter imagery and can be tasked to image a site, at a cost and under license terms. In the US, **NAIP** aerial imagery from the USDA gives free 4-band (red, green, blue, NIR) orthoimagery at about 60 cm, with each state flown every few years during the growing season."
      ],
      qgis: "Landsat scenes download from USGS EarthExplorer as one GeoTIFF per band. Load them with Layer → Add Layer → Add Raster Layer, and stack bands into one layer with Processing Toolbox → GDAL → Raster miscellaneous → Build virtual raster (check 'Place each input file into a separate band')."
    },
    {
      heading: "Lidar",
      paragraphs: [
        "**Lidar** (light detection and ranging) is an active sensor. It fires rapid laser pulses, usually near-infrared for land mapping (green light is used to map shallow water bottoms), and times each echo. Half the round-trip time multiplied by the speed of light gives the range. A GNSS receiver and an inertial measurement unit (IMU) record exactly where the sensor is and how it is tilted, so every echo becomes an x, y, z point. Millions of points form a **point cloud**, usually stored in LAS or compressed LAZ files.",
        "One pulse can produce **multiple returns**. Over a forest, the first return may come from the canopy top, middle returns from branches, and the last return from the ground. Processing assigns each point a class; in the ASPRS LAS standard, class 2 is ground, 6 is building and 9 is water. First returns build a **digital surface model (DSM)** of treetops and roofs. Ground returns build a bare-earth **digital terrain model (DTM)**. Subtracting DTM from DSM gives canopy or building height. The USGS 3D Elevation Program (3DEP) requires at least Quality Level 2 lidar: 2 or more pulses per square meter and vertical error (RMSEz) of 10 cm or less."
      ],
      formula: {
        expr: "R = c × t / 2",
        where: [
          "R: range from sensor to surface (m)",
          "c: speed of light, 299,792,458 m/s",
          "t: round-trip travel time of the pulse (s); divide by 2 because the pulse travels out and back"
        ]
      },
      example: {
        prompt: "A lidar echo arrives 6.671 microseconds after the pulse left the sensor. How far away is the surface?",
        steps: [
          "R = 299,792,458 × 6.671 × 10⁻⁶ / 2.",
          "R = 1,999.92 m / 2 = 999.96 m."
        ],
        answer: "About 1,000 m."
      },
      qgis: "Layer → Add Layer → Add Point Cloud Layer opens LAS, LAZ and COPC files. Style the layer by Classification to see ground, buildings and vegetation, and use View → Elevation Profile to draw a cross section."
    },
    {
      heading: "From pixels to information: NDVI and classification",
      paragraphs: [
        "A **vegetation index** combines bands to highlight plants. The most common is the **Normalized Difference Vegetation Index (NDVI)**. It uses the contrast between strong NIR reflectance and strong red absorption in healthy leaves. NDVI ranges from −1 to +1. Dense, healthy vegetation is usually above about 0.6, sparse vegetation and bare soil fall around 0.1 to 0.3, and water, snow and clouds are near or below zero. Compute it from surface reflectance, applying any scale factor listed in the product documentation first.",
        "**Image classification** assigns every pixel to a category such as water, forest, crops or developed land. In **supervised classification**, the analyst first outlines training areas of known cover types, and an algorithm (such as maximum likelihood or random forest) assigns each pixel to the class it most resembles. In **unsupervised classification**, the software groups pixels into spectral clusters (for example with k-means), and the analyst labels each cluster afterward. Object-based methods first group pixels into segments, which works well for high-resolution imagery.",
        "A classified map is not finished until its accuracy is checked. Compare the map with reference data at sample points and tabulate the results in an **error (confusion) matrix**. **Overall accuracy** is the number of correct points divided by the total checked."
      ],
      formula: {
        expr: "NDVI = (NIR − Red) / (NIR + Red)",
        where: [
          "NIR: near-infrared reflectance (Landsat 8/9 band 5, Sentinel-2 band 8)",
          "Red: red reflectance (Landsat 8/9 band 4, Sentinel-2 band 4)"
        ]
      },
      example: {
        prompt: "Pixel A has NIR = 0.45 and Red = 0.05. Pixel B has NIR = 0.02 and Red = 0.05. Compute NDVI for each and say what each pixel probably is.",
        steps: [
          "A: (0.45 − 0.05) / (0.45 + 0.05) = 0.40 / 0.50 = 0.80.",
          "B: (0.02 − 0.05) / (0.02 + 0.05) = −0.03 / 0.07 = −0.43.",
          "A high positive value means dense, healthy vegetation. A negative value is typical of water."
        ],
        answer: "A = 0.80 (healthy vegetation); B = −0.43 (likely water)."
      },
      qgis: "Raster → Raster Calculator (or Processing Toolbox → Raster analysis → Raster calculator) with an expression such as ( \"nir@1\" - \"red@1\" ) / ( \"nir@1\" + \"red@1\" ), using your own layer names. The Semi-Automatic Classification Plugin adds supervised classification tools."
    }
  ],
  cards: [
    { front: "Remote sensing", back: "Collecting information about the Earth's surface without touching it, usually by measuring electromagnetic energy from aircraft, drones or satellites." },
    { front: "Passive sensor", back: "A sensor that records energy from another source: reflected sunlight or heat emitted by the surface. Cameras, Landsat and Sentinel-2 are passive." },
    { front: "Active sensor", back: "A sensor that sends out its own energy and measures the return. Radar and lidar are active, so they work at night." },
    { front: "Atmospheric window", back: "A wavelength range that passes through the atmosphere with little absorption. Sensors record in these windows." },
    { front: "Band", back: "A range of wavelengths a sensor records, stored as one layer of the image." },
    { front: "Spectral signature", back: "The pattern of reflectance across wavelengths that is typical of a material, such as vegetation, water or soil." },
    { front: "Near-infrared (NIR)", back: "Wavelengths just longer than red light, about 0.7–1.3 µm. Healthy vegetation reflects NIR strongly; water absorbs it." },
    { front: "Color-infrared composite", back: "A display with NIR in the red channel, red in green and green in blue. Healthy vegetation looks bright red." },
    { front: "Photo scale", back: "Ratio of photo distance to ground distance. For a vertical photo, S = f / (H − h); it changes with terrain elevation." },
    { front: "Relief displacement", back: "The radial shift of objects above or below the datum on a vertical photo. d = r × h / H; zero at the nadir, larger toward the edges." },
    { front: "Orthophoto", back: "An image corrected for relief and tilt displacement with a DEM and ground control, giving a uniform scale that can be measured like a map." },
    { front: "Stereo overlap", back: "Successive photos overlap (about 60% forward on mapping flights) so each spot is seen from two positions and heights can be measured from parallax." },
    { front: "Parallax", back: "The apparent shift of an object between two photos taken from different positions. Higher objects shift more, which lets software compute heights." },
    { front: "Ground control point (GCP)", back: "A surveyed point that can be identified in the imagery. GCPs tie photogrammetry and georeferencing to real-world coordinates." },
    { front: "Structure from motion (SfM)", back: "Photogrammetry software that matches features across many overlapping photos to solve camera positions and build point clouds, surface models and orthomosaics." },
    { front: "Ground sample distance (GSD)", back: "The ground size of one image pixel. GSD = pixel size × flying height / focal length." },
    { front: "Spatial resolution", back: "The ground size of a pixel. Smaller pixels show smaller features." },
    { front: "Spectral resolution", back: "The number and width of a sensor's bands: panchromatic (one wide band), multispectral (several) or hyperspectral (hundreds)." },
    { front: "Radiometric resolution", back: "How many brightness levels a sensor records, set by bit depth: 2ⁿ levels, so 8-bit gives 256 and 12-bit gives 4,096." },
    { front: "Temporal resolution", back: "How often a sensor images the same place. Landsat 8 and 9 together: 8 days. Sentinel-2 pair: 5 days at the equator." },
    { front: "Mixed pixel", back: "A pixel covering more than one material, so its value blends their signatures. More common with large pixels." },
    { front: "Landsat", back: "NASA/USGS satellite series imaging the Earth since 1972. Landsat 8 and 9 give 30 m multispectral, 15 m panchromatic and 100 m thermal data, free." },
    { front: "Sentinel-2", back: "European Copernicus mission with a 13-band imager at 10, 20 and 60 m and a 5-day revisit at the equator from two satellites. Free data." },
    { front: "Synthetic aperture radar (SAR)", back: "An active microwave imaging radar, such as on Sentinel-1. It sees through clouds and works day or night." },
    { front: "Lidar", back: "An active sensor that times laser pulses to measure range (R = c × t / 2). Produces point clouds with x, y, z, intensity and return number." },
    { front: "Multiple returns", back: "Several echoes from one lidar pulse, for example from treetop, branches and ground. Last returns often reach the ground under vegetation." },
    { front: "DSM vs. DTM", back: "A digital surface model includes treetops and roofs. A digital terrain model is bare earth. DSM − DTM gives object height." },
    { front: "NDVI", back: "Normalized Difference Vegetation Index: (NIR − Red) / (NIR + Red). Ranges −1 to +1; dense healthy vegetation is high, water is near or below zero." },
    { front: "Supervised vs. unsupervised classification", back: "Supervised: analyst picks training areas first, software assigns pixels. Unsupervised: software clusters pixels first, analyst labels clusters after." },
    { front: "Error (confusion) matrix", back: "A table comparing classified map values with reference data at sample points. Overall accuracy = correct points ÷ total points." }
  ],
  questions: [
    {
      id: "ch06-q01",
      type: "mc",
      prompt: "In which part of the spectrum do healthy green leaves reflect the most energy?",
      choices: ["Blue", "Red", "Near-infrared", "Thermal infrared"],
      answer: 2,
      explain: "Leaf cell structure scatters near-infrared strongly, so reflectance there is much higher than in any visible band. Leaves look green because they reflect more green than blue or red, but NIR reflectance is higher still."
    },
    {
      id: "ch06-q02",
      type: "mc",
      prompt: "Why does a lake look nearly black in a near-infrared band?",
      choices: [
        "Near-infrared energy cannot pass through the atmosphere",
        "Water absorbs almost all near-infrared energy",
        "Water emits thermal energy that masks the reflected signal",
        "Sensors turn off the near-infrared band over water bodies"
      ],
      answer: 1,
      explain: "Water strongly absorbs NIR, so very little is reflected back to the sensor. NIR passes through the atmosphere well, which is why sensors record it."
    },
    {
      id: "ch06-q03",
      type: "mc",
      prompt: "Which of these sensors is active, meaning it sends out its own energy and measures the return?",
      choices: ["Landsat 9 OLI-2", "A digital aerial mapping camera", "Sentinel-2 MSI", "Airborne lidar"],
      answer: 3,
      explain: "Lidar fires laser pulses and times their echoes. The other three record reflected sunlight, so they are passive."
    },
    {
      id: "ch06-q04",
      type: "num",
      prompt: "A mapping camera with a 152.4 mm focal length flies 2,000 m above sea level over terrain at 476 m elevation. What is the scale denominator? (for a scale of 1:x, give x)",
      answer: 10000,
      tol: 50,
      unit: "",
      explain: "Height above ground = 2,000 − 476 = 1,524 m. Scale = f / (H − h) = 0.1524 m / 1,524 m = 1/10,000, so x = 10,000."
    },
    {
      id: "ch06-q05",
      type: "mc",
      prompt: "On a 1:12,000 vertical photo of flat ground, a road segment measures 25 mm. How long is it on the ground?",
      choices: ["30 m", "48 m", "300 m", "3,000 m"],
      answer: 2,
      explain: "Ground distance = 25 mm × 12,000 = 300,000 mm = 300 m. Multiplying correctly but converting mm to m wrong gives 30 m or 3,000 m."
    },
    {
      id: "ch06-q06",
      type: "tf",
      prompt: "On a vertical aerial photo of hilly terrain, the scale is the same everywhere in the image.",
      answer: false,
      explain: "Scale = f / (H − h). Hilltops are closer to the camera than valleys, so they appear at a larger scale. Only an orthophoto has a uniform scale."
    },
    {
      id: "ch06-q07",
      type: "mc",
      prompt: "On a vertical aerial photo, which way does the top of a tall building appear to lean relative to its base?",
      choices: [
        "Radially outward, away from the nadir point",
        "Radially inward, toward the nadir point",
        "Toward the north edge of the photo",
        "Along the direction of flight"
      ],
      answer: 0,
      explain: "Relief displacement is radial from the nadir. Objects above the ground lean outward, and the shift grows with height and distance from the center."
    },
    {
      id: "ch06-q08",
      type: "num",
      prompt: "A vertical photo was taken 1,500 m above the ground. The top of a water tower is 96 mm from the nadir and is displaced 3.2 mm from the tower's base. How tall is the tower? (give meters)",
      answer: 50,
      tol: 0.5,
      unit: "m",
      explain: "h = d × H / r = 3.2 mm × 1,500 m / 96 mm = 50 m. The millimeters cancel."
    },
    {
      id: "ch06-q09",
      type: "mc",
      prompt: "What makes an orthophoto different from a raw vertical aerial photo?",
      choices: [
        "It was taken with the camera pointing straight down instead of at an angle",
        "It is always displayed in color infrared so features are easier to identify",
        "It always has a finer spatial resolution because it was flown at a lower height",
        "It has been corrected for relief and tilt displacement, so it has a uniform scale"
      ],
      answer: 3,
      explain: "Orthorectification removes displacement so distances can be measured as on a map. A raw vertical photo is also taken pointing straight down, but it still contains relief displacement."
    },
    {
      id: "ch06-q10",
      type: "mc",
      prompt: "Why are mapping photos captured with about 60% forward overlap?",
      choices: [
        "To average out sensor noise between photos",
        "To give each photo a uniform scale",
        "So every spot is seen from two camera positions and heights can be measured from parallax",
        "So the camera can record visible and near-infrared bands in alternate photos"
      ],
      answer: 2,
      explain: "Stereo overlap creates parallax between photos, which photogrammetry uses to compute elevations. Overlap does not change each photo's scale."
    },
    {
      id: "ch06-q11",
      type: "num",
      prompt: "A drone camera has 2.4 µm pixels and an 8.8 mm focal length. What is the ground sample distance when flying 120 m above ground? (give centimeters)",
      answer: 3.27,
      tol: 0.05,
      unit: "cm",
      explain: "GSD = p × H / f = 2.4 × 10⁻⁶ m × 120 m / 8.8 × 10⁻³ m = 0.0327 m = 3.27 cm."
    },
    {
      id: "ch06-q12",
      type: "mc",
      prompt: "A sensor stores each pixel as a 12-bit value. Which kind of resolution does this describe?",
      choices: ["Spatial resolution", "Radiometric resolution", "Spectral resolution", "Temporal resolution"],
      answer: 1,
      explain: "Bit depth sets how many brightness levels can be recorded (2¹² = 4,096), which is radiometric resolution. Spectral resolution is about the number and width of bands."
    },
    {
      id: "ch06-q13",
      type: "mc",
      prompt: "Landsat 8 and Landsat 9 each revisit a location every 16 days and are offset so that together they image it every 8 days. Which kind of resolution is this?",
      choices: ["Temporal", "Radiometric", "Spatial", "Spectral"],
      answer: 0,
      explain: "Revisit time is temporal resolution."
    },
    {
      id: "ch06-q14",
      type: "tf",
      prompt: "A sensor with more and narrower bands (higher spectral resolution) generally makes it easier to tell similar materials apart.",
      answer: true,
      explain: "Narrow bands capture finer details of each material's spectral signature, so materials with similar overall brightness can still be separated."
    },
    {
      id: "ch06-q15",
      type: "mc",
      prompt: "A town planner needs to digitize the outlines of individual houses at no cost. Which imagery is the best first choice?",
      choices: [
        "Landsat 9 multispectral at 30 m",
        "Sentinel-2 multispectral at 10 m",
        "MODIS daily imagery at 250 m",
        "NAIP orthoimagery at about 60 cm"
      ],
      answer: 3,
      explain: "A house is roughly 10 to 20 m across, so it covers only a pixel or two at 10 m and less at 30 m. NAIP's sub-meter pixels show building outlines and are free."
    },
    {
      id: "ch06-q16",
      type: "mc",
      prompt: "After a week of heavy storms with constant cloud cover, an emergency manager needs a map of flood extent as soon as possible. Which source can image the ground through the clouds?",
      choices: [
        "Sentinel-2 multispectral imagery",
        "Sentinel-1 synthetic aperture radar",
        "Landsat 9 imagery",
        "NAIP aerial photography"
      ],
      answer: 1,
      explain: "Radar uses microwaves, which pass through clouds, and it supplies its own energy, so it works at night too. The optical sensors would see only cloud tops."
    },
    {
      id: "ch06-q17",
      type: "num",
      prompt: "A pixel has red reflectance 0.08 and near-infrared reflectance 0.40. What is its NDVI? (unitless, two decimals)",
      answer: 0.67,
      tol: 0.01,
      unit: "",
      explain: "NDVI = (0.40 − 0.08) / (0.40 + 0.08) = 0.32 / 0.48 = 0.67."
    },
    {
      id: "ch06-q18",
      type: "mc",
      prompt: "An NDVI value of about −0.4 most likely represents:",
      choices: ["Dense, healthy forest", "Dry bare soil", "Open water", "A corn field at peak growth"],
      answer: 2,
      explain: "Water reflects more red than NIR, which makes NDVI negative. Bare soil is usually slightly positive (about 0.1 to 0.3), and healthy crops and forest are high."
    },
    {
      id: "ch06-q19",
      type: "mc",
      prompt: "Which Landsat 8 or 9 bands are used to compute NDVI?",
      choices: [
        "Band 4 (red) and band 5 (near-infrared)",
        "Band 2 (blue) and band 3 (green)",
        "Band 6 (SWIR 1) and band 7 (SWIR 2)",
        "Band 10 and band 11 (thermal)"
      ],
      answer: 0,
      explain: "NDVI contrasts NIR and red. On Landsat 8 and 9 these are bands 5 and 4. On Sentinel-2 they are bands 8 and 4."
    },
    {
      id: "ch06-q20",
      type: "mc",
      prompt: "In a standard color-infrared composite (NIR shown as red, red as green, green as blue), how does healthy vegetation appear?",
      choices: ["Bright green", "Bright red", "Dark blue", "Black"],
      answer: 1,
      explain: "Vegetation reflects NIR strongly, and NIR is shown in the red channel, so vegetation looks red. Water absorbs NIR and looks dark."
    },
    {
      id: "ch06-q21",
      type: "mc",
      prompt: "Which statement describes supervised classification?",
      choices: [
        "The software groups pixels into spectral clusters, and the analyst labels the clusters afterward",
        "The analyst draws every land cover boundary by hand on the image, with no software",
        "The analyst picks training areas of known cover, and the software assigns each pixel to the most similar class",
        "The software assigns classes from the thermal band alone, with no input from the analyst"
      ],
      answer: 2,
      explain: "In supervised classification the analyst trains the algorithm first. The first choice describes unsupervised classification."
    },
    {
      id: "ch06-q22",
      type: "tf",
      prompt: "In unsupervised classification, the software groups pixels into spectral clusters first, and the analyst assigns meaning to those clusters afterward.",
      answer: true,
      explain: "That is the defining order of unsupervised classification. Some clusters may need to be merged or split before they match useful land cover classes."
    },
    {
      id: "ch06-q23",
      type: "mc",
      prompt: "An accuracy assessment checks a land cover map at 250 reference points; 215 are classified correctly. What is the overall accuracy?",
      choices: ["14%", "78%", "86%", "93%"],
      answer: 2,
      explain: "Overall accuracy = 215 ÷ 250 = 0.86 = 86%. 14% is the error rate."
    },
    {
      id: "ch06-q24",
      type: "mc",
      prompt: "In a lidar point cloud over a forest, which points are used to build a bare-earth DEM?",
      choices: [
        "First returns, which are the first echoes of each pulse",
        "Points with the highest intensity, which hit bright surfaces",
        "All returns averaged together within each grid cell",
        "Points classified as ground, which are usually last returns"
      ],
      answer: 3,
      explain: "Some pulses reach the ground through gaps in the canopy; those returns are classified as ground (class 2). First returns mostly hit treetops and are used for a surface model."
    },
    {
      id: "ch06-q25",
      type: "mc",
      prompt: "A gridded model of the top surface, including treetops and roofs, is called a:",
      choices: ["Digital surface model (DSM)", "Bare-earth digital terrain model (DTM)", "Orthophoto", "Hillshade"],
      answer: 0,
      explain: "A DSM includes everything on top of the ground. A DTM shows the ground with vegetation and buildings removed."
    },
    {
      id: "ch06-q26",
      type: "num",
      prompt: "A lidar pulse returns 6.0 microseconds after it was sent. How far away is the reflecting surface? (give meters)",
      answer: 899.4,
      tol: 1,
      unit: "m",
      explain: "R = c × t / 2 = 299,792,458 m/s × 6.0 × 10⁻⁶ s / 2 = 899.4 m. Divide by 2 because the pulse travels out and back."
    },
    {
      id: "ch06-q27",
      type: "tf",
      prompt: "Lidar is a passive sensor that records energy naturally reflected from the ground.",
      answer: false,
      explain: "Lidar is active: it fires its own laser pulses and times the echoes, so it works at night."
    },
    {
      id: "ch06-q28",
      type: "mc",
      prompt: "A firm needs topography good to a few centimeters over a 40-acre site with bare ground and scattered low brush, for grading design. Which data source fits best?",
      choices: [
        "Landsat 9 imagery sharpened with its 15 m panchromatic band",
        "The 1 arc-second (about 30 m) 3DEP DEM, resampled to 1 m cells",
        "Drone photogrammetry or lidar tied to surveyed ground control points",
        "Sentinel-2 10 m imagery from the date closest to the design"
      ],
      answer: 2,
      explain: "A drone survey with GCPs gives centimeter-level pixels and few-centimeter vertical accuracy over a small site. Satellite imagery and a 30 m DEM are far too coarse for grading design, and resampling a DEM to smaller cells does not add detail."
    },
    {
      id: "ch06-q29",
      type: "mc",
      prompt: "A 30 m Landsat pixel covers part of a road and part of the grass beside it. What does the pixel record?",
      choices: [
        "The value of whichever material lies at the exact center of the pixel",
        "A no-data value, because the pixel does not contain one uniform material",
        "The value of whichever of the two materials reflects more sunlight",
        "A blend of the road and grass signatures, weighted by the area each covers"
      ],
      answer: 3,
      explain: "This is the mixed pixel problem. The sensor measures all the energy from the pixel's footprint, so the value is a blend. Mixed pixels are more common with large pixels and along edges between cover types."
    }
  ]
});
