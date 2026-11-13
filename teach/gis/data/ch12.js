GIS.chapter({
  id: "ch12",
  num: 12,
  title: "Interpolation and Spatial Estimation",
  blurb: "How to turn point samples such as rain gauges, wells, and borings into continuous surfaces with Thiessen polygons, IDW, trend surfaces, splines, and kriging, how to check their accuracy, and how to map point density and core areas.",
  objectives: [
    "Compare random, systematic, stratified, cluster, and adaptive sampling patterns.",
    "Build Thiessen (Voronoi) polygons and use them for nearest-sample estimates and area-weighted averages.",
    "Compute an inverse distance weighted (IDW) estimate and explain how the power parameter changes it.",
    "Distinguish global from local and exact from inexact interpolators, including trend surfaces and splines.",
    "Interpret a semivariogram's nugget, sill, and range and describe what kriging adds.",
    "Evaluate interpolation methods with cross-validation, mean error, and RMSE.",
    "Estimate point density and core areas with simple and kernel density methods."
  ],
  guide: [
    {
      heading: "Why interpolate, and how samples are collected",
      paragraphs: [
        "**Spatial estimation** predicts values at unmeasured places from measured ones. **Interpolation** turns point samples, such as rain gauges, soil borings, groundwater wells, or survey shots, into a continuous surface. It works because nearby things tend to be more alike than distant things, a property called **spatial autocorrelation**. Without it, no method can predict well.",
        "The sampling pattern limits what any method can do. Features smaller than the spacing between samples can be missed entirely, so sample density should match the size of the variation you need to capture."
      ],
      bullets: [
        "**Random**: every location has an equal chance of being sampled. Unbiased, but chance can leave gaps and clumps.",
        "**Systematic** (grid): even spacing and coverage. It can miss or exaggerate patterns that repeat at the grid spacing, such as crop rows or terraces.",
        "**Stratified random**: divide the area into strata (soil types, land uses, or equal blocks) and sample randomly within each, so every stratum is represented.",
        "**Cluster**: groups of samples at a few locations. Cheap when travel is costly and useful for measuring short-range variation, but large areas go unsampled.",
        "**Adaptive**: add samples where values change quickly or where earlier samples found something important, such as near a contamination hot spot."
      ],
      qgis: "Processing Toolbox → Vector creation → Random points in extent, Random points inside polygons, and Regular points help lay out sampling designs."
    },
    {
      heading: "Thiessen (Voronoi) polygons",
      paragraphs: [
        "**Thiessen polygons**, also called Voronoi polygons, divide an area so that every location falls in the polygon of its nearest sample point. Each edge is part of the perpendicular bisector of the line joining two neighboring points. Connecting points whose polygons share an edge gives the **Delaunay triangulation**, the basis of TIN surfaces.",
        "As an estimator, each polygon takes the value of its sample, which is a nearest-neighbor estimate. The surface is flat inside each polygon and jumps at the edges, so it suits nominal data (which station or office is closest) better than smooth fields like temperature. In hydrology, the **Thiessen polygon method** weights each rain gauge by the area of its polygon inside the watershed to get the mean areal rainfall."
      ],
      formula: {
        expr: "P̄ = Σ(Aᵢ Pᵢ) / Σ Aᵢ",
        where: [
          "Pᵢ: rainfall at gauge i",
          "Aᵢ: area of gauge i's Thiessen polygon inside the watershed",
          "P̄: mean areal rainfall"
        ]
      },
      example: {
        prompt: "Three gauges have Thiessen polygon areas of 12, 20, and 8 km² inside a 40 km² watershed and storm totals of 30, 40, and 25 mm. Find the mean areal rainfall.",
        steps: [
          "Multiply area by rainfall: 12 × 30 = 360; 20 × 40 = 800; 8 × 25 = 200.",
          "Sum: 360 + 800 + 200 = 1,360 mm·km².",
          "Divide by the total area: 1,360 ÷ 40 = 34 mm."
        ],
        answer: "34 mm (a plain average of the three gauges would give 31.7 mm)"
      },
      qgis: "Processing Toolbox → Vector geometry → Voronoi polygons (add a buffer region so the outer polygons cover the study area). Clip the result to the watershed with Vector overlay → Clip, then compute areas with `$area`. Delaunay triangulation is in the same group."
    },
    {
      heading: "Inverse distance weighting (IDW)",
      paragraphs: [
        "**IDW** estimates a value as a weighted average of nearby samples. Each sample's weight is 1 divided by its distance raised to a power p, so close samples count much more than distant ones. Because the weights are all positive, an IDW estimate always falls between the lowest and highest sample values used.",
        "The **power** sets how fast influence drops with distance. With p = 1, distant samples still matter a good deal and the surface is smoother. With p = 2, the most common default, nearby samples dominate more. With large powers the surface approaches Thiessen polygons: nearly flat around each sample with sharp changes between them. IDW surfaces often show **bull's-eyes**, rings around isolated high or low samples.",
        "You also choose which samples to use: all of them, the nearest n, or those within a search radius. IDW is an **exact** interpolator, meaning it returns the sample value at each sample location. It cannot predict a value beyond the data range, such as an unsampled summit between survey points."
      ],
      formula: {
        expr: "ẑ = Σ(zᵢ / dᵢᵖ) / Σ(1 / dᵢᵖ)",
        where: [
          "ẑ: estimated value",
          "zᵢ: value at sample i",
          "dᵢ: distance from the estimate location to sample i",
          "p: power, often 2"
        ]
      },
      example: {
        prompt: "Estimate rainfall at a site that is 1, 2, and 4 km from three gauges that recorded 50, 60, and 80 mm. Use p = 2, then p = 1.",
        steps: [
          "p = 2 weights: 1/1² = 1, 1/2² = 0.25, 1/4² = 0.0625. Sum = 1.3125.",
          "Weighted values: 50 × 1 + 60 × 0.25 + 80 × 0.0625 = 50 + 15 + 5 = 70.",
          "Estimate with p = 2: 70 ÷ 1.3125 = 53.3 mm.",
          "p = 1 weights: 1, 0.5, 0.25 (sum 1.75). Weighted values: 50 + 30 + 20 = 100. Estimate: 100 ÷ 1.75 = 57.1 mm.",
          "The higher power pulls the estimate toward the nearest gauge (50 mm)."
        ],
        answer: "53.3 mm with p = 2; 57.1 mm with p = 1"
      },
      qgis: "Processing Toolbox → Interpolation → IDW interpolation. The Distance coefficient P is the power (default 2). Set the output cell size or the number of rows and columns before running."
    },
    {
      heading: "Trend surfaces",
      paragraphs: [
        "A **trend surface** fits one mathematical surface to all the samples by least-squares regression of z on the x and y coordinates. A first-order trend is a tilted plane; a second-order trend adds x², xy, and y² terms and can bend. It is a **global** method, because every sample affects the whole surface, and an **inexact** one, because the surface usually does not pass through the samples.",
        "Trend surfaces show the broad regional pattern, such as a water table sloping toward a river. The **residuals** (observed minus trend) show local departures from it. A common approach removes the trend, interpolates the residuals with a local method, and adds the trend back. High-order polynomials can swing wildly near the edges of the data, so keep the order low."
      ],
      formula: {
        expr: "First order: z = b₀ + b₁x + b₂y;   Second order: z = b₀ + b₁x + b₂y + b₃x² + b₄xy + b₅y²",
        where: [
          "x, y: coordinates of a location",
          "b₀ … b₅: coefficients fit by least squares"
        ]
      },
      example: {
        prompt: "A first-order trend fit to groundwater levels is z = 1,420 + 0.004x − 0.010y, with x and y in meters from a local origin and z in meters. Estimate the water level at x = 2,500 m, y = 3,000 m.",
        steps: [
          "0.004 × 2,500 = 10.",
          "0.010 × 3,000 = 30.",
          "z = 1,420 + 10 − 30 = 1,400 m."
        ],
        answer: "1,400 m"
      }
    },
    {
      heading: "Splines",
      paragraphs: [
        "A **spline** fits a flexible surface that passes through every sample point (an exact interpolator) while bending as little as possible, like a thin sheet of metal pinned at each point. In most GIS tools splines are fit from nearby samples, so they are treated as **local** methods. They give smooth, natural-looking surfaces for gently varying data such as water tables, elevations from sparse survey points, or pollutant concentrations.",
        "Because the surface must stay smooth, a spline can **overshoot**: it may predict values above the highest sample or below the lowest, especially where close samples differ a lot or where there are gaps. Tension and smoothing settings control this. Higher tension pulls the surface tight between points, like a stretched rubber sheet, which reduces overshoot. A smoothing setting lets the surface pass near, rather than exactly through, noisy samples. Splines are a poor choice where values change abruptly, such as across a fault or a cliff."
      ],
      qgis: "GRASS v.surf.rst (regularized spline with tension) and v.surf.bspline in the Processing Toolbox."
    },
    {
      heading: "Kriging and semivariograms",
      paragraphs: [
        "**Kriging** is a geostatistical method. Like IDW, it estimates a weighted average of nearby samples, but it sets the weights from a model of how similarity changes with distance, fit to the data themselves. It also accounts for clustering (a tight group of samples shares weight instead of dominating) and gives a map of estimated **prediction error**, the kriging variance, along with the estimates. **Ordinary kriging**, the most common form, assumes a constant but unknown mean over the area.",
        "The model is built from the **semivariogram**. For pairs of samples, compute half the squared difference in their values and plot it against the distance between them (the lag). Close pairs usually have small semivariance; it rises with distance and often levels off. A curve such as a spherical or exponential model is then fit to these points."
      ],
      bullets: [
        "**Nugget**: the semivariance at near-zero distance, caused by measurement error and variation at scales shorter than the closest sample spacing.",
        "**Sill**: the level where the semivariogram flattens out, often close to the overall variance of the data.",
        "**Range**: the distance at which the sill is reached. Samples farther apart than the range are not spatially correlated, so they add little to an estimate."
      ],
      formula: {
        expr: "γ(h) = [1 / (2 N(h))] × Σ (zᵢ − zⱼ)²",
        where: [
          "γ(h): semivariance at lag distance h",
          "N(h): number of sample pairs separated by about h",
          "zᵢ, zⱼ: values at the two points of a pair"
        ]
      },
      example: {
        prompt: "Four pairs of wells are each about 200 m apart. Their water-level differences are 2, 4, 0, and 2 m. What is the semivariance at the 200 m lag?",
        steps: [
          "Square the differences: 4, 16, 0, 4. Sum = 24.",
          "N(h) = 4, so γ = 24 ÷ (2 × 4) = 3.0 m²."
        ],
        answer: "3.0 m²"
      },
      qgis: "QGIS has no core kriging tool. The Smart-Map plugin fits semivariograms and runs ordinary kriging; SAGA's kriging tools also work if a SAGA provider plugin is installed."
    },
    {
      heading: "Choosing a method and checking accuracy",
      paragraphs: [
        "No method is best everywhere. Interpolators are **exact** (they honor the sample values: Thiessen, IDW, splines, and kriging without a measurement-error term) or **inexact** (they smooth through them: trend surfaces). They are **global** (trend surfaces) or **local** (IDW, splines, kriging). Match the method to the data: smooth or abrupt, with or without a regional trend, evenly spread or clustered.",
        "Judge accuracy with data the method did not use. **Cross-validation** removes one sample at a time, estimates it from the rest, and records the error; doing this for every sample is called leave-one-out. A **validation set** held back from the start works the same way. Summarize the errors with the **mean error**, which shows bias and should be near 0, and the **root mean square error (RMSE)**, the typical size of an error. Compare RMSE across methods or settings, such as IDW powers of 1, 2, and 3, and prefer the lowest."
      ],
      formula: {
        expr: "RMSE = √( Σ(zᵢ − ẑᵢ)² / n );   mean error = Σ(zᵢ − ẑᵢ) / n",
        where: [
          "zᵢ: observed value at test point i",
          "ẑᵢ: estimated value at test point i",
          "n: number of test points"
        ]
      },
      example: {
        prompt: "Leave-one-out errors (observed − estimated) at five wells are 2, −1, 3, −2, and 0 m. Find the mean error and the RMSE.",
        steps: [
          "Mean error = (2 − 1 + 3 − 2 + 0) ÷ 5 = 2 ÷ 5 = 0.4 m.",
          "Squared errors: 4, 1, 9, 4, 0. Sum = 18.",
          "RMSE = √(18 ÷ 5) = √3.6 = 1.90 m."
        ],
        answer: "Mean error = 0.4 m; RMSE ≈ 1.90 m"
      },
      qgis: "Processing Toolbox → Raster analysis → Sample raster values reads interpolated values at held-out points, so errors can be computed in the attribute table with the Field calculator."
    },
    {
      heading: "Density estimation and core areas",
      paragraphs: [
        "Sometimes the question is how many events happen near a place rather than what value a field has there: crashes along a corridor, sinkholes in a county, or GPS fixes from a collared animal. **Density estimation** turns points into a surface of events per unit area.",
        "**Simple density** counts the points inside a search circle around each cell and divides by the circle's area. **Kernel density** spreads each point over a smooth, hill-shaped kernel and adds the kernels together, giving a smoother surface in which nearer points count more. The **bandwidth** (search radius) matters most: a small bandwidth shows tight hot spots and noise, while a large one shows broad patterns.",
        "**Core area** methods outline where most of the activity happens. Simple options are a circle around the **mean center** and the **convex hull** (minimum convex polygon) around all points, which a few outliers can inflate. A kernel density surface gives a better outline: take the contour that encloses a set share of the total density, such as 50% for a core area or 95% for an overall range."
      ],
      example: {
        prompt: "A search circle with a 500 m radius around a cell contains 45 recorded crashes. What is the simple density in crashes per km²?",
        steps: [
          "Radius = 0.5 km.",
          "Circle area = π × 0.5² = 0.785 km².",
          "Density = 45 ÷ 0.785 = 57.3 crashes per km²."
        ],
        answer: "About 57 crashes per km²"
      },
      qgis: "Processing Toolbox → Interpolation → Heatmap (Kernel Density Estimation); set the Radius (bandwidth) and kernel shape. Vector analysis → Mean coordinate(s) and Vector geometry → Convex hull or Minimum bounding geometry give simple core areas."
    }
  ],
  cards: [
    { front: "Spatial interpolation", back: "Estimating values at unsampled locations from measured sample points to build a continuous surface." },
    { front: "Spatial autocorrelation", back: "The tendency of nearby locations to have more similar values than distant ones. Interpolation depends on it." },
    { front: "Systematic sampling", back: "Samples placed on a regular grid or at fixed spacing. Good coverage, but it can misrepresent patterns that repeat at the grid spacing." },
    { front: "Stratified random sampling", back: "Dividing the area into strata and placing random samples within each so every stratum is represented." },
    { front: "Cluster sampling", back: "Taking groups of samples at a few locations. Saves travel and shows short-range variation but leaves gaps." },
    { front: "Adaptive sampling", back: "Adding samples where values change quickly or where earlier samples found something of interest." },
    { front: "Thiessen (Voronoi) polygons", back: "Polygons containing all locations closer to one sample point than to any other. Edges lie on perpendicular bisectors between points." },
    { front: "Delaunay triangulation", back: "Triangles connecting points whose Thiessen polygons share an edge. Used to build TINs." },
    { front: "Thiessen rainfall method", back: "Mean areal rainfall found by weighting each gauge by the area of its Thiessen polygon inside the watershed." },
    { front: "Inverse distance weighting (IDW)", back: "An estimate equal to the weighted average of nearby samples, with weights 1/dᵖ, so closer samples count more." },
    { front: "IDW power", back: "The exponent p on distance. A higher p gives nearby samples more influence and a more local, peaked surface." },
    { front: "Bull's-eye effect", back: "Circular rings around isolated high or low samples, common in IDW surfaces." },
    { front: "Exact interpolator", back: "A method whose surface passes through the sample values, such as IDW, splines, and kriging without a measurement-error term." },
    { front: "Inexact interpolator", back: "A method whose surface does not have to pass through the samples, such as a trend surface." },
    { front: "Global vs. local interpolator", back: "Global: every sample affects the whole surface (trend surface). Local: only nearby samples affect each estimate (IDW, spline)." },
    { front: "Trend surface", back: "A polynomial in x and y fit to all samples by least squares. Shows the regional pattern; first order is a tilted plane." },
    { front: "Residual", back: "Observed value minus estimated (or trend) value at a sample point." },
    { front: "Spline", back: "An exact, local interpolator that fits a smooth, minimum-curvature surface through the samples. It can overshoot the data range." },
    { front: "Kriging", back: "Geostatistical interpolation that sets weights from a fitted semivariogram and also estimates the prediction error." },
    { front: "Ordinary kriging", back: "The most common kriging type. It assumes the mean is constant but unknown over the area." },
    { front: "Semivariogram", back: "A plot of semivariance (half the average squared difference between pairs of samples) against the distance between them." },
    { front: "Nugget", back: "Semivariance at near-zero distance, from measurement error and variation at scales shorter than the sample spacing." },
    { front: "Sill", back: "The semivariance level at which the semivariogram levels off." },
    { front: "Range (semivariogram)", back: "The distance at which the semivariogram reaches the sill. Beyond it, samples are not spatially correlated." },
    { front: "Cross-validation", back: "Removing each sample in turn, estimating it from the others, and recording the error to judge an interpolation method." },
    { front: "RMSE", back: "Root mean square error: the square root of the mean squared error. The typical size of prediction errors, in the data's units." },
    { front: "Kernel density estimation", back: "Spreads each point over a smooth kernel of set bandwidth and sums them to give events per unit area." },
    { front: "Bandwidth", back: "The kernel radius in density estimation. Larger bandwidths give smoother surfaces; smaller ones show tighter hot spots." },
    { front: "Core area", back: "The region where most of a set of points, such as animal locations or incidents, is concentrated." },
    { front: "Convex hull (minimum convex polygon)", back: "The smallest convex polygon enclosing all points. A simple core-area outline that outliers can inflate." }
  ],
  questions: [
    {
      id: "ch12-q01",
      type: "mc",
      prompt: "Which sampling pattern places samples at fixed, even spacing?",
      choices: ["Random", "Cluster", "Systematic", "Adaptive"],
      answer: 2,
      explain: "Systematic sampling uses a regular grid or fixed interval. Stratified random sampling also spreads samples out, but it places them randomly within each stratum."
    },
    {
      id: "ch12-q02",
      type: "mc",
      prompt: "A field has crop rows every 30 m, and soil samples are taken on a 30 m grid. What is the main risk?",
      choices: [
        "The grid leaves large unsampled gaps between rows that IDW cannot fill",
        "Samples may all land on rows, or all between them, and misrepresent the field",
        "The samples are too clustered along the rows to fit a semivariogram",
        "Grid samples cannot be used with IDW, which needs randomly placed points"
      ],
      answer: 1,
      explain: "When a pattern repeats at the sampling interval, every sample can land at the same point in the cycle. A 30 m grid gives even coverage, so gaps are not the problem."
    },
    {
      id: "ch12-q03",
      type: "mc",
      prompt: "A first round of soil samples on a grid around a leaking fuel tank found high readings on the east side. Which approach should the second round use?",
      choices: [
        "Systematic sampling: repeat the same grid exactly so rounds can be compared",
        "Random sampling: scatter new samples anywhere on the site to avoid bias",
        "Adaptive sampling: add samples on the east side, where readings change fastest",
        "Cluster sampling: put all samples at the tank itself, where the leak began"
      ],
      answer: 2,
      explain: "Adaptive sampling adds samples where earlier results show high values or rapid change, which is where the plume boundary must be defined. Repeating the grid would not sharpen that boundary."
    },
    {
      id: "ch12-q04",
      type: "mc",
      prompt: "Every location inside a Thiessen polygon is:",
      choices: [
        "Within a fixed distance of the polygon's sample point",
        "At the same elevation as the sample point",
        "Inside the convex hull of all the sample points",
        "Closer to that polygon's sample point than to any other sample point"
      ],
      answer: 3,
      explain: "Thiessen polygons are defined by nearest sample. Their size varies with the spacing of the points, so they do not mark a fixed distance."
    },
    {
      id: "ch12-q05",
      type: "mc",
      prompt: "What does a surface estimated with Thiessen polygons look like?",
      choices: [
        "Flat within each polygon, with jumps at the polygon edges",
        "Smooth, with gradual changes from one sample to the next",
        "A single tilted plane fit through all of the samples",
        "Circular rings of decreasing value around each sample"
      ],
      answer: 0,
      explain: "Each polygon takes its sample's value everywhere inside it, so values change only at polygon edges. Circular rings are the bull's-eye pattern of IDW."
    },
    {
      id: "ch12-q06",
      type: "num",
      prompt: "Four rain gauges have Thiessen polygon areas of 10, 15, 20, and 5 km² inside a 50 km² watershed. Their storm totals are 22, 30, 26, and 40 mm. What is the mean areal rainfall?",
      answer: 27.8,
      tol: 0.05,
      unit: "mm",
      explain: "Σ(A × P) = 10×22 + 15×30 + 20×26 + 5×40 = 220 + 450 + 520 + 200 = 1,390. Divide by 50 km²: 27.8 mm."
    },
    {
      id: "ch12-q07",
      type: "num",
      prompt: "Using IDW with power 2, estimate the water level at a point 100 m from a well with level 20 m and 300 m from a well with level 40 m.",
      answer: 22,
      tol: 0.05,
      unit: "m",
      explain: "Weights: 1/100² = 0.0001 and 1/300² = 0.0000111, a ratio of 9 to 1. Estimate = (9 × 20 + 1 × 40) ÷ 10 = 220 ÷ 10 = 22 m."
    },
    {
      id: "ch12-q08",
      type: "mc",
      prompt: "What happens when the IDW power is increased from 1 to 3?",
      choices: [
        "Distant samples gain influence and the surface becomes smoother",
        "The surface becomes a tilted plane",
        "Nearby samples gain influence and the surface looks more like Thiessen polygons",
        "Estimates can now exceed the highest sample value"
      ],
      answer: 2,
      explain: "A larger power makes weights fall off faster with distance, so the nearest sample dominates. IDW estimates stay within the sample range for any power."
    },
    {
      id: "ch12-q09",
      type: "tf",
      prompt: "An IDW estimate can never be higher than the highest sample value used to compute it.",
      answer: true,
      explain: "IDW is a weighted average with positive weights that sum to 1 after division, so the result always lies between the smallest and largest sample values."
    },
    {
      id: "ch12-q10",
      type: "mc",
      prompt: "Survey points were collected along a ridge, but none was taken at the actual summit. What will an IDW surface built from them do at the summit?",
      choices: [
        "Predict the summit correctly, because IDW is an exact interpolator",
        "Underestimate the summit, because IDW estimates cannot exceed the highest sample",
        "Overestimate the summit, because of the bull's-eye effect",
        "Fail to run, because IDW cannot be used with elevation data"
      ],
      answer: 1,
      explain: "IDW cannot produce a value above the highest sample, so the unsampled peak is cut off. Exact means it honors values at sample points, not at places that were never sampled."
    },
    {
      id: "ch12-q11",
      type: "mc",
      prompt: "Which interpolator is both global and inexact?",
      choices: ["Inverse distance weighting", "Thiessen (Voronoi) polygons", "A minimum-curvature spline", "A first-order trend surface"],
      answer: 3,
      explain: "A trend surface is fit to all samples at once (global) and generally does not pass through them (inexact). IDW and Thiessen polygons are local and exact, and a minimum-curvature spline is also local and passes through the samples."
    },
    {
      id: "ch12-q12",
      type: "num",
      prompt: "A first-order trend surface for groundwater level is z = 1,350 − 0.008x + 0.002y, with x and y in meters from a local origin and z in meters. What is z at x = 1,000 m, y = 500 m?",
      answer: 1343,
      tol: 0.01,
      unit: "m",
      explain: "z = 1,350 − 0.008 × 1,000 + 0.002 × 500 = 1,350 − 8 + 1 = 1,343 m."
    },
    {
      id: "ch12-q13",
      type: "mc",
      prompt: "Why is a trend surface often combined with another interpolation method?",
      choices: [
        "The trend shows the regional pattern; a local method handles the residuals",
        "Trend surfaces can be fit to only ten points, so the rest need another method",
        "Trend surfaces pass through every sample, so another method must smooth them",
        "Trend surfaces work only for categorical data, so values need a second method"
      ],
      answer: 0,
      explain: "A low-order trend misses local detail, which shows up in the residuals. Interpolating the residuals and adding the trend back gives both the regional and local patterns. Trend surfaces are inexact, so they do not pass through every sample."
    },
    {
      id: "ch12-q14",
      type: "tf",
      prompt: "A spline surface can predict values above the highest sample or below the lowest sample.",
      answer: true,
      explain: "To stay smooth, a spline can overshoot between samples, especially where nearby values differ sharply. IDW cannot do this."
    },
    {
      id: "ch12-q15",
      type: "mc",
      prompt: "Bedrock elevations at a site jump 20 m across a mapped fault. Which approach best represents the offset?",
      choices: [
        "Fit one spline across the whole site",
        "Fit one first-order trend surface across the site",
        "Interpolate each side of the fault separately and combine the results",
        "Use a large IDW search radius so samples from both sides are averaged"
      ],
      answer: 2,
      explain: "Treating each fault block separately keeps the abrupt step. A single spline, trend, or wide IDW search blends samples across the fault and smears the 20 m jump into a slope."
    },
    {
      id: "ch12-q16",
      type: "mc",
      prompt: "On a semivariogram, what is the range?",
      choices: [
        "The semivariance at zero distance",
        "The difference between the highest and lowest sample values",
        "The highest semivariance in the plot",
        "The distance beyond which samples are no longer spatially correlated"
      ],
      answer: 3,
      explain: "The range is the lag distance where the semivariogram reaches the sill. The semivariance at zero distance is the nugget, and the level where the curve flattens is the sill."
    },
    {
      id: "ch12-q17",
      type: "mc",
      prompt: "A semivariogram has a nugget that is large compared with its sill. What does this suggest?",
      choices: [
        "Values stay strongly correlated even at distances well beyond the range",
        "Much of the variation is measurement error or finer than the sample spacing",
        "The samples are too far apart for any semivariance to be computed",
        "A strong regional trend is present, so a third-order trend surface is needed"
      ],
      answer: 1,
      explain: "The nugget is variation that the sample spacing cannot resolve, plus measurement error. A large nugget means nearby samples are not much more alike than distant ones, which limits any interpolator's accuracy."
    },
    {
      id: "ch12-q18",
      type: "num",
      prompt: "Five pairs of soil samples are each about 50 m apart. The differences in clay content within the pairs are 3, 1, 2, 4, and 2 percentage points. What is the semivariance at the 50 m lag?",
      answer: 3.4,
      tol: 0.01,
      unit: "(percentage points)²",
      explain: "Squares: 9 + 1 + 4 + 16 + 4 = 34. γ = 34 ÷ (2 × 5) = 3.4."
    },
    {
      id: "ch12-q19",
      type: "mc",
      prompt: "What does kriging provide that IDW does not?",
      choices: [
        "Estimates at unsampled locations between the samples",
        "Weights that decrease as distance from the samples grows",
        "Surfaces that return exact values at the sample points",
        "A map of estimated prediction error (the kriging variance)"
      ],
      answer: 3,
      explain: "Both methods estimate unsampled locations, weight nearer samples more, and honor sample values. Only kriging, through its semivariogram model, also estimates how uncertain each prediction is."
    },
    {
      id: "ch12-q20",
      type: "mc",
      prompt: "Three samples are clustered tightly together 100 m east of an estimate location, and one sample is 100 m to the west. How does ordinary kriging treat the cluster compared with IDW?",
      choices: [
        "Kriging shares weight within the cluster; IDW weights each sample by distance alone",
        "Kriging drops the clustered samples entirely and uses only the western sample",
        "Kriging and IDW give identical weights, because all four samples are 100 m away",
        "IDW shares weight within the cluster; kriging weights each sample by distance alone"
      ],
      answer: 0,
      explain: "Kriging recognizes that clustered samples carry largely repeated information and shares weight among them. IDW gives each of the four samples the same weight because all are 100 m away, so the cluster gets three-quarters of the total."
    },
    {
      id: "ch12-q21",
      type: "tf",
      prompt: "In leave-one-out cross-validation, each sample is removed in turn and estimated from the remaining samples.",
      answer: true,
      explain: "Removing the point keeps it from influencing its own estimate. The differences between observed and estimated values become the error set used for RMSE."
    },
    {
      id: "ch12-q22",
      type: "num",
      prompt: "Cross-validation errors at four test points are 1.5, −0.5, −2.0, and 1.0 m. What is the RMSE?",
      answer: 1.37,
      tol: 0.01,
      unit: "m",
      explain: "Squares: 2.25 + 0.25 + 4.00 + 1.00 = 7.50. Mean = 7.50 ÷ 4 = 1.875. RMSE = √1.875 = 1.37 m."
    },
    {
      id: "ch12-q23",
      type: "mc",
      prompt: "Cross-validation of a rainfall interpolation gives RMSE of 6.2 mm for IDW (p = 1), 4.8 mm for IDW (p = 2), and 5.5 mm for a spline. All mean errors are near zero. Which method should you choose?",
      choices: ["IDW with p = 1", "Spline", "IDW with p = 2", "Any of them, because the mean errors are near zero"],
      answer: 2,
      explain: "With bias similar for all three, the lowest RMSE wins: IDW with p = 2. A mean error near zero only means errors cancel out; RMSE shows how large they are."
    },
    {
      id: "ch12-q24",
      type: "mc",
      prompt: "An interpolation method has a mean cross-validation error of +3.0 mm, computed as observed minus estimated. What does this indicate?",
      choices: [
        "The method tends to underestimate",
        "The method tends to overestimate",
        "The method is unbiased",
        "The RMSE is 3.0 mm"
      ],
      answer: 0,
      explain: "A positive observed minus estimated value means observations are usually larger than estimates, so the method runs low. RMSE is a separate number and is at least as large as the absolute mean error."
    },
    {
      id: "ch12-q25",
      type: "mc",
      prompt: "In kernel density estimation, what happens when the bandwidth (search radius) is increased?",
      choices: [
        "The surface shows tighter, sharper hot spots",
        "The surface becomes smoother and shows broader patterns",
        "The number of input points increases",
        "The output cell size doubles"
      ],
      answer: 1,
      explain: "A wider kernel spreads each point's influence over a larger area, which blurs small clusters into broad patterns. A smaller bandwidth gives tighter hot spots."
    },
    {
      id: "ch12-q26",
      type: "mc",
      prompt: "A search circle with a 1 km radius around a cell contains 63 crash points. What is the simple density?",
      choices: ["About 10 per km²", "63 per km²", "About 20 per km²", "About 200 per km²"],
      answer: 2,
      explain: "Circle area = π × 1² = 3.14 km². Density = 63 ÷ 3.14 ≈ 20 per km². About 10 comes from dividing by the circumference (2π) instead of the area."
    },
    {
      id: "ch12-q27",
      type: "mc",
      prompt: "Why can a convex hull (minimum convex polygon) overstate an animal's core area?",
      choices: [
        "The hull always excludes the mean center, where the animal spends most time",
        "A few outlying locations stretch the hull over areas the animal rarely uses",
        "Hulls can be drawn only around fewer than 10 points, so most locations are dropped",
        "The hull ignores the outermost points and so includes only the densest area"
      ],
      answer: 1,
      explain: "The hull must include every point, so a single distant location adds a large wedge of unused area. Kernel density contours are less sensitive to outliers."
    },
    {
      id: "ch12-q28",
      type: "tf",
      prompt: "Thiessen polygons are a good choice for mapping a smoothly varying field such as air temperature.",
      answer: false,
      explain: "Thiessen polygons create a stepped surface with sudden jumps at polygon edges. Smooth fields are better handled by IDW, splines, or kriging."
    },
    {
      id: "ch12-q29",
      type: "mc",
      prompt: "A geotechnical engineer has 25 borings with depth to bedrock spread unevenly over a site. She wants an estimated bedrock surface and a map of where the estimates are least reliable, to plan more borings. Which method fits best?",
      choices: ["Thiessen polygons", "A first-order trend surface", "A kernel density surface", "Ordinary kriging"],
      answer: 3,
      explain: "Kriging gives both estimates and a prediction-error map, and it handles uneven sample spacing. High-error areas are where new borings will help most. Kernel density measures point concentration, not bedrock depth."
    }
  ]
});
