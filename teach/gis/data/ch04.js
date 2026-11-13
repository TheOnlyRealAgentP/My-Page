GIS.chapter({
  id: "ch04",
  num: 4,
  title: "Data Entry and Editing",
  blurb: "How new spatial data get into a GIS through digitizing, coordinate geometry, scanning and georeferencing, and how to find and fix the errors each method introduces.",
  objectives: [
    "Compare the main ways spatial data enter a GIS and the accuracy each can deliver.",
    "Compute feature coordinates from survey bearings and distances using coordinate geometry (COGO).",
    "Explain how georeferencing uses control points and an affine transformation to register a scanned map or image.",
    "Calculate and interpret root mean square error (RMSE) for a set of control points.",
    "Identify common digitizing errors such as undershoots, overshoots, slivers and dangles, and the snapping and topology tools that prevent or fix them.",
    "Describe the metadata to record when a new dataset is created."
  ],
  guide: [
    {
      heading: "Where new GIS data come from",
      paragraphs: [
        "Data enter a GIS in a few main ways: converting existing digital files, collecting positions in the field with GNSS receivers or total stations, digitizing features from paper maps or images, scanning maps and converting them to vectors, entering survey measurements with **coordinate geometry (COGO)**, and loading tables that contain coordinates or addresses. Remote sensing (aerial photos, satellite images, lidar) supplies much of the imagery that features are traced from.",
        "Data entry is often the most expensive and error-prone step in a GIS project, so match the method to the accuracy you need. A parcel layer for a tax map can be traced from orthophotos; a layer used to stake construction must come from survey measurements.",
        "Data taken from a paper map can be no more accurate than the map. Lines on a map are drawn about 0.5 mm wide, and a careful operator's digitizing error is about the same size. On a 1:24,000 map, 0.5 mm covers 12 m on the ground."
      ],
      formula: {
        expr: "ground uncertainty = map error × scale denominator",
        where: [
          "map error: line width or digitizing error measured on the map",
          "scale denominator: 24,000 for a 1:24,000 map"
        ]
      },
      example: {
        prompt: "A line on a paper map is about 0.5 mm wide. How wide is that on the ground for a 1:24,000 map and for a 1:100,000 map?",
        steps: [
          "1:24,000: 0.5 mm × 24,000 = 12,000 mm = 12 m.",
          "1:100,000: 0.5 mm × 100,000 = 50,000 mm = 50 m."
        ],
        answer: "About 12 m (39 ft) at 1:24,000 and 50 m (164 ft) at 1:100,000"
      }
    },
    {
      heading: "Digitizing",
      paragraphs: [
        "**Digitizing** converts features on a map or image into vector coordinates by tracing them. Early GIS used digitizing tablets: a map was fixed to a table with a fine wire grid inside, and an operator traced features with a cursor called a puck. Today most digitizing is **on-screen (heads-up) digitizing**: tracing features with the mouse over a georeferenced image or scanned map.",
        "In **point mode**, the operator clicks each vertex, placing more vertices where a line curves and fewer where it is straight. In **stream mode**, the software adds vertices automatically at a set distance or time interval as the cursor moves. Stream mode is fast but can put too many vertices on straight lines and too few on tight curves.",
        "Good practice: work at a consistent display scale, digitize each shared boundary once and snap to it, end lines exactly on the lines they meet, and enter attributes as you go."
      ],
      qgis: "Select the layer and click Toggle Editing (pencil icon), then use Add Point Feature, Add Line Feature or Add Polygon Feature. Set snapping in Project → Snapping Options or on the Snapping toolbar. The Vertex Tool moves, adds and deletes vertices."
    },
    {
      heading: "Coordinate geometry (COGO)",
      paragraphs: [
        "Survey plats and legal descriptions locate boundaries with bearings and distances from a known starting point, a method called metes and bounds. **Coordinate geometry (COGO)** entry turns these measurements into coordinates. Because it uses the surveyed values directly, COGO is the most accurate way to enter parcel boundaries and rights-of-way.",
        "A **bearing** gives direction as an angle of 0° to 90° east or west of north or south, such as N 30° E or S 45° W. An **azimuth** is measured clockwise from north, from 0° to 360°. To convert: N θ E = θ; S θ E = 180° − θ; S θ W = 180° + θ; N θ W = 360° − θ. Each course adds a change in easting and northing to the previous point.",
        "A closed boundary should end exactly where it started. The gap between the start and the computed end is the **misclosure**. Dividing the perimeter by the misclosure gives a precision ratio, such as 1:10,000. A large misclosure points to a blunder in a bearing or distance."
      ],
      formula: {
        expr: "ΔE = d × sin(Az);   ΔN = d × cos(Az)",
        where: [
          "d: horizontal distance of the course",
          "Az: azimuth of the course, clockwise from north",
          "ΔE, ΔN: change in easting and northing"
        ]
      },
      example: {
        prompt: "A parcel corner is at E = 10,000.00 ft, N = 5,000.00 ft. The next course on the plat is N 30°00′ E, 200.00 ft. Find the next corner.",
        steps: [
          "The azimuth of N 30° E is 30°.",
          "ΔE = 200.00 × sin 30° = 200.00 × 0.5000 = 100.00 ft.",
          "ΔN = 200.00 × cos 30° = 200.00 × 0.8660 = 173.21 ft.",
          "E = 10,000.00 + 100.00 = 10,100.00 ft; N = 5,000.00 + 173.21 = 5,173.21 ft."
        ],
        answer: "E = 10,100.00 ft, N = 5,173.21 ft"
      },
      qgis: "The Advanced Digitizing panel (View → Panels → Advanced Digitizing Panel) lets you type exact distances and angles while drawing, which works for entering lines from bearings and distances. Check how the panel measures angles before typing values from a plat."
    },
    {
      heading: "Scanning and vectorizing",
      paragraphs: [
        "A **scanner** turns a paper map into a raster image. Resolution is given in dots per inch (dpi); a higher dpi captures finer lines but makes larger files. The ground size of one scanned pixel equals the map's scale denominator divided by the dpi, in inches.",
        "A scanned map is a picture, not a set of features. **Vectorizing** converts scanned lines into vector features. Automated tools first remove noise, then **thin** thick lines to a one-pixel-wide centerline, then trace those centerlines into lines with vertices. Semi-automatic line following lets an operator guide the software along one line at a time.",
        "Automated vectorizing struggles with text, symbols, dashed lines, lines that cross or touch, stains and folds. The output almost always needs editing, and attributes still have to be added. For many projects, on-screen digitizing over the scanned image is faster than cleaning up automated results."
      ],
      formula: {
        expr: "pixel ground size = scale denominator ÷ dpi   (result in inches)",
        where: [
          "dpi: scan resolution in dots (pixels) per inch",
          "divide by 12 for feet or multiply by 0.0254 for meters"
        ]
      },
      example: {
        prompt: "A 1:24,000 map is scanned at 400 dpi. What ground distance does one pixel cover?",
        steps: [
          "One pixel is 1/400 in on the map.",
          "Ground size = 24,000 ÷ 400 = 60 in.",
          "60 in ÷ 12 = 5 ft, or 60 × 0.0254 = 1.524 m."
        ],
        answer: "60 in = 5 ft (about 1.5 m) per pixel"
      }
    },
    {
      heading: "Georeferencing with control points",
      paragraphs: [
        "A scanned map or old aerial photo has coordinates in pixel columns and rows, not in a real-world CRS. **Georeferencing** (also called registration) links the image to a CRS using **ground control points (GCPs)**: locations you can identify both on the image and in a reference source with known coordinates. Good GCPs are sharp, permanent features such as road intersections, building corners, survey monuments or map grid ticks.",
        "The software fits a **transformation**, a set of equations that converts image coordinates (x, y) to map coordinates (x′, y′). The most common is the **affine transformation** (a first-order polynomial). It can shift, rotate, scale differently in x and y, and skew the image. Straight lines stay straight and parallel lines stay parallel.",
        "An affine transformation has six coefficients, so it needs at least three GCPs, and three points always fit exactly. More points, spread across the whole image, allow a least-squares fit and a check on the errors. GCPs bunched in one corner give a poor fit everywhere else."
      ],
      formula: {
        expr: "x′ = a·x + b·y + c;   y′ = d·x + e·y + f",
        where: [
          "x, y: image (column, row) coordinates",
          "x′, y′: map coordinates",
          "a, b, d, e: scale, rotation and skew terms",
          "c, f: shifts (translation)"
        ]
      },
      example: {
        prompt: "A georeferenced scan has affine coefficients a = 1.5, b = 0, c = 445,000, d = 0, e = −1.5 and f = 4,456,000, with map units in meters. Find the map coordinates of the pixel at column 200, row 100.",
        steps: [
          "x′ = 1.5 × 200 + 0 × 100 + 445,000 = 445,300 m.",
          "y′ = 0 × 200 + (−1.5) × 100 + 4,456,000 = 4,455,850 m.",
          "The negative e makes the northing decrease as the row number increases down the image. Each pixel is 1.5 m on the ground."
        ],
        answer: "E = 445,300 m, N = 4,455,850 m"
      },
      qgis: "Open Layer → Georeferencer (Raster → Georeferencer in versions before 3.26). Load the image, use Add Point to enter each GCP's map coordinates or pick them from the main map canvas, choose the transformation and resampling method in Settings → Transformation Settings, then click Start Georeferencing."
    },
    {
      heading: "Choosing a transformation and checking RMSE",
      figures: [
        { src: "img/qgis/georeferencer.webp", w: 1920, h: 1200,
          alt: "Georeferencer window showing a simulated scan of a Provo street map with ten ground control points, and the GCP table listing source and destination coordinates, dX, dY and residuals. Point 6 has a residual of 10.6 pixels.",
          caption: "**Layer > Georeferencer** with a simulated scan of a Provo street map (an OpenStreetMap render, rotated and rescaled) and ten GCPs at street intersections. Point 6 was placed about 16 pixels off on purpose. Its residual (10.6 px) is about twice the next largest; the bad point also pulls the fit, which raises point 4's residual. Delete or fix point 6 and the mean error drops. Basemap © OpenStreetMap contributors." }
      ],
      paragraphs: [
        "For each GCP, the **residual** is the distance between where the transformation puts the point and where it should be. The **root mean square error (RMSE)** summarizes all residuals in one number. A small RMSE means the transformation fits the control points well. It does not prove the whole image is accurate, especially far from any GCP; independent check points that were not used in the fit give a better test.",
        "If one GCP has a much larger residual than the rest, first check it for a blunder, such as a typed coordinate or a point placed on the wrong corner. Fix or remove it, but do not delete good points just to lower the RMSE.",
        "Higher-order transformations bend the image to fit more points, but they need more GCPs and can warp areas between points badly. A **thin plate spline** (rubber sheeting) passes exactly through every GCP, so its residuals are always zero and its RMSE says nothing about accuracy."
      ],
      bullets: [
        "Helmert (similarity): shift, rotation and one uniform scale; 4 coefficients; at least 2 GCPs.",
        "Affine (first-order polynomial): 6 coefficients; at least 3 GCPs.",
        "Projective: 8 coefficients; at least 4 GCPs; corrects a tilted photo of flat ground.",
        "Second-order polynomial: 12 coefficients; at least 6 GCPs.",
        "Third-order polynomial: 20 coefficients; at least 10 GCPs.",
        "Thin plate spline: fits every GCP exactly; use only with many accurate, well-spread points.",
        "Resampling: nearest neighbor keeps original cell values (use for categories); bilinear or cubic gives smoother results (use for photos and continuous data)."
      ],
      formula: {
        expr: "RMSE = √[ Σ(dx² + dy²) ÷ n ]",
        where: [
          "dx, dy: residual of each GCP in x and y",
          "n: number of GCPs"
        ]
      },
      example: {
        prompt: "Five GCPs have residuals (dx, dy), in meters, of (0.6, −0.8), (−1.2, 0.5), (0.3, 0.4), (0.9, −1.2) and (−0.6, 1.1). Compute the RMSE.",
        steps: [
          "Squared residuals (dx² + dy²): 0.36 + 0.64 = 1.00; 1.44 + 0.25 = 1.69; 0.09 + 0.16 = 0.25; 0.81 + 1.44 = 2.25; 0.36 + 1.21 = 1.57.",
          "Sum = 1.00 + 1.69 + 0.25 + 2.25 + 1.57 = 6.76 m².",
          "Divide by n = 5: 6.76 ÷ 5 = 1.352 m².",
          "RMSE = √1.352 = 1.16 m."
        ],
        answer: "RMSE ≈ 1.16 m"
      },
      qgis: "The Georeferencer's GCP table lists dX, dY and the residual for each point, and the status bar reports the mean error, so you can spot a bad point before you run the transformation."
    },
    {
      heading: "Common digitizing errors and snapping",
      paragraphs: [
        "Most errors in new vector data come from lines that should meet but don't, or that cross when they shouldn't. At normal zoom these errors are invisible, but they break analysis: a network trace stops at a gap, and a polygon that does not close has no area.",
        "**Snapping** prevents many of these errors. When a new vertex comes within the **snapping tolerance** of an existing vertex or segment, it is moved exactly onto it. A tolerance that is too small misses intended connections. One that is too large pulls in vertices that should stay separate and collapses small features. A tolerance of a few screen pixels, or a ground distance based on the data's accuracy, is typical."
      ],
      bullets: [
        "**Undershoot**: a line stops short of the line it should meet, leaving a small gap.",
        "**Overshoot**: a line extends past the line it should end on, leaving a short stub.",
        "**Dangle**: a line end that is not connected to anything. Some are real, such as a cul-de-sac or a stream's headwater; others are undershoots or overshoots.",
        "**Sliver**: a thin polygon formed where two copies of a shared boundary do not line up, leaving a narrow gap or overlap between neighbors.",
        "**Pseudo-node**: a node where exactly two lines meet end to end. Often harmless, but it splits one line into extra pieces.",
        "**Self-intersection**: a polygon boundary that crosses itself, like a bow tie, which makes the geometry invalid.",
        "**Duplicates and attribute errors**: features digitized twice, or entered with blank or wrong attribute values."
      ],
      qgis: "On the Snapping toolbar, turn on snapping, choose vertex and/or segment snapping and set the tolerance in pixels or map units. Turn on Topological Editing so shared vertices move together, and set the overlap option to Avoid Overlap on Active Layer so a new polygon is trimmed to its neighbors."
    },
    {
      heading: "Topology rules, cleanup and simplification",
      paragraphs: [
        "A **topology rule** states a relationship the data must follow, such as 'parcels must not overlap', 'parcels must not have gaps' or 'lines must not have dangles'. Checking the rules lists each violation so it can be fixed or accepted as a real exception, such as a dead-end street.",
        "Other cleanup steps include **edge matching**, which aligns features that cross the boundary between adjacent map sheets or datasets so they connect, and **line simplification**, which removes unneeded vertices. The **Douglas–Peucker** algorithm keeps a line's end points, finds the vertex farthest from the straight line between them, keeps that vertex if it is farther than a set tolerance, and repeats on each piece. Vertices within the tolerance are dropped. Smoothing does the opposite job, adding vertices to round off sharp corners."
      ],
      qgis: "Use the Topology Checker plugin (Vector → Topology Checker) to test rules such as must not overlap, must not have gaps and must not have dangles. Processing Toolbox → Vector geometry → Check validity finds invalid geometry, and Fix geometries repairs many problems. Processing Toolbox → Vector geometry → Simplify offers Douglas–Peucker as its Distance method."
    },
    {
      heading: "Metadata at data entry",
      paragraphs: [
        "**Metadata** are data about data. The best time to record them is while the data are being created, when you still know the source map, its scale and date, the CRS, the digitizing method and tolerance, and who did the work. Reconstructing that information years later is often impossible.",
        "Key elements include the **lineage** (sources and processing steps), positional and attribute accuracy, completeness, the CRS and units, attribute definitions and codes, dates, and contact information. U.S. federal agencies have used the FGDC Content Standard for Digital Geospatial Metadata (CSDGM), and the international ISO 19115 standard is now widely used."
      ],
      qgis: "Fill in Layer Properties → Metadata (identification, keywords, access, extent, contacts, links and history) and save it with the layer so it travels with the data."
    }
  ],
  cards: [
    { front: "Digitizing", back: "Converting features on a map or image into vector coordinates by tracing them." },
    { front: "Heads-up (on-screen) digitizing", back: "Tracing features with the mouse over a georeferenced image or scanned map shown on screen." },
    { front: "Point mode", back: "Digitizing by clicking each vertex yourself, adding more where lines curve and fewer where they are straight." },
    { front: "Stream mode", back: "Digitizing in which the software adds vertices automatically at a set distance or time interval as the cursor moves." },
    { front: "Snapping tolerance", back: "The distance within which a new vertex is moved exactly onto an existing vertex or line. Too small misses connections; too large distorts features." },
    { front: "Undershoot", back: "A line that stops short of the line it should meet, leaving a gap." },
    { front: "Overshoot", back: "A line that extends past the line it should end on, leaving a short stub." },
    { front: "Dangle", back: "A line end not connected to any other line. Real for cul-de-sacs or stream headwaters; otherwise usually an undershoot or overshoot." },
    { front: "Sliver polygon", back: "A thin, unwanted polygon created where two versions of the same boundary do not line up exactly." },
    { front: "Pseudo-node", back: "A node where exactly two lines meet end to end. Usually not an error, but it splits one line into extra pieces." },
    { front: "Self-intersection", back: "A polygon boundary that crosses itself, like a bow tie. It makes the geometry invalid for area and overlay calculations." },
    { front: "Coordinate geometry (COGO)", back: "Entering features from survey bearings and distances, which are converted to coordinates. The most accurate way to enter parcel boundaries." },
    { front: "Bearing", back: "A direction given as an angle of 0–90° east or west of north or south, such as N 30° E or S 45° W." },
    { front: "Azimuth", back: "A direction measured clockwise from north, 0° to 360°. The bearing N 30° W is an azimuth of 330°." },
    { front: "Misclosure", back: "The gap between a closed boundary's start point and its computed end point. Perimeter ÷ misclosure gives the precision ratio." },
    { front: "Vectorizing", back: "Converting a scanned raster image of lines into vector features, usually by cleaning, thinning and tracing." },
    { front: "Thinning", back: "A vectorizing step that reduces scanned lines several pixels wide to a one-pixel-wide centerline." },
    { front: "Georeferencing", back: "Assigning real-world coordinates to an image or map by matching control points and fitting a transformation." },
    { front: "Ground control point (GCP)", back: "A location identifiable on both the image and a reference source with known coordinates, such as a road intersection or survey monument." },
    { front: "Affine transformation", back: "A first-order transformation with 6 coefficients that can shift, rotate, scale and skew. Needs at least 3 control points." },
    { front: "Polynomial transformation", back: "A transformation with higher-order terms that bends an image. Second order needs at least 6 GCPs; third order needs at least 10." },
    { front: "Thin plate spline", back: "A rubber-sheet transformation that fits every control point exactly, so residuals are zero and RMSE cannot judge accuracy." },
    { front: "Residual", back: "For a control point, the distance between its transformed position and its true map position." },
    { front: "RMSE", back: "Root mean square error: the square root of the average squared residual. It summarizes how well a transformation fits the control points." },
    { front: "Resampling", back: "Computing cell values for the new, georeferenced grid. Nearest neighbor for categories; bilinear or cubic for images and continuous data." },
    { front: "World file", back: "A small text file (.tfw, .jgw, .pgw) with six affine coefficients that place an image's pixels in map coordinates." },
    { front: "Topology rule", back: "A required spatial relationship, such as 'must not overlap' or 'must not have gaps', checked to find editing errors." },
    { front: "Edge matching", back: "Adjusting features that cross the boundary between adjacent map sheets or datasets so they connect." },
    { front: "Douglas–Peucker algorithm", back: "A line simplification method that drops vertices lying within a set tolerance of a simplified line while keeping the overall shape." },
    { front: "Lineage", back: "The metadata section that records a dataset's sources and every processing step used to create it." }
  ],
  questions: [
    {
      id: "ch04-q01",
      type: "mc",
      prompt: "What is heads-up (on-screen) digitizing?",
      choices: [
        "Tracing features with a puck over a map fixed to a digitizing tablet",
        "Tracing features with the mouse over a georeferenced image on screen",
        "Converting a scanned map to vector lines automatically with software",
        "Collecting feature points in the field with a handheld GNSS receiver"
      ],
      answer: 1,
      explain: "Heads-up digitizing means tracing on the screen while looking at it, instead of looking down at a tablet. Automated conversion of a scan is vectorizing, a different method."
    },
    {
      id: "ch04-q02",
      type: "mc",
      prompt: "How does stream-mode digitizing differ from point-mode digitizing?",
      choices: [
        "Stream mode adds vertices automatically at a set distance or time as the cursor moves",
        "Stream mode is used only for rivers and streams, so vertices follow flow direction",
        "Stream mode stores the traced line as a chain of raster cells instead of vertices",
        "Stream mode requires the operator to click each vertex, adding more on tight curves"
      ],
      answer: 0,
      explain: "In stream mode the software places vertices while you move the cursor. Clicking each vertex yourself is point mode. The name refers to the stream of vertices, not to rivers."
    },
    {
      id: "ch04-q03",
      type: "mc",
      prompt: "What is an undershoot?",
      choices: [
        "A line that extends past the line it should end on, leaving a stub",
        "A thin polygon left between two neighboring polygons",
        "A line that stops short of the line it should meet, leaving a gap",
        "A polygon boundary that crosses itself like a bow tie"
      ],
      answer: 2,
      explain: "An undershoot falls short and leaves a gap; an overshoot goes too far and leaves a stub. Both leave a dangling line end."
    },
    {
      id: "ch04-q04",
      type: "mc",
      prompt: "Two crews digitize neighboring soil polygons separately, each tracing the shared boundary. When the layers are merged, many thin polygons appear along that boundary. What are they?",
      choices: [
        "Pseudo-nodes",
        "Overshoots",
        "Dangles",
        "Slivers"
      ],
      answer: 3,
      explain: "Two tracings of the same line never match exactly, so the small differences form thin sliver polygons. Digitizing the boundary once and snapping to it prevents them."
    },
    {
      id: "ch04-q05",
      type: "mc",
      prompt: "What is the most likely result of setting the snapping tolerance far too large?",
      choices: [
        "Lines that should connect will not snap, leaving small gaps at their ends",
        "Vertices that should stay separate are pulled together, collapsing small features",
        "The layer's CRS changes to match the units of the snapping tolerance",
        "Attributes of nearby features are merged or deleted as vertices move"
      ],
      answer: 1,
      explain: "A large tolerance grabs any vertex within reach, including ones that belong to separate nearby features. Missed connections are the problem with a tolerance that is too small."
    },
    {
      id: "ch04-q06",
      type: "tf",
      prompt: "Every dangling node in a street layer is an error that must be removed.",
      answer: false,
      explain: "Cul-de-sacs and dead-end streets end in real dangles. Topology tools flag every dangle so you can check it, and you mark the real ones as exceptions."
    },
    {
      id: "ch04-q07",
      type: "mc",
      prompt: "Which source is best entered with coordinate geometry (COGO)?",
      choices: [
        "A satellite image of a wetland and its boundary",
        "A scanned 1960s county road map with street names",
        "Bearings and distances from a recorded survey plat",
        "GNSS points collected along a trail by a field crew"
      ],
      answer: 2,
      explain: "COGO computes coordinates from surveyed bearings and distances, so it keeps the plat's full accuracy. Images and scanned maps are digitized, and GNSS points already have coordinates."
    },
    {
      id: "ch04-q08",
      type: "num",
      prompt: "From a known corner at E = 2,000.00 ft, N = 3,000.00 ft, a boundary runs S 45°00′ E for 141.42 ft. What is the easting of the next corner, in feet?",
      answer: 2100,
      tol: 0.05,
      unit: "ft",
      explain: "S 45° E is an azimuth of 180° − 45° = 135°. ΔE = 141.42 × sin 135° = 141.42 × 0.7071 = +100.00 ft, so E = 2,100.00 ft. (ΔN = 141.42 × cos 135° = −100.00 ft, so N = 2,900.00 ft.)"
    },
    {
      id: "ch04-q09",
      type: "mc",
      prompt: "What azimuth matches the bearing N 30° W?",
      choices: [
        "30°",
        "150°",
        "210°",
        "330°"
      ],
      answer: 3,
      explain: "N θ W = 360° − θ = 330°. An azimuth of 30° is N 30° E, 150° is S 30° E, and 210° is S 30° W."
    },
    {
      id: "ch04-q10",
      type: "mc",
      prompt: "How many coefficients does an affine transformation have, and how many control points does it need at minimum?",
      choices: [
        "4 coefficients; 2 points",
        "6 coefficients; 3 points",
        "8 coefficients; 4 points",
        "12 coefficients; 6 points"
      ],
      answer: 1,
      explain: "Each control point gives two equations (one for x, one for y), so six unknowns need three points. Four and two describe a Helmert transformation, eight and four a projective one, and twelve and six a second-order polynomial."
    },
    {
      id: "ch04-q11",
      type: "mc",
      prompt: "Which transformation always shows zero residuals at the control points, so its RMSE cannot be used to judge accuracy?",
      choices: [
        "Thin plate spline",
        "Affine",
        "Helmert",
        "Second-order polynomial"
      ],
      answer: 0,
      explain: "A thin plate spline bends the image to pass exactly through every GCP. The polynomial and Helmert fits use least squares, so with more than the minimum number of points they leave residuals that show how well they fit."
    },
    {
      id: "ch04-q12",
      type: "num",
      prompt: "Four control points have residuals of 0.5 m, 1.0 m, 1.5 m and 1.0 m. What is the RMSE, in meters?",
      answer: 1.06,
      tol: 0.01,
      unit: "m",
      explain: "Squares: 0.25 + 1.00 + 2.25 + 1.00 = 4.50. Divide by 4: 1.125. Square root: 1.06 m. The plain average (1.0 m) is lower because RMSE weights large residuals more."
    },
    {
      id: "ch04-q13",
      type: "mc",
      prompt: "Where should control points be placed when georeferencing an aerial photo?",
      choices: [
        "Clustered near the center, where the photo is sharpest",
        "Along one edge, so they are easy to find",
        "Spread across the whole image, including near the corners and edges",
        "On features that change over time, such as shorelines"
      ],
      answer: 2,
      explain: "A transformation is only well controlled near its GCPs. Points spread across the image keep errors low everywhere; clustered points let the fit drift in the uncovered areas."
    },
    {
      id: "ch04-q14",
      type: "mc",
      prompt: "You georeference a 1950s aerial photo of a canal corridor with eight GCPs and an affine transformation. One GCP has a residual ten times larger than any other. What should you do first?",
      choices: [
        "Switch to a third-order polynomial so the large residual shrinks to match the rest",
        "Check that point for a typed coordinate or a wrong feature, then fix or remove it",
        "Keep it, because more control points always improve the accuracy of the result",
        "Increase the output cell size so the large residual is spread over fewer pixels"
      ],
      answer: 1,
      explain: "One residual far above the rest usually means a blunder, such as a typo or the wrong corner. A higher-order transformation would bend the image to fit the bad point and distort everything near it."
    },
    {
      id: "ch04-q15",
      type: "mc",
      prompt: "A scanned land use map with classes coded 1 through 8 is being georeferenced. Which resampling method should you use?",
      choices: [
        "Cubic convolution",
        "Bilinear interpolation",
        "Nearest neighbor",
        "Lanczos"
      ],
      answer: 2,
      explain: "Nearest neighbor copies an existing value into each new cell, so the class codes stay valid. Bilinear and cubic average nearby cells and could create a value like 3.4 that is not a class."
    },
    {
      id: "ch04-q16",
      type: "tf",
      prompt: "A low RMSE proves that every part of a georeferenced image is accurate.",
      answer: false,
      explain: "RMSE only measures the fit at the control points. Areas far from any GCP, or a GCP set that shares a common error, can still be off. Independent check points give a better test."
    },
    {
      id: "ch04-q17",
      type: "mc",
      prompt: "What is the minimum number of control points for a second-order polynomial transformation?",
      choices: [
        "6",
        "3",
        "4",
        "10"
      ],
      answer: 0,
      explain: "A second-order polynomial has 12 coefficients (6 for x and 6 for y), and each point gives two equations, so at least 6 points are needed. Three is the affine minimum and ten the third-order minimum."
    },
    {
      id: "ch04-q18",
      type: "num",
      prompt: "A 1:24,000 map is scanned at 300 dpi. What ground distance does one pixel cover, in feet?",
      answer: 6.67,
      tol: 0.05,
      unit: "ft",
      explain: "24,000 ÷ 300 = 80 in on the ground per pixel. 80 in ÷ 12 = 6.67 ft (about 2.03 m)."
    },
    {
      id: "ch04-q19",
      type: "num",
      prompt: "Lines on a 1:100,000 source map are about 0.5 mm wide. What ground distance does that width represent, in meters?",
      answer: 50,
      tol: 0.5,
      unit: "m",
      explain: "0.5 mm × 100,000 = 50,000 mm = 50 m. Data digitized from this map cannot be trusted to better than tens of meters."
    },
    {
      id: "ch04-q20",
      type: "mc",
      prompt: "In automated vectorizing, what does thinning do?",
      choices: [
        "Removes extra vertices from the finished vector lines after tracing",
        "Reduces scanned lines several pixels wide to a one-pixel centerline",
        "Lowers the scan resolution so the image file takes less disk space",
        "Deletes small specks and noise polygons left over from the scan"
      ],
      answer: 1,
      explain: "Thinning works on the raster scan before tracing, so each line can be followed along a single row of pixels. Removing vertices from finished lines is simplification, a later step."
    },
    {
      id: "ch04-q21",
      type: "mc",
      prompt: "How does the Douglas–Peucker algorithm simplify a line?",
      choices: [
        "It moves every vertex onto a regular grid set by the tolerance",
        "It adds vertices along curves so sharp corners are rounded off",
        "It removes every other vertex, halving the number on each line",
        "It drops vertices that lie within a tolerance of a simplified line"
      ],
      answer: 3,
      explain: "Douglas–Peucker keeps the vertices that matter most to the shape and drops those within the tolerance. Adding vertices to round corners is smoothing, the opposite job."
    },
    {
      id: "ch04-q22",
      type: "mc",
      prompt: "Which topology rule would find unwanted gaps between neighboring parcels?",
      choices: [
        "Must not have gaps",
        "Must not have dangles",
        "Must not have pseudo-nodes",
        "Must be inside"
      ],
      answer: 0,
      explain: "Must not have gaps flags empty space between polygons that should share edges. Dangle and pseudo-node rules apply to line layers."
    },
    {
      id: "ch04-q23",
      type: "mc",
      prompt: "A planner digitizes new zoning polygons next to existing ones, and the new polygons overlap their neighbors by a few centimeters. Which QGIS setting prevents this as new polygons are drawn?",
      choices: [
        "Set the layer's maximum display scale so polygons are drawn zoomed in",
        "Change the project CRS to UTM so edges are measured in meters",
        "Run the Simplify tool after each polygon to remove the extra vertices",
        "Turn on snapping and set the overlap option to Avoid Overlap on Active Layer"
      ],
      answer: 3,
      explain: "With snapping on and Avoid Overlap set, QGIS trims each new polygon to its neighbors so shared edges match. Display scale, CRS and simplification do not control how polygons meet."
    },
    {
      id: "ch04-q24",
      type: "tf",
      prompt: "Edge matching aligns features that cross the boundary between adjacent map sheets or datasets so they connect.",
      answer: true,
      explain: "Roads, streams and boundaries digitized from neighboring sheets rarely meet exactly at the sheet edge. Edge matching moves their ends together so they form continuous features."
    },
    {
      id: "ch04-q25",
      type: "mc",
      prompt: "Which metadata element records that parcels were digitized from 1:24,000 maps in 1998 and later adjusted to GNSS control?",
      choices: [
        "Spatial extent",
        "Lineage",
        "Attribute domain",
        "Distribution information"
      ],
      answer: 1,
      explain: "Lineage is the history of a dataset: its sources and each processing step. The extent gives the area covered, and distribution information says how to get the data."
    },
    {
      id: "ch04-q26",
      type: "mc",
      prompt: "A parcel entered with COGO from a plat has a perimeter of 2,100 ft and a misclosure of 0.35 ft. What is the precision ratio?",
      choices: [
        "1:600",
        "1:735",
        "1:6,000",
        "1:60,000"
      ],
      answer: 2,
      explain: "Precision = perimeter ÷ misclosure = 2,100 ÷ 0.35 = 6,000, written 1:6,000. A bigger second number means better precision."
    },
    {
      id: "ch04-q27",
      type: "tf",
      prompt: "Georeferencing and reprojecting are the same operation.",
      answer: false,
      explain: "Georeferencing gives coordinates to data that have none, by fitting a transformation to control points. Reprojecting converts data that already have a known CRS into another CRS using exact projection equations."
    },
    {
      id: "ch04-q28",
      type: "mc",
      prompt: "What does a world file (such as .tfw or .jgw) store?",
      choices: [
        "Six coefficients that convert pixel column and row to map coordinates",
        "The color palette and band names used to display the image",
        "The raster attribute table that names each cell value's class",
        "A list of every control point, its map coordinates and its residual"
      ],
      answer: 0,
      explain: "A world file is a six-line text file with the affine coefficients: pixel size in x, two rotation terms, pixel size in y (usually negative) and the coordinates of the center of the upper-left pixel. It does not store the control points or the CRS."
    },
    {
      id: "ch04-q29",
      type: "mc",
      prompt: "Which QGIS tool reports polygons with self-intersections and other invalid geometry?",
      choices: [
        "Buffer",
        "Dissolve",
        "Rasterize (Vector to Raster)",
        "Check validity"
      ],
      answer: 3,
      explain: "Check validity (Processing Toolbox → Vector geometry) tests each geometry and writes valid and invalid features to separate outputs, with the location of each error. Fix geometries can then repair many of them."
    },
    {
      id: "ch04-q30",
      type: "mc",
      prompt: "In a line layer, what is a pseudo-node?",
      choices: [
        "A node where exactly two lines meet end to end",
        "A node where three or more lines meet",
        "A line end connected to nothing",
        "A vertex placed in stream mode"
      ],
      answer: 0,
      explain: "A pseudo-node joins only two lines, so it could be removed by merging them into one. A node where three or more lines meet is a true junction, and a line end connected to nothing is a dangle."
    }
  ]
});
