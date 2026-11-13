GIS.chapter({
  id: "ch10",
  num: 10,
  title: "Topics in Raster Analysis",
  blurb: "How to analyze gridded data with map algebra, moving windows, zones, distance and cost surfaces, and weighted overlays, and how NoData, resampling, and cell alignment change the answers.",
  objectives: [
    "Apply map algebra to compute cell-by-cell results from one or more rasters.",
    "Distinguish local, neighborhood (focal), zonal, and global operations and give an example of each.",
    "Compute focal mean and majority values for a 3×3 window.",
    "Build distance and accumulated cost surfaces and explain how diagonal moves affect cost.",
    "Combine reclassified layers in a weighted suitability model.",
    "Predict how NoData cells affect local, focal, and zonal results.",
    "Choose a resampling method and set cell size, alignment, and extent before combining rasters."
  ],
  guide: [
    {
      heading: "Rasters and map algebra",
      figures: [
        { src: "img/qgis/raster-calculator.webp", w: 1531, h: 1094,
          alt: "Raster Calculator dialog with the expression \"dem_utah_valley@1\" > 1500 and an output GeoTIFF named above_1500m.tif.",
          caption: "**Raster > Raster Calculator**: `\"dem_utah_valley@1\" > 1500` on a 30 m USGS 3DEP DEM of Utah Valley. The output is 1 where the ground is above 1,500 m and 0 elsewhere." }
      ],
      paragraphs: [
        "A raster stores one value in every cell of a regular grid. Raster analysis treats each grid as a variable in an equation. **Map algebra** is the language for this: you write an expression such as `\"elev_ft@1\" * 0.3048`, and the GIS evaluates it cell by cell to make a new raster.",
        "Raster operations are grouped by which cells feed each output cell. **Local** operations use only the same cell location in each input. **Neighborhood** (focal) operations use a window of cells around each location. **Zonal** operations use all cells that share a zone value. **Global** operations can use every cell in the raster. The local, focal, and zonal groups come from C. Dana Tomlin's map algebra; many textbooks and programs add global as a fourth group, and most raster tools fit one of the four.",
        "Map algebra assumes the inputs line up: same coordinate system, cell size, cell alignment, and extent. When they do not, the GIS must resample one raster to match the other. That step is covered in the last section of this chapter."
      ],
      qgis: "Raster → Raster Calculator (or Processing Toolbox → Raster analysis → Raster calculator). Layers appear in double quotes with a band number, such as `\"dem@1\"`."
    },
    {
      heading: "Local operations",
      paragraphs: [
        "A **local operation** computes each output cell from the values at the same location in one or more inputs. Examples include unit conversion (feet to meters), arithmetic between layers (rainfall minus evaporation), comparisons (`slope < 15` returns 1 where true and 0 where false), and Boolean combinations of comparisons.",
        "Comparisons produce **binary rasters** of 1s and 0s. Multiplying two binary rasters acts as a Boolean AND: the product is 1 only where both inputs are 1. Adding them counts how many conditions each cell meets. **Reclassification** is also local: each input value or range maps to a new value through a lookup table, such as slope 0–5% → 1, 5–15% → 2, over 15% → 3."
      ],
      example: {
        prompt: "Two 2×2 binary rasters: A (slope acceptable) is row 1: 1, 0; row 2: 1, 1. B (soil acceptable) is row 1: 1, 1; row 2: 0, 1. Compute A * B and A + B.",
        steps: [
          "A * B multiplies cell by cell: row 1: 1×1 = 1, 0×1 = 0; row 2: 1×0 = 0, 1×1 = 1.",
          "A + B adds cell by cell: row 1: 2, 1; row 2: 1, 2.",
          "A * B = 1 marks cells that pass both tests (Boolean AND). A + B counts how many tests each cell passes."
        ],
        answer: "A * B is row 1: 1, 0; row 2: 0, 1. A + B is row 1: 2, 1; row 2: 1, 2."
      },
      qgis: "Raster calculator for expressions. Processing Toolbox → Raster analysis → Reclassify by table for class breaks, and Raster boolean AND / Raster boolean OR for stacks of binary layers."
    },
    {
      heading: "Neighborhood (focal) operations",
      paragraphs: [
        "A **neighborhood operation** slides a window, often 3×3 cells, across the raster. At each position it computes a statistic of the cells in the window and writes it to the center cell of the output. Common statistics are mean, median, minimum, maximum, range, sum, and majority. Slope and aspect (Chapter 11) are also neighborhood operations.",
        "A **mean filter** is a low-pass filter: it smooths noise and spikes but also blurs real edges. A **majority filter** assigns the most common value in the window and is used on categorical rasters, for example to remove isolated misclassified cells from a land cover map. A mean of category codes has no meaning, so do not mean-filter categorical data. A **high-pass filter** does the opposite of a mean filter and emphasizes edges.",
        "At the raster's border the window extends past the data. Software either uses only the cells that exist or writes NoData along the edge. Larger windows smooth more and are affected by the border over a wider band."
      ],
      example: {
        prompt: "A 3×3 window of elevations (m) is row 1: 10, 12, 14; row 2: 11, 13, 15; row 3: 9, 20, 13. Find the focal mean and focal maximum for the center cell.",
        steps: [
          "Sum the nine values: 10 + 12 + 14 + 11 + 13 + 15 + 9 + 20 + 13 = 117.",
          "Mean = 117 ÷ 9 = 13.0 m.",
          "Maximum = the largest value in the window = 20 m."
        ],
        answer: "Focal mean = 13.0 m; focal maximum = 20 m"
      },
      qgis: "GRASS r.neighbors in the Processing Toolbox (choose a method such as average or mode, and the window size). For land cover cleanup, GDAL → Raster analysis → Sieve removes small patches."
    },
    {
      heading: "Zonal and global operations",
      paragraphs: [
        "A **zonal operation** groups cells by a zone layer and computes one statistic per zone. Zones can come from a raster, where each value is a zone, or from polygons such as subwatersheds, counties, or parcels. Typical questions: the mean slope of each subwatershed, the cropland area in each county, or the highest elevation along each proposed corridor.",
        "The output can be a table with one row per zone, or a raster in which every cell of a zone holds that zone's statistic. Zones do not have to be contiguous: all cells with zone value 3 form one zone even if they are scattered in several patches.",
        "A **global operation** can use the entire input raster to compute each output cell. Euclidean distance to the nearest stream cell is global, and so are the overall mean, minimum, and maximum of a grid. Global statistics are also used to rescale rasters, for example to 0–1 by subtracting the minimum and dividing by the range."
      ],
      example: {
        prompt: "A zone raster is row 1: 1, 1, 2; row 2: 1, 2, 2. A slope raster (%) for the same cells is row 1: 4, 6, 12; row 2: 8, 10, 14. Find the zonal mean slope for each zone.",
        steps: [
          "Zone 1 cells: 4, 6, and 8. Mean = 18 ÷ 3 = 6%.",
          "Zone 2 cells: 12, 10, and 14. Mean = 36 ÷ 3 = 12%."
        ],
        answer: "Zone 1: 6%; zone 2: 12%"
      },
      qgis: "Processing Toolbox → Raster analysis → Zonal statistics (polygon zones; adds fields such as `_mean` to the polygons) or Raster layer zonal statistics (raster zones; writes a table). Raster layer statistics reports global values."
    },
    {
      heading: "Distance and cost surfaces",
      paragraphs: [
        "A **distance surface** stores in each cell the straight-line distance from the cell center to the nearest source cell, such as a road or stream. It is the raster form of a buffer, but with a continuous value instead of inside or outside. Reclassifying it (for example 0–100 m → 1, otherwise 0) gives a raster buffer.",
        "Straight-line distance ignores terrain and land cover. A **cost surface** (friction surface) gives each cell a cost per unit distance to cross it: steep slopes, wetlands, or expensive land cost more. An **accumulated cost surface** stores the least total cost to reach each cell from the source. A **least-cost path** traces back through that surface from a destination to find the cheapest route, a common first screen for pipeline, road, and transmission line corridors.",
        "A widely used rule averages the costs of the two cells and multiplies by the distance moved. A move to an edge neighbor covers one cell width. A move to a diagonal neighbor covers √2 ≈ 1.414 cell widths, so it costs 1.414 times as much for the same cell costs."
      ],
      formula: {
        expr: "Edge move: cost = s × (c₁ + c₂) / 2;   Diagonal move: cost = 1.414 × s × (c₁ + c₂) / 2",
        where: [
          "s: cell size",
          "c₁, c₂: cost per unit distance of the cell being left and the cell being entered",
          "1.414: √2, the diagonal distance in cell widths"
        ]
      },
      example: {
        prompt: "Cells are 10 m. A path moves east from a cell with cost 2 into a cell with cost 4, then diagonally southeast into a cell with cost 6. Costs are in dollars per meter. What is the accumulated cost?",
        steps: [
          "East (edge) move: 10 × (2 + 4) ÷ 2 = 10 × 3 = $30.",
          "Diagonal move: 1.4142 × 10 × (4 + 6) ÷ 2 = 14.142 × 5 = $70.71.",
          "Total: 30 + 70.71 = $100.71."
        ],
        answer: "About $100.71"
      },
      qgis: "GDAL → Raster analysis → Proximity (raster distance) builds distance surfaces. GRASS r.cost builds an accumulated cost surface, and r.drain traces the least-cost path through it."
    },
    {
      heading: "Raster overlay and weighted suitability",
      paragraphs: [
        "Raster overlay combines layers cell by cell. **Boolean overlay** turns each criterion into a 0/1 raster and multiplies them, so a cell is suitable only if it passes every test. It is simple, but a site that barely fails one test is treated the same as one that fails them all.",
        "**Weighted overlay** first reclassifies each criterion to a common score scale, such as 1 (poor) to 5 (best), because slope in percent and distance in meters cannot be added directly. Each layer gets a weight for its importance, with the weights summing to 1, and the suitability score is the weighted sum of the scores. Hard constraints, such as wetlands where nothing may be built, are applied afterward as a 0/1 mask so no score can outweigh them.",
        "Weights and class breaks are judgment calls. Document them, and run a sensitivity check: change the weights a little and see whether the best sites change."
      ],
      formula: {
        expr: "S = Σ wᵢ × sᵢ   (with Σ wᵢ = 1)",
        where: [
          "S: suitability score of a cell",
          "wᵢ: weight of criterion i",
          "sᵢ: reclassified score of criterion i in that cell"
        ]
      },
      example: {
        prompt: "A detention pond siting model uses slope (weight 0.5), soil infiltration (weight 0.3), and distance to the storm drain (weight 0.2), each scored 1–5. A cell scores 4 for slope, 2 for soil, and 5 for distance. What is its suitability score?",
        steps: [
          "Slope: 0.5 × 4 = 2.0.",
          "Soil: 0.3 × 2 = 0.6.",
          "Distance: 0.2 × 5 = 1.0.",
          "Sum: 2.0 + 0.6 + 1.0 = 3.6."
        ],
        answer: "3.6 on the 1–5 scale"
      },
      qgis: "Reclassify by table for each criterion, then the Raster calculator, for example `(0.5*\"slope_s@1\" + 0.3*\"soil_s@1\" + 0.2*\"dist_s@1\") * \"allowed@1\"`, where `allowed` is the 0/1 constraint raster."
    },
    {
      heading: "NoData",
      paragraphs: [
        "**NoData** marks cells with no value: outside the study area, under clouds, or where a sensor failed. It is not zero. An elevation of 0 means sea level; a NoData elevation means unknown. Treating NoData as 0 drags averages down and can create false pits in a DEM.",
        "In local operations NoData usually propagates: if any input cell is NoData, the output cell is NoData. That is why a Raster calculator result can have unexpected holes, or be entirely NoData when two inputs do not overlap. Focal and zonal tools usually skip NoData cells and compute the statistic from the cells that have values, though many tools let you choose. Check each tool's setting.",
        "Small gaps can be filled by interpolating from the surrounding cells. Replace NoData with a fixed value only when that value is truly correct, such as 0 rainfall where a gauge network confirms no rain fell."
      ],
      example: {
        prompt: "A 3×3 window is row 1: 6, 8, NoData; row 2: 7, 9, 10; row 3: 5, 8, 9. What is the focal mean if NoData is skipped? What would you get if NoData were wrongly read as 0?",
        steps: [
          "Skip NoData and sum the eight valid values: 6 + 8 + 7 + 9 + 10 + 5 + 8 + 9 = 62.",
          "Mean = 62 ÷ 8 = 7.75.",
          "If NoData is read as 0, the mean is 62 ÷ 9 = 6.89, which is biased low."
        ],
        answer: "7.75 with NoData skipped (6.89 if NoData is wrongly treated as 0)"
      },
      qgis: "GDAL → Raster conversion → Translate (convert format) can assign a NoData value to the output. GDAL → Raster analysis → Fill NoData interpolates small gaps, and Raster tools → Fill NoData cells replaces them with a fixed value."
    },
    {
      heading: "Resampling, cell alignment, and extent",
      paragraphs: [
        "**Resampling** computes values for a new grid from an existing one. It happens whenever a raster is reprojected, its cell size is changed, or it is aligned to another raster. The method you choose depends on whether the data are categories or continuous measurements.",
        "Before map algebra, the rasters should share a coordinate system, a **cell size**, and **cell alignment**, meaning cell edges fall on the same grid lines (some software sets this with a snap raster). The **analysis extent** decides which area is processed. Many tools default to the area where all inputs overlap, and cells outside it become NoData.",
        "Resampling to smaller cells does not add real detail. It only splits each cell into copies or blends neighbors. A common rule is to resample to the coarsest cell size among the inputs, or at least not to report detail finer than the coarsest layer supports."
      ],
      bullets: [
        "**Nearest neighbor**: takes the value of the closest input cell center. It never creates new values, so use it for categorical data (land cover, soil classes, zone IDs) and for coded rasters such as flow direction. It can make edges look blocky.",
        "**Bilinear**: a distance-weighted average of the 4 nearest cell centers. Gives smooth results for continuous data such as elevation or temperature, and its values stay within the range of those 4 cells.",
        "**Cubic convolution**: fits smooth curves through the 16 nearest cells (a 4×4 block). Sharper than bilinear and good for continuous surfaces and imagery, but it can produce values slightly above or below the input range."
      ],
      example: {
        prompt: "Four cell centers form a square with values upper-left 10, upper-right 20, lower-left 30, and lower-right 40. A new cell center lies 25% of the way from left to right and 40% of the way from top to bottom. What value does bilinear resampling give, and what would nearest neighbor give?",
        steps: [
          "Interpolate along the top edge: 10 + 0.25 × (20 − 10) = 12.5.",
          "Interpolate along the bottom edge: 30 + 0.25 × (40 − 30) = 32.5.",
          "Interpolate between them: 12.5 + 0.40 × (32.5 − 12.5) = 20.5.",
          "The closest center is the upper-left one, so nearest neighbor returns 10."
        ],
        answer: "Bilinear gives 20.5; nearest neighbor gives 10"
      },
      qgis: "GDAL → Raster projections → Warp (reproject) sets the resampling method and output cell size. Raster → Align Rasters (or Processing Toolbox → Raster tools → Align rasters) matches cell size, extent, and alignment to a reference layer."
    }
  ],
  cards: [
    { front: "Map algebra", back: "A language for raster analysis in which rasters are variables in expressions evaluated cell by cell, such as `\"dem@1\" * 3.2808`." },
    { front: "Local operation", back: "Each output cell depends only on the input values at the same cell location. Examples: unit conversion, reclassification, adding two rasters." },
    { front: "Neighborhood (focal) operation", back: "Each output cell is a statistic of the cells in a moving window around it, such as a 3×3 mean." },
    { front: "Zonal operation", back: "Computes one statistic for all cells that share a zone value, such as the mean slope of each subwatershed." },
    { front: "Global operation", back: "Each output cell can depend on every cell in the input raster, such as Euclidean distance to the nearest source cell." },
    { front: "Binary raster", back: "A raster of 1s and 0s marking where a condition is true or false. Multiplying binary rasters acts as a Boolean AND." },
    { front: "Raster reclassification", back: "Mapping input values or ranges to new values with a lookup table, such as slope classes or suitability scores." },
    { front: "Mean filter", back: "A focal mean. It smooths noise in continuous data (a low-pass filter) but blurs real edges." },
    { front: "Majority filter", back: "Assigns the most common value in the window. Used to remove isolated cells from categorical rasters such as land cover." },
    { front: "High-pass filter", back: "A focal filter that emphasizes differences between a cell and its neighbors, highlighting edges and abrupt changes." },
    { front: "Edge effect", back: "At a raster's border the window extends past the data, so the statistic uses fewer cells or the output is NoData." },
    { front: "Zonal statistics", back: "Summary values (mean, sum, maximum, count) computed for each zone and reported as a table or written back to a raster." },
    { front: "Distance surface", back: "A raster storing the straight-line distance from each cell to the nearest source cell." },
    { front: "Cost (friction) surface", back: "A raster giving the cost per unit distance to cross each cell, based on factors such as slope, land cover, or land price." },
    { front: "Accumulated cost surface", back: "A raster storing the least total cost to travel from a source to each cell across a cost surface." },
    { front: "Least-cost path", back: "The route between a source and a destination with the lowest accumulated cost, traced through an accumulated cost surface." },
    { front: "Diagonal factor", back: "A diagonal move between cells covers √2 ≈ 1.414 cell widths, so its distance and cost are 1.414 times an edge move's." },
    { front: "Boolean overlay", back: "Combining 0/1 criteria rasters, usually by multiplication. A cell is suitable only if it passes every test." },
    { front: "Weighted overlay", back: "Adding criteria scores after multiplying each by a weight for its importance. Scores share one scale and weights usually sum to 1." },
    { front: "NoData", back: "A cell with no value. It is not zero, and in local operations it usually makes the output cell NoData too." },
    { front: "Resampling", back: "Computing cell values for a new grid from an existing raster. Needed when reprojecting, changing cell size, or aligning rasters." },
    { front: "Nearest neighbor resampling", back: "Assigns the value of the closest input cell center. Keeps original values, so it is the right choice for categorical data." },
    { front: "Bilinear resampling", back: "A distance-weighted average of the 4 nearest cell centers. Gives smooth results for continuous data such as elevation." },
    { front: "Cubic convolution", back: "Resampling that fits smooth curves through the 16 nearest cells. Sharper than bilinear but can exceed the input range." },
    { front: "Cell alignment", back: "Making cell edges of different rasters fall on the same grid lines so cells match one-to-one in map algebra." },
    { front: "Analysis extent", back: "The area a raster tool processes. Often the overlap of all inputs; cells outside it become NoData." },
    { front: "Cell size (resolution)", back: "The ground width of one cell. Halving it quadruples the number of cells for the same area." }
  ],
  questions: [
    {
      id: "ch10-q01",
      type: "mc",
      prompt: "Which type of raster operation computes each output cell using only the input values at that same cell location?",
      choices: ["Local", "Neighborhood", "Zonal", "Global"],
      answer: 0,
      explain: "Local operations work cell by cell with no information from other locations. Neighborhood operations also write to one cell, but they read a whole window of cells around it."
    },
    {
      id: "ch10-q02",
      type: "mc",
      prompt: "Computing the mean slope of each subwatershed from a slope raster and a subwatershed raster is an example of which operation?",
      choices: ["Local", "Neighborhood", "Global", "Zonal"],
      answer: 3,
      explain: "Each subwatershed is a zone, and the operation computes one statistic for all cells in each zone. It is not global because each result uses only that zone's cells."
    },
    {
      id: "ch10-q03",
      type: "mc",
      prompt: "Which of these is a global operation?",
      choices: [
        "Converting every cell of a DEM from feet to meters",
        "A 3×3 focal mean of elevation around every cell",
        "Finding each cell's distance to the nearest stream cell",
        "Reclassifying every land cover code into four groups"
      ],
      answer: 2,
      explain: "The nearest stream cell could be anywhere in the raster, so each output cell can depend on the whole grid. Unit conversion and reclassification are local, and a focal mean is a neighborhood operation."
    },
    {
      id: "ch10-q04",
      type: "num",
      prompt: "In the Raster calculator you run `(\"A@1\" + \"B@1\") * 2`. A and B hold rainfall depths in mm. At one cell, A = 12 mm and B = 5 mm. What is the output value at that cell?",
      answer: 34,
      tol: 0,
      unit: "mm",
      explain: "Parentheses first: 12 + 5 = 17. Then 17 × 2 = 34 mm."
    },
    {
      id: "ch10-q05",
      type: "mc",
      prompt: "Raster A is 1 where slope is under 10% and 0 elsewhere. Raster B is 1 on land zoned industrial and 0 elsewhere. Which expression gives 1 only where both conditions are met and 0 everywhere else?",
      choices: ["A + B", "A * B", "A − B", "The maximum of A and B"],
      answer: 1,
      explain: "A product of 0/1 values is 1 only when both are 1, which is a Boolean AND. A + B gives 2 (not 1) where both are met, and the maximum acts like OR."
    },
    {
      id: "ch10-q06",
      type: "num",
      prompt: "A 3×3 window of elevations (m) is row 1: 4, 6, 8; row 2: 5, 7, 9; row 3: 6, 8, 10. What focal mean is written to the center cell?",
      answer: 7,
      tol: 0.01,
      unit: "m",
      explain: "Sum = 4 + 6 + 8 + 5 + 7 + 9 + 6 + 8 + 10 = 63. Mean = 63 ÷ 9 = 7 m."
    },
    {
      id: "ch10-q07",
      type: "mc",
      prompt: "A land cover raster has a 3×3 window with codes row 1: 41, 41, 82; row 2: 82, 41, 21; row 3: 41, 21, 82. What does a 3×3 majority filter assign to the center cell?",
      choices: ["82", "21", "50.2 (the mean of the codes)", "41"],
      answer: 3,
      explain: "Code 41 appears 4 times, 82 appears 3 times, and 21 appears 2 times, so the majority is 41. The mean of category codes, 50.2, is not a real land cover class."
    },
    {
      id: "ch10-q08",
      type: "mc",
      prompt: "Why should a mean filter not be applied to a land cover raster?",
      choices: [
        "Averaging category codes can create codes that are not real classes",
        "Mean filters only work on rasters with fewer than 256 distinct values",
        "Mean filters make the cell size larger, which blurs class boundaries",
        "Land cover rasters have no NoData cells, which mean filters require"
      ],
      answer: 0,
      explain: "Land cover codes are labels, not quantities. Averaging forest (41) and crops (82) gives a number that is no class at all. Use a majority filter for categorical data. A mean filter does not change the cell size."
    },
    {
      id: "ch10-q09",
      type: "tf",
      prompt: "A mean filter with a larger window (7×7 instead of 3×3) produces a smoother output raster.",
      answer: true,
      explain: "Each output cell averages 49 cells instead of 9, so local variation is spread over a wider area and the surface is smoother."
    },
    {
      id: "ch10-q10",
      type: "tf",
      prompt: "In a zonal operation, each zone must be one contiguous patch of cells.",
      answer: false,
      explain: "All cells with the same zone value form one zone, even if they are in separate patches. The statistic is computed over all of them together."
    },
    {
      id: "ch10-q11",
      type: "mc",
      prompt: "What does each cell of an accumulated cost surface store?",
      choices: [
        "The cost per meter to cross that cell",
        "The straight-line distance to the nearest source",
        "The number of paths that pass through that cell",
        "The least total cost to reach that cell from the source"
      ],
      answer: 3,
      explain: "The accumulated cost is the cheapest total cost of any path from the source to the cell. The cost per meter of a single cell is stored in the cost (friction) surface, which is the input."
    },
    {
      id: "ch10-q12",
      type: "num",
      prompt: "Cells are 30 m. A path moves from a cell with cost 3 to its diagonal neighbor with cost 5 (cost units per meter). Using the average-cost rule, what is the cost of this move?",
      answer: 169.7,
      tol: 0.5,
      unit: "cost units",
      explain: "Average cost = (3 + 5) ÷ 2 = 4. Diagonal distance = 1.414 × 30 = 42.43 m. Cost = 4 × 42.43 ≈ 169.7."
    },
    {
      id: "ch10-q13",
      type: "mc",
      prompt: "Why does a diagonal move across a cost surface cost more than an edge move between cells with the same costs?",
      choices: [
        "Diagonal neighbors always have higher cost values than edge neighbors",
        "Diagonal moves get an extra penalty to discourage zigzag paths",
        "Diagonal cell centers are about 1.414 cell widths apart",
        "A diagonal move also crosses the two edge cells it passes between"
      ],
      answer: 2,
      explain: "Cost is cost per unit distance times distance. Diagonal centers are √2 cell widths apart, so the same costs give a move 1.414 times as expensive. There is no extra penalty beyond that distance."
    },
    {
      id: "ch10-q14",
      type: "mc",
      prompt: "A water utility is screening routes for a new transmission main from a treatment plant to a storage tank. Crossing wetlands, steep slopes, and developed land adds cost. Which raster approach fits best?",
      choices: [
        "A Euclidean distance surface from the plant and a straight line to the tank",
        "A 3×3 majority filter on land cover, then a buffer around the cleaned wetlands",
        "An accumulated cost surface from the plant and a least-cost path to the tank",
        "A zonal mean of slope by county, choosing the counties with the lowest slope"
      ],
      answer: 2,
      explain: "Costs vary across the landscape, so the route should minimize total cost, not distance. A Euclidean distance surface would give a straight line that ignores wetlands and slopes."
    },
    {
      id: "ch10-q15",
      type: "mc",
      prompt: "A team is siting a maintenance yard using slope (percent), soil type (classes), and distance to roads (meters). What must happen before these layers can be combined in a weighted overlay?",
      choices: [
        "Each layer must be converted to a 0/1 raster of suitable and unsuitable cells",
        "Each layer must be reclassified to a common score scale, such as 1–5",
        "Each layer must be resampled to 1 m cells so the values can be added",
        "Each layer must be multiplied by its cell size so the units match"
      ],
      answer: 1,
      explain: "Percent, class codes, and meters cannot be added meaningfully. Reclassifying each to the same score scale makes them comparable. Converting to 0/1 would turn the model into a Boolean overlay and lose the gradations."
    },
    {
      id: "ch10-q16",
      type: "num",
      prompt: "A site suitability model uses weights 0.40 (slope), 0.35 (soil), and 0.25 (access). One cell scores 3, 5, and 2 on a 1–5 scale. What is its weighted score?",
      answer: 3.45,
      tol: 0.01,
      unit: "score (1–5)",
      explain: "0.40 × 3 + 0.35 × 5 + 0.25 × 2 = 1.20 + 1.75 + 0.50 = 3.45."
    },
    {
      id: "ch10-q17",
      type: "mc",
      prompt: "In a detention pond siting model, building in wetlands is prohibited. What is the best way to include wetlands?",
      choices: [
        "Give wetland cells a low score and a small weight",
        "Give the wetland layer a weight of 0.5 so it dominates the score",
        "Resample the wetland layer with bilinear interpolation",
        "Multiply the suitability score by a 0/1 constraint raster that is 0 in wetlands"
      ],
      answer: 3,
      explain: "A prohibition is a hard constraint. Multiplying by a 0/1 mask forces wetland cells to 0 no matter how well they score on other criteria. A low score with a small weight could still be outscored by good slope or soil."
    },
    {
      id: "ch10-q18",
      type: "tf",
      prompt: "In most GIS software, a NoData cell is treated as zero in Raster calculator expressions.",
      answer: false,
      explain: "NoData means unknown, not zero. In local operations, a NoData input usually makes the output cell NoData."
    },
    {
      id: "ch10-q19",
      type: "mc",
      prompt: "You add two rasters in the Raster calculator and the output is entirely NoData. What is the most likely cause?",
      choices: [
        "The rasters use different color ramps, so the output cannot be displayed",
        "The rasters do not overlap, so every output cell has a NoData input",
        "One raster stores integers and the other stores decimals, which cannot be added",
        "The rasters have different file names, so the calculator cannot match them"
      ],
      answer: 1,
      explain: "Where the inputs do not overlap, at least one input is NoData at every cell, so every output cell is NoData. A CRS mismatch that places the rasters in different locations has the same effect. Mixing integer and decimal rasters is allowed."
    },
    {
      id: "ch10-q20",
      type: "mc",
      prompt: "A 3×3 focal mean is computed for a cell whose window contains one NoData cell, with the tool set to skip NoData. How many values are averaged?",
      choices: ["9", "1", "8", "None; the output is NoData"],
      answer: 2,
      explain: "Skipping NoData means the mean uses the eight cells that have values. Treating the window as nine values would require reading NoData as a number, which biases the mean."
    },
    {
      id: "ch10-q21",
      type: "mc",
      prompt: "Which resampling method should be used when reprojecting a land cover raster?",
      choices: ["Bilinear", "Cubic convolution", "Average of all cells", "Nearest neighbor"],
      answer: 3,
      explain: "Nearest neighbor copies existing values, so every output cell keeps a real land cover code. Bilinear and cubic average codes and create values that are not classes."
    },
    {
      id: "ch10-q22",
      type: "mc",
      prompt: "What happens if a soil class raster (codes 1, 2, 3, 4) is resampled with bilinear interpolation?",
      choices: [
        "The codes are preserved exactly, because bilinear uses existing cells",
        "Cells may get in-between values such as 2.5 that are not real classes",
        "The raster becomes binary, with 1 where classes change and 0 elsewhere",
        "The cell size doubles, because 4 input cells feed each output cell"
      ],
      answer: 1,
      explain: "Bilinear averages the 4 nearest cells, so cells near class boundaries get blended values. Only nearest neighbor guarantees that the original codes are kept."
    },
    {
      id: "ch10-q23",
      type: "mc",
      prompt: "How many input cells does cubic convolution use to compute each output cell?",
      choices: ["25", "4", "16", "9"],
      answer: 2,
      explain: "Cubic convolution uses a 4×4 block of 16 cells. Bilinear uses 4, and nearest neighbor uses 1."
    },
    {
      id: "ch10-q24",
      type: "tf",
      prompt: "Cubic convolution can produce output values slightly higher or lower than any value in the input raster.",
      answer: true,
      explain: "The cubic curves can overshoot near sharp changes, so output values can fall slightly outside the input range. Bilinear cannot, because it is a weighted average of 4 input values."
    },
    {
      id: "ch10-q25",
      type: "tf",
      prompt: "Resampling a 30 m DEM to 5 m cells adds real terrain detail that the 30 m data did not capture.",
      answer: false,
      explain: "Resampling only splits or blends existing values. Real 5 m detail requires 5 m (or finer) source data, such as lidar."
    },
    {
      id: "ch10-q26",
      type: "mc",
      prompt: "A raster covering 3 km × 3 km with 30 m cells is resampled to 10 m cells. How does the number of cells change?",
      choices: ["It doubles", "It triples", "It stays the same", "It increases 9 times"],
      answer: 3,
      explain: "At 30 m: 100 × 100 = 10,000 cells. At 10 m: 300 × 300 = 90,000 cells. Dividing the cell size by 3 multiplies the cell count by 3² = 9."
    },
    {
      id: "ch10-q27",
      type: "mc",
      prompt: "A 10 m DEM and a 30 m land cover raster with different cell origins will be used to compute the mean elevation of each land cover class. What should you do first?",
      choices: [
        "Align both to one grid: nearest neighbor for land cover, bilinear for the DEM",
        "Resample both rasters to 1 m cells with cubic convolution so no detail is lost",
        "Align both to one grid: bilinear for land cover, nearest neighbor for the DEM",
        "Nothing, because zonal tools ignore differences in cell size and alignment"
      ],
      answer: 0,
      explain: "The cells must match before zonal statistics, and each layer needs a resampling method suited to its data type. Bilinear on land cover would blend class codes into values that are not classes. Resampling both to 1 m adds no information, and cubic convolution would also blend the codes."
    },
    {
      id: "ch10-q28",
      type: "mc",
      prompt: "What does cell alignment (snapping) ensure?",
      choices: [
        "All rasters use the same color ramp and value range for display",
        "NoData cells are removed from the edges of each input raster",
        "Cell edges of different rasters fall on the same grid lines",
        "All rasters have the same number of bands and the same data type"
      ],
      answer: 2,
      explain: "Aligned rasters have matching cell boundaries, so each output cell in map algebra combines input cells that cover the same ground. Alignment has nothing to do with symbology or bands."
    }
  ]
});
