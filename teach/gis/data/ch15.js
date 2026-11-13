GIS.chapter({
  id: "ch15",
  num: 15,
  title: "New Developments in GIS",
  blurb: "The trends reshaping GIS work, including web and cloud platforms, open-source tools, real-time sensors, big data, GeoAI, 3D digital twins and mobile field apps, and the privacy and ethics questions that come with them.",
  objectives: [
    "Describe how web GIS delivers maps, data and analysis as services, and tell map image services from feature services.",
    "Explain why cloud platforms and cloud-optimized formats change how large imagery collections are analyzed.",
    "Identify common open-source GIS tools and open data sources, and the responsibilities that come with using them.",
    "Describe how GNSS, drones and Internet of Things sensors feed real-time and big geospatial data.",
    "Explain how machine learning is used in GeoAI and why its results still need independent accuracy assessment.",
    "Define a digital twin and explain how 3D GIS and BIM work together on infrastructure projects.",
    "Evaluate the privacy risks of location data and apply practices that protect the people in the data."
  ],
  guide: [
    {
      heading: "Web GIS and map services",
      paragraphs: [
        "In **web GIS**, maps, data and analysis live on servers and are delivered over the internet. A browser or mobile app (the client) sends a request, and a server sends back a map, data or a result. Many people can use the same up-to-date data without copying files around.",
        "Data are shared through **services**, which follow standards so any client can use them. The Open Geospatial Consortium (OGC) publishes the most common ones. A **Web Map Service (WMS)** returns a rendered picture of the map. A **Web Map Tile Service (WMTS)** returns small pre-made image tiles. A **Web Feature Service (WFS)** returns the actual vector features with their attributes, which you can analyze. A **Web Coverage Service (WCS)** returns raster data values. A newer family, the **OGC API** standards (such as OGC API – Features), offers the same kinds of access using modern web conventions.",
        "Most online basemaps are **tiled web maps**. The map is cut into a pyramid of square tiles at fixed zoom levels, so the browser loads only the tiles in view. **Vector tiles** send the geometry instead of pictures and style it on the device, which allows sharp display and on-the-fly restyling."
      ],
      qgis: "Add services with Layer > Add Layer > Add WMS/WMTS Layer, or with the WFS and XYZ Tiles entries in the Browser panel."
    },
    {
      heading: "Cloud platforms and cloud-native data",
      paragraphs: [
        "**Cloud computing** means renting storage and processing power from large data centers instead of owning the hardware. For geospatial work, the big change is that you can bring the analysis to the data. Rather than downloading terabytes of satellite images, you send a script to a platform where the images already sit, and it runs on many machines at once.",
        "Data formats have changed to fit. A **Cloud Optimized GeoTIFF (COG)** is a regular GeoTIFF arranged internally in tiles with lower-resolution overviews, so a program can read just the part it needs over the web. Similar ideas apply to multidimensional arrays (Zarr) and vector tables (GeoParquet). A **SpatioTemporal Asset Catalog (STAC)** is a standard way to describe image collections so they can be searched by place, time and properties.",
        "Providers also publish **analysis-ready data**: imagery already corrected for sensor, atmospheric and geometric effects and placed on consistent grids, so users can start analysis right away."
      ],
      bullets: [
        "Benefits: scale up for big jobs, share results instantly, no local storage limits.",
        "Costs and risks: ongoing fees, dependence on one vendor, internet access, and rules about where sensitive data may be stored."
      ]
    },
    {
      heading: "Open-source software and open data",
      paragraphs: [
        "**Open-source software** publishes its source code under a license that lets anyone use, study, change and share it. QGIS, GRASS GIS, GDAL (a library that reads and writes hundreds of raster and vector formats), PROJ (coordinate transformations), PostGIS (spatial functions for the PostgreSQL database) and GeoServer are widely used open-source tools. Many commercial programs rely on GDAL and PROJ inside. Python and R have open libraries for nearly every GIS task.",
        "Open-source licenses differ. Some, like the GNU GPL that QGIS uses, require that shared modified versions stay open. Others, like the MIT license, are permissive. Open source does not mean unsupported or noncommercial: engineering firms and agencies use it on paid projects, and companies sell support for it.",
        "**Open data** has grown just as fast. The USGS opened the full Landsat archive at no cost in 2008, the European Copernicus program releases Sentinel imagery freely, national lidar programs publish elevation data, and **OpenStreetMap** is a worldwide map built by volunteers under an open license. Free data still needs the same quality checks as any other source, and its license terms (such as attribution) must be followed."
      ]
    },
    {
      heading: "Positioning, drones and the Internet of Things",
      paragraphs: [
        "Positioning keeps improving. Receivers now track several **GNSS** constellations (GPS, GLONASS, Galileo and BeiDou) on multiple frequencies. **Real-time kinematic (RTK)** positioning uses corrections from a nearby base station or a network of reference stations to give centimeter-level positions in the field. A typical phone, by contrast, is good to a few meters under open sky and worse near tall buildings or under trees.",
        "**Drones** (uncrewed aircraft systems, or UAS) collect high-resolution imagery on demand. Photogrammetry software turns overlapping photos into orthomosaics, point clouds and surface models, and drone-mounted lidar can map ground under vegetation. In the US, commercial drone flights must follow FAA rules, such as Part 107 for small drones.",
        "The **Internet of Things (IoT)** is the network of connected sensors that report measurements continuously: stream gages, rain gauges, traffic counters, air-quality monitors, strain gauges on bridges and GPS units on vehicles. Each reading carries a location and a time, so GIS dashboards can map conditions live and send alerts. A **geofence** is a virtual boundary that triggers an action when a tracked device enters or leaves it."
      ]
    },
    {
      heading: "Big geospatial data",
      paragraphs: [
        "**Big data** is data too large, too fast or too varied for ordinary tools to handle. These traits are often called the three V's: **volume** (size), **velocity** (how fast new data arrive) and **variety** (many formats and sources). A fourth, **veracity**, asks how trustworthy the data are.",
        "Geospatial examples include satellite fleets that image most of Earth's land every day, statewide lidar point clouds with billions of points, location traces from millions of phones or vehicles, and streams of IoT sensor readings. Handling them calls for spatial indexing, tiling, parallel processing on many machines, and data cubes that stack images through time.",
        "More data is not automatically better data. Phone-based traffic or mobility data, for example, may underrepresent people without smartphones. The quality ideas from data standards (completeness, accuracy, lineage) apply at any size."
      ]
    },
    {
      heading: "GeoAI and machine learning",
      paragraphs: [
        "**Machine learning (ML)** means algorithms that learn patterns from examples instead of following rules a person wrote. In **supervised learning**, the algorithm trains on labeled examples, such as pixels already tagged as water, forest or pavement. **Deep learning** uses neural networks with many layers; convolutional neural networks are especially good with images. **GeoAI** is the use of these methods with spatial data.",
        "Common GeoAI tasks include **object detection** (finding cars, solar panels or manholes), **semantic segmentation** (labeling every pixel, as when extracting building footprints or road edges), change detection between image dates, and pavement crack detection from vehicle cameras. Large pretrained models for Earth observation imagery are making these tasks faster to set up.",
        "ML results are classifications and predictions, so they need the same accuracy assessment as any other map: an error matrix built from independent reference data. A model can perform well where it was trained and poorly in a new region, season or sensor. Test samples should also be kept spatially separate from training samples. Nearby locations tend to be similar (spatial autocorrelation), so testing on points next to training points overstates how well the model will do elsewhere."
      ],
      bullets: [
        "Training data must represent the places and conditions where the model will be used.",
        "Report accuracy by class, not just one overall number.",
        "Keep a person in the loop for decisions that affect safety or people's property."
      ]
    },
    {
      heading: "3D GIS, BIM and digital twins",
      paragraphs: [
        "GIS is moving from flat maps to 3D: terrain surfaces, lidar point clouds, buildings with heights and roof shapes, and underground utilities. 3D city models are often described by **level of detail (LOD)**, from simple extruded blocks to detailed buildings with roof forms and facades.",
        "**Building Information Modeling (BIM)** is the object-based modeling used to design and build structures. A BIM model holds individual components (beams, pipes, valves) with their properties at construction detail. GIS holds the geographic context: parcels, terrain, networks and the surrounding area. Infrastructure projects increasingly connect the two. One common hurdle is that BIM models often use local project coordinates, which must be tied to a real-world CRS before they line up with GIS data. **IFC** (Industry Foundation Classes) is an open standard for exchanging BIM data.",
        "A **digital twin** is a virtual model of a physical asset or system that stays linked to the real thing through data that are updated over time, often from sensors. A water utility's twin might combine a GIS of its pipe network, a hydraulic model and live pressure readings, so engineers can spot leaks and test what happens if a main is closed before they close it."
      ]
    },
    {
      heading: "Mobile and field data collection",
      paragraphs: [
        "Field data collection has moved from paper forms to apps on phones and tablets. A well-designed form uses drop-down lists of allowed values, required fields and range checks, attaches the GNSS position, time and photos automatically, works offline, and syncs to a central database when a connection returns. These features prevent many attribute errors at the moment of capture.",
        "When a phone's few-meter accuracy is not enough, crews pair it with an external GNSS receiver over Bluetooth to get sub-meter or RTK-level positions. Open-source apps such as QField open QGIS projects in the field, and commercial platforms offer similar tools.",
        "The public collects data too. **Volunteered geographic information (VGI)**, also called crowdsourcing, includes OpenStreetMap edits, citizen-science observations and pothole reports sent through city apps. VGI can be fast and detailed, but its quality varies, so it needs checks before engineering use."
      ]
    },
    {
      heading: "Privacy and ethics of location data",
      paragraphs: [
        "Location data are personal. A few weeks of someone's phone locations reveal where they live and work and which clinics, churches or schools they visit. Removing names does not make such data anonymous. A 2013 study of mobile phone records for 1.5 million people found that just four points in space and time were enough to single out 95% of them. In early 2018, analysts noticed that a fitness app's public heatmap of user workouts revealed the layouts and patrol routes of military bases.",
        "Ways to protect people include collecting only the data a project needs (**data minimization**), aggregating points to areas such as census tracts, **geomasking** (moving points a random distance before sharing), reducing coordinate precision, limiting who can access raw data, deleting data on a set schedule, and getting informed consent. Laws vary by place; the European Union's GDPR, for example, counts location data that can identify a person as personal data.",
        "Ethics in GIS goes beyond privacy. Analysts should ask who benefits from a project and who bears its costs, whether data or AI models are biased against some groups, and whether maps are honest about uncertainty. Engineering codes of ethics, such as the NSPE's, put public safety, health and welfare first, and the GIS Certification Institute publishes a code of ethics for GIS professionals."
      ]
    }
  ],
  cards: [
    { front: "Web GIS", back: "GIS in which maps, data and analysis are hosted on servers and delivered over the internet to browsers and apps as services." },
    { front: "WMS (Web Map Service)", back: "An OGC service that returns a rendered map image for a requested area. Good for display, not for getting feature geometry." },
    { front: "WFS (Web Feature Service)", back: "An OGC service that returns vector features with their attributes, so the client can query and analyze them." },
    { front: "OGC API", back: "A newer family of OGC standards (such as OGC API – Features) that provide map and data access using modern web conventions." },
    { front: "Tiled web map", back: "A basemap cut into a pyramid of small tiles at fixed zoom levels, so the browser loads only the tiles in view." },
    { front: "Vector tiles", back: "Tiles that carry geometry and attributes instead of pictures; the device styles and draws them." },
    { front: "Cloud computing", back: "Renting storage and processing from remote data centers, which lets analysis scale up and run next to large data sets." },
    { front: "Cloud Optimized GeoTIFF (COG)", back: "A GeoTIFF arranged in internal tiles with overviews so programs can read only the part they need over the web." },
    { front: "STAC", back: "SpatioTemporal Asset Catalog: a standard for describing imagery and other geospatial files so they can be searched by place, time and properties." },
    { front: "Analysis-ready data", back: "Imagery already corrected for sensor, atmospheric and geometric effects and placed on consistent grids, ready for analysis." },
    { front: "Open-source software", back: "Software whose source code is published under a license that lets anyone use, study, modify and share it." },
    { front: "GDAL", back: "An open-source library that reads and writes hundreds of raster and vector formats. QGIS and many other programs use it." },
    { front: "PostGIS", back: "An open-source extension that adds geometry types and spatial SQL functions to the PostgreSQL database." },
    { front: "OpenStreetMap", back: "A worldwide map built and maintained by volunteers and released under an open license." },
    { front: "RTK GNSS", back: "Real-time kinematic positioning: uses corrections from a base station or reference network to give centimeter-level positions in the field." },
    { front: "Internet of Things (IoT)", back: "The network of connected sensors and devices that report location-tagged measurements continuously, such as stream gages and traffic counters." },
    { front: "Geofence", back: "A virtual boundary that triggers an action, such as an alert, when a tracked device enters or leaves it." },
    { front: "Big data (three V's)", back: "Data too large or fast for ordinary tools, described by volume, velocity and variety; veracity (trustworthiness) is often added." },
    { front: "GeoAI", back: "Using machine learning and other AI methods on spatial data, such as extracting buildings from imagery or predicting crash risk." },
    { front: "Supervised learning", back: "Machine learning that trains on labeled examples (such as pixels tagged by class) and then predicts labels for new data." },
    { front: "Semantic segmentation", back: "Labeling every pixel of an image with a class, used to extract features such as building footprints or road surfaces." },
    { front: "Spatial autocorrelation (in model testing)", back: "Nearby places tend to be similar, so test points near training points make a model look more accurate than it is elsewhere." },
    { front: "BIM", back: "Building Information Modeling: object-based models of structures in which each component carries properties, used for design and construction." },
    { front: "IFC", back: "Industry Foundation Classes, an open standard file format for exchanging BIM data between programs." },
    { front: "Digital twin", back: "A virtual model of a physical asset or system that stays linked to it through regularly updated data, used to monitor and test scenarios." },
    { front: "Level of detail (LOD)", back: "How detailed a 3D city model is, from simple extruded building blocks to detailed roofs and facades." },
    { front: "Volunteered geographic information (VGI)", back: "Geographic data contributed by the public, such as OpenStreetMap edits or pothole reports. Fast and detailed but variable in quality." },
    { front: "Geomasking", back: "Moving each point a random distance or snapping it to an area before sharing, so individuals cannot be located exactly." },
    { front: "Data minimization", back: "Collecting and keeping only the location data a project actually needs, which limits privacy risk." }
  ],
  questions: [
    {
      id: "ch15-q01",
      type: "mc",
      prompt: "Which description best fits web GIS?",
      choices: [
        "Desktop GIS software that reads data files stored on one workstation's hard drive",
        "Maps, data and analysis hosted on servers and delivered over the internet as services",
        "A file format that packages maps and data so they can be sent as email attachments",
        "Any map that has been exported or printed to paper from inside a web browser"
      ],
      answer: 1,
      explain: "Web GIS is defined by its client–server, service-based setup. A desktop program reading local files is traditional desktop GIS."
    },
    {
      id: "ch15-q02",
      type: "mc",
      prompt: "You need the county's actual parcel polygons and their attribute tables, served from the county's map server, so you can run an overlay in QGIS. Which service type should you connect to?",
      choices: [
        "WMS, because it returns the parcels as a map image",
        "WMTS, because tiles load the fastest",
        "WFS, because it returns vector features with attributes",
        "A PDF map from the county website"
      ],
      answer: 2,
      explain: "WFS (or OGC API – Features) delivers the features themselves. WMS and WMTS return pictures of the map, which you can view but not overlay as polygons."
    },
    {
      id: "ch15-q03",
      type: "tf",
      prompt: "Tiled web maps load quickly because the map is prepared in advance as small tiles at fixed zoom levels, and the browser requests only the tiles in view.",
      answer: true,
      explain: "Pre-made tiles in a zoom pyramid mean the server does not draw a new map for every request, and the browser fetches only what is on screen."
    },
    {
      id: "ch15-q04",
      type: "mc",
      prompt: "A state DOT wants to map vegetation change along every highway using 20 years of satellite images. Why is a cloud platform attractive for this job?",
      choices: [
        "Analysis runs on many machines next to the stored images, so no terabyte downloads",
        "Cloud platforms make satellite images more accurate than the original files",
        "Cloud platforms remove the need to check results against reference data",
        "Cloud processing keeps working without any internet connection at all"
      ],
      answer: 0,
      explain: "Bringing the analysis to the data and spreading it across many machines is the main advantage. The cloud does not improve image accuracy or replace accuracy assessment."
    },
    {
      id: "ch15-q05",
      type: "mc",
      prompt: "What makes a Cloud Optimized GeoTIFF (COG) different from an ordinary GeoTIFF?",
      choices: [
        "It stores vector features instead of raster cells, which saves space",
        "It can be opened only by the commercial cloud platform that created it",
        "It is always compressed to less than 1 MB so it downloads quickly",
        "Internal tiles and overviews let a program read just the part it needs"
      ],
      answer: 3,
      explain: "A COG is still a GeoTIFF, so any GeoTIFF reader can open it. Its internal layout is what allows partial reads over the web."
    },
    {
      id: "ch15-q06",
      type: "mc",
      prompt: "What is analysis-ready data?",
      choices: [
        "Imagery already corrected for sensor, atmosphere and geometry, on consistent grids",
        "Raw sensor data delivered straight from the satellite before any processing",
        "Any data set that comes with a complete ISO 19115 metadata record",
        "Imagery that a machine-learning model has already classified into land cover"
      ],
      answer: 0,
      explain: "Analysis-ready data save users the preprocessing steps. Raw data are the opposite, and classification is an analysis result, not a preprocessing step."
    },
    {
      id: "ch15-q07",
      type: "mc",
      prompt: "Which statement best defines open-source software?",
      choices: [
        "Software that is free to download but whose source code is kept secret",
        "Software that only universities and nonprofit groups are allowed to use",
        "Software whose code is published under a license to use, study, modify and share",
        "Software released with no license, so its legal status is undefined"
      ],
      answer: 2,
      explain: "Open source is about access to the code and the rights a license grants. Free-to-download software with secret code is freeware, not open source."
    },
    {
      id: "ch15-q08",
      type: "tf",
      prompt: "Open-source GIS software such as QGIS cannot be used on paid commercial engineering projects.",
      answer: false,
      explain: "Open-source licenses allow commercial use. Engineering firms and agencies use QGIS, GDAL and PostGIS on paid work."
    },
    {
      id: "ch15-q09",
      type: "mc",
      prompt: "What role does GDAL play in the GIS software world?",
      choices: [
        "A national standard for testing and reporting positional accuracy",
        "An open-source library that reads and writes many raster and vector formats",
        "A satellite mission that collects multispectral imagery of the Earth",
        "A web service that returns pre-rendered map tiles to browsers"
      ],
      answer: 1,
      explain: "GDAL is the format-translation engine behind many GIS programs, open-source and commercial alike."
    },
    {
      id: "ch15-q10",
      type: "mc",
      prompt: "What does PostGIS add to the PostgreSQL database?",
      choices: [
        "Geometry types and spatial SQL functions, such as distance queries",
        "A drawing program for designing print layouts and map posters",
        "A built-in archive of satellite images for the whole world",
        "A smartphone app for collecting field data offline"
      ],
      answer: 0,
      explain: "PostGIS turns PostgreSQL into a spatial database that can store geometries and run spatial queries in SQL."
    },
    {
      id: "ch15-q11",
      type: "mc",
      prompt: "How does RTK GNSS reach centimeter-level accuracy in the field?",
      choices: [
        "By averaging a phone's positions over several hours at the same point",
        "By tracking only GPS satellites and ignoring the other constellations",
        "By applying real-time corrections from a base station or reference network",
        "By snapping each position to the nearest mapped road centerline in real time"
      ],
      answer: 2,
      explain: "RTK uses corrections from a known reference location, delivered in real time, to remove most of the shared errors. Using fewer constellations would make results worse, not better."
    },
    {
      id: "ch15-q12",
      type: "mc",
      prompt: "Which is an example of Internet of Things data feeding a GIS?",
      choices: [
        "A scanned flood map from the 1970s, digitized last year",
        "A county parcel layer that is updated once a year",
        "A DEM made from a single lidar flight in 2015",
        "Stream-level sensors reporting water depth every 5 minutes"
      ],
      answer: 3,
      explain: "IoT means connected sensors reporting continuously. The other choices are one-time or periodic data sets."
    },
    {
      id: "ch15-q13",
      type: "mc",
      prompt: "A contractor wants an automatic alert whenever one of its haul trucks enters a school zone. Which technique fits?",
      choices: [
        "Geocoding",
        "Georeferencing",
        "Generalization",
        "Geofencing"
      ],
      answer: 3,
      explain: "A geofence is a virtual boundary that triggers an action when a tracked device crosses it. Georeferencing ties an image to coordinates, and geocoding turns addresses into points."
    },
    {
      id: "ch15-q14",
      type: "mc",
      prompt: "In descriptions of big data, what does \"velocity\" refer to?",
      choices: [
        "How fast new data arrive and must be processed",
        "The total storage size of the data",
        "The number of different formats in the data",
        "How trustworthy the data are"
      ],
      answer: 0,
      explain: "Velocity is the rate of incoming data, as with sensor streams. Size is volume, format mix is variety, and trustworthiness is veracity."
    },
    {
      id: "ch15-q15",
      type: "tf",
      prompt: "A typical smartphone gives centimeter-level positions without any external corrections or receiver.",
      answer: false,
      explain: "Phones are usually good to a few meters under open sky and worse near buildings or trees. Centimeter work needs survey-grade receivers with corrections such as RTK."
    },
    {
      id: "ch15-q16",
      type: "mc",
      prompt: "What does a supervised machine-learning classifier need before it can map land cover?",
      choices: [
        "A print layout with a legend",
        "Labeled training examples of each class",
        "A metadata record in ISO 19115 format",
        "A web map tile service"
      ],
      answer: 1,
      explain: "Supervised learning learns from examples whose correct labels are known. The other items may be useful later but do not train a model."
    },
    {
      id: "ch15-q17",
      type: "mc",
      prompt: "Which task is an example of GeoAI?",
      choices: [
        "Buffering every fire hydrant in the city by 150 m to find coverage gaps",
        "Reprojecting a parcel layer from State Plane coordinates to UTM zone 12N",
        "Training a neural network to outline building roofs in aerial imagery",
        "Joining a census attribute table to tract polygons by their tract ID field"
      ],
      answer: 2,
      explain: "Extracting building footprints with a neural network (semantic segmentation) is a GeoAI task. Buffering, reprojecting and joining are standard rule-based GIS operations."
    },
    {
      id: "ch15-q18",
      type: "mc",
      prompt: "A building-detection model was trained on suburban imagery and reported 94% accuracy there. A city now wants to use it downtown, where buildings are taller and shadows are long. What should the city do first?",
      choices: [
        "Use it as is, since 94% accuracy is high enough for city work",
        "Test it on independent reference samples from downtown, and retrain if needed",
        "Lower the image resolution so the model runs faster downtown",
        "Skip testing and fix errors later as citizens report them"
      ],
      answer: 1,
      explain: "Models often perform worse in conditions unlike their training data. Only a local accuracy assessment shows whether the model is fit for downtown use."
    },
    {
      id: "ch15-q19",
      type: "tf",
      prompt: "A land cover map produced by a machine-learning model should be checked with an error matrix built from independent reference data, just like any other classified map.",
      answer: true,
      explain: "The method of classification does not change the need for accuracy assessment. Overall, producer's and user's accuracy apply to ML output too."
    },
    {
      id: "ch15-q20",
      type: "mc",
      prompt: "Why should test samples for a GeoAI model be kept spatially separate from the training samples?",
      choices: [
        "Nearby places tend to be similar, so tests beside training points overstate accuracy",
        "Models cannot process two coordinates that lie closer than 1 km apart",
        "The NSSDA requires that test and training samples be kept separate",
        "Test samples must all come from one pixel so the results are consistent"
      ],
      answer: 0,
      explain: "Spatial autocorrelation makes neighboring points look alike. A test set right beside the training set mostly measures memory, not how the model will do elsewhere."
    },
    {
      id: "ch15-q21",
      type: "mc",
      prompt: "Which best describes a digital twin?",
      choices: [
        "A backup copy of a GIS project file kept on a second server",
        "Two identical maps of an asset printed at different scales",
        "A single drone photograph of an asset taken at handover",
        "A virtual model of an asset kept current with data from the real one"
      ],
      answer: 3,
      explain: "What separates a digital twin from an ordinary model is the ongoing data link to the real asset. A backup file or a single photo has no such link."
    },
    {
      id: "ch15-q22",
      type: "tf",
      prompt: "Any detailed 3D model of a bridge counts as a digital twin, even if it is never updated with data from the real bridge.",
      answer: false,
      explain: "A static 3D model is just a model. A digital twin stays linked to the real bridge through updated data, such as inspections or sensor readings."
    },
    {
      id: "ch15-q23",
      type: "mc",
      prompt: "How do BIM and GIS usually differ on an infrastructure project?",
      choices: [
        "BIM covers large regions, while GIS covers the details of single buildings",
        "BIM models components and their properties; GIS places assets in geographic context",
        "BIM is only for paper drawings, while GIS is only for publishing web maps",
        "BIM and GIS always share one coordinate system, so no conversion is needed"
      ],
      answer: 1,
      explain: "BIM works at the component level and GIS at the geographic level. BIM files often use local project coordinates, which must be tied to a real-world CRS before the two line up."
    },
    {
      id: "ch15-q24",
      type: "mc",
      prompt: "A city council asks how much of the afternoon a proposed 20-story tower will shade a neighboring park. Which data and tool fit best?",
      choices: [
        "A 2D zoning map with parcel boundaries and setbacks",
        "A WMS basemap of current aerial imagery of the area",
        "A 3D city model with building heights and a sun-angle analysis",
        "A confusion matrix of the park's land cover classes"
      ],
      answer: 2,
      explain: "Shadows depend on building height and sun angle, which only a 3D model can represent. A 2D zoning map has no heights."
    },
    {
      id: "ch15-q25",
      type: "mc",
      prompt: "A utility replaces paper inspection forms with a tablet app. Which feature does the most to reduce attribute errors?",
      choices: [
        "A darker color theme so the map is easier to read outdoors",
        "Drop-down lists of allowed values and required fields",
        "Storing every coordinate with 12 decimal places",
        "Printing a paper copy of the form before each inspection"
      ],
      answer: 1,
      explain: "Restricting entries to valid values and requiring key fields stops many mistakes at capture. Extra decimal places add precision on paper, not accuracy."
    },
    {
      id: "ch15-q26",
      type: "mc",
      prompt: "Which is an example of volunteered geographic information?",
      choices: [
        "A county surveyor's network of control monuments",
        "A USGS lidar data set collected under contract",
        "A site plan stamped by a licensed engineer",
        "Road and trail edits the public makes in OpenStreetMap"
      ],
      answer: 3,
      explain: "VGI is contributed by the public. Surveyor, USGS and engineer products come from professionals under formal specifications."
    },
    {
      id: "ch15-q27",
      type: "mc",
      prompt: "A transportation study removes names and phone numbers from a set of phone location traces before sharing it. Why might people still be identifiable?",
      choices: [
        "Phone location traces always include the owner's email address in each record",
        "A few space-time points, like where a phone spends nights and workdays, can single out one person",
        "Location traces are stored in formats that can never be anonymized by any method",
        "Removing names makes the remaining coordinates more accurate and easier to link"
      ],
      answer: 1,
      explain: "Movement patterns are nearly unique. Research on phone records found that four space-time points could single out 95% of 1.5 million people."
    },
    {
      id: "ch15-q28",
      type: "mc",
      prompt: "A city wants to publish a public map of traffic-crash injuries that includes the home location of each injured person. What is the most responsible approach?",
      choices: [
        "Publish exact home points so the map is as accurate as possible",
        "Publish exact points but remove the legend and the layer names",
        "Aggregate counts to census tracts or geomask the points, and restrict raw data",
        "Publish the exact points only in a printed layout instead of online"
      ],
      answer: 2,
      explain: "Aggregation or geomasking keeps the pattern visible while protecting individuals. A printed map still exposes exact homes."
    },
    {
      id: "ch15-q29",
      type: "tf",
      prompt: "Under the European Union's GDPR, location data can count as personal data.",
      answer: true,
      explain: "The GDPR lists location data among identifiers that can make information personal data, so its collection and sharing fall under the regulation."
    }
  ]
});
