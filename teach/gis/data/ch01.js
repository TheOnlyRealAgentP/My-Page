GIS.chapter({
  id: "ch01",
  num: 1,
  title: "Introduction",
  blurb: "What a geographic information system is, what it is made of, where it came from, and why tying data to location helps engineers and scientists answer real questions.",
  objectives: [
    "Define a geographic information system (GIS) and explain how it differs from a drawing or mapping program.",
    "Name the five components of a GIS and give an example of each.",
    "Distinguish spatial (location) data from attribute data and describe how a GIS links them.",
    "Describe major milestones in the history of GIS and the technologies that drove them.",
    "Explain how civil engineers and scientists use GIS for planning, design and asset management.",
    "Convert between map distance and ground distance using a representative fraction."
  ],
  guide: [
    {
      heading: "What a GIS is",
      paragraphs: [
        "A **geographic information system (GIS)** is a computer-based system for collecting, storing, editing, analyzing and displaying data that are tied to places on Earth. Each feature in a GIS has a known position in a real-world coordinate system. That lets the software measure distances and areas, find what lies near or inside something else, and combine data from different sources.",
        "A GIS is more than a map-drawing program. A drawing program can make a good-looking map, but it does not know that a line is a sewer main 300 m long or which parcels it passes under. A GIS stores both the geometry and the facts about each feature, so it can answer questions such as 'Which homes lie within 150 m of the proposed pipeline?'",
        "**Geographic information science (GIScience)** is the study of the ideas behind these systems: how to represent the world in a computer, how to measure Earth, and how errors move through an analysis. This course covers both the science and the QGIS software."
      ],
      bullets: [
        "**Location**: What is at this place? (Who owns the parcel at 400 N 100 E?)",
        "**Condition**: Where are the places that meet a set of conditions? (Where is land flatter than 5% and outside the floodplain?)",
        "**Trend**: What has changed over time? (How much farmland became housing since 2000?)",
        "**Pattern**: Are features clustered, spread out or random? (Do crashes cluster at certain intersections?)",
        "**Modeling**: What if? (Which streets flood in a 100-year storm?)"
      ]
    },
    {
      heading: "The components of a GIS",
      paragraphs: [
        "A GIS is usually described as five parts working together. Remove any one of them and the system stops being useful.",
        "Data are often the most expensive and longest-lived part. Computers and software are replaced every few years, but a well-built parcel or utility layer may be maintained for decades, so it pays to collect it carefully and document it."
      ],
      bullets: [
        "**Hardware**: computers, servers, GNSS receivers, scanners, drones and the mobile devices used in the field.",
        "**Software**: programs that store, analyze and display spatial data, such as QGIS (free and open source) and ArcGIS Pro (commercial). Many build on shared open-source libraries such as GDAL and PROJ.",
        "**Data**: the layers of features and their attributes, plus the metadata that describe them.",
        "**People**: the analysts, technicians, engineers, managers and members of the public who create and use the results.",
        "**Methods**: the procedures and standards for how data are collected, checked, analyzed and shared."
      ],
      qgis: "QGIS is free, open-source desktop GIS software. Its main window holds the map canvas, the Layers panel (the layer at the top of the list draws on top), the Browser panel for finding data, and the Processing Toolbox (Processing → Toolbox), which holds hundreds of analysis tools."
    },
    {
      heading: "Spatial data and attribute data",
      paragraphs: [
        "Geographic data describe where something is, what it is like, and often when it was observed. The 'where' is **spatial data**: coordinates that fix a feature's position and shape. The 'what' is **attribute data**: descriptive values such as a road's name, a pipe's diameter or a soil's texture.",
        "A GIS keeps the two linked. Each feature in a layer has one row in an **attribute table**, and each column (field) holds one attribute. Select a row in the table and the matching feature is highlighted on the map; select a feature on the map and its row is highlighted in the table.",
        "A **layer** usually holds one theme, such as streams, parcels or elevation. Layers that cover the same area can be stacked and analyzed together because they share a common coordinate system."
      ],
      example: {
        prompt: "A city stores its fire hydrants in a GIS. Sort these items into spatial data and attribute data: easting and northing, ID number, year installed, rated flow, date of last inspection.",
        steps: [
          "Spatial data fix where the feature is. The easting and northing are coordinates, so they are spatial data.",
          "Everything else describes the hydrant rather than locating it, so it goes in the attribute table: ID, install year, rated flow and inspection date."
        ],
        answer: "Spatial: easting and northing. Attributes: ID, install year, rated flow, last inspection date."
      },
      qgis: "Use the Identify Features tool and click a feature to see its attributes. Right-click a layer and choose Open Attribute Table (F6) to see every feature's attributes at once."
    },
    {
      heading: "Why location matters",
      paragraphs: [
        "Location is a key that links data with nothing else in common. A county parcel layer, a FEMA flood map and a USGS elevation model come from different agencies with different ID numbers, but they can be combined because each feature sits at a known place on Earth. Stacking layers and combining their attributes by location is called **overlay**, one of the core GIS operations.",
        "Waldo Tobler's **first law of geography** says that everything is related to everything else, but near things are more related than distant things. Neighboring wells tend to have similar water levels, and nearby parcels tend to have similar land values. Much of spatial analysis builds on this idea.",
        "A classic example predates computers. During the 1854 cholera outbreak in London, physician John Snow mapped the homes of people who died. The deaths clustered around a public water pump on Broad Street, which pointed to contaminated water as the source. The map turned a list of cases into a pattern that suggested a cause."
      ]
    },
    {
      heading: "A short history of GIS",
      paragraphs: [
        "Before computers, planners overlaid hand-drawn maps on clear plastic sheets to find places that met several conditions at once. Landscape architect Ian McHarg made this approach well known in his 1969 book Design with Nature. It is the manual version of a GIS overlay.",
        "The first system usually called a GIS was the **Canada Geographic Information System (CGIS)**, started in the 1960s under Roger Tomlinson to analyze land data for the Canada Land Inventory. Around the same time, the Harvard Laboratory for Computer Graphics built early mapping software and trained people who went on to start the GIS industry. Esri was founded in 1969 and released ARC/INFO in 1982, one of the first widely used commercial GIS packages.",
        "Data and positioning technology drove later growth. Landsat satellites have imaged Earth's land surface since 1972. The U.S. Census Bureau built the TIGER street and boundary files for the 1990 census. GPS was declared fully operational in 1995, putting accurate positions in the hands of field crews. Since then, web maps, free and open-source software such as QGIS (begun in 2002), lidar, drones and open government data have made GIS a routine engineering tool."
      ],
      bullets: [
        "1854: John Snow's cholera map in London",
        "1960s: CGIS in Canada; Harvard Laboratory for Computer Graphics",
        "1969: McHarg's Design with Nature; Esri founded",
        "1972: First Landsat satellite",
        "1982: ARC/INFO released",
        "1990: Census TIGER files used for the decennial census",
        "1995: GPS fully operational",
        "2002: QGIS project begins",
        "2005: Google Earth brings a 3D globe to the public"
      ]
    },
    {
      heading: "GIS in civil engineering and science",
      paragraphs: [
        "Civil engineers work on infrastructure spread across the landscape, so much of their data is spatial. GIS helps them inventory assets, plan projects, check regulations and explain plans to the public. It usually feeds design tools such as CAD and hydraulic models rather than replacing them.",
        "Scientists use GIS to study patterns and processes. Hydrologists delineate watersheds and route streamflow, ecologists map habitat, geologists map faults and landslides, and public health researchers map disease. In each case, location affects the answer."
      ],
      bullets: [
        "**Transportation**: pavement condition, crash locations, traffic counts and corridor planning.",
        "**Water resources**: watershed delineation from elevation data, floodplain mapping, stormwater inventories and flood forecasting.",
        "**Utilities**: water, sewer and power networks with pipe size, material and age for maintenance planning.",
        "**Land development**: parcels, zoning, slopes and soils for site selection and permitting.",
        "**Environmental**: wetlands, habitat and contaminated sites for impact studies.",
        "**Construction and surveying**: existing conditions, earthwork estimates from surfaces and as-built records.",
        "**Emergency management**: evacuation routes, shelter locations and damage assessment."
      ]
    },
    {
      heading: "Map scale",
      paragraphs: [
        "**Map scale** is the ratio between a distance on a map and the matching distance on the ground. It is often written as a **representative fraction (RF)** such as 1:24,000, meaning 1 unit on the map equals 24,000 of the same units on the ground. Because the units cancel, an RF works in inches, centimeters or any other unit. Scale can also be given in words ('1 inch = 2,000 feet') or as a graphic scale bar, which stays correct when a map is enlarged or shrunk.",
        "A **large-scale** map has a larger fraction (smaller denominator), such as 1:1,200. It covers a small area in detail. A **small-scale** map, such as 1:1,000,000, covers a large area with little detail. The terms are easy to mix up; remember that the fraction 1/1,200 is a bigger number than 1/1,000,000.",
        "Digital data can be zoomed to any size on screen, but they keep the accuracy and detail of their source. A stream digitized from a 1:100,000 map does not become more accurate when you zoom in to 1:1,000."
      ],
      formula: {
        expr: "ground distance = map distance × scale denominator",
        where: [
          "map distance: the distance measured on the map",
          "scale denominator: the second number in the RF (24,000 for 1:24,000)",
          "both distances are in the same unit; convert units afterward"
        ]
      },
      example: {
        prompt: "On a 1:24,000 USGS topographic map, two culverts are 4.5 cm apart. How far apart are they on the ground?",
        steps: [
          "Ground distance = 4.5 cm × 24,000 = 108,000 cm.",
          "108,000 cm ÷ 100 = 1,080 m.",
          "1,080 m ÷ 1,609.344 m/mi = 0.67 mi."
        ],
        answer: "1,080 m (about 0.67 mi)"
      },
      qgis: "The Scale box in the status bar at the bottom of the QGIS window shows the current map scale; type a value such as 1:24000 to zoom to it. In a print layout, add a scale bar with Add Item → Add Scale Bar."
    },
    {
      heading: "Data sources and the GIS workflow",
      paragraphs: [
        "GIS data come from field surveys with total stations and GNSS receivers, from **remote sensing** (satellite images, aerial photos, lidar and drone surveys), from digitized paper maps, and from tables that include addresses or coordinates. Much basic U.S. data is free from public agencies: the USGS National Map (elevation, hydrography, imagery), Census TIGER/Line files (roads and boundaries), FEMA flood hazard layers, and state portals such as the Utah Geospatial Resource Center (UGRC).",
        "A typical project follows a cycle: find or collect data, bring it into a common coordinate system, check and edit it, analyze it, and present the results as maps, tables or reports. Results are only as good as the inputs, so check each dataset's source, date, accuracy and coordinate system before using it. That descriptive information is called **metadata**."
      ],
      qgis: "Add data with Layer → Add Layer (vector, raster, delimited text and more) or open the Data Source Manager (Ctrl+L). For a quick basemap, expand XYZ Tiles in the Browser panel and double-click OpenStreetMap."
    }
  ],
  cards: [
    { front: "Geographic information system (GIS)", back: "A computer-based system for collecting, storing, editing, analyzing and displaying data tied to locations on Earth." },
    { front: "GIScience", back: "The study of the concepts behind GIS: representing the world digitally, measuring Earth, analyzing spatial data and tracking how errors spread." },
    { front: "Five components of a GIS", back: "Hardware, software, data, people and methods (procedures). All five must work together." },
    { front: "Spatial data", back: "Data that give a feature's location and shape, usually as coordinates in a defined coordinate system." },
    { front: "Attribute data", back: "Descriptive values about a feature that do not give its location, such as a pipe's diameter, a road's name or a parcel's owner." },
    { front: "Feature", back: "One real-world object represented in a GIS layer, such as a single hydrant, road segment or parcel." },
    { front: "Layer", back: "A set of features or cells of one theme (streams, parcels, elevation) stored together and drawn as a unit." },
    { front: "Attribute table", back: "A table with one row per feature and one column (field) per attribute, linked to the features' geometry." },
    { front: "Overlay", back: "Combining two or more layers that cover the same area so each output location carries attributes from all inputs." },
    { front: "Tobler's first law of geography", back: "Everything is related to everything else, but near things are more related than distant things." },
    { front: "John Snow's 1854 map", back: "A map of cholera deaths in London that showed a cluster around the Broad Street water pump. An early example of spatial analysis." },
    { front: "CGIS", back: "Canada Geographic Information System, started in the 1960s under Roger Tomlinson for the Canada Land Inventory. Usually called the first GIS." },
    { front: "Ian McHarg", back: "Landscape architect whose 1969 book Design with Nature made overlaying map layers to find suitable land widely known." },
    { front: "Landsat", back: "U.S. Earth-observing satellite program that has imaged the land surface since 1972. A major source of land cover data." },
    { front: "GNSS", back: "Global Navigation Satellite System: any satellite positioning system, such as the U.S. GPS, Europe's Galileo, Russia's GLONASS or China's BeiDou." },
    { front: "TIGER/Line files", back: "U.S. Census Bureau files of roads, boundaries and other features, first built for the 1990 census and free to download." },
    { front: "Remote sensing", back: "Collecting information about Earth's surface from a distance, for example with satellite images, aerial photos or lidar." },
    { front: "Lidar", back: "Light detection and ranging: a sensor that times laser pulses to measure millions of 3D points, often used to build detailed elevation models." },
    { front: "Map scale", back: "The ratio of a distance on a map to the matching distance on the ground." },
    { front: "Representative fraction (RF)", back: "Map scale written as a unitless ratio, such as 1:24,000: 1 map unit equals 24,000 of the same units on the ground." },
    { front: "Large-scale map", back: "A map with a large RF (small denominator), such as 1:1,200. Covers a small area in great detail." },
    { front: "Small-scale map", back: "A map with a small RF (large denominator), such as 1:1,000,000. Covers a large area with little detail." },
    { front: "Graphic scale (scale bar)", back: "A bar marked with ground distances. Unlike an RF or verbal scale, it stays correct when the map is enlarged or reduced." },
    { front: "Spatial query", back: "A question answered by location, such as 'Which parcels are within 50 m of the creek?' An attribute query uses only table values." },
    { front: "Metadata", back: "Data about data: source, date, coordinate system, accuracy, attribute definitions and contact information for a dataset." },
    { front: "Open-source GIS", back: "GIS software whose source code is public and may be used, changed and shared under its license. QGIS, GDAL and PROJ are examples." }
  ],
  questions: [
    {
      id: "ch01-q01",
      type: "mc",
      prompt: "Which description best fits a geographic information system?",
      choices: [
        "A satellite system that reports a receiver's latitude and longitude",
        "A drawing program used to make attractive printed maps for reports",
        "A computer system that stores, analyzes and displays data linked to locations on Earth",
        "A database of descriptive records, such as names and dates, with no locations"
      ],
      answer: 2,
      explain: "A GIS ties data to real-world locations and can analyze them. A drawing program can make a map, but it does not store real-world coordinates or link features to attributes for analysis. GPS is a positioning system that can feed data into a GIS."
    },
    {
      id: "ch01-q02",
      type: "mc",
      prompt: "A city's hydrant layer includes the items below. Which one is attribute data rather than spatial data?",
      choices: [
        "Rated flow in gallons per minute",
        "Easting coordinate",
        "Northing coordinate",
        "The point geometry drawn on the map"
      ],
      answer: 0,
      explain: "Spatial data place a feature; attribute data describe it. The easting, northing and point geometry all give location. Flow rate describes the hydrant, so it is an attribute."
    },
    {
      id: "ch01-q03",
      type: "mc",
      prompt: "Which list gives the five components usually used to describe a GIS?",
      choices: [
        "Points, lines, polygons, rasters and TINs",
        "Satellites, receivers, control stations, users and signals",
        "Latitude, longitude, elevation, time and accuracy",
        "Hardware, software, data, people and methods"
      ],
      answer: 3,
      explain: "A GIS is hardware, software, data, people and methods working together. Points, lines and polygons are data model elements, and satellites and receivers describe a GNSS, not a GIS."
    },
    {
      id: "ch01-q04",
      type: "tf",
      prompt: "A map drawn in a graphics program, with no real-world coordinates attached to its features, can measure the length of a road in meters as reliably as a GIS layer.",
      answer: false,
      explain: "Without a coordinate system, the program only knows page or screen units. A GIS stores features in real-world coordinates, which is what makes measurement and overlay possible."
    },
    {
      id: "ch01-q05",
      type: "mc",
      prompt: "What does Tobler's first law of geography state?",
      choices: [
        "Near things are more related than distant things",
        "Every map projection distorts area, shape or distance",
        "Large-scale maps show smaller areas than small-scale maps",
        "Every feature must have at least one attribute"
      ],
      answer: 0,
      explain: "Tobler's law says nearby places tend to be more alike than distant ones, an idea behind much of spatial analysis. The other statements are about projections, map scale and data structure, not Tobler's law."
    },
    {
      id: "ch01-q06",
      type: "mc",
      prompt: "What did John Snow's 1854 map of cholera deaths in London show?",
      choices: [
        "Deaths were spread evenly across the city, which suggested the disease traveled through the air",
        "Deaths clustered around the Broad Street water pump, which pointed to contaminated water",
        "Deaths clustered near hospitals, which suggested the disease spread from patients",
        "Deaths were highest along the river, which suggested flooding caused the outbreak"
      ],
      answer: 1,
      explain: "Snow's map showed a cluster of deaths around one public pump. Mapping the cases revealed a spatial pattern that a plain list could not, and the pattern pointed to the water supply."
    },
    {
      id: "ch01-q07",
      type: "mc",
      prompt: "The Canada Geographic Information System (CGIS), often called the first GIS, was built in the 1960s mainly to do what?",
      choices: [
        "Guide ships along Canada's coasts",
        "Count Canada's population for the national census",
        "Analyze land capability data for the Canada Land Inventory",
        "Track military aircraft"
      ],
      answer: 2,
      explain: "Roger Tomlinson's team built CGIS to store and overlay land capability maps (agriculture, forestry, recreation, wildlife and more) for the Canada Land Inventory. It was a land analysis system, not a navigation or census tool."
    },
    {
      id: "ch01-q08",
      type: "mc",
      prompt: "Why is Ian McHarg's 1969 book Design with Nature remembered in GIS history?",
      choices: [
        "It showed how overlaying transparent map layers could find land suited to a use",
        "It introduced the first computer program for drawing contour lines",
        "It described the first satellite positioning system",
        "It defined the Universal Transverse Mercator grid"
      ],
      answer: 0,
      explain: "McHarg stacked transparent maps of factors such as slope, soils and land value to find suitable sites. GIS overlay does the same thing digitally."
    },
    {
      id: "ch01-q09",
      type: "tf",
      prompt: "GPS was declared fully operational in the mid-1990s, which made accurate field positions widely available for building GIS data.",
      answer: true,
      explain: "The U.S. declared GPS fully operational in 1995. Field crews could then collect coordinates directly, which sped up data collection for GIS."
    },
    {
      id: "ch01-q10",
      type: "mc",
      prompt: "Which of these map scales is the largest scale?",
      choices: [
        "1:1,000,000",
        "1:100,000",
        "1:24,000",
        "1:1,200"
      ],
      answer: 3,
      explain: "Scale is a fraction, and 1/1,200 is the largest of these fractions. A 1:1,200 map shows a small area in great detail. A 1:1,000,000 map is the smallest scale even though its denominator is the biggest number."
    },
    {
      id: "ch01-q11",
      type: "num",
      prompt: "On a 1:24,000 topographic map, a section of canal measures 3.5 cm. What is its length on the ground, in meters?",
      answer: 840,
      tol: 1,
      unit: "m",
      explain: "Ground distance = 3.5 cm × 24,000 = 84,000 cm. 84,000 cm ÷ 100 = 840 m."
    },
    {
      id: "ch01-q12",
      type: "num",
      prompt: "A road 2.4 km long is drawn on a 1:50,000 map. How long is it on the map, in centimeters?",
      answer: 4.8,
      tol: 0.05,
      unit: "cm",
      explain: "2.4 km = 240,000 cm. Map distance = 240,000 cm ÷ 50,000 = 4.8 cm."
    },
    {
      id: "ch01-q13",
      type: "mc",
      prompt: "Compared with a large-scale map printed at the same size, what does a small-scale map show?",
      choices: [
        "A smaller area in more detail",
        "A larger area in less detail",
        "The same area with more accurate coordinates",
        "The same area with a larger representative fraction"
      ],
      answer: 1,
      explain: "A small-scale map has a small fraction (large denominator), so each map centimeter covers more ground. It shows a larger area with less detail. A large-scale map is the one that shows a small area in detail."
    },
    {
      id: "ch01-q14",
      type: "mc",
      prompt: "Which of these is a spatial query rather than an attribute query?",
      choices: [
        "Which pipes were installed before 1970?",
        "Which roads have a speed limit above 45 mph?",
        "Which parcels are zoned R-1?",
        "Which parcels lie within 50 m of the creek?"
      ],
      answer: 3,
      explain: "Only the creek question depends on where features are relative to each other. The others can be answered from values in the attribute table alone."
    },
    {
      id: "ch01-q15",
      type: "mc",
      prompt: "A city engineer wants to find every water main under streets scheduled for repaving next summer, so pipe replacement can happen first. The repaving list is a spreadsheet of street segment IDs, and streets and mains are GIS layers. Which approach gives a complete, reliable list?",
      choices: [
        "Join the spreadsheet to the streets by segment ID, then select the mains that intersect the scheduled streets",
        "Sort the water main table by install year, then select the oldest mains in the city for replacement first",
        "Color the streets by repaving status, then read the pipe IDs off the screen and type them into a list",
        "Convert the water main layer to a raster, then join the raster cells to the spreadsheet by segment ID"
      ],
      answer: 0,
      explain: "The segment ID links the spreadsheet to street features (an attribute join), and shared location links streets to mains (a spatial selection). Coloring streets shows the pattern but does not produce a reliable list of mains."
    },
    {
      id: "ch01-q16",
      type: "mc",
      prompt: "Which of these is an example of remote sensing data?",
      choices: [
        "A traverse measured with a total station",
        "A parcel deed from the county recorder",
        "A lidar point cloud collected from an aircraft",
        "Answers to a census questionnaire"
      ],
      answer: 2,
      explain: "Remote sensing measures the surface from a distance, here with laser pulses from an aircraft. A total station traverse is a ground survey made by setting up on points at the site."
    },
    {
      id: "ch01-q17",
      type: "tf",
      prompt: "Because digital data can be zoomed to any scale, streams digitized from a 1:100,000 map are as accurate as a field survey when viewed at 1:1,000.",
      answer: false,
      explain: "Zooming changes the display, not the accuracy. The data keep the detail and position error of their 1:100,000 source; a 0.5 mm line on that map already covers 50 m on the ground."
    },
    {
      id: "ch01-q18",
      type: "mc",
      prompt: "Which of these is the best example of the 'methods' component of a GIS?",
      choices: [
        "A rugged tablet computer that field crews carry to collect hydrant locations",
        "A written procedure for how crews collect, check and upload hydrant locations",
        "The hydrant layer, with its locations, attributes and inspection dates",
        "The QGIS software that crews use to check and upload hydrant locations"
      ],
      answer: 1,
      explain: "Methods are the procedures and standards for doing the work. The tablet is hardware, the layer is data, and QGIS is software."
    },
    {
      id: "ch01-q19",
      type: "mc",
      prompt: "What does a single GIS layer most often hold?",
      choices: [
        "Every type of feature in a city, mixed together in one table",
        "The map title, legend, scale bar and north arrow for one map",
        "Features or cells of one theme, such as all streams in a county",
        "Only attribute tables, with no geometry or coordinate system"
      ],
      answer: 2,
      explain: "Layers are organized by theme so they can be turned on and off, styled and analyzed separately. Map titles and legends belong to a map layout, not a data layer."
    },
    {
      id: "ch01-q20",
      type: "mc",
      prompt: "A transportation engineer needs a list of highway segments that cross the 100-year floodplain so their culverts can be checked. Which data and operation fit best?",
      choices: [
        "The highway layer and a county population layer, joined by matching county names",
        "The highway layer and the FEMA flood hazard layer, combined with an intersect overlay",
        "The FEMA flood hazard layer alone, with its polygons sorted from largest to smallest area",
        "A land use raster of the state, colored by class and checked by eye for flooded roads"
      ],
      answer: 1,
      explain: "The question is where highways and floodplains occupy the same ground, which is an overlay of the two layers. An intersect returns the highway pieces inside the floodplain, with attributes from both layers."
    },
    {
      id: "ch01-q21",
      type: "tf",
      prompt: "In a GIS, selecting a row in a layer's attribute table highlights the matching feature on the map.",
      answer: true,
      explain: "Each row in the attribute table is linked to one feature's geometry, so selections are shared between the table and the map."
    },
    {
      id: "ch01-q22",
      type: "mc",
      prompt: "Which 1970s development first gave GIS users repeated, consistent satellite images of most of Earth's land surface?",
      choices: [
        "The Landsat program",
        "The Global Positioning System",
        "Google Earth",
        "Airborne lidar"
      ],
      answer: 0,
      explain: "Landsat 1 launched in 1972, and the series has imaged the land surface ever since. GPS provides positions, not images, and Google Earth (2005) and widespread lidar came much later."
    },
    {
      id: "ch01-q23",
      type: "mc",
      prompt: "What does it mean that QGIS is open-source software?",
      choices: [
        "It can open only open data formats downloaded from public government portals",
        "It is free to download but may not be used for paid or commercial engineering work",
        "It runs only in a web browser and stores every project on a public server",
        "Its source code is public and may be used, changed and shared under its license"
      ],
      answer: 3,
      explain: "Open source refers to the license and public source code. QGIS (GNU GPL) may be used for commercial work, runs on desktop computers, and opens many proprietary formats as well as open ones."
    },
    {
      id: "ch01-q24",
      type: "mc",
      prompt: "Why is location such a useful key for combining datasets?",
      choices: [
        "Every agency assigns the same ID numbers to features, so records always match",
        "Features from different sources can be matched by where they are, even with no shared ID",
        "Location data never contain errors, so matches by position are always exact",
        "Attribute tables cannot be joined in any other way, since they lack key fields"
      ],
      answer: 1,
      explain: "Agencies rarely share ID numbers, but features at the same place on Earth can still be matched by overlay. Location data do contain errors, and tables can also be joined by shared key fields."
    },
    {
      id: "ch01-q25",
      type: "mc",
      prompt: "A state bridge office has inspection ratings for every bridge from 2005 to today. What type of GIS question is 'How has the condition of bridges in the northern region changed since 2005?'",
      choices: [
        "A location question",
        "A modeling (what-if) question",
        "A trend question",
        "A pattern question"
      ],
      answer: 2,
      explain: "Asking what changed over time is a trend question. A location question asks what is at a place, and a modeling question asks what would happen under a scenario."
    },
    {
      id: "ch01-q26",
      type: "tf",
      prompt: "Geographic data describe where something is and what it is like, and often when it was observed.",
      answer: true,
      explain: "Location, attributes and time are the three basic parts of geographic data. Time matters for anything that changes, such as land use or pavement condition."
    },
    {
      id: "ch01-q27",
      type: "mc",
      prompt: "What are the U.S. Census Bureau's TIGER/Line files best known for providing?",
      choices: [
        "Nationwide digital roads and census boundaries",
        "Satellite images of crops and other land cover",
        "Nationwide lidar elevation data and contours",
        "Real-time GPS corrections for field surveys"
      ],
      answer: 0,
      explain: "TIGER was built for the 1990 census to map addresses, roads and census areas nationwide. It remains a free source of roads and boundaries for GIS work."
    },
    {
      id: "ch01-q28",
      type: "mc",
      prompt: "Which item belongs in a dataset's metadata?",
      choices: [
        "The colors, line widths and labels used to draw the layer on your screen",
        "The number of times the file has been opened and by which computers",
        "The source, collection date, coordinate system and accuracy of the data",
        "The printer, paper size and page layout used for the final printed map"
      ],
      answer: 2,
      explain: "Metadata describe the data themselves so others can judge whether to use them. Display colors and printers are about one map, not the dataset."
    }
  ]
});
