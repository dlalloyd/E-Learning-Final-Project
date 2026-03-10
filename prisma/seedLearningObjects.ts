/// <reference types="node" />

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const learningObjects = [
  // ═══════════════════════════════════════════════════════════════════════════
  // LEVEL 1: REMEMBERING (Bloom 1)
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: 'lo-uk-capitals',
    title: 'UK Nation Capitals',
    knowledgeComponentId: 'UK_capitals',
    bloomLevel: 1,
    orderIndex: 1,
    contentType: 'text',
    content: `## Learning Objective
By the end of this section, you will be able to identify the capital cities of all four UK nations and locate them on a map.

---

## The Four Nations

The United Kingdom consists of four distinct nations, each with its own capital city:

### England — London
London is both the capital of England and the capital of the entire United Kingdom. Located in southeastern England on the River Thames, it's the largest city in the UK with a population of approximately 9 million. London has been a major settlement for over two millennia, originally founded by the Romans as *Londinium*.

**Key landmarks:** Houses of Parliament, Tower of London, Buckingham Palace

### Scotland — Edinburgh
Edinburgh (pronounced "ED-in-bruh" or "ED-in-bur-uh") sits on Scotland's east coast. Despite Glasgow being Scotland's largest city, Edinburgh has served as the Scottish capital since the 15th century. The city is famous for its castle, which dominates the skyline from Castle Rock.

**Key landmarks:** Edinburgh Castle, Royal Mile, Scottish Parliament Building (Holyrood)

### Wales — Cardiff
Cardiff became the official Welsh capital only in 1955, though it had been the largest Welsh city for over a century. Located on the south coast of Wales at the mouth of the River Taff, Cardiff is the youngest capital in Western Europe.

**Key landmarks:** Cardiff Castle, Millennium Stadium, Senedd (Welsh Parliament)

### Northern Ireland — Belfast
Belfast is located on the east coast of Northern Ireland, at the mouth of the River Lagan. It became the capital when Northern Ireland was established in 1921. The city is famous for the Harland and Wolff shipyard where the RMS Titanic was built.

**Key landmarks:** Stormont (Parliament Buildings), Titanic Quarter, Belfast City Hall

---

## Memory Technique

**Mnemonic: "LECB" — Lovely English, Celtic, British capitals**
- **L**ondon → England
- **E**dinburgh → Scotland  
- **C**ardiff → Wales
- **B**elfast → Northern Ireland

Or remember: *"London, Edinburgh, Cardiff, Belfast — Locations Every Citizen Benefits from knowing"*

---

## Self-Check Questions

1. Which nation's capital was only officially designated in 1955?
2. What river does London sit on?
3. Which capital is home to the shipyard that built the Titanic?

**Answers:** 1. Wales (Cardiff) | 2. River Thames | 3. Belfast

---

## Connection to Next Topics

Understanding where the capitals are located will help you when we explore:
- **County locations** — knowing where the capitals sit helps orient the counties around them
- **Climate patterns** — Edinburgh's east coast location vs Cardiff's west coast affects their weather
- **River systems** — London (Thames), Belfast (Lagan), and Cardiff (Taff) all sit on major rivers`,
    eli5Content: `## Simple Version

The UK is like a family of four countries living together:

🏴‍☠️ **England** → **London** (the biggest city, where the King lives)

🏴󠁧󠁢󠁳󠁣󠁴󠁿 **Scotland** → **Edinburgh** (the one with the famous castle on a rock)

🏴󠁧󠁢󠁷󠁬󠁳󠁿 **Wales** → **Cardiff** (the newest capital, only since 1955)

🏴 **Northern Ireland** → **Belfast** (where the Titanic was built)

**Easy way to remember:** Think of **LECB** - London, Edinburgh, Cardiff, Belfast - going around the UK like the hands of a clock!

London is in the bottom right, Edinburgh is at the top, Cardiff is on the left, and Belfast is across the water.`
  },

  {
    id: 'lo-counties-north',
    title: 'UK County Locations - Northern England',
    knowledgeComponentId: 'UK_county_locations',
    bloomLevel: 1,
    orderIndex: 2,
    contentType: 'text',
    content: `## Learning Objective
By the end of this section, you will be able to identify and locate the major counties of Northern England on a map.

---

## Northern England Overview

Northern England stretches from the Scottish border down to roughly the line between Liverpool and Hull. This region contains some of England's most dramatic landscapes, including the Pennine Hills (often called "the backbone of England") and the Lake District.

---

## Key Counties

### Northumberland
The northernmost county in England, bordering Scotland. Known for Hadrian's Wall (the ancient Roman frontier) and vast open moorlands. The county town is Alnwick, though Newcastle upon Tyne is the largest city nearby (technically in Tyne and Wear).

**Remember:** Northumberland = North + Land = The northern land bordering Scotland

### Cumbria
Home to the Lake District, England's largest National Park. Located in the northwest corner, it contains England's highest peak (Scafell Pike) and deepest lake (Wastwater). The county town is Carlisle, an ancient border city.

**Remember:** Cumbria contains the Lakes — "Come-bria to see the water"

### County Durham
Sits between Northumberland and North Yorkshire. Famous for Durham Cathedral (a UNESCO World Heritage Site) and its coal mining heritage. The River Wear flows through the centre.

**Remember:** Durham is in the DURable middle of the North

### North Yorkshire
England's largest county by area. Contains the Yorkshire Dales and part of the North York Moors. York, the historic city with its famous Minster, sits at the southern edge.

**Remember:** Yorkshire = York's Shire = the lands around York

### Lancashire
On the west coast, historically the cotton manufacturing heartland. Contains the Ribble Valley and Forest of Bowland. Preston is the administrative centre, though Manchester's urban area overlaps the southern boundary.

**Remember:** Lancashire = Lancaster's Shire (Lancaster was the county town)

---

## Self-Check

1. Which county contains England's highest peak?
2. What ancient structure runs through Northumberland?
3. Which is England's largest county by area?

**Answers:** 1. Cumbria (Scafell Pike) | 2. Hadrian's Wall | 3. North Yorkshire

---

## Connection Forward

Knowing Northern England's geography helps explain:
- **The Pennines rain shadow** — why the east is drier than the west
- **River systems** — where major rivers like the Tees and Tyne originate
- **Climate patterns** — why Cumbria is one of the wettest places in England`,
    eli5Content: null
  },

  {
    id: 'lo-counties-south',
    title: 'UK County Locations - Southern England',
    knowledgeComponentId: 'UK_county_locations',
    bloomLevel: 1,
    orderIndex: 3,
    contentType: 'text',
    content: `## Learning Objective
By the end of this section, you will be able to identify and locate the major counties of Southern England on a map.

---

## Southern England Overview

Southern England includes everything south of a line roughly from the Bristol Channel to the Wash. This region is generally lower-lying than the north, warmer, and drier. It contains London and the heavily populated "Home Counties" that surround it.

---

## Key Counties

### Kent
The southeastern corner of England, historically called "the Garden of England" for its orchards and hop fields. It faces France across the English Channel — on a clear day, you can see the French coast from the white cliffs of Dover.

**Remember:** Kent = Corner (southeast corner of England)

### Sussex (East and West)
Stretches along the south coast, divided into East Sussex (containing Brighton) and West Sussex (containing Chichester). The South Downs, a chalk hill range, runs through both.

**Remember:** Sussex = South Saxons — where the South Saxons settled

### Surrey
Directly south of London, one of the "Home Counties." Despite being heavily suburban, it contains significant areas of woodland and heathland. Guildford is the county town.

**Remember:** Surrey = South of the River (Thames)

### Hampshire
Central southern coast, containing the cities of Southampton (major port) and Portsmouth (naval base). The New Forest National Park covers the southwest portion.

**Remember:** Hampshire = Southampton's Shire

### Devon
In the southwest, containing both Dartmoor and Exmoor. The county has two separate coastlines — north (facing the Bristol Channel) and south (facing the English Channel).

**Remember:** Devon = Deep valleys (it's very hilly)

### Cornwall
The southwestern tip of England, almost entirely surrounded by sea. Famous for its distinctive Celtic heritage, tin mining history, and dramatic coastline. Truro is the only city.

**Remember:** Cornwall = The corner of Wales (although it's not in Wales!)

---

## Self-Check

1. Which county is called "the Garden of England"?
2. Where can you see France on a clear day?
3. Which southwestern county has two separate coastlines?

**Answers:** 1. Kent | 2. The white cliffs of Dover (Kent) | 3. Devon

---

## Connection Forward

Southern England's geography explains:
- **Why it's warmer and drier** — further from Atlantic weather systems
- **Continental influence** — Kent experiences more extreme temperatures due to proximity to mainland Europe
- **River systems** — the Thames basin drains much of this region`,
    eli5Content: null
  },

  {
    id: 'lo-rivers',
    title: 'UK Major Rivers',
    knowledgeComponentId: 'UK_rivers',
    bloomLevel: 1,
    orderIndex: 4,
    contentType: 'text',
    content: `## Learning Objective
By the end of this section, you will be able to identify the UK's major rivers, their sources, and where they flow.

---

## Why Rivers Matter

Rivers shaped where people settled, where cities grew, and how goods moved before railways. Understanding rivers helps explain everything from flood patterns to why London became the capital.

---

## England's Major Rivers

### River Thames (346 km)
England's best-known river and the longest entirely in England. Rises in the Cotswold Hills (Gloucestershire), flows east through Oxford, Reading, and London, then into the North Sea.

**Key fact:** Tidal up to Teddington Lock — London sits on the tidal Thames
**Cities:** Oxford, Reading, London

### River Severn (354 km)
The longest river in the UK. Rises in the Welsh mountains, flows through Shrewsbury, Worcester, and Gloucester before entering the Bristol Channel. The Severn Estuary has the second-highest tidal range in the world.

**Key fact:** Forms much of the England-Wales border
**Cities:** Shrewsbury, Worcester, Gloucester

### River Trent (297 km)
The third-longest river in the UK. Flows northward through the Midlands, joining the Ouse to form the Humber Estuary.

**Key fact:** The Trent often marks the traditional North-South divide
**Cities:** Stoke-on-Trent, Nottingham

### River Mersey (112 km)
Flows through Manchester and Liverpool. Historically crucial for the Industrial Revolution — goods moved between the cotton mills of Manchester and the port of Liverpool.

**Key fact:** The Mersey Tunnel connects Liverpool and Birkenhead
**Cities:** Manchester (tributary), Liverpool

---

## Scotland's Major Rivers

### River Tay (188 km)
Scotland's longest river. Flows from the Highlands through Perth and into the North Sea at Dundee. Famous for salmon fishing.

### River Clyde (176 km)
Flows through Glasgow. Historically famous for shipbuilding — "Clyde-built" was a mark of quality.

---

## Memory Technique

**"The Seven Trents Through the Thames"**
- **Severn** — longest, flows to Bristol Channel
- **Trent** — flows north through Midlands  
- **Thames** — flows east through London

---

## Self-Check

1. Which is the longest river in the UK?
2. What river flows through London?
3. Which river traditionally marks the North-South divide?

**Answers:** 1. River Severn (354 km) | 2. River Thames | 3. River Trent

---

## Connection Forward

Understanding rivers helps explain:
- **Flood risk** — why river valleys flood and how climate affects this
- **Rain shadow** — rivers on the east are fed differently than western rivers
- **North Atlantic Drift** — affects rainfall patterns that feed these rivers`,
    eli5Content: null
  },

  {
    id: 'lo-mountains',
    title: 'UK Mountains and Uplands',
    knowledgeComponentId: 'UK_mountains',
    bloomLevel: 1,
    orderIndex: 5,
    contentType: 'text',
    content: `## Learning Objective
By the end of this section, you will be able to identify the UK's major mountain ranges and upland areas and explain their geographic distribution.

---

## The UK's Mountain Geography

The UK is broadly divided into "Highland Britain" (the north and west) and "Lowland Britain" (the south and east). This division is fundamental to understanding British geography and climate.

---

## Major Mountain Ranges

### The Scottish Highlands
The most mountainous region in the British Isles. Contains all of the UK's peaks over 1,000m, including:
- **Ben Nevis (1,345m)** — the UK's highest peak, near Fort William
- **Cairngorms** — a high plateau with subarctic conditions at the summit

**Remember:** Scottish = Highest (all the big ones are in Scotland)

### The Pennines
The "backbone of England" — a chain of hills running north-south through northern England, from the Scottish Border to the Peak District.
- **Cross Fell (893m)** — highest point in the Pennines
- Forms a natural barrier between Lancashire/Cumbria (west) and Yorkshire/Durham (east)

**Remember:** Pennines = England's sPine

### The Lake District
In Cumbria, northwest England. Contains England's highest peak:
- **Scafell Pike (978m)** — England's highest
- **Helvellyn (950m)** — third highest in England

**Remember:** Lakes + Peaks = Lake District

### Snowdonia (Eryri)
In northwest Wales. Contains Wales's highest peak:
- **Snowdon/Yr Wyddfa (1,085m)** — Wales's highest

**Remember:** Snow + don = Snowdon (though it rarely has snow!)

### The Brecon Beacons (Bannau Brycheiniog)
In south Wales. Lower than Snowdonia but significant:
- **Pen y Fan (886m)** — highest peak in southern Britain

---

## Highest Peaks by Nation

| Nation | Peak | Height |
|--------|------|--------|
| Scotland | Ben Nevis | 1,345m |
| Wales | Snowdon | 1,085m |
| England | Scafell Pike | 978m |
| N. Ireland | Slieve Donard | 850m |

---

## Self-Check

1. What is the UK's highest peak?
2. What are the Pennines often called?
3. Which upland area contains England's highest peak?

**Answers:** 1. Ben Nevis (1,345m) | 2. The backbone of England | 3. The Lake District (Scafell Pike)

---

## Connection Forward

Mountains and uplands directly affect:
- **Rainfall patterns** — western slopes receive far more rain
- **Rain shadow effect** — the Pennines block moisture from reaching the east
- **Climate classification** — highland areas have distinct microclimates`,
    eli5Content: null
  },

  {
    id: 'lo-national-parks',
    title: 'UK National Parks',
    knowledgeComponentId: 'UK_national_parks',
    bloomLevel: 1,
    orderIndex: 6,
    contentType: 'text',
    content: `## Learning Objective
By the end of this section, you will be able to identify the UK's National Parks and explain their geographic distribution.

---

## What Are National Parks?

National Parks are protected areas of countryside designated for their natural beauty, wildlife, and cultural heritage. Unlike American national parks, UK national parks contain towns, farms, and private land — people live and work in them.

---

## England's National Parks (10)

### Upland Parks (North & West)
- **Lake District** — England's largest park; mountains and lakes in Cumbria
- **Yorkshire Dales** — limestone scenery, dry stone walls, and valleys
- **North York Moors** — heather moorland on England's northeast coast
- **Peak District** — where the Pennines begin; first UK national park (1951)
- **Northumberland** — Hadrian's Wall and England's darkest night skies

### Lowland/Coastal Parks (South)
- **New Forest** — ancient woodland in Hampshire; famous for wild ponies
- **South Downs** — chalk hills from Winchester to Eastbourne
- **Exmoor** — coastal moorland spanning Devon/Somerset
- **Dartmoor** — granite tors and wild ponies in Devon
- **The Broads** — wetlands and waterways in Norfolk/Suffolk

---

## Wales's National Parks (3)

- **Snowdonia (Eryri)** — mountains including Wales's highest peak
- **Brecon Beacons (Bannau Brycheiniog)** — mountains and waterfalls in south Wales  
- **Pembrokeshire Coast** — the only UK park focused on coastline

---

## Scotland's National Parks (2)

- **Cairngorms** — UK's largest park; subarctic plateau and ancient Caledonian forest
- **Loch Lomond & The Trossachs** — "the gateway to the Highlands"

---

## Geographic Pattern

**Notice:** Most parks are in Highland Britain (north & west) where the dramatic landscapes are.

---

## Self-Check

1. Which was the first UK national park (1951)?
2. Which is the UK's largest national park?
3. Which Welsh park focuses entirely on coastline?

**Answers:** 1. Peak District | 2. Cairngorms | 3. Pembrokeshire Coast

---

## Connection Forward

National Parks help illustrate:
- **Highland vs Lowland Britain** — most parks protect upland areas
- **Rainfall patterns** — western parks (Lake District, Snowdonia) are the wettest
- **Climate diversity** — Cairngorms has subarctic conditions; New Forest is mild`,
    eli5Content: null
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // LEVEL 2: UNDERSTANDING (Bloom 2)
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: 'lo-westerly-winds',
    title: 'Westerly Winds and UK Rainfall',
    knowledgeComponentId: 'westerly_winds_rainfall',
    bloomLevel: 2,
    orderIndex: 7,
    contentType: 'text',
    content: `## Learning Objective
By the end of this section, you will be able to explain why western parts of the UK receive more rainfall than eastern parts.

---

## Prerequisites
You should already know:
- UK county locations (where west and east England are)
- Basic UK geography orientation

---

## The Key Concept: Prevailing Westerlies

The UK sits in the path of the **prevailing westerly winds** — winds that blow predominantly from west to east across the Atlantic Ocean.

### Why Does This Matter?

1. **The Atlantic Journey** — Air masses travel thousands of kilometres across the warm Atlantic Ocean
2. **Moisture Pickup** — As air moves over water, it evaporates moisture and becomes humid
3. **First Contact** — When this moist air hits the UK, the **western coasts** are the first land it encounters
4. **Relief Rainfall** — Air is forced upward over western mountains, cools, and releases rain

---

## The Process: Relief Rainfall

**Step by step:**
1. Warm, moist air arrives from the Atlantic (westerlies)
2. Air hits western highlands (Wales, Lake District, Scottish Highlands)
3. Air is forced upward → cools → water vapour condenses → **rain**
4. By the time air reaches the east, much moisture has been lost

---

## Real-World Evidence

| Location | Position | Annual Rainfall |
|----------|----------|----------------|
| Seathwaite (Lake District) | West | 3,400mm |
| Manchester | Central | 870mm |
| Cambridge | East | 550mm |

**Seathwaite receives 6x more rain than Cambridge** — entirely due to position relative to prevailing westerlies.

---

## Why "Prevailing"?

The winds don't blow from the west 100% of the time, but they do blow from the west **most** of the time (around 60-70% of days). This consistent pattern creates the overall rainfall distribution we observe.

Other wind directions (easterlies, northerlies) bring different weather — but they're less frequent.

---

## Common Misconception

❌ **Wrong:** "The west is wetter because it's closer to the sea"
✅ **Right:** "The west is wetter because moist Atlantic air hits western mountains first, losing its moisture before reaching the east"

The east coast is also "close to the sea" (the North Sea), but North Sea air masses bring less rainfall because:
- They travel over less water (shorter journey)
- The water is colder (less evaporation)
- There are no major mountain barriers on the east coast

---

## Self-Check

1. From which direction do the UK's prevailing winds blow?
2. Why does the Lake District receive so much more rain than Cambridge?
3. What process causes air to release moisture when it hits mountains?

**Answers:** 1. From the west (westerlies) | 2. Moist Atlantic air hits western mountains first, losing moisture through relief rainfall before reaching the east | 3. Relief rainfall (air rises, cools, condenses)

---

## Connection Forward

This concept directly explains:
- **The Pennines rain shadow** — the specific effect of the Pennine hills
- **Why Eastern England has a more continental climate** — it's shielded from Atlantic moisture
- **Flood risk patterns** — why western rivers are fed differently than eastern ones`,
    eli5Content: null
  },

  {
    id: 'lo-pennines-rain-shadow',
    title: 'The Pennines Rain Shadow',
    knowledgeComponentId: 'pennines_rain_shadow',
    bloomLevel: 2,
    orderIndex: 8,
    contentType: 'text',
    content: `## Learning Objective
By the end of this section, you will be able to explain the rain shadow effect created by the Pennines and its impact on eastern England.

---

## Prerequisites
You should already know:
- UK Mountains (especially the Pennines as "the backbone of England")
- Westerly winds and relief rainfall (how moisture is lost over western slopes)

---

## What Is a Rain Shadow?

A **rain shadow** is an area of reduced rainfall on the **leeward side** (downwind side) of a mountain range. The mountains literally "shadow" the land from rain.

---

## The Pennines Effect

### The Process:

1. **Moist Atlantic air** arrives from the west (prevailing westerlies)
2. **Forced upward** over the western Pennine slopes
3. **Cools and condenses** → heavy rainfall on western side (Lancashire, Cumbria)
4. **Crosses the summit** with reduced moisture
5. **Descends the eastern slope** → air warms and dries further
6. **Eastern areas** (Yorkshire, Durham) receive much less rainfall

---

## Real-World Comparison

| City | Side of Pennines | Annual Rainfall |
|------|------------------|----------------|
| Burnley (Lancashire) | West | 1,200mm |
| Bradford | East (just) | 870mm |
| York | East | 640mm |
| Hull | Far East | 600mm |

**Moving east = less rain.** The Pennines have "wrung out" the moisture.

---

## Why This Matters

The rain shadow creates **two different Englands**:

**Western Pennine slopes:**
- Greener, damper
- Historically: wool processing (needed water), coal mining
- More frequent flooding

**Eastern lowlands:**
- Drier, sunnier summers
- Historically: arable farming (crops need less rain)
- More prone to drought in summer

---

## The "Föhn Effect"

When air descends the eastern slopes, it warms at about 10°C per 1,000m. This can create unusual **warm, dry winds** on the eastern side — sometimes called a "Helm Wind" in the Pennines.

---

## Self-Check

1. What is the "leeward side" of a mountain?
2. Why is York drier than Burnley, even though both are in northern England?
3. What happens to air temperature as it descends the eastern Pennine slopes?

**Answers:** 1. The downwind side (the side sheltered from the prevailing wind) | 2. The Pennines block moist Atlantic air; by the time air reaches York, it has lost much of its moisture | 3. It warms (and becomes even drier)

---

## Connection Forward

The rain shadow helps explain:
- **Continental effect** — why eastern England has more extreme temperatures
- **Flood risk integration** — different rainfall patterns create different flood risks
- **Climate classification** — why we can divide England into climate zones`,
    eli5Content: null
  },

  {
    id: 'lo-maritime-continental',
    title: 'Maritime vs Continental Climate',
    knowledgeComponentId: 'maritime_continental',
    bloomLevel: 2,
    orderIndex: 9,
    contentType: 'text',
    content: `## Learning Objective
By the end of this section, you will be able to distinguish between maritime and continental climate influences and explain how both affect the UK.

---

## Prerequisites
You should already know:
- UK county locations (especially coastal vs inland areas)
- Basic understanding of UK's island geography

---

## Two Climate Types

### Maritime Climate
- Influenced by the **sea**
- **Mild winters, cool summers** (small temperature range)
- **High humidity, frequent cloud**
- **Rainfall spread throughout the year**

### Continental Climate
- Influenced by **large land masses**
- **Cold winters, hot summers** (large temperature range)
- **Lower humidity, more sunshine**
- **Less overall rainfall, but intense summer storms**

---

## The UK's Position

The UK sits between two major climate influences:

**Result:** The UK has a **predominantly maritime climate** (thanks to prevailing westerlies), but **eastern areas show continental tendencies**.

---

## West vs East: The Gradient

| Characteristic | Western UK | Eastern UK |
|----------------|------------|------------|
| Main influence | Atlantic (maritime) | Europe (continental) |
| Winter temp | Milder (5-7°C) | Colder (3-5°C) |
| Summer temp | Cooler (15-17°C) | Warmer (17-20°C) |
| Annual range | Small (10-12°C) | Larger (14-16°C) |
| Rainfall | Higher, year-round | Lower, more seasonal |

---

## Real-World Examples

### Plymouth (Southwest, very maritime):
- January average: 6°C
- July average: 16°C
- Annual range: **10°C**
- Rarely freezes, rarely gets hot

### Cambridge (East, continental influence):
- January average: 4°C
- July average: 18°C
- Annual range: **14°C**
- Frost common in winter, occasional heatwaves in summer

---

## Why Does the Sea Moderate Temperature?

Water has a **high heat capacity** — it takes a lot of energy to change its temperature.

- **Summer:** The sea absorbs heat slowly, keeping coastal air cool
- **Winter:** The sea releases stored heat slowly, keeping coastal air mild

Land heats and cools much faster, creating continental extremes.

---

## Common Misconception

❌ **Wrong:** "The UK has one climate"
✅ **Right:** "The UK has a gradient from maritime (west) to semi-continental (east)"

This explains why:
- Fruit farming thrives in Kent (warm summers)
- Dairy farming dominates in the west (mild, wet year-round)
- The Scottish east coast can be cold and sunny while the west is mild and rainy

---

## Self-Check

1. What characterises a maritime climate?
2. Why does Cambridge have hotter summers than Plymouth?
3. What physical property of water moderates coastal temperatures?

**Answers:** 1. Mild winters, cool summers, small annual temperature range, high humidity | 2. Cambridge is further from the Atlantic's moderating influence and more exposed to continental air masses from Europe | 3. High heat capacity (water heats and cools slowly)

---

## Connection Forward

Understanding maritime vs continental helps explain:
- **Climate classification** — how to categorise UK climate zones
- **The continental effect** — why eastern areas experience extremes
- **Agricultural patterns** — what grows where`,
    eli5Content: null
  },

  {
    id: 'lo-north-atlantic-drift',
    title: 'The North Atlantic Drift',
    knowledgeComponentId: 'north_atlantic_drift',
    bloomLevel: 2,
    orderIndex: 10,
    contentType: 'text',
    content: `## Learning Objective
By the end of this section, you will be able to explain how the North Atlantic Drift affects UK temperatures and why the UK is warmer than its latitude suggests.

---

## Prerequisites
You should already know:
- UK rivers (understanding that water carries heat)
- Basic UK geography (position in the Atlantic)

---

## The Puzzle: Why Is the UK So Mild?

The UK lies between 50°N and 60°N latitude — the same as:
- **Labrador, Canada** (average January: -15°C)
- **Southern Alaska** (average January: -10°C)

Yet London's average January temperature is **5°C** — about 20 degrees warmer than places at the same latitude across the Atlantic.

**The answer:** The North Atlantic Drift.

---

## What Is the North Atlantic Drift?

The North Atlantic Drift is a powerful **warm ocean current** that flows from the Gulf of Mexico, across the Atlantic, toward the UK and Norway.

### The Process:

1. **Warm water** from the Gulf of Mexico flows north (the Gulf Stream)
2. **Crosses the Atlantic** as the North Atlantic Drift
3. **Releases heat** into the atmosphere near the UK
4. **Prevailing westerlies** blow this warmed air over the British Isles

---

## The Numbers: Heat Transfer

The North Atlantic Drift transports approximately **1 petawatt** (1,000,000,000,000,000 watts) of heat toward Western Europe.

This is roughly equivalent to **500,000 nuclear power stations** running continuously.

---

## Impact on UK Climate

| Effect | Without NAD | With NAD |
|--------|-------------|----------|
| UK January avg | ~ -5°C | ~ +5°C |
| UK growing season | 4-5 months | 8-9 months |
| Scottish Highlands | Permanently frozen | Green year-round |
| Ports | Ice-bound in winter | Ice-free year-round |

---

## Why Western Coasts Benefit Most

The North Atlantic Drift's warming effect is strongest on **western and northern coasts**:

- **Cornwall, Devon:** Palm trees grow! (average frost-free days: 330+)
- **Western Scotland:** Mild despite high latitude
- **Northern Ireland:** Milder winters than inland England

Eastern coasts benefit less because:
- Further from the warm current
- Prevailing westerlies have crossed cold land

---

## Climate Change Connection

Scientists monitor the North Atlantic Drift carefully because **if it weakens**, UK temperatures could drop dramatically. Paradoxically, global warming could make the UK **colder** if melting ice disrupts ocean circulation.

---

## Self-Check

1. What ocean current warms the UK?
2. Why is the UK milder than Labrador at the same latitude?
3. Which UK coasts benefit most from the North Atlantic Drift?

**Answers:** 1. The North Atlantic Drift (continuation of the Gulf Stream) | 2. Warm water from the Gulf of Mexico releases heat into the atmosphere near the UK, which prevailing westerlies blow over the British Isles | 3. Western and northern coasts (closest to the warm current)

---

## Connection Forward

The North Atlantic Drift helps explain:
- **Climate change application** — how changes to ocean currents could affect UK climate
- **Why maritime influence is so strong** — the Atlantic isn't just wet, it's warm
- **Agricultural patterns** — why the UK can grow crops that shouldn't survive at this latitude`,
    eli5Content: null
  },

  {
    id: 'lo-continental-effect',
    title: 'The Continental Effect in Eastern Britain',
    knowledgeComponentId: 'continental_effect',
    bloomLevel: 2,
    orderIndex: 11,
    contentType: 'text',
    content: `## Learning Objective
By the end of this section, you will be able to explain why eastern Britain experiences greater temperature extremes than western areas.

---

## Prerequisites
You should already know:
- UK county locations (especially eastern counties)
- Maritime vs Continental climate (the two types of influence)

---

## The Continental Effect Defined

The **continental effect** describes how areas **far from the sea** (or shielded from maritime influence) experience:
- **Hotter summers**
- **Colder winters**
- **Greater annual temperature range**
- **Less overall rainfall**

In the UK, this primarily affects **eastern England**, particularly:
- East Anglia (Norfolk, Suffolk, Cambridgeshire)
- Lincolnshire
- East Yorkshire
- Kent (to some degree)

---

## Why Eastern Britain Is Different

**Three factors combine:**

1. **Distance from Atlantic** — Maritime influence weakens moving east
2. **Rain shadow** — Pennines and other uplands block moisture
3. **Proximity to Europe** — Continental air masses can reach eastern coasts directly across the North Sea

---

## Temperature Comparison

| Location | January Mean | July Mean | Annual Range |
|----------|--------------|-----------|-------------|
| Pembrokeshire (west) | 6°C | 15°C | **9°C** |
| Cambridge (east) | 4°C | 18°C | **14°C** |
| **Difference** | 2°C colder | 3°C hotter | 5°C more extreme |

Cambridge isn't on a coast, but it experiences continental-type climate patterns.

---

## Seasonal Weather Patterns

### Summer in Eastern England:
- **Hotter** (air from Europe reaches UK heated by land)
- **Drier** (less Atlantic moisture reaches east)
- **More sunshine** (fewer clouds)
- Occasional **heatwaves** when hot continental air arrives

### Winter in Eastern England:
- **Colder** (continental air masses bring freezing temperatures)
- **Drier** (but more likely to snow when precipitation occurs)
- **"Beast from the East"** — occasional severe cold spells from Siberian air
- More frequent **frost and ice**

---

## The "Beast from the East"

When high pressure sits over Scandinavia, it can draw **Siberian air** directly across the North Sea to eastern Britain:

- Temperatures can drop to -10°C or below
- Heavy snowfall possible (cold air picks up moisture over North Sea)
- Western Britain stays relatively mild

This is the continental effect at its most extreme.

---

## Agricultural Implications

| Eastern England | Western England |
|-----------------|----------------|
| Arable farming (wheat, barley) | Pastoral farming (dairy, sheep) |
| Needs warm, dry summers | Needs mild, wet conditions |
| Irrigation sometimes needed | Rarely needs irrigation |
| Earlier harvests | Later growing season |

---

## Self-Check

1. Why does Cambridge have hotter summers than Pembrokeshire?
2. What is the "Beast from the East"?
3. Why is eastern England better suited to arable farming?

**Answers:** 1. Cambridge is further from the Atlantic's moderating influence and more exposed to continental air masses | 2. A severe cold spell caused by Siberian air reaching eastern Britain when high pressure over Scandinavia draws air from the east | 3. Warmer, drier summers allow crops like wheat and barley to ripen properly

---

## Connection Forward

The continental effect is essential for:
- **Climate classification** — dividing the UK into climate zones
- **Understanding flood risk** — eastern rivers behave differently
- **Predicting climate change impacts** — how will the balance shift?`,
    eli5Content: null
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // LEVEL 3: APPLYING (Bloom 3)
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: 'lo-climate-classification',
    title: 'UK Climate Classification',
    knowledgeComponentId: 'climate_classification',
    bloomLevel: 3,
    orderIndex: 12,
    contentType: 'text',
    content: `## Learning Objective
By the end of this section, you will be able to classify different UK regions by climate type and explain the factors that create these classifications.

---

## Prerequisites
You should already understand:
- Maritime vs Continental climate (the two main influences)
- The Continental Effect (why eastern areas differ from western)
- Westerly winds and rainfall patterns

---

## The Köppen Classification System

Climatologists use the **Köppen system** to classify climates worldwide. The UK falls into category **Cfb** — **Temperate Oceanic Climate**:

- **C** = Temperate (mild) — no month averages below -3°C or above 22°C
- **f** = No dry season — precipitation year-round
- **b** = Warm summer — warmest month below 22°C

However, this single classification masks significant **internal variation**.

---

## UK Climate Zones: A Practical Classification

Based on the factors you've learned, we can identify **four distinct climate zones**:

### Zone 1: Western Maritime (Wales, Cornwall, Western Scotland)
- **Characteristics:** Mild winters (6-8°C), cool summers (14-16°C), high rainfall (1,500-3,000mm)
- **Why:** Maximum Atlantic/NAD influence, first landfall for westerlies
- **Agriculture:** Dairy farming, sheep grazing (needs year-round grass growth)

### Zone 2: Eastern Semi-Continental (East Anglia, Lincolnshire, East Yorkshire)
- **Characteristics:** Colder winters (3-5°C), warmer summers (17-19°C), low rainfall (500-650mm)
- **Why:** Rain shadow effect, continental air masses from Europe
- **Agriculture:** Arable farming (wheat, barley, sugar beet)

### Zone 3: Highland (Scottish Highlands, Lake District, Snowdonia)
- **Characteristics:** Cold winters (0-3°C), cool summers (12-14°C), very high rainfall (2,000-4,000mm)
- **Why:** Altitude reduces temperature (~0.6°C per 100m), orographic enhancement of rainfall
- **Agriculture:** Hill farming (sheep), forestry

### Zone 4: Lowland Central (Midlands, Thames Valley)
- **Characteristics:** Moderate winters (4-6°C), moderate summers (16-18°C), moderate rainfall (700-900mm)
- **Why:** Transitional zone between maritime west and continental east
- **Agriculture:** Mixed farming

---

## Applying the Classification

**Example 1: Norwich (Norfolk)**
- East of Pennines? ✓ Yes
- Lowland? ✓ Yes
- → **Zone 2: Eastern Semi-Continental**
- Prediction: Drier, colder winters, warmer summers
- Reality: 629mm rain, January avg 4°C, July avg 17°C ✓

**Example 2: Keswick (Lake District)**
- Upland area? ✓ Yes (surrounded by mountains)
- → **Zone 3: Highland**
- Prediction: High rainfall, cool year-round
- Reality: 1,470mm rain, January avg 4°C, July avg 15°C ✓

---

## Self-Check

1. What Köppen classification applies to the UK?
2. Why would you classify Plymouth differently from Cambridge?
3. What zone would Aberdeen fall into, and why?

**Answers:** 1. Cfb (Temperate Oceanic) | 2. Plymouth is Zone 1 (Western Maritime — maximum Atlantic influence); Cambridge is Zone 2 (Eastern Semi-Continental — rain shadow, continental influence) | 3. Zone 1/3 hybrid — coastal but northern, significant maritime influence but cooler due to latitude`,
    eli5Content: null
  },

  {
    id: 'lo-climate-change',
    title: 'Climate Change and UK Geography',
    knowledgeComponentId: 'climate_change_application',
    bloomLevel: 3,
    orderIndex: 13,
    contentType: 'text',
    content: `## Learning Objective
By the end of this section, you will be able to apply your knowledge of UK climate systems to predict how climate change might affect different regions.

---

## Prerequisites
You should already understand:
- The North Atlantic Drift (how ocean currents warm the UK)
- Westerly winds and rainfall patterns
- Regional climate variation (zones)

---

## Climate Change Predictions for the UK

The UK Met Office projects these changes by 2050-2080:

| Factor | Projection |
|--------|------------|
| Average temperature | +1.5 to 4°C |
| Summer rainfall | -10 to -40% (south) |
| Winter rainfall | +10 to +30% (north/west) |
| Sea level | +20 to 80cm |
| Extreme events | More frequent heatwaves, storms |

---

## Applying Your Knowledge: Regional Impacts

### Eastern England (Zone 2: Semi-Continental)

**Your knowledge:** Already the driest region due to rain shadow effect

**Climate change impact:**
- Summer droughts become more severe
- Continental heatwaves penetrate more easily
- Irrigation demand increases dramatically
- Some crops may become unviable

**Prediction exercise:** If Cambridge currently averages 550mm rainfall and projections suggest -20% summer rainfall, what agricultural adaptations might be needed?

### Western Uplands (Zone 3: Highland)

**Your knowledge:** Already receives 2,000-4,000mm rainfall from westerlies hitting mountains

**Climate change impact:**
- Winter rainfall increases further (+30%)
- More intense storm events
- Increased flood risk in western valleys
- Snow becomes rare even at altitude

**Prediction exercise:** If the Lake District already floods regularly, what does +30% winter rainfall mean for communities like Keswick?

### The North Atlantic Drift Wildcard

**Your knowledge:** The NAD keeps the UK 15-20°C warmer than its latitude suggests

**The paradox:** Global warming could actually make the UK **colder** if:
1. Arctic ice melts rapidly
2. Fresh water disrupts ocean circulation
3. The NAD weakens or shifts

**Current evidence:** The NAD has weakened by ~15% since the 1950s. Scientists debate whether this trend will continue.

**Scenario analysis:**
- If NAD continues: UK warms with global trend
- If NAD weakens significantly: UK could cool while the rest of the world warms
- If NAD collapses: UK winters could become 5-10°C colder

---

## Synthesis: Winners and Losers

| Region | Projected Impact | Adaptation Needed |
|--------|------------------|-------------------|
| Southeast | Water stress, heatwaves | Reservoirs, building design |
| Northwest | Flooding, storms | Flood defences, drainage |
| Scottish Highlands | Milder winters, tourism changes | Diversify ski industry |
| Coastal areas | Sea level rise, erosion | Managed retreat, barriers |
| East Anglia | Agricultural disruption | Crop switching, irrigation |

---

## Critical Thinking: Uncertainty

Climate projections involve uncertainty. Your geographic knowledge helps you:

1. **Understand mechanisms** — Why predictions make sense (or don't)
2. **Identify vulnerabilities** — Which regions face amplified risks
3. **Evaluate adaptations** — Whether proposed solutions address root causes

---

## Self-Check

1. Why might climate change cause MORE flooding in western England but MORE drought in eastern England?
2. How could global warming paradoxically make the UK colder?
3. Which UK climate zone faces the greatest agricultural challenge from climate change, and why?

**Answers:** 1. Westerlies bring moisture from the Atlantic; climate change intensifies this cycle, increasing western rainfall. Eastern areas, already in rain shadow, see summer rainfall decrease further. | 2. If melting Arctic ice disrupts ocean circulation and weakens the North Atlantic Drift, the UK loses the warming effect of the Gulf Stream/NAD system. | 3. Zone 2 (Eastern Semi-Continental) — already the driest region, faces further summer rainfall reduction while temperatures increase, threatening arable farming that depends on current conditions.`,
    eli5Content: null
  },

  {
    id: 'lo-flood-risk',
    title: 'Flood Risk: Integrating Geographic Factors',
    knowledgeComponentId: 'flood_risk_integration',
    bloomLevel: 3,
    orderIndex: 14,
    contentType: 'text',
    content: `## Learning Objective
By the end of this section, you will be able to assess flood risk for UK locations by integrating multiple geographic factors.

---

## Prerequisites
You should already understand:
- UK rivers (where they flow and why)
- The Pennines rain shadow (differential rainfall patterns)
- Westerly winds and relief rainfall

---

## Flood Risk: A Multi-Factor Problem

Flooding isn't just about rainfall — it's about how multiple geographic factors interact:

**FLOOD RISK = Rainfall + Topography + Soil + Urbanisation + River Characteristics + Coastal Factors**

---

## Factor 1: Rainfall Patterns (What You Know)

**Western UK:** High rainfall from westerlies → rivers receive sustained input → flood risk from **volume**

**Eastern UK:** Lower rainfall BUT more intense summer storms → flash flood risk from **intensity**

**Key insight:** Different rainfall patterns create different flood types.

---

## Factor 2: Topography and River Response

**Steep catchments (Lake District, Wales):**
- Water reaches rivers quickly
- "Flashy" response — rapid rise and fall
- Short warning time
- Example: Borrowdale floods rapidly after heavy rain

**Flat catchments (East Anglia, Somerset Levels):**
- Water drains slowly
- Prolonged flooding — water takes days/weeks to disperse
- Longer warning time but longer duration
- Example: Somerset Levels flood for months in wet winters

---

## Factor 3: The Pennines Effect on Eastern Rivers

**Your knowledge:** Rain shadow means eastern regions receive less total rainfall.

**The complication:** Eastern rivers (Ouse, Trent, Humber) have catchments that extend INTO the Pennines.

When heavy rain falls on western Pennine slopes:
1. Water flows east down rivers
2. Arrives in low-lying eastern areas (York, Doncaster, Hull)
3. These areas flood despite receiving little local rainfall

**Example: York floods**
York doesn't flood because of rain falling on York — it floods because of rain falling 50+ miles away in the Yorkshire Dales, which then flows down the River Ouse.

---

## Flood Risk Assessment Framework

Use this framework to assess any UK location:

| Factor | Low Risk | High Risk |
|--------|----------|----------|
| **Position** | East/rain shadow | West/windward |
| **Altitude** | Hilltop/elevated | Valley floor/floodplain |
| **Upstream catchment** | Small, local | Large, extends to uplands |
| **River proximity** | >1km from major river | On floodplain |
| **Urbanisation** | Rural (absorption) | Urban (runoff) |
| **Coastal** | Inland | Estuary/tidal |

---

## Case Study: Assess These Locations

**Location A: Cockermouth (Cumbria)**
- Position: Western Lake District ✗ (high rainfall)
- Altitude: Valley floor where two rivers meet ✗
- Upstream: Lake District mountains ✗
- Result: **VERY HIGH RISK** (flooded severely in 2009, 2015)

**Location B: Cambridge**
- Position: Eastern, rain shadow ✓
- Altitude: Low but not floodplain ✓
- Upstream: Small local catchment ✓
- Result: **LOW RISK** (rarely floods)

**Location C: York**
- Position: Eastern ✓
- Altitude: River valley floor ✗
- Upstream: Pennine Dales (large, high rainfall) ✗
- Result: **HIGH RISK** (floods regularly despite low local rainfall)

---

## Self-Check

1. Why does York flood even though it's in the drier east?
2. What's the difference between Lake District floods and Somerset Levels floods?
3. Using the framework, assess flood risk for: Hull (east coast, Humber estuary, low-lying, large upstream catchment)

**Answers:** 1. York's upstream catchment extends into the Pennines/Yorkshire Dales. Heavy rainfall there flows down the Ouse to York. | 2. Lake District: rapid "flashy" floods from steep terrain; Somerset Levels: prolonged flooding from flat terrain where water drains slowly | 3. Hull: VERY HIGH RISK — estuary location (tidal surge risk), extremely low-lying (below sea level in places), large upstream catchment (Ouse, Trent, Aire all drain to Humber), urban (rapid runoff). Hull is one of the UK's highest-risk cities.`,
    eli5Content: null
  }
];

async function seedLearningObjects() {
  console.log('\n📚 Seeding Learning Objects...\n');

  for (const lo of learningObjects) {
    try {
      await prisma.learningObject.upsert({
        where: { id: lo.id },
        update: {
          title: lo.title,
          content: lo.content,
          eli5Content: lo.eli5Content,
          contentType: lo.contentType,
          bloomLevel: lo.bloomLevel,
          orderIndex: lo.orderIndex,
          knowledgeComponentId: lo.knowledgeComponentId,
        },
        create: {
          id: lo.id,
          title: lo.title,
          content: lo.content,
          eli5Content: lo.eli5Content,
          contentType: lo.contentType,
          bloomLevel: lo.bloomLevel,
          orderIndex: lo.orderIndex,
          knowledgeComponentId: lo.knowledgeComponentId,
        },
      });
      console.log(`  ✅ ${lo.id} — ${lo.title} (Bloom ${lo.bloomLevel})`);
    } catch (error) {
      console.error(`  ❌ Failed: ${lo.id}`, error);
    }
  }

  // Summary
  const counts = await prisma.learningObject.groupBy({
    by: ['bloomLevel'],
    _count: { id: true },
  });

  console.log('\n── Learning Objects Summary ─────────────────────────────────');
  console.log(`   Total objects : ${learningObjects.length}`);
  counts.forEach((c) => {
    console.log(`   Bloom ${c.bloomLevel}       : ${c._count.id} items`);
  });
  console.log('─────────────────────────────────────────────────────────────\n');
}

seedLearningObjects()
  .then(() => {
    console.log('✅ Learning Objects seeding complete!\n');
    process.exit(0);
  })
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });