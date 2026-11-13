GIS.chapter({
  id: "ch14",
  num: 14,
  title: "Data Standards and Data Quality",
  blurb: "How to describe, measure and report the quality of spatial data, from RMSE and NSSDA accuracy statements to error matrices and metadata, so you can decide whether a data set is fit for an engineering job.",
  objectives: [
    "Name and give an example of each element of spatial data quality: positional accuracy, attribute accuracy, logical consistency, completeness and lineage.",
    "Distinguish accuracy from precision, and random error from bias.",
    "Compute RMSE from checkpoint differences and convert it to an NSSDA accuracy at the 95% confidence level.",
    "Describe how the ASPRS positional accuracy standards changed in Edition 2 (2023).",
    "Compute overall, producer's and user's accuracy from an error matrix and explain what each one tells a map user.",
    "Explain what metadata records and identify the FGDC and ISO metadata standards.",
    "Explain how map scale and generalization limit the uses a data set can support."
  ],
  guide: [
    {
      heading: "Why data standards matter",
      paragraphs: [
        "A **standard** is an agreed set of rules for how data are defined, stored, tested or described. Standards let data made by one group be used correctly by another. Without them, every county, agency and consultant would label fields differently, use different accuracy tests and describe their data in different ways.",
        "GIS uses several kinds of standards. **Content standards** define what a data set must contain, such as the fields in a parcel layer. **Format and transfer standards** define how data are stored and exchanged; GeoPackage and the web services of the Open Geospatial Consortium (OGC) are examples. **Accuracy standards** define how to test and report positional accuracy. **Metadata standards** define how to document a data set.",
        "Data quality is judged by **fitness for use**: whether the data are good enough for a particular purpose. A statewide road layer can be excellent for regional travel-time analysis and still be unfit for designing a curb ramp. Quality reports exist so users can make that call."
      ]
    },
    {
      heading: "Elements of data quality",
      paragraphs: [
        "Spatial data quality is usually described with a handful of elements. US federal metadata and later ISO standards both use versions of this list, so you will see these terms in metadata records and project specifications.",
        "Errors enter at every stage: the original survey or image, digitizing, georeferencing, projection, data entry, and processing. Quality elements help you find out which stage caused a problem."
      ],
      bullets: [
        "**Positional accuracy**: how close coordinates are to true ground positions, tested separately for horizontal and vertical.",
        "**Attribute accuracy**: how often attribute values are correct, such as pipe material, land cover class or road surface type.",
        "**Logical consistency**: whether the data obey their own rules, such as polygons that close, no overlapping parcels, lines that connect at nodes, and values that fall within allowed ranges.",
        "**Completeness**: whether every feature that should be included is there, and nothing extra is, according to the stated rules (for example, a minimum mapping unit).",
        "**Lineage**: the history of the data, including sources, dates, methods and every processing step.",
        "**Temporal accuracy (currency)**: whether the data describe the time they claim to and are recent enough for the task."
      ]
    },
    {
      heading: "Accuracy, precision and bias",
      paragraphs: [
        "**Accuracy** is how close a measured value is to the true value. **Precision** has two meanings. It can mean how tightly repeated measurements cluster together, or it can mean how finely a value is recorded (the number of decimal places). Neither meaning guarantees accuracy. A GNSS receiver can give readings that cluster within 2 cm but sit 1 m away from the true point, and a coordinate stored to the millimeter can still be meters off.",
        "Errors come in three kinds. **Random errors** scatter in both directions and tend to average out. **Systematic errors**, or **bias**, push results the same way every time, such as a wrong datum or an uncalibrated instrument. **Blunders** are mistakes, like swapped X and Y values or a typo in an elevation. Random error is reduced by more measurements; bias must be found and corrected; blunders must be caught and removed.",
        "A quick check for bias is the **mean error**. If the average difference between data and checkpoints is close to zero, errors are mostly random. If the mean error is about as large as the RMSE, a systematic shift dominates."
      ]
    },
    {
      heading: "Measuring positional accuracy with RMSE",
      paragraphs: [
        "Positional accuracy is tested at **checkpoints**: points whose coordinates are known from a more accurate, independent source. For each checkpoint, subtract the true coordinate from the data coordinate. The **root mean square error (RMSE)** summarizes these differences. Squaring keeps positive and negative errors from canceling, and it gives large errors more influence.",
        "For horizontal accuracy, compute RMSE separately for x and y, then combine them into the radial (horizontal) RMSE, written RMSE_r. Vertical accuracy uses the same method with elevation differences, giving RMSE_z."
      ],
      formula: {
        expr: "RMSE_x = √( Σ(x_data,i − x_check,i)² / n );  RMSE_r = √( RMSE_x² + RMSE_y² )",
        where: [
          "x_data,i: x coordinate of point i in the data set being tested",
          "x_check,i: x coordinate of the same point from the more accurate source",
          "n: number of checkpoints",
          "RMSE_y and RMSE_z are computed the same way from y and z differences"
        ]
      },
      example: {
        prompt: "A drone orthophoto is checked at five points (a real test needs at least 20; five keeps the arithmetic short). The differences, data minus checkpoint, in meters are dx = 0.12, −0.08, 0.05, −0.10, 0.06 and dy = −0.04, 0.09, −0.11, 0.03, 0.08. Find RMSE_x, RMSE_y and RMSE_r.",
        steps: [
          "Σdx² = 0.0144 + 0.0064 + 0.0025 + 0.0100 + 0.0036 = 0.0369 m²",
          "RMSE_x = √(0.0369 / 5) = √0.00738 = 0.086 m",
          "Σdy² = 0.0016 + 0.0081 + 0.0121 + 0.0009 + 0.0064 = 0.0291 m²",
          "RMSE_y = √(0.0291 / 5) = √0.00582 = 0.076 m",
          "RMSE_r = √(0.00738 + 0.00582) = √0.0132 = 0.115 m",
          "Mean dx = 0.010 m and mean dy = 0.010 m, both small, so there is no sign of a systematic shift."
        ],
        answer: "RMSE_x ≈ 0.086 m, RMSE_y ≈ 0.076 m, RMSE_r ≈ 0.115 m"
      },
      qgis: "In the checkpoint layer, use the Field Calculator to add a field of squared differences, for example `(\"x_data\" - \"x_check\")^2`. Vector > Analysis Tools > Basic Statistics for Fields then reports its mean; the square root of that mean is RMSE_x."
    },
    {
      heading: "The NSSDA: reporting accuracy at 95% confidence",
      paragraphs: [
        "The **National Standard for Spatial Data Accuracy (NSSDA)**, published by the Federal Geographic Data Committee (FGDC) in 1998, sets a common way to test and report positional accuracy for digital data. It replaced reporting based on map scale or contour interval with a ground-distance value at the **95% confidence level**: the distance within which 95% of well-defined points are expected to fall.",
        "The test uses at least **20 checkpoints** from an **independent source of higher accuracy**, such as a GNSS or total-station survey that was not used to make the data. The points should be **well-defined points**, features you can find exactly on the ground and in the data, like right-angle road intersections or curb corners. They should be spread across the area; the standard suggests at least 20% of points in each quadrant.",
        "The NSSDA does not set pass/fail limits. It tells producers how to measure and report accuracy, and users or contracts decide what accuracy is acceptable. Results are reported as, for example, \"Tested 0.20 meters horizontal accuracy at 95% confidence level.\""
      ],
      formula: {
        expr: "Accuracy_r = 1.7308 × RMSE_r  (when RMSE_x = RMSE_y);  Accuracy_z = 1.9600 × RMSE_z",
        where: [
          "Accuracy_r: horizontal accuracy at 95% confidence",
          "Accuracy_z: vertical accuracy at 95% confidence",
          "If RMSE_x and RMSE_y differ but RMSE_min/RMSE_max is between 0.6 and 1.0, use Accuracy_r ≈ 2.4477 × 0.5 × (RMSE_x + RMSE_y)",
          "The factors assume errors are normally distributed and independent in x and y"
        ]
      },
      example: {
        prompt: "Use the drone results from the previous section (RMSE_x = 0.086 m, RMSE_y = 0.076 m) to write an NSSDA horizontal accuracy statement.",
        steps: [
          "Check the ratio: 0.076 / 0.086 = 0.89, which is between 0.6 and 1.0, so the approximation applies.",
          "Accuracy_r ≈ 2.4477 × 0.5 × (0.086 + 0.076) = 2.4477 × 0.081 = 0.198 m",
          "For comparison, 1.7308 × RMSE_r = 1.7308 × 0.115 = 0.199 m, nearly the same.",
          "Round for reporting."
        ],
        answer: "\"Tested 0.20 meters horizontal accuracy at 95% confidence level\" (with at least 20 checkpoints in a real test)"
      },
      bullets: [
        "Older maps used the **National Map Accuracy Standards (NMAS, 1947)**: 90% of well-defined points within 1/30 inch at map scale for scales larger than 1:20,000, or 1/50 inch for 1:20,000 and smaller. For a 1:24,000 quad, 1/50 inch is 40 ft on the ground.",
        "NMAS vertical: 90% of tested elevations within one-half the contour interval."
      ]
    },
    {
      heading: "ASPRS positional accuracy standards",
      paragraphs: [
        "The American Society for Photogrammetry and Remote Sensing (ASPRS) publishes the **Positional Accuracy Standards for Digital Geospatial Data**, which are widely used in contracts for orthoimagery, lidar and drone mapping. Edition 1 (2014) defined accuracy classes by RMSE rather than by map scale, and it also reported values at 95% confidence. For lidar it separated non-vegetated vertical accuracy (NVA) from vegetated vertical accuracy (VVA).",
        "Edition 2, approved in 2023 and updated since, made several changes. Accuracy is now stated as RMSE only, and the separate x and y components are combined into one horizontal value, RMSE_H, which is computed the same way as the NSSDA's RMSE_r. When you read a project specification, check which edition it cites, because a 95% value and an RMSE value for the same data differ by a factor of about 1.7 to 2."
      ],
      bullets: [
        "Dropped the 95% confidence level as an accuracy measure; RMSE is reported instead.",
        "Combined RMSE_x and RMSE_y into RMSE_H; vertical is written RMSE_V.",
        "Raised the minimum number of checkpoints for product accuracy assessment from 20 to 30, and capped large projects at 120.",
        "Relaxed how much more accurate ground control and checkpoints must be than the product being tested.",
        "Requires the checkpoint survey's own error to be included when computing product accuracy.",
        "Removed pass/fail for VVA in lidar; VVA is reported, while NVA must still be met.",
        "Added a three-dimensional positional accuracy term."
      ]
    },
    {
      heading: "Attribute accuracy and the error matrix",
      paragraphs: [
        "For categories like land cover or soil type, accuracy is checked by visiting sample points (or using better imagery) and comparing the mapped class with the true **reference** class. The results go in an **error matrix**, also called a **confusion matrix**. In this chapter, rows are the map classes and columns are the reference classes. Some software flips this, so always check the labels.",
        "**Overall accuracy** is the number of correct points (the diagonal) divided by the total. **Producer's accuracy** for a class is the correct count divided by the reference total for that class (the column total). It tells the map maker how much of the real class was captured; its complement is **omission error**. **User's accuracy** is the correct count divided by the map total for that class (the row total). It tells a map user how often a pixel labeled with that class really is that class; its complement is **commission error**.",
        "Overall accuracy can hide a poorly mapped rare class, so report the full matrix and the per-class accuracies. Stratified random sampling makes sure rare classes get enough sample points. The **kappa** statistic, which compares observed agreement with agreement expected by chance, often appears in older reports, though many analysts now prefer to report the matrix and class accuracies directly."
      ],
      formula: {
        expr: "Overall = Σ diagonal / N;  Producer's(k) = n_kk / column total_k;  User's(k) = n_kk / row total_k",
        where: [
          "n_kk: count of points mapped as class k that really are class k",
          "N: total number of sample points",
          "Omission error = 1 − producer's accuracy; commission error = 1 − user's accuracy"
        ]
      },
      example: {
        prompt: "200 sample points were checked. Rows are map classes, columns are reference classes (Water, Forest, Urban). Map Water: 45, 3, 2. Map Forest: 5, 60, 10. Map Urban: 0, 7, 68. Find the overall accuracy and the producer's and user's accuracy for Forest.",
        steps: [
          "Diagonal = 45 + 60 + 68 = 173; overall = 173 / 200 = 0.865 = 86.5%",
          "Reference Forest (column) total = 3 + 60 + 7 = 70; producer's = 60 / 70 = 85.7% (omission error 14.3%)",
          "Map Forest (row) total = 5 + 60 + 10 = 75; user's = 60 / 75 = 80.0% (commission error 20.0%)"
        ],
        answer: "Overall 86.5%; Forest producer's accuracy 85.7%; Forest user's accuracy 80.0%"
      }
    },
    {
      heading: "Metadata standards",
      paragraphs: [
        "**Metadata** is data about data: who made a data set, when, how, at what accuracy, in what coordinate system, what each field means, and how to get it. Good metadata is how a user judges fitness for use, and it is where lineage and accuracy reports are recorded.",
        "In the US, the FGDC **Content Standard for Digital Geospatial Metadata (CSDGM)**, FGDC-STD-001-1998, was the long-standing standard. Its seven main sections are Identification, Data Quality, Spatial Data Organization, Spatial Reference, Entity and Attribute, Distribution, and Metadata Reference information.",
        "The international standard is **ISO 19115** (Geographic information – Metadata), first published in 2003 and revised as ISO 19115-1 in 2014. ISO 19115-2 adds elements for imagery and gridded data, and separate ISO documents (ISO 19139 and ISO 19115-3) define how the metadata is written in XML. The FGDC endorsed ISO 19115 in 2010, and federal agencies have been moving toward the ISO family. Data quality concepts are covered in a companion standard, ISO 19157."
      ],
      qgis: "Open Layer Properties > Metadata to create or edit a layer's metadata, including its identification, keywords, extent, contacts and history."
    },
    {
      heading: "Scale, generalization and error propagation",
      paragraphs: [
        "Digital data keep the accuracy of their source, even when you zoom in. A line drawn 0.5 mm wide on a paper map covers a strip of ground whose width equals 0.5 mm times the scale denominator, so features digitized from small-scale maps carry large positional uncertainty. Zooming in on screen does not add accuracy.",
        "**Generalization** is the simplification cartographers apply as scale gets smaller: selecting which features to show, simplifying and smoothing lines, aggregating small areas, and displacing features so they do not overlap. A **minimum mapping unit** sets the smallest area that will be mapped as its own polygon. Generalized data are fine for regional studies but not for site design.",
        "When layers from different scales or sources are overlaid, their errors combine. Boundaries that should match do not, which creates thin **sliver polygons**. If errors from separate steps are independent, they combine as the square root of the sum of squares."
      ],
      formula: {
        expr: "E_total = √( E1² + E2² + … + En² )",
        where: [
          "E1 … En: independent error components (for example, georeferencing RMSE and digitizing RMSE)",
          "E_total: expected combined error"
        ]
      },
      example: {
        prompt: "A stream line is drawn 0.5 mm wide on a 1:24,000 map. How wide is that line on the ground?",
        steps: [
          "Ground width = map width × scale denominator",
          "0.5 mm × 24,000 = 12,000 mm",
          "12,000 mm = 12 m"
        ],
        answer: "12 m, so the line's own width hides about 12 m of positional uncertainty"
      }
    }
  ],
  cards: [
    { front: "Fitness for use", back: "The idea that data quality is judged by whether a data set is good enough for a specific purpose, not by a single universal grade." },
    { front: "Positional accuracy", back: "How close the coordinates in a data set are to true ground positions. Tested separately for horizontal and vertical." },
    { front: "Attribute accuracy", back: "How often the attribute values (class, material, name) are correct, often measured with an error matrix for categories." },
    { front: "Logical consistency", back: "Whether the data obey their own rules: closed polygons, no forbidden overlaps or gaps, connected networks, values within allowed ranges." },
    { front: "Completeness", back: "Whether all features that should be in a data set are included, and no extra ones, according to the stated selection rules." },
    { front: "Lineage", back: "The history of a data set: its sources, dates, collection methods and every processing step applied." },
    { front: "Temporal accuracy (currency)", back: "Whether data describe the stated time correctly and are recent enough for the intended use." },
    { front: "Accuracy", back: "How close a measurement or coordinate is to its true value." },
    { front: "Precision", back: "How tightly repeated measurements cluster, or how finely a value is recorded. High precision does not guarantee accuracy." },
    { front: "Bias (systematic error)", back: "Error that pushes results the same direction every time, such as a datum mismatch. Shows up as a mean error far from zero." },
    { front: "Blunder", back: "A gross mistake, such as swapped coordinates or a typo. Must be found and removed rather than averaged in." },
    { front: "RMSE", back: "Root mean square error: square each difference from the true value, average them, take the square root. Summarizes error size." },
    { front: "RMSE_r", back: "Radial (horizontal) RMSE, √(RMSE_x² + RMSE_y²). ASPRS Edition 2 calls the same quantity RMSE_H." },
    { front: "Checkpoint", back: "A point with coordinates from an independent, more accurate source, used to test a data set. Not used to make the data." },
    { front: "Well-defined point", back: "A point that can be found exactly both on the ground and in the data, such as a right-angle road intersection or curb corner." },
    { front: "Independent source of higher accuracy", back: "Reference data, often a GNSS or total-station survey, that is more accurate than the tested data and was not used to produce it." },
    { front: "NSSDA", back: "National Standard for Spatial Data Accuracy (FGDC, 1998). Tests with at least 20 checkpoints and reports accuracy at 95% confidence in ground units." },
    { front: "NSSDA horizontal factor", back: "Accuracy_r = 1.7308 × RMSE_r when RMSE_x = RMSE_y (equivalently 2.4477 × RMSE_x). Gives the 95% confidence radius." },
    { front: "NSSDA vertical factor", back: "Accuracy_z = 1.9600 × RMSE_z, assuming normally distributed vertical errors." },
    { front: "NMAS", back: "National Map Accuracy Standards (1947): 90% of well-defined points within 1/30 in (scales > 1:20,000) or 1/50 in (1:20,000 or smaller) at map scale." },
    { front: "ASPRS Edition 2 (2023)", back: "ASPRS positional accuracy standard update: reports RMSE only (no 95% value), uses RMSE_H and RMSE_V, and requires at least 30 checkpoints." },
    { front: "Error (confusion) matrix", back: "A table comparing mapped classes with reference classes at sample points. The diagonal holds the correct points." },
    { front: "Overall accuracy", back: "Correct sample points (the diagonal sum) divided by all sample points." },
    { front: "Producer's accuracy", back: "Correct points for a class ÷ reference total for that class. Shows how much of the real class the map captured; 1 − it = omission error." },
    { front: "User's accuracy", back: "Correct points for a class ÷ map total for that class. Shows how often a map label is right on the ground; 1 − it = commission error." },
    { front: "Omission error", back: "Leaving real features of a class out of that class on the map (a forest point mapped as urban is an omission for forest)." },
    { front: "Commission error", back: "Putting features into a class they do not belong to (a forest point mapped as urban is a commission for urban)." },
    { front: "Metadata", back: "Data about data: source, date, methods, accuracy, coordinate system, field definitions, contacts and access terms." },
    { front: "FGDC CSDGM", back: "Content Standard for Digital Geospatial Metadata (FGDC-STD-001-1998), the long-standing US metadata standard, with seven main sections." },
    { front: "ISO 19115", back: "The international geographic metadata standard (Part 1 fundamentals, Part 2 imagery and gridded data), endorsed by the FGDC in 2010." }
  ],
  questions: [
    {
      id: "ch14-q01",
      type: "mc",
      prompt: "A metadata record lists the source aerial photos, the date flown, the software used for orthorectification and each later editing step. Which data quality element does this describe?",
      choices: [
        "Completeness",
        "Logical consistency",
        "Lineage",
        "Attribute accuracy"
      ],
      answer: 2,
      explain: "Lineage is the history of a data set: sources, methods and processing steps. Completeness is about whether all the features are present."
    },
    {
      id: "ch14-q02",
      type: "mc",
      prompt: "A county parcel layer has some parcels that overlap their neighbors, which the parcel rules do not allow. Which quality element is violated?",
      choices: [
        "Logical consistency",
        "Lineage",
        "Temporal accuracy",
        "Completeness"
      ],
      answer: 0,
      explain: "Logical consistency checks whether data follow their own rules, including topology rules like no overlapping parcels. The parcels exist, so completeness is not the issue."
    },
    {
      id: "ch14-q03",
      type: "mc",
      prompt: "A road layer's specification says it includes every public road, but a check finds that roads shorter than 100 m were left out. Which quality element is affected?",
      choices: [
        "Positional accuracy",
        "Completeness",
        "Lineage",
        "Attribute accuracy"
      ],
      answer: 1,
      explain: "Features that should be present are missing, which is a completeness problem. The roads that are present may still be well located."
    },
    {
      id: "ch14-q04",
      type: "mc",
      prompt: "Field crews find that 12 of 50 sampled water-main segments list the wrong pipe material, although every segment is in the right place. Which quality element is affected?",
      choices: [
        "Positional accuracy",
        "Logical consistency",
        "Completeness",
        "Attribute accuracy"
      ],
      answer: 3,
      explain: "The locations are right but the descriptive values are wrong, so attribute accuracy is the problem."
    },
    {
      id: "ch14-q05",
      type: "mc",
      prompt: "Ten GNSS readings at one survey monument all fall within 2 cm of each other, but their average is 0.8 m from the published coordinate. How should these readings be described?",
      choices: [
        "Accurate but not precise",
        "Precise but not accurate",
        "Both accurate and precise",
        "Neither accurate nor precise"
      ],
      answer: 1,
      explain: "Tight clustering means high precision; being 0.8 m off the true value means low accuracy. This pattern points to a systematic error such as a setup or datum problem."
    },
    {
      id: "ch14-q06",
      type: "tf",
      prompt: "Storing coordinates with more decimal places makes them more accurate.",
      answer: false,
      explain: "Extra decimal places increase recorded precision only. A coordinate stored to the millimeter can still be meters away from the true position."
    },
    {
      id: "ch14-q07",
      type: "mc",
      prompt: "Checkpoints on a georeferenced map show a mean x error of +0.38 m and an RMSE_x of 0.40 m, while the mean y error is 0.01 m and RMSE_y is 0.05 m. What does this suggest?",
      choices: [
        "Errors are mostly random, so adding checkpoints will shrink RMSE_x",
        "The y coordinates carry the bias, while the x coordinates are unbiased",
        "A systematic shift in x dominates and should be found and corrected",
        "The data pass the NSSDA test because both mean errors are positive"
      ],
      answer: 2,
      explain: "When the mean error is nearly as large as the RMSE, most of the error is a consistent offset (bias), not random scatter. Adding checkpoints does not remove bias."
    },
    {
      id: "ch14-q08",
      type: "mc",
      prompt: "Why are differences squared when computing RMSE?",
      choices: [
        "It stops positive and negative errors from canceling and stresses large errors",
        "It converts errors from meters to square meters for use in area accuracy reports",
        "It removes the effect of systematic errors so that only random scatter is left",
        "It puts the errors in the form the NSSDA needs before multiplying by 1.7308"
      ],
      answer: 0,
      explain: "Without squaring, errors of +0.5 and −0.5 would average to zero. The square root at the end returns the result to the original units."
    },
    {
      id: "ch14-q09",
      type: "num",
      prompt: "A lidar surface is checked at five points (for practice only; a real test needs more). The elevation differences, data minus survey, are +0.06, −0.04, +0.10, −0.08 and +0.02 m. What is RMSE_z? (m)",
      answer: 0.066,
      tol: 0.001,
      unit: "m",
      explain: "Σdz² = 0.0036 + 0.0016 + 0.0100 + 0.0064 + 0.0004 = 0.0220. RMSE_z = √(0.0220 / 5) = √0.0044 = 0.066 m."
    },
    {
      id: "ch14-q10",
      type: "num",
      prompt: "A drone orthophoto test gives RMSE_x = RMSE_y = 0.05 m. What is the NSSDA horizontal accuracy at 95% confidence? (m)",
      answer: 0.122,
      tol: 0.002,
      unit: "m",
      explain: "RMSE_r = √(0.05² + 0.05²) = 0.0707 m. Accuracy_r = 1.7308 × 0.0707 = 0.122 m. Equivalently, 2.4477 × 0.05 = 0.122 m."
    },
    {
      id: "ch14-q11",
      type: "num",
      prompt: "A DEM test against 25 surveyed checkpoints gives RMSE_z = 0.15 m. What vertical accuracy at 95% confidence should be reported under the NSSDA? (m)",
      answer: 0.294,
      tol: 0.002,
      unit: "m",
      explain: "Accuracy_z = 1.9600 × RMSE_z = 1.96 × 0.15 = 0.294 m."
    },
    {
      id: "ch14-q12",
      type: "mc",
      prompt: "What is the minimum number of checkpoints the NSSDA calls for in a positional accuracy test?",
      choices: [
        "10",
        "15",
        "30",
        "20"
      ],
      answer: 3,
      explain: "The NSSDA requires at least 20 checkpoints. Thirty is the minimum in the ASPRS Edition 2 standard, not the NSSDA."
    },
    {
      id: "ch14-q13",
      type: "mc",
      prompt: "A consultant is testing the horizontal accuracy of a drone orthophoto of a highway interchange. Which set of points can serve as the independent source of higher accuracy?",
      choices: [
        "RTK GNSS coordinates of the ground control points used to process the images",
        "Road-corner points picked from a free statewide orthophoto with 1 m pixels",
        "RTK GNSS coordinates of separate targets that were left out of processing",
        "Road-corner points picked from the drone orthophoto itself after processing"
      ],
      answer: 2,
      explain: "Checkpoints must be more accurate than the product and independent of how it was made. Control points used in processing were fit by the solution, so they make the product look better than it is."
    },
    {
      id: "ch14-q14",
      type: "mc",
      prompt: "Which feature makes the best well-defined point for testing a 1:1,200-scale engineering base map?",
      choices: [
        "The center of a large irregular pond",
        "The intersection of two sidewalk curb lines",
        "The edge of a wetland on the aerial photo",
        "The middle of a mixed forest stand"
      ],
      answer: 1,
      explain: "A well-defined point can be located exactly both on the ground and on the map. Pond centers, wetland edges and stand centers are vague and would add interpretation error to the test."
    },
    {
      id: "ch14-q15",
      type: "tf",
      prompt: "The NSSDA sets pass/fail accuracy thresholds that every data set must meet.",
      answer: false,
      explain: "The NSSDA defines how to test and report accuracy, not what accuracy is acceptable. Thresholds come from product specifications, contracts or users."
    },
    {
      id: "ch14-q16",
      type: "mc",
      prompt: "The NSSDA horizontal factor 1.7308 × RMSE_r assumes which of the following?",
      choices: [
        "Normal errors, independent in x and y, with RMSE_x equal to RMSE_y",
        "Errors all point in the same direction across the map",
        "The data were digitized from a paper map at 1:24,000 scale",
        "At least 30 checkpoints were measured with RTK GNSS"
      ],
      answer: 0,
      explain: "The factor comes from a circular normal error distribution with equal x and y errors. When RMSE_x and RMSE_y differ, the NSSDA gives a separate approximation for ratios from 0.6 to 1.0; for more unequal errors neither shortcut applies."
    },
    {
      id: "ch14-q17",
      type: "mc",
      prompt: "Under the 1947 National Map Accuracy Standards, a 1:24,000 topographic quad meets the horizontal standard if 90% of well-defined points fall within what ground distance?",
      choices: [
        "80 ft",
        "66.7 ft",
        "40 ft",
        "20 ft"
      ],
      answer: 2,
      explain: "For scales of 1:20,000 or smaller the tolerance is 1/50 inch at map scale: 24,000 / 50 = 480 in = 40 ft. The 1/30 inch rule (24,000 / 30 = 800 in = 66.7 ft here) applies only to scales larger than 1:20,000."
    },
    {
      id: "ch14-q18",
      type: "mc",
      prompt: "Which change did Edition 2 (2023) of the ASPRS Positional Accuracy Standards make?",
      choices: [
        "It replaced RMSE with the 95% confidence level as the accuracy measure",
        "It dropped the 95% confidence level and reports accuracy as RMSE",
        "It reduced the minimum number of checkpoints from 30 to 20",
        "It made vegetated vertical accuracy a strict pass/fail test"
      ],
      answer: 1,
      explain: "Edition 2 removed the 95% confidence level and states accuracy as RMSE (RMSE_H and RMSE_V). It also raised the checkpoint minimum to 30 and removed pass/fail for VVA."
    },
    {
      id: "ch14-q19",
      type: "tf",
      prompt: "ASPRS Edition 2 increased the minimum number of checkpoints for product accuracy assessment from 20 to 30.",
      answer: true,
      explain: "Edition 2 raised the minimum from 20 to 30 and capped large projects at 120 checkpoints."
    },
    {
      id: "ch14-q20",
      type: "num",
      prompt: "An impervious-surface map was checked at 100 random points. Rows are map classes; columns are reference classes. Map Impervious: 38 truly impervious, 7 truly pervious. Map Pervious: 2 truly impervious, 53 truly pervious. What is the overall accuracy? (%)",
      answer: 91,
      tol: 0.1,
      unit: "%",
      explain: "Correct points are on the diagonal: 38 + 53 = 91. Overall accuracy = 91 / 100 = 91%."
    },
    {
      id: "ch14-q21",
      type: "num",
      prompt: "Using the same impervious-surface matrix (Map Impervious: 38 truly impervious, 7 truly pervious; Map Pervious: 2 truly impervious, 53 truly pervious), what is the producer's accuracy for Impervious? (%)",
      answer: 95,
      tol: 0.1,
      unit: "%",
      explain: "Reference impervious total (column) = 38 + 2 = 40. Producer's accuracy = 38 / 40 = 95%."
    },
    {
      id: "ch14-q22",
      type: "num",
      prompt: "Using the same matrix (Map Impervious: 38 truly impervious, 7 truly pervious; Map Pervious: 2 truly impervious, 53 truly pervious), what is the user's accuracy for Impervious? (%)",
      answer: 84.4,
      tol: 0.1,
      unit: "%",
      explain: "Map impervious total (row) = 38 + 7 = 45. User's accuracy = 38 / 45 = 84.4%. The map captures most real pavement (95%) but labels some lawn and soil as impervious."
    },
    {
      id: "ch14-q23",
      type: "mc",
      prompt: "A city uses a classified impervious-surface map to set stormwater fees. A property owner asks: \"When the map says my lot is impervious, how likely is that to be true?\" Which measure answers this?",
      choices: [
        "Overall accuracy",
        "Producer's accuracy for impervious",
        "Omission error for pervious",
        "User's accuracy for impervious"
      ],
      answer: 3,
      explain: "User's accuracy is the share of points mapped as a class that really are that class, which is what someone reading the map needs. Producer's accuracy answers how much real impervious surface the map found."
    },
    {
      id: "ch14-q24",
      type: "mc",
      prompt: "A sample point that is truly forest is mapped as urban. How is this error counted?",
      choices: [
        "Omission error for forest and commission error for urban",
        "Commission error for forest and omission error for urban",
        "Omission error for both classes",
        "It is not counted, because it is off the diagonal"
      ],
      answer: 0,
      explain: "Forest lost a point it should have had (omission), and urban gained a point it should not have (commission). Every off-diagonal cell is both kinds of error at once."
    },
    {
      id: "ch14-q25",
      type: "tf",
      prompt: "A classification can have high overall accuracy even when a rare class is mapped poorly.",
      answer: true,
      explain: "Overall accuracy is dominated by the common classes. If wetlands are 2% of the sample, getting most of them wrong barely moves the overall number, which is why per-class accuracies are reported."
    },
    {
      id: "ch14-q26",
      type: "mc",
      prompt: "In an FGDC CSDGM metadata record, where would you look to find the datum and map projection of a data set?",
      choices: [
        "Distribution Information",
        "Spatial Reference Information",
        "Entity and Attribute Information",
        "Identification Information"
      ],
      answer: 1,
      explain: "Spatial Reference Information holds the coordinate system, datum and projection. Entity and Attribute Information describes the fields."
    },
    {
      id: "ch14-q27",
      type: "mc",
      prompt: "What is ISO 19115?",
      choices: [
        "The US standard for testing positional accuracy at 95% confidence",
        "A file format for storing vector layers in a single file",
        "The international standard that defines the content of geographic metadata",
        "The standard that sets accuracy classes for lidar data"
      ],
      answer: 2,
      explain: "ISO 19115 defines metadata content for geographic data, and the FGDC endorsed it in 2010. The 95% accuracy testing standard is the NSSDA, and lidar accuracy classes come from ASPRS."
    },
    {
      id: "ch14-q28",
      type: "mc",
      prompt: "A line is drawn 0.5 mm wide on a 1:24,000 map. About how wide a strip of ground does that line cover?",
      choices: [
        "1.2 m",
        "12 m",
        "48 m",
        "120 m"
      ],
      answer: 1,
      explain: "Ground width = 0.5 mm × 24,000 = 12,000 mm = 12 m. The other values come from slipping a decimal place or using the wrong scale."
    },
    {
      id: "ch14-q29",
      type: "mc",
      prompt: "A designer wants to set 3 m building setbacks from streams using stream lines digitized from a 1:100,000-scale map. What is the main data quality concern?",
      choices: [
        "A 1:100,000 source can be off by tens of meters, far more than the 3 m that matters",
        "The stream lines must be reprojected to a new CRS before any buffer can be drawn",
        "The stream layer will have too many vertices for the buffer tool to run quickly",
        "Stream names in the attribute table may be misspelled or out of date"
      ],
      answer: 0,
      explain: "A 0.5 mm line at 1:100,000 alone spans 50 m on the ground, and generalization moves features further. The data are unfit for a 3 m decision no matter how far you zoom in."
    },
    {
      id: "ch14-q30",
      type: "mc",
      prompt: "A scanned map is georeferenced with an RMSE of 1.2 m, and digitizing from it adds an independent error with an RMSE of 0.5 m. What is the expected combined RMSE?",
      choices: [
        "0.7 m",
        "0.85 m",
        "1.3 m",
        "1.7 m"
      ],
      answer: 2,
      explain: "Independent errors combine as √(1.2² + 0.5²) = √(1.44 + 0.25) = √1.69 = 1.3 m. Simply adding them (1.7 m) overstates the combined error."
    }
  ]
});
