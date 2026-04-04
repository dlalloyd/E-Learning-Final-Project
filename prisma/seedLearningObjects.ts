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
  // LEVEL 1 SUPPLEMENT: UK Physical Features (Bloom 1, orderIndex 15–19)
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: 'lo-uk-rivers-overview',
    title: 'Major UK River Systems',
    knowledgeComponentId: 'UK_rivers',
    bloomLevel: 1,
    orderIndex: 15,
    contentType: 'text',
    content: `## Learning Objective
By the end of this section, you will be able to name the UK's five major river systems, describe their approximate source-to-mouth journeys, and explain why rivers have been central to human geography.

---

## Why Rivers Matter

Rivers shaped where people settled, where cities grew, and how goods moved across the country for thousands of years. Before roads and railways, a navigable river was the fastest, cheapest route to carry heavy goods. Today, understanding river systems is essential for explaining patterns of industry, population, and flood risk.

---

## The Five Major River Systems

### River Thames (346 km)
The most economically and historically significant river in England. It rises in the Cotswold Hills near Kemble in Gloucestershire and flows eastward through Oxford, Reading, Windsor, and central London before emptying into the North Sea via the Thames Estuary at Southend-on-Sea. The Thames is tidal as far upstream as Teddington Lock in southwest London.

**Why it matters:** London grew at the lowest point where the Thames could be bridged, making it a natural hub for trade with continental Europe. The Port of London was once the busiest in the world.

### River Severn (354 km)
The longest river in the UK. It rises on the eastern slopes of Plynlimon in the Cambrian Mountains of Wales and flows northeast through Shrewsbury, then south through Worcester and Gloucester before emptying into the Bristol Channel. The Severn has the second-largest tidal range in the world (up to 15 metres), creating the famous Severn Bore — a tidal wave that surges upstream.

**Why it matters:** The Severn historically divided Wales from England and formed a natural barrier. The two Severn road bridges now carry millions of vehicles per year between England and Wales.

### River Trent (297 km)
England's third-longest river. Rising in the Staffordshire Moorlands near Stoke-on-Trent, it flows northeast through Nottingham and Newark before joining the Ouse to form the Humber Estuary at the east coast. The Trent valley was traditionally regarded as marking the boundary between the more prosperous south and the industrialised north of England.

**Why it matters:** The Trent powered the industrial Midlands — pottery, steel, and coal industries all developed along its valley. Its valley is home to many coal-fired power stations, attracted by river water for cooling.

### River Mersey (112 km)
Formed by the confluence of the Goyt and Tame rivers at Stockport, the Mersey flows west through Manchester's conurbation before widening into the Mersey Estuary and emptying into the Irish Sea at Liverpool Bay.

**Why it matters:** Liverpool's position on the Mersey estuary made it a global trading port, particularly during the Atlantic trade era. The Manchester Ship Canal (opened 1894) turned Manchester into an inland port connected directly to the Mersey.

### River Tyne (118 km)
Formed where the North Tyne and South Tyne meet near Hexham in Northumberland, the Tyne flows east through Newcastle and Gateshead before reaching the North Sea at Tynemouth.

**Why it matters:** Newcastle upon Tyne grew around coal export — "coals to Newcastle" became a byword for sending something to where it already exists in abundance. The Tyne bridges, including the iconic Tyne Bridge (1928), reflect the river's central role in the city's identity.

---

## Source to Mouth: Key Terms

- **Source** — where a river begins, usually on high ground
- **Mouth** — where a river reaches the sea or a larger body of water
- **Estuary** — the tidal, often wide lower section where fresh and salt water mix

---

## Self-Check

1. Which is the longest river in the UK?
2. What river does London sit on, and where does it meet the sea?
3. Which river connects the Midlands to the Irish Sea via Liverpool?

**Answers:** 1. River Severn (354 km) | 2. River Thames; Thames Estuary (North Sea) | 3. River Mersey

---

## Connection Forward

Understanding these river systems prepares you for:
- **Drainage basins and tributaries** — how smaller rivers feed the major systems
- **Flood risk** — which cities are most vulnerable and why
- **Settlement patterns** — how rivers determined where towns and cities grew`,
    eli5Content: `## Simple Version

Think of rivers as roads made of water. Before cars and trains, rivers were the motorways of the UK — if you wanted to move heavy things like coal or grain, you put them on a boat and floated them downstream.

The UK has five big rivers you need to know:

**Thames** — London's river. It starts in the hills and flows east to the sea. London grew here because it was the easiest place to cross it.

**Severn** — the longest one. It starts in Wales, loops through England, and pours into the Bristol Channel. It has a huge "tidal bore" — a wave that rushes upstream when the tide comes in.

**Trent** — goes through the middle of England (the Midlands) and joins up with another river to reach the east coast.

**Mersey** — Liverpool's river. Ships from all over the world came here to load and unload goods.

**Tyne** — Newcastle's river, famous for coal and bridges.

Every big UK city sits on one of these rivers. That is not a coincidence — people built cities where the water was!`
  },

  {
    id: 'lo-uk-mountains-overview',
    title: 'UK Mountain Ranges and Highest Peaks',
    knowledgeComponentId: 'UK_mountains',
    bloomLevel: 1,
    orderIndex: 16,
    contentType: 'text',
    content: `## Learning Objective
By the end of this section, you will be able to identify the UK's major mountain ranges, name the three highest peaks in each home nation, and describe the basic processes that formed them.

---

## The UK's Upland Geography

The UK's mountains are concentrated in the north and west — a pattern that profoundly influences climate, land use, and settlement. This north-west/south-east divide between "Highland Britain" and "Lowland Britain" is one of the most important geographical concepts in understanding the country.

---

## Major Mountain Ranges

### The Scottish Highlands
The most extensive and highest mountain region in the British Isles. The Highlands are separated from the Scottish Lowlands by the Highland Boundary Fault — a geological fracture running from Helensburgh in the west to Stonehaven in the east.

**Key peaks:**
- **Ben Nevis (1,345m)** — the highest point in the UK. Located near Fort William in the western Highlands. Its summit is in cloud for roughly 355 days per year. The Ben Nevis Race sees runners complete the 14 km round trip in under two hours.
- **Ben Macdui (1,309m)** — second highest, located in the Cairngorms plateau. The Cairngorms are Britain's only subarctic mountain environment.
- **Ben Lomond (974m)** — the most southerly Munro (peaks over 914m), overlooking Loch Lomond.

### The Pennines
Often called "the backbone of England," the Pennines form a chain of upland moorland running roughly 400 km from the Scottish border south to Derbyshire. They are not dramatic, jagged peaks but broad, high moorland plateaus.

**Key summits:**
- **Cross Fell (893m)** — the highest point in the Pennines, in Cumbria
- **Pen-y-ghent (694m)** — one of the famous Yorkshire Three Peaks

The Pennines create a rain shadow — their western flanks receive heavy rainfall, while the eastern plains are much drier.

### The Lake District (Cumbrian Mountains)
A compact but dramatic mountain area in Cumbria, northwest England. Formed by volcanic activity and shaped by glaciation.

**Key peaks:**
- **Scafell Pike (978m)** — the highest point in England. Part of the Three Peaks Challenge alongside Ben Nevis and Snowdon.
- **Helvellyn (950m)** — famous for the knife-edge Striding Edge ridge
- **Skiddaw (931m)** — one of the oldest rocks in England

### The Cambrian Mountains (Wales)
A high, plateau-like upland in mid-Wales. Less dramatic than Snowdonia but covering a larger area. Home to the sources of the rivers Severn and Wye.

### Snowdonia (Eryri)
The highest mountain region in Wales and England combined (after the Highlands). Located in northwest Wales.

**Key peaks:**
- **Snowdon / Yr Wyddfa (1,085m)** — the highest point in Wales and the most visited mountain in the UK (around 600,000 visitors per year). A rack-and-pinion railway runs to the summit.
- **Carnedd Llewelyn (1,064m)**
- **Glyder Fawr (1,001m)**

---

## How Were They Formed?

### Glaciation
The dominant shaping force. During the last Ice Age (ending approximately 12,000 years ago), glaciers carved the landscape:
- **Corries (cirques)** — armchair-shaped hollows where glaciers formed
- **Arêtes** — knife-edge ridges between two corries
- **U-shaped valleys** — characteristic flat-bottomed, steep-sided valleys
- **Ribbon lakes** — long, narrow lakes in glacially scoured valleys (Windermere, Loch Ness)

### Folding and Faulting
The Scottish Highlands were created by ancient continental collision — the same tectonic forces that built the Appalachian Mountains in North America. The rocks in the Highlands are among the oldest in the world, some over 3 billion years old.

---

## Self-Check

1. What is the highest peak in the UK, and where is it?
2. What is the highest point in England?
3. What is the highest point in Wales?
4. What geographical feature separates the Scottish Highlands from the Lowlands?

**Answers:** 1. Ben Nevis (1,345m), near Fort William, Scotland | 2. Scafell Pike (978m), Lake District | 3. Snowdon / Yr Wyddfa (1,085m), Snowdonia | 4. The Highland Boundary Fault

---

## Connection Forward

Understanding mountain geography prepares you for:
- **Orographic rainfall** — how mountains force air upward and create rain
- **Economic impact of uplands** — tourism, farming, reservoirs, wind farms
- **Rain shadow effect** — why eastern England is drier than the west`,
    eli5Content: `## Simple Version

Mountains in the UK are mostly in the north and west — think of Scotland, Wales, and the northwest of England.

**The three tallest are:**
- **Ben Nevis (1,345m)** — Scotland. This is the UK champion. It is so often covered in cloud that you might climb all the way to the top and still not be able to see much!
- **Scafell Pike (978m)** — England, in the Lake District. Famous for its beautiful lakes.
- **Snowdon (1,085m)** — Wales. So popular that you can actually catch a little train to the summit.

Most UK mountains were shaped by glaciers — giant rivers of ice that ground down the rock during the last Ice Age. They left behind curved valleys, sharp ridges, and long lakes (like Windermere and Loch Ness).

The mountains act like a giant wall — they stop rain clouds from crossing, which is why the west of the UK is much wetter than the east.`
  },

  {
    id: 'lo-uk-rivers-detail',
    title: 'River Characteristics: Drainage Basins, Tributaries, and Settlement',
    knowledgeComponentId: 'UK_rivers',
    bloomLevel: 1,
    orderIndex: 17,
    contentType: 'text',
    content: `## Learning Objective
By the end of this section, you will be able to define drainage basins, tributaries, and confluences, name key tributaries of UK rivers, and explain how river systems shaped human settlement patterns.

---

## Key Concepts

### Drainage Basin
A drainage basin (also called a catchment area) is all the land from which rainfall drains into a single river system. It is bounded by a **watershed** — the high ground that separates one basin from another. Water falling on one side of a watershed drains into one river; water on the other side drains into a different river.

**Example:** The Pennines form the watershed between the Rivers Mersey and Aire. Rain on the western slopes drains into the Mersey and eventually the Irish Sea; rain on the eastern slopes drains into the Aire, then the Ouse, then the Humber, and finally the North Sea.

The drainage basin of the Thames — the **Thames Basin** — covers approximately 13,000 km² and includes parts of Gloucestershire, Wiltshire, Oxfordshire, Buckinghamshire, Hertfordshire, and Greater London.

### Tributary
A tributary is a river or stream that flows into a larger river. Every major UK river has numerous tributaries that feed it with water from across its drainage basin.

### Confluence
The point where a tributary joins a larger river. Many UK towns and cities developed at confluences because:
- The meeting point of two rivers created a natural transport hub
- Fertile floodplain soils on both sides supported farming
- The increased water flow after the confluence made the river easier to navigate by boat

**Examples of confluence settlements:**
- **Oxford** — at the confluence of the Thames and the Cherwell
- **Nottingham** — grew near the confluence of the Trent and the Soar
- **Newcastle upon Tyne** — at the tidal limit and a ford on the Tyne

---

## Key Tributaries of Major UK Rivers

### Thames Tributaries
- **River Cherwell** — joins at Oxford
- **River Kennet** — joins at Reading; drains the Berkshire Downs
- **River Wey** — joins at Weybridge, Surrey
- **River Medway** — drains Kent; empties into the Thames Estuary at Rochester
- **River Lee (Lea)** — joins in east London; the Lee Valley is now a major urban park

### Severn Tributaries
- **River Avon (Warwickshire)** — joins the Severn at Tewkesbury; flows through Stratford-upon-Avon and Evesham
- **River Wye** — joins the Severn Estuary near Chepstow; famous for its gorge through the Forest of Dean
- **River Vyrnwy** — a major Welsh tributary; the Vyrnwy reservoir supplies Liverpool with drinking water

### Trent Tributaries
- **River Soar** — flows through Leicester and joins the Trent near Nottingham
- **River Derwent** — drains the Peak District; joins the Trent at Shardlow
- **River Dove** — forms the boundary between Derbyshire and Staffordshire; famous for fly fishing

### Ouse Tributaries (Yorkshire)
- **River Aire** — flows through Leeds; joins the Ouse at Airmyn
- **River Wharfe** — drains the Yorkshire Dales through Ilkley and Wetherby
- **River Cam** — flows through Cambridge, joining the Great Ouse; gave Cambridge its name

---

## Settlement Patterns Along Rivers

### Why Settle by a River?
1. **Fresh water** — essential for drinking, cooking, and agriculture
2. **Fertile soil** — river floodplains deposit nutrient-rich silt
3. **Transport** — goods could be moved by boat far more easily than by road
4. **Power** — watermills on fast-flowing rivers powered grain mills and early factories
5. **Defence** — rivers formed natural moats; meanders created defensible peninsulas

### River Crossing Points
Many of England's most important cities grew at the first easy crossing point from the sea — where the river was narrow enough to bridge but still navigable by boats.

- **London** (Thames): the Romans built the first bridge; all roads radiated from this point
- **York** (Ouse): the Romans chose this crossing point; it became a Viking trading city
- **Bristol** (Avon): grew at the tidal limit of the Avon; the harbour could receive seagoing ships

---

## Self-Check

1. What is the difference between a tributary and a confluence?
2. Which river flows through Leicester and eventually joins the Trent?
3. Name two reasons why towns often developed at river confluences.

**Answers:** 1. A tributary is a smaller river that flows INTO a larger one; a confluence is the specific POINT where this joining happens | 2. River Soar | 3. Any two from: transport hub, fertile floodplain soils, easier river navigation, natural meeting point for trade

---

## Connection Forward

This foundation in drainage basins and tributaries prepares you for:
- **Flood risk analysis** — understanding why upstream rainfall affects downstream towns
- **Water supply** — how reservoirs on tributaries supply cities
- **Industrial geography** — why certain industries clustered along specific river valleys`,
    eli5Content: `## Simple Version

Imagine a river is like a family tree — but upside down.

At the top, you have loads of tiny streams on hills and mountains. These join together into slightly bigger streams, which join into small rivers, which all eventually pour into one big river.

The **drainage basin** is all the land that drains into that one big river. If it rains anywhere in that area, the water will eventually reach your river.

A **tributary** is just a smaller river that joins a bigger one. When they meet, that meeting point is called a **confluence**.

**Why do cities grow at confluences?** Because in the old days, rivers were your roads. If two rivers meet, that spot is like a motorway junction — loads of people and goods pass through. So people set up markets and towns there.

Examples:
- The River Cherwell meets the Thames → **Oxford**
- The River Soar meets the Trent near → **Nottingham**
- The River Cam meets the Great Ouse → **Ely** (gave the region to Cambridge)`
  },

  {
    id: 'lo-uk-mountains-detail',
    title: 'Upland vs Lowland Britain: Weather, Farming, and Economy',
    knowledgeComponentId: 'UK_mountains',
    bloomLevel: 1,
    orderIndex: 18,
    contentType: 'text',
    content: `## Learning Objective
By the end of this section, you will be able to describe the upland/lowland divide in Britain, explain orographic rainfall and temperature lapse rate, and outline the economic activities associated with upland areas.

---

## The Great Divide: Highland vs Lowland Britain

The UK is physically divided into two broad zones by an imaginary line running roughly from the Tees estuary in the northeast to the Exe estuary in the southwest:

- **Highland Britain** (north and west) — mountainous, older and harder rocks (granite, slate, limestone), thin soils, high rainfall, sparse population
- **Lowland Britain** (south and east) — flat to gently rolling, younger and softer rocks (chalk, clay, sandstone), deeper fertile soils, lower rainfall, denser population

This divide explains many of the most significant patterns in British human geography: where industry grew, where populations cluster, and how land is used.

---

## Weather Implications of Mountains

### Orographic Rainfall (Relief Rainfall)
When moist air from the Atlantic hits a mountain range, it is forced upward. As air rises, it cools at approximately 6.5°C per 1,000 metres — the **environmental lapse rate**. Cooler air holds less water vapour, so the moisture condenses and falls as rain on the windward (west-facing) slope.

By the time air descends the leeward (east-facing) slope, it has lost most of its moisture. This creates a **rain shadow** — a drier region in the shelter of the mountains.

**Real-world data:**
| Location | Annual rainfall | Reason |
|---|---|---|
| Seathwaite, Lake District | ~3,400 mm | Western windward slope |
| Leeds (east of Pennines) | ~640 mm | Rain shadow of Pennines |
| Fort William (west Highlands) | ~2,000 mm | Western Highland slopes |
| Aberdeen (east Highlands) | ~800 mm | Rain shadow of Cairngorms |

### Temperature Lapse Rate
Temperature falls with altitude. On average in the UK, temperatures drop by approximately 0.6°C for every 100 metres of altitude gained. This means:
- The summit of Ben Nevis (1,345m) is typically 8°C colder than sea level Fort William
- Growing seasons shorten dramatically with altitude — upland farms have far fewer frost-free days than lowland farms
- Snow persists longer at altitude — the Cairngorms maintain snow patches into July in some years

---

## Economic Impact of Upland Areas

### Farming
Upland farming is dominated by **pastoral (livestock) farming**, especially sheep and beef cattle. The thin, acidic soils and harsh climate rule out most arable (crop) farming. Key characteristics:
- **Hill sheep farming** — breeds like Herdwick (Lake District), Swaledale (Yorkshire Dales), and Cheviot (Northumberland) are adapted to harsh upland conditions
- **Extensive farming** — low stocking density on large areas; farms may cover hundreds of hectares
- **Subsidy dependence** — many upland farms are economically marginal and depend on government support (formerly EU Common Agricultural Policy, now UK Agriculture Act payments)

### Tourism
Upland areas generate billions of pounds annually through tourism:
- **The Lake District** receives approximately 19 million visitors per year — the most of any UK national park
- **Snowdonia** — around 4 million visitors per year
- **Ben Nevis** — approximately 150,000 summit attempts per year
- Activities include hiking, mountain biking, skiing (Cairngorms), rock climbing, and water sports on upland lakes

### Water Supply (Reservoirs)
Upland areas are ideal for reservoirs because:
- High rainfall means abundant water input
- Hard impermeable rocks (granite, slate) prevent water seeping away
- Valleys can be dammed to create large storage capacity
- Sparse population means fewer people to displace

**Examples:**
- **Thirlmere** and **Haweswater** (Lake District) — supply Manchester
- **Elan Valley reservoirs** (Cambrian Mountains, Wales) — supply Birmingham
- **Vyrnwy** (Welsh hills) — supplies Liverpool

### Wind Energy
Upland areas receive much stronger and more consistent winds than lowland areas, making them ideal for wind farms. The UK is Europe's leading producer of wind energy, with thousands of turbines on Scottish, Welsh, and Pennine uplands.

---

## Self-Check

1. What process causes heavy rainfall on the western slopes of UK mountain ranges?
2. At what rate does temperature typically fall with altitude in the UK?
3. Why are upland areas particularly suitable for reservoirs?
4. Name two farming breeds adapted to upland conditions.

**Answers:** 1. Orographic (relief) rainfall — moist air is forced upward, cools, and condenses | 2. Approximately 0.6°C per 100 metres | 3. High rainfall, impermeable rocks, ability to dam valleys, sparse population | 4. Any two from: Herdwick, Swaledale, Cheviot

---

## Connection Forward

This understanding of upland/lowland Britain prepares you for:
- **Flood risk** — how upland rainfall translates into downstream flooding
- **Climate patterns** — why the UK's climate varies so dramatically over short distances
- **Population distribution** — why most of the UK's population lives in Lowland Britain`,
    eli5Content: `## Simple Version

Imagine Britain cut in half diagonally, like a sandwich — the top-left bit is hilly and rainy (Highland Britain), and the bottom-right bit is flatter and drier (Lowland Britain).

**Why are mountains so rainy on one side?**
Clouds blow in from the Atlantic Ocean (always from the west). When they hit a mountain, they have to go UP. Going up makes the air colder. Cold air can not hold as much water, so the water falls out as RAIN — on the mountain's west side. By the time the air goes over the top and comes down the other side, it has run out of rain. So the east side is much drier. This is called the **rain shadow**.

**What do people do in the mountains?**
- **Sheep farming** — sheep are tough enough to handle the cold and wet
- **Tourism** — millions of people visit the Lake District, Snowdonia, and the Scottish Highlands every year
- **Reservoirs** — upland valleys get dammed to store rainwater that cities drink
- **Wind farms** — it is very windy up there, so wind turbines generate lots of electricity`
  },

  {
    id: 'lo-uk-coastal-features',
    title: 'UK Coastlines: Erosion, Deposition, and Coastal National Parks',
    knowledgeComponentId: 'UK_national_parks',
    bloomLevel: 1,
    orderIndex: 19,
    contentType: 'text',
    content: `## Learning Objective
By the end of this section, you will be able to describe the UK's three main coastline zones, distinguish between erosional and depositional coastal features, and identify key coastal national parks and landmarks.

---

## The UK's Coastal Context

The UK is an island nation with approximately 17,820 km of coastline — more than the entire coast of India. No point in Great Britain is more than 113 km from the sea. This extraordinary coastal exposure means that the sea has profoundly shaped both the landscape and British culture, economy, and history.

---

## Three Main Coastline Zones

### The North Sea Coast (East)
Stretching from the Scottish border south to the Thames Estuary, the North Sea coast is characterised by:
- **Softer rocks** (boulder clay, chalk) that erode quickly
- **Flat, low-lying land** vulnerable to storm surge flooding
- **Rapid coastal erosion** — Holderness (East Yorkshire) loses on average 1.8 metres of coastline per year, making it Europe's fastest-eroding coast
- **Sandy beaches and spits** formed by longshore drift carrying sediment southward

**Key features:** Flamborough Head (chalk headland, Yorkshire), Dungeness (the UK's largest shingle structure, Kent), The Wash (large estuarine bay, Norfolk/Lincolnshire)

### The Atlantic Coast (West)
The western coastline faces the full force of Atlantic storms and is characterised by:
- **Hard, ancient rocks** (granite, slate) that resist erosion
- **Dramatic cliff scenery** — Cliffs of Moher, Lizard Peninsula, Pembrokeshire
- **Deep estuaries and rias** (drowned river valleys) — the Fal in Cornwall, Milford Haven in Wales
- **Higher wave energy** from Atlantic swells crossing thousands of kilometres of open ocean

**Key features:** Land's End (UK's most westerly point), Pembrokeshire coastline (stacks, arches, sea caves), Scottish sea lochs (fjords), Giant's Causeway (Northern Ireland, basalt columns)

### The English Channel Coast (South)
A varied coastline balancing Atlantic exposure and sheltered stretches:
- **White chalk cliffs** (Seven Sisters, White Cliffs of Dover) — the iconic symbol of England
- **Shingle beaches** (Chesil Beach — 29 km of shingle connecting Portland to the mainland)
- **Eroding sandstone cliffs** at Bournemouth and Poole
- **Busy shipping lanes** — the English Channel is the world's busiest shipping route

---

## Coastal Processes

### Erosion Features
Coastal erosion creates distinctive landforms over geological timescales:

- **Headlands and bays** — form when rocks of different hardness alternate along a coastline. Soft rock erodes to form bays; hard rock resists to form headlands that jut out.
- **Cliffs** — formed by wave attack at the base of sloping land. Waves undercut the cliff to form a **wave-cut notch**; when the overhang collapses, the cliff retreats.
- **Sea caves, arches, and stacks** — the sequence of erosion: waves exploit cracks to form a cave → cave cuts through a headland to form an arch → arch roof collapses leaving an isolated **stack** → stack erodes to a **stump**.
  - **Famous examples:** Old Harry Rocks (Dorset), Durdle Door (arch, Dorset), The Needles (chalk stacks, Isle of Wight)

### Deposition Features
Where wave energy is lower or sediment supply is high, material is deposited:

- **Beaches** — accumulations of sand or shingle. The UK's longest beach is Chesil Beach (Dorset) at 29 km.
- **Spits** — narrow fingers of sand or shingle extending from a headland, formed by longshore drift (the transport of sediment along the coast by waves). When the coastline changes direction, the spit curves inland at its tip.
  - **Example:** Spurn Head (Humberside), Dungeness (Kent)
- **Bars** — spits that extend across a bay, cutting off a lagoon.
- **Tombolos** — beaches that connect an island to the mainland; Chesil Beach connects Portland to Dorset.

---

## Key Coastal National Parks and Landmarks

### Pembrokeshire Coast National Park (Wales)
The only UK national park whose primary designation is its coastline rather than mountains. Its 186 km Pembrokeshire Coast Path passes through dramatic cliff scenery, sandy bays, and prehistoric sites. Key features: Stackpole Head, the Green Bridge of Wales arch, and Skomer Island (seabird colony).

### South Downs National Park (England)
Stretches 160 km from Winchester (Hampshire) to Eastbourne (East Sussex). Where the South Downs meet the sea, they create the iconic **Seven Sisters** — seven chalk cliff faces forming a dramatic roller-coaster profile east of Seaford. The chalk was formed from the shells of tiny marine organisms deposited when a warm, shallow sea covered southern Britain 100 million years ago.

### North York Moors National Park (England)
The eastern edge of this park drops dramatically to the North Sea, creating spectacular coastal scenery including:
- **Robin Hood's Bay** — a picturesque fishing village built into a narrow coastal valley
- **Whitby** — home of the famous abbey (inspiration for Bram Stoker's Dracula), a working fishing port at the mouth of the River Esk
- **Boulby** — site of England's highest cliffs (203m) outside of the chalk

---

## Self-Check

1. Which UK coastline loses on average 1.8 metres per year to erosion?
2. What is the difference between a headland and a bay?
3. What process forms a coastal spit?
4. Which is the only UK national park primarily designated for its coastline?

**Answers:** 1. Holderness coast, East Yorkshire | 2. A headland is hard rock that resists erosion and juts out; a bay forms where soft rock erodes back | 3. Longshore drift carries sediment along the coast, which accumulates and extends as a spit when the coastline changes direction | 4. Pembrokeshire Coast National Park (Wales)

---

## Connection Forward

Understanding UK coastal features prepares you for:
- **Coastal management** — why some coasts are defended and others are left to erode
- **Sea level rise** — which parts of the UK face the greatest threat from climate change
- **Marine ecosystems** — how coastal habitats support biodiversity`,
    eli5Content: `## Simple Version

The UK is an island, so it has coastline everywhere — mountains, cliffs, beaches, and everything in between.

**Three types of coast:**

**East coast (North Sea):** Made of softer rock, so the sea eats it away. In East Yorkshire (Holderness), the cliff crumbles by nearly 2 metres every year! The old villages that used to be on the cliff are now under the sea.

**West coast (Atlantic):** Bashed by huge Atlantic waves, but made of hard rock like granite. This creates dramatic cliffs and sea stacks — tall pillars of rock standing alone in the water, left behind after the weaker rock around them got eaten away.

**South coast (English Channel):** Famous for the white chalk cliffs (like the White Cliffs of Dover). Chalk used to be seabed — it is made from billions of tiny sea creatures that died and piled up millions of years ago.

**Two things happen at coasts:**
- **Erosion** — waves smash rock away, making cliffs and caves
- **Deposition** — worn-away material gets dropped somewhere else, making beaches and spits (long fingers of sand)

**Coastal national parks** protect some of the most beautiful coastlines:
- Pembrokeshire (Wales) — the only park that is mostly about the sea cliffs
- South Downs — the Seven Sisters chalk cliffs
- North York Moors — dramatic cliffs dropping to the North Sea`
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
  counts.forEach((c: { bloomLevel: number; _count: { id: number } }) => {
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