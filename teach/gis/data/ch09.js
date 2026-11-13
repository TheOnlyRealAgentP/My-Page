GIS.chapter({
  id: "ch09",
  num: 9,
  title: "Basic Spatial Analysis",
  blurb: "How to select, buffer, overlay, join, and summarize vector data so a GIS can answer questions such as which parcels lie within 100 m of a stream or which route to a site is shortest.",
  objectives: [
    "Write attribute queries that combine conditions with Boolean AND, OR, NOT, and XOR.",
    "Select features by location using spatial relationships such as intersects, within, and touches.",
    "Reclassify and dissolve features to simplify a layer for analysis.",
    "Compute buffer areas for fixed and variable distances and explain when each is used.",
    "Predict the geometry and attributes produced by intersect, union, clip, erase, and identity overlays.",
    "Use spatial joins, proximity tools, and shortest-path network analysis to answer engineering questions.",
    "Summarize overlay results with counts, sums, and area-weighted means."
  ],
  guide: [
    {
      heading: "Selecting features by attribute",
      paragraphs: [
        "Most analyses start by picking the right features. A **selection by attribute** (an attribute query) tests every record in the attribute table against a condition, such as `zoning = 'R1'` or `area_m2 > 5000`. Records that pass are selected and highlighted on the map. The selection is temporary until you save it as a new layer.",
        "Conditions use comparison operators (=, <>, <, >, <=, >=) and can be joined with **Boolean operators**. AND keeps a record only if both conditions are true. OR keeps it if either one is true. NOT reverses a condition. XOR (exclusive or) keeps records where exactly one condition is true. Boolean logic matches set logic: AND is the intersection of two sets, OR is the union, and NOT is the complement.",
        "Use parentheses when you mix operators, for example `(zoning = 'R1' OR zoning = 'R2') AND in_flood = 1`. Most query languages evaluate AND before OR, so leaving the parentheses out can return a different set."
      ],
      example: {
        prompt: "A county has 120 parcels zoned residential (set A) and 45 parcels in the floodplain (set B). Fifteen parcels are in both. How many parcels does each query return: A AND B, A OR B, A AND NOT B, and A XOR B?",
        steps: [
          "A AND B is the overlap: 15 parcels.",
          "A OR B counts each parcel once: 120 + 45 − 15 = 150 parcels.",
          "A AND NOT B removes the overlap from A: 120 − 15 = 105 parcels.",
          "A XOR B is A OR B without the overlap: 150 − 15 = 135 parcels."
        ],
        answer: "15, 150, 105, and 135 parcels"
      },
      qgis: "Select by Expression (attribute table or Edit → Select), or Processing Toolbox → Vector selection → Select by attribute. Extract by attribute and Extract by expression save the result as a new layer."
    },
    {
      heading: "Selecting features by location",
      paragraphs: [
        "A **selection by location** picks features based on their spatial relationship to features in another layer. These relationships are called **spatial predicates**: intersects, contains, within, touches, overlaps, crosses, disjoint, and equals. For example, selecting road segments that cross a stream layer gives a list of likely bridge and culvert sites.",
        "The predicate you choose changes the answer. A parcel that only shares an edge with a floodplain polygon **touches** it and also **intersects** it, but it is not **within** it. Intersects is the broadest test: it is true whenever two shapes share any point. Within and contains are inverses: if A is within B, then B contains A.",
        "Selection tools also let you set the mode: make a new selection, add to the current one, remove from it, or select within the current selection. Chaining modes builds multi-step queries, such as commercial parcels (attribute) that are also within 1 km of a highway interchange (location)."
      ],
      qgis: "Processing Toolbox → Vector selection → Select by location (or Vector selection → Extract by location to write a new layer). Tick the predicates and choose the selection mode in the dialog."
    },
    {
      heading: "Reclassification and dissolve",
      paragraphs: [
        "**Reclassification** assigns new values to features based on an existing attribute. It groups many detailed classes into a few useful ones, such as turning 40 soil map units into four hydrologic soil groups (A, B, C, D), or turning slope values into buildable and not buildable. A **binary** reclassification has only two classes, often coded 1 and 0.",
        "After reclassifying, many neighboring polygons share the same new value. A **dissolve** merges features that share a value in a chosen field and removes the boundaries between them. The output has fewer, larger features, which speeds up later overlays and makes maps easier to read.",
        "When you dissolve, decide what happens to the other attributes. Areas and counts can be summed, but values that differ from feature to feature, such as owner names, are usually dropped because one merged polygon cannot hold several values."
      ],
      qgis: "Field calculator with a `CASE WHEN … THEN … END` expression creates the new class field. Then run Processing Toolbox → Vector geometry → Dissolve with that field as the dissolve field."
    },
    {
      heading: "Buffers",
      figures: [
        { src: "img/qgis/buffer-map.webp", w: 1000, h: 1100,
          alt: "Map of a 150 meter buffer around a proposed sewer running north–south along University Avenue in Provo, with eight labeled manholes, over an OpenStreetMap basemap.",
          caption: "**The result**: a 150 m buffer around the proposed University Avenue sewer, with manholes MH-01 to MH-08. The sewer and manholes are sample data for teaching. Basemap © OpenStreetMap contributors." }
      ],
      paragraphs: [
        "A **buffer** is a polygon that encloses all locations within a set distance of a feature. Point buffers are circles, line buffers are corridors with rounded ends, and polygon buffers grow the shape outward (or shrink it with a negative distance). Buffers answer proximity questions such as which wells lie within 300 m of a fuel tank.",
        "A **fixed-distance** buffer uses one distance for every feature. A **variable-distance** buffer reads the distance from an attribute, so a large river can get a 60 m setback while a small creek gets 15 m. A **multi-ring** buffer creates several zones at set distances (for example 100, 200, and 300 m). Overlapping buffers can be kept separate or **dissolved** into one polygon. Dissolve them before reporting total buffered area, or overlaps are counted more than once.",
        "Always buffer in a projected coordinate system with units of meters or feet. In a geographic CRS the distance is read in degrees, so a buffer of 100 would mean 100 degrees. For one straight line of length L buffered by distance r with round ends, the area is a rectangle plus one full circle (the two half-circle end caps)."
      ],
      formula: {
        expr: "A_point = π r²;   A_line = 2 r L + π r²",
        where: [
          "r: buffer distance",
          "L: length of a straight line segment",
          "π r²: area of a circle, or of the two half-circle end caps together"
        ]
      },
      example: {
        prompt: "A straight stream reach is 2.0 km long. Find the area of a 100 m buffer on both sides with round end caps, in m² and hectares.",
        steps: [
          "Rectangle: 2 × 100 m × 2,000 m = 400,000 m².",
          "End caps (two half circles make one circle): π × (100 m)² = 31,416 m².",
          "Total: 400,000 + 31,416 = 431,416 m².",
          "Convert: 431,416 m² ÷ 10,000 m²/ha = 43.1 ha (about 107 acres)."
        ],
        answer: "About 431,400 m², or 43.1 ha"
      },
      qgis: "Processing Toolbox → Vector geometry → Buffer. Tick Dissolve result to merge overlaps. For a variable buffer, click the data-defined override button next to Distance and pick the distance field. Multi-ring buffer (constant distance) makes concentric rings."
    },
    {
      heading: "Overlay: intersect, union, clip, erase, and identity",
      paragraphs: [
        "**Overlay** combines two layers so that the output carries geometry, and often attributes, from both inputs. It answers questions that involve two themes at once, such as which soil types lie under each land use. Vector overlay splits polygons wherever boundaries cross, so the output usually has more, smaller features than either input.",
        "Overlay output needs two checks. First, area and length fields copied from the inputs are not updated, so recompute them after any overlay that splits features. Second, boundaries that should match but were digitized slightly differently create **sliver polygons**, thin features with no real meaning. Snapping tolerances, topology cleaning, or deleting polygons below a minimum area remove most of them."
      ],
      bullets: [
        "**Intersect**: keeps only the area common to both layers. Output features carry attributes from both.",
        "**Union**: keeps all the area of both layers. Pieces covered by only one layer get empty (null) values for the other layer's fields.",
        "**Clip**: cuts the input layer to the outline of the clip layer, like a cookie cutter. Output keeps only the input layer's attributes.",
        "**Erase (Difference)**: keeps the parts of the input layer that fall outside the erase layer. Output keeps only the input layer's attributes.",
        "**Identity**: keeps all of the input layer's area, split along the identity layer's boundaries, with the identity layer's attributes added where they overlap.",
        "**Symmetrical difference**: keeps area covered by one layer or the other but not both (a spatial XOR)."
      ],
      qgis: "Processing Toolbox → Vector overlay → Intersection, Union, Clip, Difference, and Symmetrical difference. QGIS has no single Identity tool. Run Union, then delete the pieces that fall outside the input layer to get the same result."
    },
    {
      heading: "Spatial joins",
      paragraphs: [
        "A **spatial join** copies attributes from one layer to another based on location instead of a shared key field. Joining a parcels layer to a flood zone layer, for example, adds the flood zone code to every parcel that intersects a zone. Spatial joins use the same predicates as selection by location.",
        "A feature can match several features in the other layer. A one-to-one join keeps only the first match or a summary of all matches (count, sum, mean, maximum). A one-to-many join writes one output row per match. Counting points in polygons is a common summary join: the number of crashes on each road segment or the number of manholes in each subdivision. A **nearest join** attaches the attributes of the closest feature and the distance to it."
      ],
      qgis: "Processing Toolbox → Vector general → Join attributes by location, Join attributes by location (summary), and Join attributes by nearest. Vector analysis → Count points in polygon."
    },
    {
      heading: "Proximity and distance",
      paragraphs: [
        "**Proximity analysis** measures how close features are to each other. Buffers give a yes or no answer (inside or outside a distance). Distance tools give a number: the distance from each feature to the nearest feature in another layer, or a **distance matrix** of distances between every pair of points.",
        "Straight-line (**Euclidean**) distance comes from the Pythagorean theorem applied to projected coordinates. Travel usually follows streets or pipes, so network distance is equal to or longer than Euclidean distance. **Manhattan distance**, the sum of the east-west and north-south differences, approximates travel on a rectangular street grid."
      ],
      formula: {
        expr: "d = √((x₂ − x₁)² + (y₂ − y₁)²)",
        where: [
          "x, y: projected coordinates, such as UTM easting and northing in meters",
          "d: straight-line distance in the same units"
        ]
      },
      example: {
        prompt: "Two survey control points have UTM coordinates (431,200 E, 4,455,600 N) and (431,500 E, 4,456,000 N), in meters. What is the straight-line distance between them? What is the Manhattan distance?",
        steps: [
          "Δx = 431,500 − 431,200 = 300 m.",
          "Δy = 4,456,000 − 4,455,600 = 400 m.",
          "Euclidean: d = √(300² + 400²) = √250,000 = 500 m.",
          "Manhattan: 300 + 400 = 700 m."
        ],
        answer: "500 m straight-line; 700 m Manhattan"
      },
      qgis: "Processing Toolbox → Vector analysis → Distance to nearest hub (points) and Distance matrix; Vector general → Join attributes by nearest. The Measure Line tool on the toolbar gives quick distances."
    },
    {
      heading: "Network analysis and shortest paths",
      paragraphs: [
        "A **network** is a set of **edges** (lines, such as road or pipe segments) connected at **nodes** (junctions). Each edge has an **impedance**, the cost of traveling along it: length, travel time, or a combined cost. Networks can also store one-way streets, turn restrictions, and closed edges.",
        "The **shortest path** is the route between two nodes with the lowest total impedance. It is not always the route with the fewest edges. **Dijkstra's algorithm** finds it by working outward from the start node, each time settling the unvisited node with the lowest total cost so far. A **service area** is the part of the network reachable within a cost limit, such as all streets within a 4-minute drive of a fire station.",
        "Results depend on correct topology. Segments that meet at an intersection must share an endpoint, while a road that passes over another on a bridge must not connect to it."
      ],
      example: {
        prompt: "Edge lengths (km) in a small road network are A–B 4, A–C 2, B–C 1, B–D 5, C–D 8, C–E 10, and D–E 2. What is the shortest route from A to E?",
        steps: [
          "A–C–E = 2 + 10 = 12 km.",
          "A–B–D–E = 4 + 5 + 2 = 11 km.",
          "A–C–D–E = 2 + 8 + 2 = 12 km.",
          "A–C–B–D–E = 2 + 1 + 5 + 2 = 10 km.",
          "The lowest total uses four edges, more than any other candidate."
        ],
        answer: "A–C–B–D–E, 10 km"
      },
      qgis: "Processing Toolbox → Network analysis → Shortest path (point to point), Shortest path (layer to point), and Service area (from point). Set the path type to Shortest (distance) or Fastest (time, from a speed field)."
    },
    {
      heading: "Summary statistics",
      paragraphs: [
        "Most analyses end with numbers: how many features were selected, the total area of each class, or the average of some value. **Summary statistics** include count, sum, minimum, maximum, mean, and standard deviation. They can be computed for a whole layer or grouped by a category field, such as total impervious area per subbasin.",
        "When features differ in size, a plain average can mislead. An **area-weighted mean** multiplies each value by its feature's area, adds the products, and divides by the total area. Engineers use it after intersecting a watershed with land cover or soils to get a composite runoff curve number (CN) or runoff coefficient."
      ],
      formula: {
        expr: "x̄_w = Σ(Aᵢ xᵢ) / Σ Aᵢ",
        where: [
          "Aᵢ: area of piece i",
          "xᵢ: value for piece i, such as a curve number",
          "x̄_w: area-weighted mean"
        ]
      },
      example: {
        prompt: "Intersecting a 60 ha watershed with land use gives 12 ha of pavement (CN 98), 30 ha of lawn (CN 61), and 18 ha of woods (CN 74). What is the composite curve number?",
        steps: [
          "Products: 12 × 98 = 1,176; 30 × 61 = 1,830; 18 × 74 = 1,332.",
          "Sum of products: 1,176 + 1,830 + 1,332 = 4,338.",
          "Divide by total area: 4,338 ÷ 60 = 72.3."
        ],
        answer: "Composite CN ≈ 72.3 (a plain average of 98, 61, and 74 would give 77.7)"
      },
      qgis: "Processing Toolbox → Vector analysis → Basic statistics for fields and Statistics by categories. Refresh areas after an overlay with the Field calculator and `$area`."
    }
  ],
  cards: [
    { front: "Selection by attribute", back: "Choosing features whose attribute values meet a condition, such as `zoning = 'R1'`. Also called an attribute query." },
    { front: "Selection by location", back: "Choosing features based on their spatial relationship (intersects, within, touches, and so on) to features in another layer." },
    { front: "Boolean AND", back: "True only when both conditions are true. Matches set intersection, so it returns the same number of records or fewer than either condition alone." },
    { front: "Boolean OR", back: "True when either condition, or both, is true. Matches set union, so it returns the same number of records or more than either condition alone." },
    { front: "Boolean NOT", back: "Reverses a condition. `NOT in_flood = 1` selects every record outside the floodplain. Matches the set complement." },
    { front: "Boolean XOR", back: "Exclusive or: true when exactly one of two conditions is true, false when both or neither are true." },
    { front: "Spatial predicate", back: "A test of the spatial relationship between two shapes, such as intersects, contains, within, touches, crosses, overlaps, or disjoint." },
    { front: "Intersects (predicate)", back: "True when two shapes share at least one point, including touching at an edge. The broadest spatial predicate." },
    { front: "Reclassification", back: "Assigning new values to features based on an existing attribute, usually to group detailed classes into fewer, more useful ones." },
    { front: "Dissolve", back: "Merging features that share a value in a chosen field and removing the boundaries between them." },
    { front: "Buffer", back: "A polygon enclosing all locations within a given distance of a point, line, or polygon feature." },
    { front: "Variable-distance buffer", back: "A buffer whose distance comes from an attribute of each feature, such as a wider setback for larger streams." },
    { front: "Multi-ring buffer", back: "A set of concentric buffer zones at several distances, such as 100, 200, and 300 m, around the same features." },
    { front: "Overlay", back: "Combining two layers so the output features carry geometry, and often attributes, from both inputs." },
    { front: "Intersect", back: "Overlay that keeps only the area common to both layers, with attributes from both." },
    { front: "Union", back: "Overlay that keeps all area from both layers. Pieces covered by only one layer get null values for the other layer's fields." },
    { front: "Clip", back: "Cuts the input layer to the outline of a clip layer. Only the input layer's attributes are kept." },
    { front: "Erase (Difference)", back: "Removes the parts of the input layer that fall inside the erase layer. Only the input layer's attributes are kept." },
    { front: "Identity", back: "Overlay that keeps all of the input layer's area, split along the identity layer's boundaries, with identity attributes added where they overlap." },
    { front: "Sliver polygon", back: "A thin, false polygon created in overlay when two versions of the same boundary do not line up exactly." },
    { front: "Spatial join", back: "Copying attributes from one layer to another based on spatial relationship rather than a shared key field." },
    { front: "Proximity analysis", back: "Analysis of how close features are to each other, using buffers, nearest-feature distances, or distance matrices." },
    { front: "Euclidean distance", back: "Straight-line distance between two points: √(Δx² + Δy²) using projected coordinates." },
    { front: "Network", back: "A connected set of edges (lines) and nodes (junctions) used to model roads, pipes, or streams." },
    { front: "Impedance", back: "The cost of moving along a network edge or through a turn, such as length, travel time, or fuel use." },
    { front: "Shortest path", back: "The route between two network nodes with the lowest total impedance. Commonly found with Dijkstra's algorithm." },
    { front: "Service area", back: "All parts of a network reachable from a location within a cost limit, such as a 5-minute drive." },
    { front: "Area-weighted mean", back: "An average in which each value is multiplied by its area before dividing by the total area. Used for composite curve numbers." }
  ],
  questions: [
    {
      id: "ch09-q01",
      type: "mc",
      prompt: "Which Boolean operator returns records where exactly one of two conditions is true?",
      choices: ["AND", "OR", "XOR", "NOT"],
      answer: 2,
      explain: "XOR (exclusive or) keeps records that meet one condition but not both. OR is the tempting choice, but OR also keeps records where both conditions are true."
    },
    {
      id: "ch09-q02",
      type: "mc",
      prompt: "The query `slope_pct < 10 AND zoning = 'IND'` returns 40 parcels. If AND is changed to OR, how many parcels will be returned?",
      choices: ["Fewer than 40", "Exactly 40", "Exactly 80", "40 or more"],
      answer: 3,
      explain: "OR returns every parcel that AND returned plus parcels that meet only one condition, so the count can only stay the same or grow. Nothing makes it exactly double."
    },
    {
      id: "ch09-q03",
      type: "num",
      prompt: "A city has 200 parcels zoned commercial and 80 parcels within 500 m of a light-rail station. Thirty parcels meet both conditions. How many parcels does `commercial OR near_station` select?",
      answer: 250,
      tol: 0,
      unit: "parcels",
      explain: "200 + 80 − 30 = 250. Subtract the overlap so parcels that meet both conditions are counted only once."
    },
    {
      id: "ch09-q04",
      type: "mc",
      prompt: "A parcel shares one boundary line with a floodplain polygon but no area. Which spatial predicate is true for the parcel and the floodplain?",
      choices: ["Within", "Touches", "Contains", "Disjoint"],
      answer: 1,
      explain: "Touches is true when two shapes share boundary points but no interior. Within would require the whole parcel to lie inside the floodplain. Disjoint is false because the shapes share a boundary."
    },
    {
      id: "ch09-q05",
      type: "tf",
      prompt: "If feature A is within feature B, then feature B contains feature A.",
      answer: true,
      explain: "Within and contains are inverse relationships. Swapping the order of the two layers swaps the predicate."
    },
    {
      id: "ch09-q06",
      type: "mc",
      prompt: "A city engineer needs every road segment that crosses a stream so each crossing can be checked for a culvert. Which operation fits best?",
      choices: [
        "Join each road to its nearest stream with Join attributes by nearest",
        "Select roads by attribute where `surface = 'paved'`",
        "Select roads by location with the intersects predicate against the stream layer",
        "Dissolve the road layer by road name"
      ],
      answer: 2,
      explain: "The question depends on where roads are relative to streams, so it is a selection by location. A nearest join attaches a stream to every road, including roads that never cross one."
    },
    {
      id: "ch09-q07",
      type: "mc",
      prompt: "What does a dissolve operation do?",
      choices: [
        "Merges features that share a field value and removes the lines between them",
        "Splits polygons wherever the boundaries of two input layers cross each other",
        "Creates a zone of fixed width around each feature in the input layer",
        "Copies attributes from one layer to another based on where features fall"
      ],
      answer: 0,
      explain: "Dissolve combines features with the same value in a chosen field. Splitting polygons where boundaries cross describes overlay, not dissolve."
    },
    {
      id: "ch09-q08",
      type: "mc",
      prompt: "A soil layer has 35 map units spread over hundreds of polygons. You add a field holding each unit's hydrologic soil group (A, B, C, or D) and dissolve on that field with multipart output. At most how many features will the output have?",
      choices: ["35", "4", "70", "One per original polygon"],
      answer: 1,
      explain: "With multipart output, each unique value in the dissolve field becomes one feature, so there are at most four. If you split the result into single parts, each separate patch would become its own feature."
    },
    {
      id: "ch09-q09",
      type: "num",
      prompt: "A municipal well is protected by a circular buffer with a 150 m radius. What is the protected area in hectares? (1 ha = 10,000 m²)",
      answer: 7.07,
      tol: 0.05,
      unit: "ha",
      explain: "A = π r² = π × 150² = 70,686 m². Divide by 10,000 to get 7.07 ha."
    },
    {
      id: "ch09-q10",
      type: "num",
      prompt: "A straight 800 m sewer line needs a 10 m construction easement on each side, with round end caps. What is the buffer area in m²?",
      answer: 16314,
      tol: 5,
      unit: "m²",
      explain: "Rectangle: 2 × 10 × 800 = 16,000 m². End caps: π × 10² = 314 m². Total ≈ 16,314 m²."
    },
    {
      id: "ch09-q11",
      type: "mc",
      prompt: "Why should overlapping buffers be dissolved before reporting the total buffered area?",
      choices: [
        "Dissolving converts the buffers to a projected coordinate system",
        "Dissolving removes features smaller than the buffer distance",
        "Buffers cannot be displayed until they are dissolved",
        "Without dissolving, the areas where buffers overlap are counted more than once"
      ],
      answer: 3,
      explain: "Each separate buffer polygon carries its own area, so summing them counts overlap zones two or more times. Dissolving merges them into one polygon with no double counting. Dissolving does not change the coordinate system."
    },
    {
      id: "ch09-q12",
      type: "mc",
      prompt: "A buffer distance of 100 is entered for a layer stored in WGS 84 latitude and longitude. What is the most likely problem?",
      choices: [
        "The distance is read as 100 degrees, not 100 meters",
        "The buffers will be squares instead of circles",
        "Only the first feature will be buffered",
        "The buffer will be drawn inside the features instead of outside"
      ],
      answer: 0,
      explain: "Buffer distances are in the layer's CRS units. In a geographic CRS those units are degrees. Reproject to a projected CRS such as UTM before buffering."
    },
    {
      id: "ch09-q13",
      type: "mc",
      prompt: "County rules require 30 m setbacks for perennial streams and 15 m for intermittent streams. The stream layer has a `setback_m` field. Which approach creates the correct setback zones in one step?",
      choices: [
        "A multi-ring buffer at 15 and 30 m around every stream in the layer",
        "A fixed 30 m buffer on all streams, which covers both setback rules",
        "A variable-distance buffer that reads `setback_m` for each stream",
        "A dissolve of the stream layer by `setback_m`, then a 30 m buffer"
      ],
      answer: 2,
      explain: "A variable-distance buffer gives each stream its own distance from the attribute. A multi-ring buffer would draw both 15 m and 30 m rings around every stream, and a fixed 30 m buffer would over-restrict intermittent streams."
    },
    {
      id: "ch09-q14",
      type: "mc",
      prompt: "Which overlay keeps all of the area from both input layers?",
      choices: ["Intersect", "Clip", "Erase", "Union"],
      answer: 3,
      explain: "Union keeps everything from both layers, splitting polygons where boundaries cross. Intersect keeps only the shared area, and clip and erase keep only parts of the input layer."
    },
    {
      id: "ch09-q15",
      type: "mc",
      prompt: "You clip a statewide roads layer with a county boundary polygon. Which attributes does the output have?",
      choices: [
        "Road attributes and county attributes",
        "Only road attributes",
        "Only county attributes",
        "No attributes, only geometry"
      ],
      answer: 1,
      explain: "Clip trims the input's geometry to the clip outline but keeps only the input's attributes. Intersect is the tool that would add the county attributes as well."
    },
    {
      id: "ch09-q16",
      type: "mc",
      prompt: "A developer wants the part of a parcel that lies outside a wetland, to count as buildable area. Which overlay gives that area directly?",
      choices: [
        "Intersect the parcel with the wetland layer",
        "Clip the parcel with the wetland layer",
        "Union the parcel and wetland layers",
        "Erase (Difference) the wetland layer from the parcel"
      ],
      answer: 3,
      explain: "Erase keeps the parts of the input outside the erase layer. Intersect and clip would return the opposite, the part inside the wetland."
    },
    {
      id: "ch09-q17",
      type: "mc",
      prompt: "The input layer is a watershed polygon and the second layer is a soils layer that covers only the eastern half of the watershed. How do identity and intersect differ in this case?",
      choices: [
        "Identity keeps only the eastern half; intersect keeps the whole watershed",
        "Identity keeps the whole watershed; intersect keeps only the eastern half",
        "Identity drops the watershed attributes and keeps only the soil attributes",
        "They give the same result whenever one layer covers only part of the other"
      ],
      answer: 1,
      explain: "Identity keeps all of the input layer's area and adds the second layer's attributes where they overlap. Intersect keeps only the area covered by both, so the western half would be lost."
    },
    {
      id: "ch09-q18",
      type: "tf",
      prompt: "After an intersect, an area field copied from the input layer automatically updates to the area of each new, smaller piece.",
      answer: false,
      explain: "Copied fields keep their original values. Recompute area with the Field calculator (`$area`) after any overlay that splits features."
    },
    {
      id: "ch09-q19",
      type: "mc",
      prompt: "What usually causes sliver polygons in an overlay?",
      choices: [
        "Using a buffer distance larger than the width of the features",
        "Running a dissolve on one layer before the overlay is done",
        "The same boundary digitized slightly differently in the two layers",
        "Overlaying two layers that use different attribute field names"
      ],
      answer: 2,
      explain: "When a shared boundary, such as a county line, was digitized separately for each layer, the two versions do not match exactly. The overlay creates thin polygons in the gaps between them."
    },
    {
      id: "ch09-q20",
      type: "mc",
      prompt: "You need to add each parcel's FEMA flood zone code to the parcel attribute table. The two layers share no key field. Which tool fits?",
      choices: [
        "Join attributes by location",
        "A table join on parcel ID",
        "Dissolve by flood zone",
        "Clip the flood zones to the parcels"
      ],
      answer: 0,
      explain: "A spatial join links records by location when there is no common key. A table join needs a field both layers share, and the flood zone layer has no parcel IDs."
    },
    {
      id: "ch09-q21",
      type: "mc",
      prompt: "You need the number of traffic crashes (points) recorded in each census tract (polygons). Which operation gives one row per tract with a count?",
      choices: [
        "Buffer the crash points and dissolve",
        "Select tracts by attribute where crashes > 0",
        "Clip the crash points to the tract layer",
        "Count points in polygon, a summary spatial join"
      ],
      answer: 3,
      explain: "Count points in polygon adds a count field to each tract. Clipping returns the crash points themselves, not a count per tract."
    },
    {
      id: "ch09-q22",
      type: "tf",
      prompt: "The network (street) distance between two addresses is never shorter than the straight-line distance between them.",
      answer: true,
      explain: "A straight line is the shortest path between two points on a plane. A street route can only equal it when the street runs straight between them."
    },
    {
      id: "ch09-q23",
      type: "num",
      prompt: "Travel times (minutes) on a street network are S–P 3, S–Q 7, P–Q 2, P–R 9, Q–R 3, Q–T 8, and R–T 2. What is the shortest travel time from S to T?",
      answer: 10,
      tol: 0,
      unit: "minutes",
      explain: "S–P–Q–R–T = 3 + 2 + 3 + 2 = 10 min. Other routes are longer: S–Q–R–T = 12, S–P–Q–T = 13, S–P–R–T = 14, S–Q–T = 15."
    },
    {
      id: "ch09-q24",
      type: "mc",
      prompt: "In network analysis, what is impedance?",
      choices: [
        "The number of nodes a route passes through between start and end",
        "The maximum speed allowed on each road segment in the network",
        "The cost of traveling along an edge, such as length or travel time",
        "The positional error of the network's edge and node coordinates"
      ],
      answer: 2,
      explain: "Impedance is the cost the shortest-path search adds up along a route. Speed limits can be used to compute a travel-time impedance, but the speed itself is not the impedance."
    },
    {
      id: "ch09-q25",
      type: "mc",
      prompt: "A fire department wants to map all streets a proposed station could reach within a 4-minute drive. Which analysis fits?",
      choices: [
        "A 4 km circular buffer around the station",
        "A service area from the station with a 4-minute travel-time limit",
        "Shortest path (point to point) from the station to city hall",
        "A distance matrix between all fire hydrants"
      ],
      answer: 1,
      explain: "A service area follows the street network and stops when travel time reaches the limit. A circular buffer ignores the street layout, one-way streets, and speeds."
    },
    {
      id: "ch09-q26",
      type: "mc",
      prompt: "Intersecting a 50 ha catchment with land use gives 20 ha of roofs and pavement (CN 98) and 30 ha of lawns (CN 61). What is the area-weighted composite curve number?",
      choices: ["79.5", "61.0", "75.8", "98.0"],
      answer: 2,
      explain: "(20 × 98 + 30 × 61) ÷ 50 = (1,960 + 1,830) ÷ 50 = 75.8. The value 79.5 is the plain average of 98 and 61, which ignores that lawns cover more of the catchment."
    },
    {
      id: "ch09-q27",
      type: "tf",
      prompt: "A plain average of curve numbers equals the area-weighted average when every land-use piece has the same area.",
      answer: true,
      explain: "With equal areas every weight is the same, so the weighted average reduces to the plain average."
    },
    {
      id: "ch09-q28",
      type: "tf",
      prompt: "Selecting features by location changes the geometry of the selected features.",
      answer: false,
      explain: "A selection only flags which features meet the condition. Overlay tools such as clip and intersect are what create new geometry."
    }
  ]
});
