GIS.chapter({
  id: "ch05",
  num: 5,
  title: "Global Navigation Satellite Systems",
  blurb: "How satellite positioning works, where its errors come from, and how differential methods turn meter-level fixes into centimeter-level coordinates you can design and build from.",
  objectives: [
    "Describe the three segments of a GNSS and name the four global constellations.",
    "Explain how a receiver uses pseudoranges from four or more satellites to solve for position and clock bias.",
    "Identify the main GNSS error sources and explain how satellite geometry (DOP) magnifies them.",
    "Compare code and carrier-phase positioning and the accuracy each can reach.",
    "Explain how differential correction, SBAS, RTK, CORS and OPUS improve accuracy.",
    "Choose a receiver class and field method that match the accuracy an engineering task requires.",
    "Convert a GNSS ellipsoid height to an orthometric height using a geoid model."
  ],
  guide: [
    {
      heading: "What a GNSS is",
      paragraphs: [
        "A **Global Navigation Satellite System (GNSS)** is a constellation of satellites that broadcast timed radio signals so receivers anywhere on Earth can compute position, velocity and time. Four systems are global: **GPS** (United States), **GLONASS** (Russia), **Galileo** (European Union) and **BeiDou** (China). Regional systems such as Japan's QZSS and India's NavIC add satellites over their own areas. People often say \"GPS\" for all of them, but most modern receivers track several constellations at once, which means more satellites in view and better results under trees or between buildings.",
        "Every GNSS has three parts. The **space segment** is the satellites, each carrying atomic clocks. The **control segment** is a network of ground stations that track the satellites, compute their orbits and clock errors, and upload corrections; GPS is run by the US Space Force from a master control station at Schriever Space Force Base, Colorado. The **user segment** is every receiver, from a phone chip to a survey rover."
      ],
      bullets: [
        "GPS baseline design: 24 orbital slots in six planes, about 20,200 km above Earth, inclined 55°, with an orbit period of about 12 hours. The US normally flies more than 24 satellites (around 30) so spares are already in orbit.",
        "GLONASS orbits at about 19,100 km and Galileo at about 23,200 km. BeiDou mixes medium-Earth-orbit satellites with geostationary and inclined geosynchronous ones.",
        "The design goal is at least four satellites above the horizon from any open-sky location at any time."
      ]
    },
    {
      heading: "Ranging, trilateration and the fourth satellite",
      paragraphs: [
        "Each satellite broadcasts a signal that says, in effect, \"I am here, and it is this time.\" The receiver notes when the signal arrives. Travel time multiplied by the speed of light gives the range to that satellite. One range places the receiver somewhere on a sphere centered on the satellite. Finding a position from distances to known points is called **trilateration** (triangulation uses angles, not distances).",
        "Three spheres intersect at two points, and one is far out in space, so three ranges would be enough if the receiver had a perfect clock. It does not. A receiver uses an inexpensive quartz clock, and an error of just one microsecond shifts every range by about 300 m. Because the distance first computed contains this clock error, it is called a **pseudorange**. The receiver treats its clock bias as a fourth unknown, along with x, y and z, so it needs at least **four satellites**. With more than four, it solves by least squares and can detect bad measurements.",
        "A side effect is that a GNSS receiver ends up knowing time very accurately. Power grids, cell networks and financial systems depend on GNSS timing for this reason."
      ],
      formula: {
        expr: "R = c × Δt        P = ρ + c·dt + (other errors)",
        where: [
          "R: range computed from travel time (m)",
          "c: speed of light, 299,792,458 m/s",
          "Δt: signal travel time (s)",
          "P: pseudorange (m)",
          "ρ: true geometric distance from satellite to receiver (m)",
          "dt: receiver clock bias (s)"
        ]
      },
      example: {
        prompt: "A signal takes 0.0700 s to reach a receiver, and the receiver clock is 1.0 microsecond fast. What range does the travel time give, and how large is the clock's effect on it?",
        steps: [
          "Range from travel time: R = 299,792,458 m/s × 0.0700 s = 20,985,472 m ≈ 20,985 km.",
          "Clock effect: 299,792,458 m/s × 1.0 × 10⁻⁶ s = 299.8 m.",
          "Every pseudorange from this receiver carries the same 299.8 m error, which is why the receiver solves for its clock bias as an unknown."
        ],
        answer: "About 20,985 km; the 1 µs clock error adds about 300 m to each pseudorange."
      }
    },
    {
      heading: "Code and carrier-phase measurements",
      paragraphs: [
        "Satellites put two kinds of information on their signals. A **ranging code** is a repeating pseudo-random pattern of chips. The GPS civilian C/A code has chips about 1 microsecond long, which is about 300 m of range. A receiver lines up its own copy of the code with the incoming signal to get travel time. Code measurements give positions good to a few meters on their own.",
        "The code rides on a **carrier wave**. GPS L1 is 1575.42 MHz, so its wavelength is only about 19 cm. A receiver can measure the phase of that wave to a small fraction of a cycle, which means millimeter-level precision. The catch is the **integer ambiguity**: the receiver knows the fraction of a cycle but not how many whole cycles lie between it and the satellite. Survey software resolves this whole number, and the receiver must keep continuous lock. A brief blockage causes a **cycle slip**, and the ambiguity must be solved again.",
        "Satellites broadcast on more than one frequency (for GPS, L1, L2 and L5). Multi-frequency receivers use the extra signals to remove ionospheric delay and to resolve ambiguities faster."
      ],
      formula: {
        expr: "λ = c / f",
        where: [
          "λ: wavelength (m)",
          "c: speed of light, 299,792,458 m/s",
          "f: frequency (Hz)"
        ]
      },
      example: {
        prompt: "Find the wavelength of the GPS L1 carrier (1575.42 MHz).",
        steps: [
          "Convert frequency: 1575.42 MHz = 1,575,420,000 Hz.",
          "λ = 299,792,458 / 1,575,420,000 = 0.1903 m."
        ],
        answer: "About 0.190 m (19 cm)."
      }
    },
    {
      heading: "Where the errors come from",
      paragraphs: [
        "A pseudorange is never perfect. Small errors in the broadcast orbit and satellite clock come first. The signal is then slowed as it passes through the atmosphere, and it may bounce off objects before it reaches the antenna. The sum of these range errors is often called the **user equivalent range error (UERE)**.",
        "Some errors are shared by receivers that are near each other (satellite orbit and clock, most of the atmospheric delay). Others are local to one antenna (multipath, receiver noise). That split matters, because differential correction can only remove the shared errors."
      ],
      bullets: [
        "**Ionosphere** (roughly 50 to 1,000 km up): charged particles delay the signal by a few meters to tens of meters, more during high solar activity. The delay depends on frequency, so dual-frequency receivers can remove most of it.",
        "**Troposphere** (lowest layer of the atmosphere): gases and water vapor add about 2.5 m of delay for a satellite overhead and several times that near the horizon. It is the same at all GNSS frequencies, so it is modeled rather than removed.",
        "**Multipath**: signals reflected off buildings, vehicles, rock walls or water arrive late. Avoid reflective surroundings, use a ground plane or better antenna, and set an **elevation mask** (often 10° to 15°) to ignore low satellites.",
        "**Satellite orbit and clock**: small errors in the broadcast data. Precise orbit and clock products computed after the fact reduce them.",
        "**Obstructions**: tree canopy, buildings and terrain block satellites, which weakens geometry and causes cycle slips.",
        "**Selective Availability**, the deliberate degradation of civilian GPS, was turned off in May 2000 and is no longer an error source."
      ]
    },
    {
      heading: "Satellite geometry and DOP",
      paragraphs: [
        "The same range errors produce a larger or smaller position error depending on where the satellites are in the sky. **Dilution of precision (DOP)** is a unitless number that describes this. When satellites are spread widely across the sky, the range spheres cross at strong angles and DOP is low. When they are bunched together or lined up, the spheres cross at shallow angles and DOP is high.",
        "There are several DOP values: **PDOP** for 3D position, **HDOP** for horizontal, **VDOP** for vertical, and **TDOP** for time. VDOP is usually larger than HDOP because every satellite is above the receiver; there are none below the horizon to balance the geometry. Many crews avoid collecting when PDOP is above about 4 to 6, and mission-planning software uses satellite orbit data to predict good and poor time windows."
      ],
      formula: {
        expr: "σ_position ≈ DOP × σ_range (UERE)",
        where: [
          "σ_position: expected position error (m)",
          "DOP: the dilution of precision for the component you care about (HDOP, VDOP or PDOP)",
          "σ_range: user equivalent range error (m)"
        ]
      },
      example: {
        prompt: "A receiver has a range error of 1.5 m. HDOP is 1.2 and VDOP is 2.0. Estimate the horizontal and vertical errors.",
        steps: [
          "Horizontal: 1.2 × 1.5 m = 1.8 m.",
          "Vertical: 2.0 × 1.5 m = 3.0 m."
        ],
        answer: "About 1.8 m horizontal and 3.0 m vertical."
      }
    },
    {
      heading: "Differential correction, SBAS and RTK",
      paragraphs: [
        "**Differential GNSS** places a receiver, the **base**, on a point with known coordinates. The base compares the ranges it measures with the ranges it should measure and computes corrections. A nearby **rover** applies those corrections and removes the errors the two receivers share. Corrections can be sent in real time or applied later in office software (post-processing).",
        "**Satellite-based augmentation systems (SBAS)** do this over a whole continent. Ground reference stations compute corrections, and geostationary satellites broadcast them on the GPS L1 frequency. The US system is the FAA's **WAAS**; Europe has EGNOS, Japan MSAS and India GAGAN. SBAS is free and built into many consumer and mapping receivers, and it typically improves accuracy to about 1 to 2 m.",
        "**Real-time kinematic (RTK)** positioning uses carrier phase from both a base and a rover. Corrections stream to the rover by radio or over the internet with **NTRIP**. Once the integer ambiguities are resolved (a **fixed** solution), accuracy is about 1 to 2 cm horizontally and 2 to 3 cm vertically. A **float** solution means the ambiguities are not yet resolved; accuracy is decimeters or worse, and engineers should not record it as final. Accuracy also degrades with distance from the base, so single-base RTK is usually kept within about 10 to 20 km."
      ],
      bullets: [
        "**Network RTK** uses many permanent stations to model errors across a region, so the user needs only a rover and a data plan. Utah's network, TURN, is run by the Utah Geospatial Resource Center (UGRC).",
        "**Post-processed kinematic (PPK)** logs raw data on base and rover and solves later. It is common for drones.",
        "**Precise point positioning (PPP)** uses precise satellite orbit and clock products instead of a local base. It reaches centimeters to decimeters but needs a convergence period, often tens of minutes."
      ]
    },
    {
      heading: "CORS and OPUS",
      paragraphs: [
        "A **Continuously Operating Reference Station (CORS)** is a permanently mounted GNSS receiver that logs data around the clock. The **NOAA CORS Network** includes well over a thousand stations, most of them operated by partner agencies, universities and companies, with data checked and published by NOAA's National Geodetic Survey (NGS). CORS data are free and provide access to the National Spatial Reference System (NSRS), the official US framework for coordinates.",
        "The **Online Positioning User Service (OPUS)** lets you upload a static GNSS data file to NGS. OPUS processes it against nearby CORS and emails back coordinates, usually within minutes. Standard OPUS static accepts files from 2 to 48 hours long; OPUS Rapid Static accepts 15 minutes to 2 hours. Survey crews use OPUS to set project control or to check the coordinates of an RTK base."
      ],
      qgis: "OPUS returns a text report. To map the result, copy the coordinates into a CSV and load it with Layer → Add Layer → Add Delimited Text Layer, choosing the CRS the report uses (for example, NAD83(2011) / UTM zone 12N in Utah)."
    },
    {
      heading: "Receiver classes and choosing a method",
      paragraphs: [
        "Receivers fall into rough accuracy classes. **Recreational and smartphone** receivers are usually good to about 5 m under open sky (gps.gov cites 4.9 m as typical for phones) and get much worse near buildings and trees. **Mapping-grade (GIS-grade)** receivers reach sub-meter to decimeter accuracy with SBAS, real-time corrections or post-processing. **Survey-grade** receivers track carrier phase on multiple frequencies and constellations and reach centimeters with RTK or static methods.",
        "Pick the cheapest method that clearly meets the requirement, and confirm it in the field. Occupy a known control point at the start and end of a session; if the check point is off, the rest of the data probably are too. Record the receiver, correction source, datum and epoch, and solution type in your metadata."
      ],
      bullets: [
        "Field reconnaissance or photo locations: smartphone or handheld.",
        "Utility and asset inventory (hydrants, signs, manholes) to about 1 m: mapping-grade with SBAS or real-time corrections.",
        "Construction staking, as-built inverts, property and control surveys: survey-grade RTK or static, checked against control."
      ],
      qgis: "View → Panels → GPS Information Panel connects QGIS to a live receiver and can add points or lines to an editable layer. GPX files from handheld units open with Layer → Add Layer → Add Vector Layer; choose the waypoints, tracks or routes sublayer."
    },
    {
      heading: "GNSS heights: ellipsoid versus orthometric",
      paragraphs: [
        "GNSS computes positions on a smooth mathematical **ellipsoid** (GRS 80 for NAD 83, nearly the same as WGS 84). The height it reports is the **ellipsoid height (h)**, measured from that surface. Engineers usually need **orthometric height (H)**, the height above the **geoid**, a surface of equal gravity potential that approximates mean sea level. Water flows according to gravity, so drainage design has to use orthometric heights; ellipsoid heights can make water look like it runs uphill.",
        "The separation between the two surfaces is the **geoid height (N)**, read from a geoid model. In the United States, NGS publishes hybrid geoid models; GEOID18 converts NAD 83 ellipsoid heights to NAVD 88 elevations. Across the conterminous US the geoid lies below the ellipsoid, so N is negative and H is larger than h. NGS is preparing to replace NAD 83 and NAVD 88 with new reference frames (NATRF2022 and NAPGD2022), which come with a new geoid model, GEOID2022, so always record which datum and geoid model you used."
      ],
      formula: {
        expr: "H = h − N",
        where: [
          "H: orthometric height (elevation) above the geoid (m)",
          "h: ellipsoid height from GNSS (m)",
          "N: geoid height from a geoid model (m); negative across the conterminous US"
        ]
      },
      example: {
        prompt: "An RTK rover reports h = 1,372.40 m. The geoid model gives N = −17.10 m at that point. Find the orthometric height.",
        steps: [
          "H = h − N = 1,372.40 − (−17.10).",
          "H = 1,372.40 + 17.10 = 1,389.50 m."
        ],
        answer: "H = 1,389.50 m (about 4,558.7 ft)."
      },
      qgis: "If you have a geoid grid as a raster, Processing Toolbox → Raster analysis → Sample raster values attaches N to each point. Then use the Field Calculator to compute \"h\" - \"N\"."
    }
  ],
  cards: [
    { front: "GNSS", back: "Global Navigation Satellite System: a satellite constellation that broadcasts signals for positioning, navigation and timing. GPS, GLONASS, Galileo and BeiDou are the four global systems." },
    { front: "Space segment", back: "The satellites. Each carries atomic clocks and broadcasts ranging signals plus a navigation message with its orbit and clock data." },
    { front: "Control segment", back: "Ground monitor stations, antennas and a master control station that track satellites, compute orbit and clock corrections, and upload them." },
    { front: "User segment", back: "All the receivers and antennas that pick up satellite signals and compute position, velocity and time." },
    { front: "Trilateration", back: "Finding a position from measured distances to points with known coordinates. GNSS receivers trilaterate from satellite ranges; triangulation uses angles instead." },
    { front: "Pseudorange", back: "Satellite-to-receiver distance computed as signal travel time times the speed of light. It still contains receiver clock bias and other errors." },
    { front: "Receiver clock bias", back: "The offset of the receiver's inexpensive clock from GNSS time. It is solved as a fourth unknown, which is why four satellites are needed." },
    { front: "Ephemeris", back: "Orbit parameters broadcast by each satellite so receivers can compute where it was when it sent the signal." },
    { front: "C/A code", back: "The GPS civilian coarse/acquisition ranging code on L1. Each chip lasts about 1 microsecond, or about 300 m of range." },
    { front: "Carrier phase", back: "Measurement of the phase of the carrier wave itself (about 19 cm wavelength on L1). It allows centimeter accuracy once the integer ambiguity is resolved." },
    { front: "Integer ambiguity", back: "The unknown whole number of carrier wavelengths between satellite and receiver. Resolving it gives an RTK fixed solution." },
    { front: "Cycle slip", back: "A jump of a whole number of cycles in carrier-phase tracking after a brief loss of signal (a tree, bridge or truck). The ambiguity must be solved again." },
    { front: "Ionospheric delay", back: "Delay caused by charged particles high in the atmosphere. It depends on frequency, so dual-frequency receivers can remove most of it." },
    { front: "Tropospheric delay", back: "Delay from gases and water vapor in the lower atmosphere. It is the same at all GNSS frequencies, so it is modeled. It is larger for low satellites." },
    { front: "Multipath", back: "Signals that reach the antenna after bouncing off buildings, vehicles, water or the ground. It is local to each receiver, so differential correction cannot remove it." },
    { front: "Dilution of precision (DOP)", back: "A unitless factor showing how satellite geometry magnifies range errors into position error. PDOP (3D), HDOP and VDOP are common. Lower is better." },
    { front: "Elevation mask", back: "A cutoff angle above the horizon, often 10° to 15°, below which the receiver ignores satellites to reduce atmospheric and multipath error." },
    { front: "Differential GNSS", back: "A base receiver on a known point computes corrections that a nearby rover applies, removing the errors both receivers share." },
    { front: "SBAS", back: "Satellite-based augmentation system: corrections from ground reference networks broadcast by geostationary satellites. Examples: WAAS (US), EGNOS (Europe), MSAS (Japan), GAGAN (India)." },
    { front: "WAAS", back: "Wide Area Augmentation System, the FAA's SBAS for North America. Free and built into many receivers; typically improves accuracy to about 1 to 2 m." },
    { front: "RTK", back: "Real-time kinematic: carrier-phase differential positioning with corrections streamed from a base or network. A fixed solution is about 1 to 2 cm horizontal." },
    { front: "Fixed vs. float solution", back: "Fixed: integer ambiguities resolved, centimeter accuracy. Float: ambiguities not resolved, decimeter accuracy or worse. Record only fixed positions for engineering work." },
    { front: "NTRIP", back: "Networked Transport of RTCM via Internet Protocol: the standard way to stream GNSS corrections to a rover over the internet, usually by cell connection." },
    { front: "CORS", back: "Continuously Operating Reference Station: a permanent GNSS receiver logging data around the clock. NOAA CORS Network data are free and tie work to the NSRS." },
    { front: "OPUS", back: "NGS Online Positioning User Service. Upload a static GNSS file (15 min to 48 h) and receive coordinates computed from nearby CORS." },
    { front: "PPP", back: "Precise point positioning: a single receiver uses precise satellite orbit and clock products instead of a local base. Needs a convergence period, often tens of minutes." },
    { front: "Ellipsoid height (h)", back: "Height above the reference ellipsoid. This is the height GNSS measures directly." },
    { front: "Geoid height (N)", back: "Separation between the geoid and the ellipsoid at a point, taken from a geoid model such as GEOID18. Negative across the conterminous US." },
    { front: "Orthometric height (H)", back: "Height above the geoid, close to height above mean sea level. What engineers call elevation. H = h − N." }
  ],
  questions: [
    {
      id: "ch05-q01",
      type: "mc",
      prompt: "What is the minimum number of satellites a receiver needs to compute a 3D position and its own clock bias?",
      choices: ["Two", "Three", "Four", "Six"],
      answer: 2,
      explain: "There are four unknowns: x, y, z and receiver clock bias, so four ranges are needed. Three would be enough only with a perfect receiver clock, which inexpensive receivers do not have."
    },
    {
      id: "ch05-q02",
      type: "mc",
      prompt: "Why is the distance a code receiver first computes called a pseudorange?",
      choices: [
        "It is measured to a pseudo-random point near the satellite rather than to the satellite itself",
        "It still contains the receiver clock error, so it is not yet the true geometric distance",
        "It is computed from the carrier wave instead of the ranging code",
        "It is measured to the geoid instead of the ellipsoid"
      ],
      answer: 1,
      explain: "The receiver clock bias is built into every travel-time measurement, so the range is 'pseudo' until the bias is solved. The ranging code is called pseudo-random noise, but that name describes the code pattern, not the range."
    },
    {
      id: "ch05-q03",
      type: "mc",
      prompt: "Which GNSS segment tracks the satellites and uploads updated orbit and clock data to them?",
      choices: ["Space segment", "User segment", "Augmentation segment", "Control segment"],
      answer: 3,
      explain: "The control segment's monitor stations track the satellites, the master control station computes orbit and clock corrections, and ground antennas upload them. The space segment is the satellites themselves."
    },
    {
      id: "ch05-q04",
      type: "mc",
      prompt: "Which global navigation satellite system is operated by the European Union?",
      choices: ["Galileo", "GLONASS", "BeiDou", "QZSS"],
      answer: 0,
      explain: "Galileo is Europe's system. GLONASS is Russian, BeiDou is Chinese, and QZSS is a Japanese regional system."
    },
    {
      id: "ch05-q05",
      type: "num",
      prompt: "A receiver's clock is off by 0.5 microseconds and nothing corrects it. About how much error does this add to each pseudorange? (give meters)",
      answer: 149.9,
      tol: 1.5,
      unit: "m",
      explain: "Error = c × time error = 299,792,458 m/s × 0.5 × 10⁻⁶ s = 149.9 m."
    },
    {
      id: "ch05-q06",
      type: "mc",
      prompt: "Which error can a dual-frequency receiver largely remove by comparing the delay on two frequencies?",
      choices: ["Multipath", "Tropospheric delay", "Ionospheric delay", "Receiver noise"],
      answer: 2,
      explain: "Ionospheric delay depends on frequency, so two frequencies let the receiver solve for it. Tropospheric delay is the same at all GNSS frequencies, so it has to be modeled instead."
    },
    {
      id: "ch05-q07",
      type: "tf",
      prompt: "Tropospheric delay can be removed by comparing measurements on two frequencies, the same way ionospheric delay is.",
      answer: false,
      explain: "The troposphere delays all GNSS frequencies by the same amount, so a two-frequency comparison reveals nothing about it. It is handled with atmospheric models and, for precise work, by estimating it in processing."
    },
    {
      id: "ch05-q08",
      type: "mc",
      prompt: "A crew sets a GNSS rover a few meters from a large metal-sided warehouse and sees position scatter of several decimeters, even with a good satellite count. What is the most likely cause?",
      choices: [
        "Ionospheric delay from high solar activity",
        "Multipath from signals reflecting off the building",
        "Selective Availability degrading the signals",
        "An elevation mask set too high for the site"
      ],
      answer: 1,
      explain: "Reflective surfaces near the antenna produce multipath, which is local to that antenna. Ionospheric delay would affect nearby receivers alike, Selective Availability was turned off in 2000, and a higher elevation mask reduces multipath rather than causing it."
    },
    {
      id: "ch05-q09",
      type: "mc",
      prompt: "Which arrangement of four satellites gives the lowest (best) PDOP?",
      choices: [
        "All four bunched together high overhead, well above the elevation mask",
        "All four low on the eastern horizon, spaced a few degrees apart",
        "One overhead and three spread evenly around the sky at low elevation",
        "All four in a straight line across the sky from north to south"
      ],
      answer: 2,
      explain: "Widely spread satellites make the range spheres cross at strong angles, which gives low DOP. Bunched or lined-up satellites give weak geometry and high DOP."
    },
    {
      id: "ch05-q10",
      type: "num",
      prompt: "A receiver has a user equivalent range error of 1.5 m and an HDOP of 1.8. Estimate the horizontal position error. (give meters)",
      answer: 2.7,
      tol: 0.05,
      unit: "m",
      explain: "Horizontal error ≈ HDOP × range error = 1.8 × 1.5 m = 2.7 m."
    },
    {
      id: "ch05-q11",
      type: "tf",
      prompt: "GNSS vertical accuracy is usually worse than horizontal accuracy because all of the satellites a receiver tracks are above it.",
      answer: true,
      explain: "With no satellites below the horizon, geometry in the vertical direction is weaker, so VDOP is usually larger than HDOP. Vertical errors of 1.5 to 2 times the horizontal error are common."
    },
    {
      id: "ch05-q12",
      type: "mc",
      prompt: "Why can carrier-phase positioning reach centimeter accuracy when code positioning usually cannot?",
      choices: [
        "The carrier wavelength (about 19 cm) is far shorter than a code chip (about 300 m)",
        "Carrier signals pass through the atmosphere without the delays that slow the code",
        "Carrier-phase receivers carry their own atomic clocks, so clock bias is not solved",
        "Carrier signals come only from geostationary satellites that never move in the sky"
      ],
      answer: 0,
      explain: "Measuring a fraction of a 19 cm cycle gives millimeter precision, while a fraction of a 300 m chip gives meters. Carrier signals are still delayed by the atmosphere; differencing with a base removes most of that shared delay."
    },
    {
      id: "ch05-q13",
      type: "mc",
      prompt: "In carrier-phase processing, what is the integer ambiguity?",
      choices: [
        "The minimum number of satellites the rover must track to reach a fixed solution",
        "The rounding error in the receiver clock, which is always a whole microsecond",
        "The unknown whole number of carrier wavelengths between satellite and receiver",
        "The difference between ellipsoid and geoid heights, rounded to a whole meter"
      ],
      answer: 2,
      explain: "A receiver measures the fractional part of a cycle directly, but not how many whole cycles are in the path. Resolving that integer is what gives an RTK fixed solution."
    },
    {
      id: "ch05-q14",
      type: "mc",
      prompt: "What does WAAS provide to a GNSS user in North America?",
      choices: [
        "Centimeter-level carrier-phase corrections sent by radio from a local base station",
        "Post-processed coordinates returned by email after you upload a static data file",
        "A separate set of navigation satellites that replaces GPS over North America",
        "Free corrections from geostationary satellites that improve accuracy to about 1 to 2 m"
      ],
      answer: 3,
      explain: "WAAS is the FAA's satellite-based augmentation system. Its corrections improve code positioning to roughly a meter or two. Centimeter work needs carrier-phase methods such as RTK, and uploaded files are what OPUS processes."
    },
    {
      id: "ch05-q15",
      type: "mc",
      prompt: "An RTK rover shows a 'float' solution. What does that mean?",
      choices: [
        "Ambiguities are unresolved, so accuracy is decimeters rather than centimeters",
        "The rover is over water or wet ground, so its heights are unreliable",
        "The rover has lost all satellites and is estimating position from motion",
        "The base station is sending SBAS corrections instead of RTK corrections"
      ],
      answer: 0,
      explain: "Float means the ambiguities are estimated as non-integer values. Wait for a fixed solution, or re-initialize, before recording points for engineering use."
    },
    {
      id: "ch05-q16",
      type: "tf",
      prompt: "Differential correction works because a base station and a nearby rover experience nearly the same satellite orbit, satellite clock and atmospheric errors.",
      answer: true,
      explain: "These errors are spatially correlated, so a base on a known point can measure them and the rover can subtract them. The correlation weakens with distance, which is why accuracy drops farther from the base."
    },
    {
      id: "ch05-q17",
      type: "mc",
      prompt: "Which error is local to each receiver, so corrections from a base station cannot remove it?",
      choices: ["Satellite clock error", "Orbit (ephemeris) error", "Multipath", "Ionospheric delay"],
      answer: 2,
      explain: "Multipath depends on the reflecting surfaces around one particular antenna. The other three are nearly the same for receivers a few kilometers apart, so differential correction removes most of them."
    },
    {
      id: "ch05-q18",
      type: "mc",
      prompt: "You logged a 4-hour static GNSS file on a new project control point. You want NAD 83 coordinates tied to the national network without setting up your own base. What should you use?",
      choices: ["WAAS", "A smartphone mapping app", "An SBAS-enabled handheld", "NGS OPUS"],
      answer: 3,
      explain: "OPUS processes an uploaded static file against nearby CORS and returns coordinates tied to the National Spatial Reference System. WAAS and handheld receivers only reach meter-level accuracy."
    },
    {
      id: "ch05-q19",
      type: "tf",
      prompt: "CORS stations are permanent GNSS receivers whose logged data can serve as base station data for post-processing.",
      answer: true,
      explain: "CORS log data continuously, and NOAA publishes the data free. Post-processing software and OPUS use them in place of a user's own base."
    },
    {
      id: "ch05-q20",
      type: "mc",
      prompt: "A city crew needs to inventory 2,000 fire hydrants for a GIS layer. Positions within about 1 m are acceptable, and the crew wants to move quickly. Which choice fits best?",
      choices: [
        "Survey-grade RTK with a 3-minute occupation on each hydrant",
        "A mapping-grade receiver using SBAS or real-time corrections",
        "A 2-hour static session on each hydrant processed with OPUS",
        "Digitizing hydrants from 30 m Landsat imagery"
      ],
      answer: 1,
      explain: "Mapping-grade receivers with corrections reach sub-meter accuracy quickly and cost less. RTK and OPUS would work but are far more precise and slower than the job needs; 30 m pixels cannot show a hydrant."
    },
    {
      id: "ch05-q21",
      type: "mc",
      prompt: "You must stake a culvert inlet so its invert elevation is within 3 cm of the design value. Which approach fits?",
      choices: [
        "Smartphone GPS averaged for 10 minutes, with heights from the phone's map app",
        "A recreational handheld with WAAS, checked against a benchmark at the start",
        "A mapping-grade receiver with post-processed code corrections and a geoid model",
        "Survey-grade RTK checked on nearby control, with heights converted by a geoid model"
      ],
      answer: 3,
      explain: "Only carrier-phase RTK (or a total station) reaches centimeter vertical accuracy. The control check confirms the setup, and the geoid model turns ellipsoid heights into the elevations the design uses. The other options are meter-level or decimeter-level at best."
    },
    {
      id: "ch05-q22",
      type: "num",
      prompt: "A GNSS receiver gives an ellipsoid height h = 1,402.65 m. The geoid model gives N = −16.80 m. What is the orthometric height H? (give meters)",
      answer: 1419.45,
      tol: 0.01,
      unit: "m",
      explain: "H = h − N = 1,402.65 − (−16.80) = 1,402.65 + 16.80 = 1,419.45 m."
    },
    {
      id: "ch05-q23",
      type: "tf",
      prompt: "Across the conterminous United States the geoid lies below the reference ellipsoid, so orthometric heights are larger than ellipsoid heights.",
      answer: true,
      explain: "Geoid heights (N) are negative across the conterminous US. Since H = h − N, subtracting a negative number makes H larger than h."
    },
    {
      id: "ch05-q24",
      type: "mc",
      prompt: "Why do engineers convert GNSS ellipsoid heights to orthometric heights before designing a storm drain?",
      choices: [
        "Ellipsoid heights are much less precise than orthometric heights from the same receiver",
        "Satellites broadcast orthometric heights, so the conversion restores the original value",
        "Orthometric heights follow gravity, so they show which way water will actually flow",
        "Ellipsoid heights are reported only in feet, and design drawings must use meters"
      ],
      answer: 2,
      explain: "Orthometric heights are referenced to the geoid, a surface of equal gravity potential. The ellipsoid is a geometric surface, so it does not reflect which way water will flow. The conversion does not change precision."
    },
    {
      id: "ch05-q25",
      type: "mc",
      prompt: "What is the name for finding a position from measured distances to points with known coordinates?",
      choices: ["Triangulation", "Traversing", "Interpolation", "Trilateration"],
      answer: 3,
      explain: "Trilateration uses distances, which is what GNSS ranging provides. Triangulation uses measured angles."
    },
    {
      id: "ch05-q26",
      type: "mc",
      prompt: "Why do receivers use an elevation mask, such as 15°?",
      choices: [
        "To ignore low satellites with longer atmospheric paths and more multipath",
        "To make the receiver track only geostationary SBAS correction satellites",
        "To block satellites from other constellations that use different signals",
        "To force the rover to a fixed RTK solution more quickly after startup"
      ],
      answer: 0,
      explain: "Low-elevation signals travel a longer path through the atmosphere and are more likely to reflect off nearby surfaces. The trade-off is fewer satellites, so the mask should not be set so high that DOP suffers."
    },
    {
      id: "ch05-q27",
      type: "tf",
      prompt: "Selective Availability, the deliberate degradation of civilian GPS accuracy, is still in effect.",
      answer: false,
      explain: "Selective Availability was turned off in May 2000, and newer GPS satellites are built without it."
    },
    {
      id: "ch05-q28",
      type: "mc",
      prompt: "A GPS satellite directly overhead is about 20,200 km away. About how long does its signal take to reach the receiver?",
      choices: ["About 6.7 microseconds", "About 67 milliseconds", "About 0.67 seconds", "About 6.7 seconds"],
      answer: 1,
      explain: "t = d / c = 20,200,000 m ÷ 299,792,458 m/s ≈ 0.0674 s, or about 67 milliseconds."
    }
  ]
});
