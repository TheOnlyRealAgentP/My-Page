GIS.chapter({
  id: "ch13",
  num: 13,
  title: "Spatial Models and Modeling",
  blurb: "How GIS chains layers and operations into models that pick suitable sites or simulate processes like runoff and erosion, and how to check whether a model deserves your trust.",
  objectives: [
    "Distinguish cartographic (suitability) models from spatial process models.",
    "Build a binary model and a weighted-overlay suitability model from criteria, scores and weights.",
    "Classify a model as deterministic or stochastic, static or dynamic, and lumped or distributed.",
    "Compute storm runoff with the curve number method and annual soil loss with the USLE for one cell.",
    "Explain the differences among calibration, validation and sensitivity analysis.",
    "Lay out a model-builder workflow that takes inputs through GIS tools to outputs."
  ],
  guide: [
    {
      heading: "What a spatial model is",
      paragraphs: [
        "A **model** is a simplified version of a real system that helps us understand it or predict what it will do. A **spatial model** adds location: its inputs are map layers, and its outputs are new layers or values tied to places. Every model leaves things out. A good one keeps the parts that matter for the question and states its assumptions.",
        "In a GIS, a model is usually a chain of operations applied in a set order: reclassify, buffer, overlay, map algebra and so on. Drawing the chain as a flowchart (inputs, operations, outputs) makes the logic easy to check and repeat.",
        "Engineers build spatial models for two broad jobs. **Cartographic models** answer \"where\" questions by combining existing layers, such as where a detention basin could go. **Process models** simulate how something moves or changes, such as how much runoff reaches a culvert during a storm."
      ],
      bullets: [
        "Inputs: data layers plus parameters (buffer distance, weights, rainfall depth).",
        "Operations: the GIS tools, in order.",
        "Outputs: the answer layer, plus any intermediate layers you need to check.",
        "Assumptions: written down, so a reviewer can judge them."
      ]
    },
    {
      heading: "Cartographic models: binary and index models",
      paragraphs: [
        "A **cartographic model** combines map layers through a sequence of GIS operations to produce a new map. The term comes from Dana Tomlin's work on map algebra, where each step takes one or more layers in and produces a layer out.",
        "In a **binary model**, each criterion is reclassified to 1 (meets the requirement) or 0 (fails it). The layers are then combined with a logical AND, which for rasters is the same as multiplying the cells. A cell is suitable only if every criterion is 1. Binary models are easy to explain, but they cannot rank sites: a cell that misses one criterion by a hair gets the same 0 as a cell that fails everything.",
        "An **index model** scores each criterion on a common scale and combines the scores into a single number, so sites can be ranked from best to worst. The weighted overlay in the next section is the most common index model."
      ],
      example: {
        prompt: "A binary model for a staging yard needs slope under 5%, no floodplain, and land within 500 m of an existing road. Cell X has slope 3%, is outside the floodplain, and is 650 m from a road. Is it suitable?",
        steps: [
          "Slope criterion: 3% < 5%, so slope = 1.",
          "Floodplain criterion: outside the floodplain, so floodplain = 1.",
          "Road criterion: 650 m > 500 m, so road = 0.",
          "Combine with AND (multiply): 1 × 1 × 0 = 0."
        ],
        answer: "Not suitable (result = 0), even though it passes two of the three criteria."
      }
    },
    {
      heading: "Weighted overlay suitability analysis",
      paragraphs: [
        "A **weighted overlay** (also called weighted linear combination) ranks every location by how well it meets several criteria. First, separate **constraints** from **factors**. Constraints are hard rules that exclude land outright, like wetlands or existing buildings. Factors are graded preferences, like gentler slopes being better than steeper ones.",
        "Next, reclassify each factor to a common scale, such as 1 (poor) to 5 (best). This step is called **standardization**. Raw values cannot be added because their units differ: degrees of slope, meters of distance and soil categories have nothing in common until they are scored. Then assign each factor a weight that reflects its importance, with the weights summing to 1. Multiply each score by its weight, add the results, and finally multiply by the constraint mask (0 or 1) so excluded land drops out.",
        "Weights come from design standards, expert judgment or stakeholder input. A structured method called the **Analytic Hierarchy Process (AHP)** builds weights from pairwise comparisons (\"Is slope more important than soil, and by how much?\"). Because results can shift with the weights, it is good practice to rerun the model with alternative weights and see whether the top sites change."
      ],
      formula: {
        expr: "S = w1·x1 + w2·x2 + … + wn·xn,  with w1 + w2 + … + wn = 1",
        where: [
          "S: suitability score for the cell",
          "xi: standardized score for factor i (for example 1 to 5)",
          "wi: weight for factor i"
        ]
      },
      example: {
        prompt: "A road-corridor study uses slope (weight 0.5), soil stability (0.3) and distance to existing roads (0.2), each scored 1–5. Cell A scores 4, 2, 5. Cell B scores 2, 5, 4. Which cell ranks higher?",
        steps: [
          "Cell A: 0.5(4) + 0.3(2) + 0.2(5) = 2.0 + 0.6 + 1.0 = 3.6",
          "Cell B: 0.5(2) + 0.3(5) + 0.2(4) = 1.0 + 1.5 + 0.8 = 3.3",
          "Neither cell falls under a constraint, so no masking is needed."
        ],
        answer: "Cell A ranks higher (3.6 versus 3.3) because slope carries the largest weight."
      },
      qgis: "Score each raster with Processing Toolbox > Reclassify by table, then combine them in Raster > Raster calculator, for example `0.5 * \"slope_score@1\" + 0.3 * \"soil_score@1\" + 0.2 * \"dist_score@1\"`. Multiply by a 0/1 constraint raster to remove excluded land."
    },
    {
      heading: "Ways to classify models",
      paragraphs: [
        "A **deterministic** model always gives the same output for the same inputs. A **stochastic** model includes random terms to represent variability or uncertainty, so each run differs. Stochastic models are run many times (a **Monte Carlo** simulation) and the results are summarized as a range or a probability, such as the chance that a wildfire reaches a subdivision.",
        "A **static** model describes one moment or a steady state. A **dynamic** model steps through time, and the output of one time step becomes the input to the next. A flood model that updates water depth in every cell every few seconds is dynamic.",
        "A **lumped** model treats a whole area as one unit with averaged parameters, such as one curve number for an entire watershed. A **distributed** model lets parameters vary from cell to cell, which uses more of the detail a GIS holds. Models can also be **empirical** (fitted to observed data) or **physically based** (built from physical laws like conservation of mass)."
      ],
      bullets: [
        "**Cellular automata**: each grid cell changes state according to rules based on its neighbors, as in urban growth or fire spread models.",
        "**Agent-based models**: individual agents (drivers, households, animals) follow behavior rules and interact, as in evacuation or traffic models.",
        "**Regression models**: a statistical equation links an outcome (like landslide occurrence) to spatial predictors (slope, soil, rainfall)."
      ]
    },
    {
      heading: "Process model example: runoff with the curve number method",
      paragraphs: [
        "The **curve number (CN) method**, developed by the USDA Soil Conservation Service (now the NRCS), estimates the depth of direct runoff from a storm's rainfall depth. The curve number runs from about 30 to 100. Higher numbers mean less infiltration and more runoff; pavement is near 98. The CN for a piece of land depends on its land cover, its **hydrologic soil group** (A for sandy, fast-draining soils through D for clayey, slow-draining soils) and how wet the soil was before the storm.",
        "A GIS fits this method well. Overlay a soils layer with a land cover layer, look up a CN for each combination, and either compute runoff cell by cell (distributed) or compute one area-weighted CN for the watershed (lumped). Because the runoff equation is nonlinear, the two approaches can give different totals."
      ],
      formula: {
        expr: "Q = (P − Ia)² / (P − Ia + S)  for P > Ia (otherwise Q = 0);  S = 1000/CN − 10;  Ia = 0.2·S",
        where: [
          "Q: runoff depth (in)",
          "P: rainfall depth (in)",
          "S: potential maximum retention after runoff begins (in)",
          "Ia: initial abstraction, the rain caught by interception, depressions and early infiltration before runoff starts (in)",
          "CN: curve number (dimensionless)"
        ]
      },
      example: {
        prompt: "A 3.0 in storm falls on a residential area with CN = 80. Estimate the runoff depth.",
        steps: [
          "S = 1000/80 − 10 = 12.5 − 10 = 2.5 in",
          "Ia = 0.2 × 2.5 = 0.5 in. Since P = 3.0 in > 0.5 in, runoff occurs.",
          "Q = (3.0 − 0.5)² / (3.0 − 0.5 + 2.5) = 6.25 / 5.0 = 1.25 in"
        ],
        answer: "Q = 1.25 in of runoff (about 42% of the rainfall)"
      },
      qgis: "Intersect the soils and land cover layers (Vector > Geoprocessing Tools > Intersection), join a CN lookup table, then compute S and Q with the Field Calculator."
    },
    {
      heading: "Process model example: soil loss with the USLE",
      paragraphs: [
        "The **Universal Soil Loss Equation (USLE)** estimates long-term average annual soil loss from sheet and rill erosion. It multiplies five factors. In a GIS, each factor is a raster layer and the equation is applied cell by cell with map algebra, which produces a map of where erosion is worst.",
        "Each factor comes from a different source. R comes from rainfall records, K from a soil survey, LS from a DEM, C from land cover, and P from records of conservation practices. C and P are ratios of 1 or less, compared with bare soil farmed up and down the slope. Bare graded soil on a construction site has C close to 1, while mulch, erosion-control blankets or established vegetation lower it sharply.",
        "Know the limits. The USLE predicts an average year, not a single storm. It does not cover gully erosion, and it does not track where eroded soil is deposited. The Revised USLE (RUSLE) keeps the same form with updated ways to find each factor."
      ],
      formula: {
        expr: "A = R × K × LS × C × P",
        where: [
          "A: average annual soil loss (commonly tons/acre/year in US units)",
          "R: rainfall-runoff erosivity factor",
          "K: soil erodibility factor",
          "LS: slope length and steepness factor (from a DEM)",
          "C: cover-management factor (1 or less)",
          "P: support practice factor, such as contouring or terracing (1 or less)"
        ]
      },
      example: {
        prompt: "One cell has R = 100, K = 0.30, LS = 1.5, C = 0.20 and P = 1.0 (US units). Estimate the annual soil loss.",
        steps: [
          "A = 100 × 0.30 × 1.5 × 0.20 × 1.0",
          "100 × 0.30 = 30; 30 × 1.5 = 45; 45 × 0.20 = 9.0; 9.0 × 1.0 = 9.0"
        ],
        answer: "A = 9.0 tons/acre/year"
      },
      qgis: "With all five factor rasters aligned to the same CRS, extent and cell size, use Raster > Raster calculator: `\"R@1\" * \"K@1\" * \"LS@1\" * \"C@1\" * \"P@1\"`."
    },
    {
      heading: "Calibration, validation and sensitivity",
      paragraphs: [
        "**Calibration** is adjusting a model's parameters, within physically reasonable ranges, until its output matches observed data. For a runoff model, that might mean tuning curve numbers until predicted flows match a stream gage. **Validation** then tests the calibrated model against independent observations that were not used in calibration. A common approach is a split sample: calibrate on 2015–2020 records and validate on 2021–2024.",
        "A model that matches its calibration data closely but fails validation is **overfit**. It has learned the noise in one data set rather than the behavior of the system.",
        "**Sensitivity analysis** changes one input or parameter at a time, say by ±10%, and records how much the output changes. It shows which inputs need the best data. In a purely multiplicative model like the USLE, a 10% change in any one factor changes A by exactly 10%. In a nonlinear model like the curve number method, the effect depends on the storm size. Errors in inputs also carry through to the output (**error propagation**), and Monte Carlo runs with perturbed inputs are one way to estimate the resulting uncertainty."
      ],
      bullets: [
        "Calibrate: tune parameters to match observations.",
        "Validate: test against different observations.",
        "Sensitivity: find out which inputs drive the answer.",
        "Report results with their uncertainty, not as a single exact number."
      ]
    },
    {
      heading: "Model-builder workflows",
      paragraphs: [
        "Model-builder tools, such as the QGIS Model Designer and ArcGIS ModelBuilder, let you draw a model as a flowchart. Inputs (layers and parameters) connect to algorithms, which connect to outputs. The saved model runs like any single tool.",
        "A model built this way documents its own steps, which supports the lineage that data-quality standards ask for. It can be rerun when the data are updated, run again with different weights or buffer distances to compare scenarios, and shared with a reviewer who can see every step.",
        "Practical tips: make values you might change (weights, distances, thresholds) into model inputs rather than typing them into tools; give intermediate outputs clear names; test each step before chaining the next; and make sure all rasters share one CRS, extent and cell size before you combine them."
      ],
      qgis: "Open Processing > Model Designer (Ctrl+Alt+G). Drag inputs from the Inputs panel and algorithms from the Toolbox panel onto the canvas, connect them, and save the model as a .model3 file so it appears in the Processing Toolbox."
    }
  ],
  cards: [
    { front: "Spatial model", back: "A simplified representation of a real system in which inputs and outputs are tied to locations, usually built as a chain of GIS operations." },
    { front: "Cartographic model", back: "A model that combines map layers through a sequence of GIS operations to produce a new map, often to answer a \"where\" question such as site suitability." },
    { front: "Process model", back: "A model that simulates how a physical process works over space, such as runoff, erosion or pollutant spread." },
    { front: "Binary model", back: "A model in which each criterion is scored 1 (pass) or 0 (fail) and the layers are combined with AND. It shows suitable versus unsuitable but cannot rank sites." },
    { front: "Index model", back: "A model that scores each criterion on a common scale and combines the scores into one number, so locations can be ranked." },
    { front: "Weighted overlay", back: "An index model that multiplies each standardized factor score by a weight (weights sum to 1) and adds the results for each location." },
    { front: "Constraint (suitability analysis)", back: "A hard rule that excludes land outright, such as wetlands or existing buildings. Applied as a 0/1 mask, not as a weighted factor." },
    { front: "Factor (suitability analysis)", back: "A criterion that makes a location more or less suitable by degree, such as slope or distance to a road. Scored and weighted." },
    { front: "Standardization", back: "Reclassifying factors with different units (degrees, meters, categories) onto one common scale, such as 1 to 5, so they can be combined." },
    { front: "Analytic Hierarchy Process (AHP)", back: "A method for setting weights by comparing criteria two at a time and judging how much more important one is than the other." },
    { front: "Map algebra", back: "Combining raster layers cell by cell with arithmetic, logical and conditional operators, such as multiplying factor rasters in the USLE." },
    { front: "Deterministic model", back: "A model that always produces the same output from the same inputs. The USLE is an example." },
    { front: "Stochastic model", back: "A model with random components, so repeated runs give different results. Results are summarized as ranges or probabilities." },
    { front: "Monte Carlo simulation", back: "Running a model many times with inputs drawn at random from their likely ranges, then summarizing the spread of outputs to estimate uncertainty." },
    { front: "Dynamic model", back: "A model that steps through time, using the output of one time step as the input to the next, such as a flood-routing model." },
    { front: "Lumped model", back: "A model that treats an area as one unit with averaged parameters, such as a single curve number for a whole watershed." },
    { front: "Distributed model", back: "A model whose parameters vary across space, usually cell by cell, so local differences in soil, cover or slope are kept." },
    { front: "Cellular automaton", back: "A grid model in which each cell changes state by rules based on its neighbors' states, used for urban growth and fire spread." },
    { front: "Agent-based model", back: "A model in which individual agents, such as drivers or households, follow behavior rules and interact, used for evacuation and traffic studies." },
    { front: "Curve number (CN)", back: "An NRCS index from about 30 to 100 that sets how much rainfall becomes runoff. It depends on land cover, hydrologic soil group and antecedent moisture." },
    { front: "Hydrologic soil group", back: "NRCS soil classes A to D by infiltration rate. A soils (sandy) drain fastest and give the least runoff; D soils (clayey) drain slowest." },
    { front: "Initial abstraction (Ia)", back: "Rainfall held by interception, surface depressions and early infiltration before runoff begins. The standard CN method uses Ia = 0.2S." },
    { front: "USLE", back: "Universal Soil Loss Equation, A = R × K × LS × C × P. Estimates long-term average annual sheet and rill erosion." },
    { front: "LS factor", back: "The USLE slope length and steepness factor. In a GIS it is derived from a DEM." },
    { front: "C factor", back: "The USLE cover-management factor, 1 or less. Bare soil is near 1; mulch, blankets or vegetation lower it." },
    { front: "Calibration", back: "Adjusting model parameters within reasonable ranges until the model's output matches observed data." },
    { front: "Validation", back: "Testing a calibrated model against independent observations that were not used to calibrate it." },
    { front: "Sensitivity analysis", back: "Changing one input or parameter at a time and measuring the change in output, to find which inputs most affect the result." },
    { front: "Overfitting", back: "Tuning a model so closely to calibration data that it captures noise and predicts poorly on new data." },
    { front: "Model Designer (model builder)", back: "A graphical tool that chains inputs, algorithms and outputs into a saved, reusable workflow. In QGIS it is under Processing > Model Designer." }
  ],
  questions: [
    {
      id: "ch13-q01",
      type: "mc",
      prompt: "Which task is the best example of a cartographic model?",
      choices: [
        "Simulating how a flood wave moves down a channel minute by minute",
        "Combining slope, zoning and floodplain layers to map where a new school could be built",
        "Fitting a regression line between rainfall and measured stream flow at one gage",
        "Measuring the coordinates of survey control points with RTK GNSS"
      ],
      answer: 1,
      explain: "A cartographic model combines existing map layers through GIS operations to answer a \"where\" question. Flood routing is a dynamic process model, not a layer-combination model."
    },
    {
      id: "ch13-q02",
      type: "mc",
      prompt: "In a binary suitability model, a cell meets four of five criteria. What is its result?",
      choices: [
        "0.8, because it meets 80% of the criteria",
        "It depends on the weight of the failed criterion",
        "0, because every criterion must be 1 for the AND to be 1",
        "1, because it meets most of the criteria"
      ],
      answer: 2,
      explain: "Binary layers are combined with AND (multiplication), so one 0 makes the result 0. Fractions and weights belong to index models, not binary models."
    },
    {
      id: "ch13-q03",
      type: "num",
      prompt: "A weighted overlay uses slope (weight 0.40), soil (0.35) and distance to utilities (0.25), each scored 1–5. A cell scores 5 for slope, 3 for soil and 2 for distance. What is its suitability score?",
      answer: 3.55,
      tol: 0.01,
      explain: "S = 0.40(5) + 0.35(3) + 0.25(2) = 2.00 + 1.05 + 0.50 = 3.55."
    },
    {
      id: "ch13-q04",
      type: "mc",
      prompt: "Why must slope (degrees), distance to roads (meters) and soil type (categories) be reclassified to a common scale before a weighted overlay?",
      choices: [
        "Values in different units cannot be added meaningfully until each is scored on one scale",
        "Reclassification projects all three layers into the same coordinate reference system",
        "The raster calculator only accepts integer cell values from 1 to 5 in its expressions",
        "Reclassification masks out cells under a constraint so they do not affect the weights"
      ],
      answer: 0,
      explain: "Standardization puts every factor on one scale so the weights, not the original units, control the result. Reclassifying values does not change a layer's CRS."
    },
    {
      id: "ch13-q05",
      type: "mc",
      prompt: "Wetlands are legally off-limits for a new access road. How should the wetlands layer enter a weighted-overlay model?",
      choices: [
        "As a factor with a small weight, so wetlands score slightly lower",
        "As a factor with the largest weight, so wetlands score lowest",
        "It should be left out, since the designer can avoid wetlands by eye",
        "As a 0/1 constraint mask multiplied with the final score, so wetland cells become 0"
      ],
      answer: 3,
      explain: "A legal exclusion is a constraint. Treating it as a weighted factor, even a heavy one, still lets a wetland cell earn a nonzero score and possibly rank above dry land."
    },
    {
      id: "ch13-q06",
      type: "tf",
      prompt: "In a weighted overlay, the weights are normally chosen to sum to 1 so the final score stays on the same scale as the factor scores.",
      answer: true,
      explain: "If factors are scored 1–5 and the weights sum to 1, the weighted sum also falls between 1 and 5, which keeps results easy to read and compare."
    },
    {
      id: "ch13-q07",
      type: "mc",
      prompt: "Which statement describes a deterministic model?",
      choices: [
        "It always includes a time step",
        "It must be calibrated with field data before use",
        "The same inputs always produce the same output",
        "It is run many times to produce a probability map"
      ],
      answer: 2,
      explain: "Deterministic means no random component, so repeat runs match exactly. Running many times for a probability map describes a stochastic (Monte Carlo) approach."
    },
    {
      id: "ch13-q08",
      type: "mc",
      prompt: "A wildfire model is run 500 times. Each run draws wind speed and direction at random from historical records, and the output is the percent of runs in which fire reaches each cell. What kind of model is this?",
      choices: [
        "Stochastic, because random inputs make each run different",
        "Deterministic, because the same terrain is used every time",
        "Binary, because each cell either burns or does not",
        "Lumped, because one map is produced at the end"
      ],
      answer: 0,
      explain: "Random inputs and many runs summarized as a probability are the marks of a stochastic Monte Carlo model. Fixed terrain does not make it deterministic, because the wind changes between runs."
    },
    {
      id: "ch13-q09",
      type: "mc",
      prompt: "Which of these is a dynamic model?",
      choices: [
        "A map of average annual soil loss computed once with the USLE",
        "A landfill suitability map built from slope, soils and zoning layers",
        "A 30 m buffer drawn around every stream in the county",
        "A flood model that updates each cell's water depth every 10 s from the previous step"
      ],
      answer: 3,
      explain: "A dynamic model steps through time and feeds each step's output into the next. The USLE and suitability maps describe one state and are static."
    },
    {
      id: "ch13-q10",
      type: "tf",
      prompt: "A static model can use only one input layer.",
      answer: false,
      explain: "Static means the model describes a single time, not that it has a single input. A suitability model may combine many layers and still be static."
    },
    {
      id: "ch13-q11",
      type: "mc",
      prompt: "An engineer computes one area-weighted curve number for an entire 2 km² watershed and uses it to predict runoff at the outlet. This approach is:",
      choices: [
        "Distributed",
        "Lumped",
        "Stochastic",
        "Agent-based"
      ],
      answer: 1,
      explain: "A lumped model treats the whole area as one unit with averaged parameters. A distributed model would compute runoff cell by cell with each cell's own CN."
    },
    {
      id: "ch13-q12",
      type: "num",
      prompt: "A 4.0 in storm falls on a watershed with CN = 75. Using the standard curve number method (Ia = 0.2S), what is the runoff depth Q? (in)",
      answer: 1.67,
      tol: 0.02,
      unit: "in",
      explain: "S = 1000/75 − 10 = 3.333 in. Ia = 0.2(3.333) = 0.667 in. Q = (4.0 − 0.667)² / (4.0 − 0.667 + 3.333) = 11.11 / 6.667 = 1.67 in."
    },
    {
      id: "ch13-q13",
      type: "mc",
      prompt: "Which land would have the highest curve number?",
      choices: [
        "Forest on hydrologic soil group A",
        "Pasture on hydrologic soil group B",
        "A paved parking lot",
        "Lawn on hydrologic soil group C"
      ],
      answer: 2,
      explain: "Pavement lets almost no water infiltrate, so its CN is near 98 regardless of the soil beneath. Group A forest is the opposite extreme, with a low CN."
    },
    {
      id: "ch13-q14",
      type: "mc",
      prompt: "A cell has CN = 60, so S = 6.67 in and Ia = 1.33 in. What runoff does the curve number method predict for a 1.0 in storm?",
      choices: [
        "About 0.15 in",
        "About 0.33 in",
        "1.0 in, because all rain becomes runoff on saturated soil",
        "Zero, because the rainfall is less than the initial abstraction"
      ],
      answer: 3,
      explain: "Runoff begins only after rainfall exceeds Ia. Here P = 1.0 in is less than Ia = 1.33 in, so Q = 0."
    },
    {
      id: "ch13-q15",
      type: "num",
      prompt: "A cell has R = 150, K = 0.25, LS = 2.0, C = 0.10 and P = 0.50. Using the USLE, what is the average annual soil loss? (tons/acre/year)",
      answer: 3.75,
      tol: 0.01,
      unit: "tons/acre/year",
      explain: "A = 150 × 0.25 × 2.0 × 0.10 × 0.50 = 37.5 × 2.0 × 0.05 = 3.75 tons/acre/year."
    },
    {
      id: "ch13-q16",
      type: "mc",
      prompt: "Which USLE factor would a GIS analyst normally derive from a digital elevation model?",
      choices: [
        "LS, the slope length and steepness factor",
        "R, the rainfall-runoff erosivity factor",
        "K, the soil erodibility factor",
        "C, the cover-management factor"
      ],
      answer: 0,
      explain: "Slope steepness and flow length both come from terrain, so LS is computed from a DEM. K comes from soil surveys and C from land cover."
    },
    {
      id: "ch13-q17",
      type: "mc",
      prompt: "A contractor covers a bare cut slope with erosion-control blankets. In a USLE model of the site, which factor should the engineer lower?",
      choices: [
        "R",
        "K",
        "C",
        "LS"
      ],
      answer: 2,
      explain: "Blankets change the surface cover, which is what C represents. The soil (K), the rain (R) and the slope shape (LS) are unchanged."
    },
    {
      id: "ch13-q18",
      type: "mc",
      prompt: "A reviewer asks you to use the USLE to predict the sediment that will wash off a site during next spring's single largest storm. What is the best response?",
      choices: [
        "Run the USLE with that storm's rainfall depth substituted for the annual R factor",
        "Explain that the USLE predicts long-term average annual loss, so a single storm needs another method",
        "Run the USLE as usual and divide the annual result by 12 to estimate one month",
        "Set C and P to 1 so the USLE returns the worst case for a single large storm"
      ],
      answer: 1,
      explain: "The USLE was built to predict average annual loss over many years. Swapping in one storm's rainfall for R misuses the factor, and dividing an annual average does not represent one event."
    },
    {
      id: "ch13-q19",
      type: "mc",
      prompt: "What is model calibration?",
      choices: [
        "Testing the finished model against observations that were held back from tuning",
        "Changing one input at a time and recording how much the model output moves",
        "Resampling every input layer to the same cell size, extent and coordinate system",
        "Tuning parameters within reasonable ranges until output matches observations"
      ],
      answer: 3,
      explain: "Calibration tunes parameters to fit observed data. Testing against unseen data is validation, and changing one input at a time is sensitivity analysis."
    },
    {
      id: "ch13-q20",
      type: "mc",
      prompt: "You calibrated a runoff model so it matches stream gage flows from 2015–2020. Which step best validates it?",
      choices: [
        "Compare its predictions with 2021–2024 gage flows not used in calibration",
        "Compare its predictions again with the 2015–2020 gage flows used to tune it",
        "Add parameters until the model reproduces the 2015–2020 gage flows exactly",
        "Have a second analyst rerun the model with the same inputs and compare outputs"
      ],
      answer: 0,
      explain: "Validation needs independent data. Re-checking the calibration period only shows that the tuning worked, and adding parameters to force a perfect fit invites overfitting."
    },
    {
      id: "ch13-q21",
      type: "tf",
      prompt: "If a model matches its calibration data very closely, it is guaranteed to predict well for new conditions.",
      answer: false,
      explain: "A close fit can come from overfitting to noise in the calibration data. Only validation against independent data shows how well the model predicts."
    },
    {
      id: "ch13-q22",
      type: "mc",
      prompt: "What is the main purpose of a sensitivity analysis?",
      choices: [
        "To prove that the model has no errors",
        "To find which inputs or parameters change the output the most",
        "To pick the best location in a suitability map",
        "To convert a deterministic model into a stochastic one"
      ],
      answer: 1,
      explain: "Sensitivity analysis shows where better data would most improve the result. It does not prove a model correct."
    },
    {
      id: "ch13-q23",
      type: "mc",
      prompt: "In a USLE model, new soil sampling raises the K value of one cell by 20% while R, LS, C and P stay the same. How does the predicted soil loss for that cell change?",
      choices: [
        "It rises by 4%",
        "It rises by 20%",
        "It rises by 44%",
        "It does not change, because K is a soil property and not a rainfall property"
      ],
      answer: 1,
      explain: "The USLE is a pure product, so A changes in direct proportion to any single factor: 1.20 × A. A 44% rise would need two factors each raised by 20%."
    },
    {
      id: "ch13-q24",
      type: "tf",
      prompt: "Because the curve number runoff equation is nonlinear, averaging the curve numbers of two very different areas and then computing runoff can give a different total than computing runoff for each area and then averaging.",
      answer: true,
      explain: "For a 2 in storm, half CN 60 and half CN 100 give average runoff of about 1.03 in when computed separately, but the average CN of 80 gives only about 0.56 in."
    },
    {
      id: "ch13-q25",
      type: "mc",
      prompt: "You are building a suitability model for a stormwater detention basin in the QGIS Model Designer. The weights may change after a public meeting. What is the best way to handle them?",
      choices: [
        "Type the weights directly into the raster calculator expression and rebuild the model if they change",
        "Leave the weights out and let the reviewer apply them by hand",
        "Make each weight a model input parameter so the model can be rerun with new values",
        "Use a binary model instead so no weights are needed"
      ],
      answer: 2,
      explain: "Exposing values that may change as inputs lets you rerun scenarios without editing the model. Switching to a binary model would discard the ranking the project needs."
    },
    {
      id: "ch13-q26",
      type: "mc",
      prompt: "Before multiplying slope, soil and land-cover rasters in a weighted overlay, which check matters most?",
      choices: [
        "That all rasters share the same CRS, extent and cell size",
        "That all rasters use the same color ramp",
        "That all rasters were created on the same date",
        "That all rasters are stored in the same folder"
      ],
      answer: 0,
      explain: "Map algebra combines cells by position. If CRS, extent or cell size differ, cells will not line up, and the result will mix values from different places. Colors and folders do not affect the math."
    },
    {
      id: "ch13-q27",
      type: "mc",
      prompt: "An urban growth model turns a rural cell into an urban cell when at least three of its eight neighbors are already urban. What type of model is this?",
      choices: [
        "Agent-based model",
        "Regression model",
        "Binary suitability model",
        "Cellular automaton"
      ],
      answer: 3,
      explain: "Grid cells changing state according to rules about their neighbors is the definition of a cellular automaton. An agent-based model would track individual decision makers instead."
    },
    {
      id: "ch13-q28",
      type: "mc",
      prompt: "A city wants to test how traffic would clear a stadium if each driver picks a route based on congestion they see. Which model type fits best?",
      choices: [
        "Weighted overlay",
        "Agent-based model",
        "USLE",
        "Lumped curve number model"
      ],
      answer: 1,
      explain: "Individual drivers making decisions and interacting are agents, so an agent-based model fits. A weighted overlay ranks locations but has no moving individuals or time steps."
    }
  ]
});
